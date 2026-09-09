<?php
/**
 * Public proxy router.
 *
 * Front-end calls:  GET /api/dv2-streaming-plugin/{endpoint}
 * Router loads:     includes/handle-proxy/endpoints/{endpoint}.php
 *
 * Each endpoint file returns an array:
 *   array(
 *     'method'    => 'GET',          // optional, default GET (or array of methods)
 *     'cache_ttl' => 60,             // optional, seconds (0 = no cache)
 *     'handle'    => function () {   // required
 *         return DV2_Proxy_Client::get('/external/v1/...');
 *     },
 *   );
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_Proxy_Router {

    private static $instance = null;

    /** @var array<string,array>|null */
    private $endpoints = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('init', array($this, 'add_rewrite_rules'));
        add_filter('query_vars', array($this, 'add_query_vars'));
        add_action('template_redirect', array($this, 'maybe_dispatch'), 0);
        add_action('init', array($this, 'maybe_flush_rewrites'), 99);
    }

    /**
     * One-time flush when proxy rewrite rules are introduced/updated.
     */
    public function maybe_flush_rewrites() {
        $version = '1';
        if (get_option('dv2_proxy_rewrite_version') === $version) {
            return;
        }
        $this->add_rewrite_rules();
        flush_rewrite_rules(false);
        update_option('dv2_proxy_rewrite_version', $version, true);
    }

    /**
     * Public base path for JS (relative to site root).
     *
     * @return string
     */
    public static function public_base() {
        return DV2_PROXY_PUBLIC_BASE;
    }

    /**
     * Absolute public base URL for JS fetch().
     *
     * @return string
     */
    public static function public_url() {
        return untrailingslashit(home_url(DV2_PROXY_PUBLIC_BASE));
    }

    public function add_rewrite_rules() {
        // /api/dv2-streaming-plugin/{endpoint}
        add_rewrite_rule(
            '^api/dv2-streaming-plugin/([^/]+)/?$',
            'index.php?dv2_proxy_endpoint=$matches[1]',
            'top'
        );
    }

    public function add_query_vars($vars) {
        $vars[] = 'dv2_proxy_endpoint';
        return $vars;
    }

    /**
     * Handle proxy request early (before theme renders).
     */
    public function maybe_dispatch() {
        $slug = $this->resolve_endpoint_slug();
        if ($slug === '') {
            return;
        }

        $this->dispatch($slug);
    }

    /**
     * Resolve endpoint slug from query var or REQUEST_URI fallback.
     *
     * @return string
     */
    private function resolve_endpoint_slug() {
        $slug = (string) get_query_var('dv2_proxy_endpoint');
        if ($slug !== '') {
            return sanitize_key($slug);
        }

        $uri = isset($_SERVER['REQUEST_URI']) ? (string) wp_unslash($_SERVER['REQUEST_URI']) : '';
        $path = (string) wp_parse_url($uri, PHP_URL_PATH);

        // Strip WP subdirectory prefix if present (e.g. /mysite/api/...).
        $home_path = (string) wp_parse_url(home_url('/'), PHP_URL_PATH);
        $home_path = untrailingslashit($home_path);
        if ($home_path !== '' && $home_path !== '/' && strpos($path, $home_path) === 0) {
            $path = substr($path, strlen($home_path));
            if ($path === '' || $path[0] !== '/') {
                $path = '/' . ltrim($path, '/');
            }
        }

        $base = untrailingslashit(DV2_PROXY_PUBLIC_BASE);

        if ($path !== '' && preg_match('#^' . preg_quote($base, '#') . '/([^/]+)/?$#', $path, $m)) {
            return sanitize_key($m[1]);
        }

        return '';
    }

    /**
     * Run endpoint handler and exit with JSON.
     *
     * @param string $slug
     */
    private function dispatch($slug) {
        $endpoint = $this->get_endpoint($slug);

        if ($endpoint === null) {
            $this->send_json(
                array(
                    'message' => 'error',
                    'error'   => 'Unknown proxy endpoint',
                ),
                404
            );
        }

        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        $allowed = isset($endpoint['method']) ? $endpoint['method'] : 'GET';
        if (!is_array($allowed)) {
            $allowed = array($allowed);
        }
        $allowed = array_map('strtoupper', $allowed);

        if (!in_array($method, $allowed, true)) {
            $this->send_json(
                array(
                    'message' => 'error',
                    'error'   => 'Method not allowed',
                ),
                405
            );
        }

        if ($method === 'OPTIONS') {
            $this->send_cors_headers();
            status_header(204);
            exit;
        }

        $cache_ttl = isset($endpoint['cache_ttl']) ? (int) $endpoint['cache_ttl'] : 0;
        $cache_key = 'dv2_proxy_' . $slug . '_' . md5($method . '|' . (string) wp_json_encode($_GET));

        if ($cache_ttl > 0 && $method === 'GET') {
            $cached = get_transient($cache_key);
            if (is_array($cached) && isset($cached['status'], $cached['payload'])) {
                $this->send_json($cached['payload'], (int) $cached['status']);
            }
        }

        if (!isset($endpoint['handle']) || !is_callable($endpoint['handle'])) {
            $this->send_json(
                array(
                    'message' => 'error',
                    'error'   => 'Endpoint handler missing',
                ),
                500
            );
        }

        try {
            $result = call_user_func($endpoint['handle']);
        } catch (Throwable $e) {
            $this->send_json(
                array(
                    'message' => 'error',
                    'error'   => 'Proxy handler exception',
                ),
                500
            );
        }

        // Endpoint may return either a Proxy_Client result or a custom payload array.
        if (is_array($result) && array_key_exists('ok', $result) && array_key_exists('status', $result)) {
            $status  = (int) $result['status'];
            $payload = $result['json'];

            if ($payload === null) {
                $payload = array(
                    'message' => 'error',
                    'error'   => $result['error'] ? $result['error'] : 'Invalid upstream response',
                );
                if ($status < 400) {
                    $status = 502;
                }
            }

            if ($cache_ttl > 0 && $method === 'GET' && !empty($result['ok'])) {
                set_transient(
                    $cache_key,
                    array(
                        'status'  => $status,
                        'payload' => $payload,
                    ),
                    $cache_ttl
                );
            }

            $this->send_json($payload, $status);
        }

        // Custom payload (already shaped for the client).
        $this->send_json($result, 200);
    }

    /**
     * Load endpoint definition by slug (filename without .php).
     *
     * @param string $slug
     * @return array|null
     */
    private function get_endpoint($slug) {
        $all = $this->load_endpoints();
        return isset($all[$slug]) ? $all[$slug] : null;
    }

    /**
     * Auto-discover endpoint PHP files.
     *
     * @return array<string,array>
     */
    private function load_endpoints() {
        if ($this->endpoints !== null) {
            return $this->endpoints;
        }

        $this->endpoints = array();
        $dir = DV2_STREAMING_PLUGIN_DIR . 'includes/handle-proxy/endpoints';

        if (!is_dir($dir)) {
            return $this->endpoints;
        }

        $files = glob($dir . '/*.php');
        if (!is_array($files)) {
            return $this->endpoints;
        }

        foreach ($files as $file) {
            $slug = sanitize_key(basename($file, '.php'));
            if ($slug === '') {
                continue;
            }

            $definition = include $file;
            if (!is_array($definition)) {
                continue;
            }

            $this->endpoints[$slug] = $definition;
        }

        return $this->endpoints;
    }

    /**
     * @param mixed $payload
     * @param int   $status
     */
    private function send_json($payload, $status = 200) {
        $this->send_cors_headers();

        status_header((int) $status);
        nocache_headers();
        header('Content-Type: application/json; charset=utf-8');

        echo wp_json_encode($payload);
        exit;
    }

    private function send_cors_headers() {
        // Same-origin by default; allow simple CORS if needed later.
        header('X-Content-Type-Options: nosniff');
    }
}
