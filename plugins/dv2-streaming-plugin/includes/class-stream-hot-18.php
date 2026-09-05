<?php
/**
 * HOT18 live redirect handler.
 * GET /tructiephotlink → fetch eighteen-plus live → redirect to stream detail.
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_Stream_Hot_18 {

    private static $instance = null;

    const API_ENDPOINT = 'lives/eighteen-plus';

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('init', array($this, 'add_rewrite_rules'));
        add_filter('query_vars', array($this, 'add_query_vars'));
        add_action('template_redirect', array($this, 'handle_redirect'));
    }

    public function add_rewrite_rules() {
        add_rewrite_rule(
            '^tructiephotlink/?$',
            'index.php?dv2_hot18_link=1',
            'top'
        );
    }

    /**
     * @param string[] $vars
     * @return string[]
     */
    public function add_query_vars($vars) {
        $vars[] = 'dv2_hot18_link';
        return $vars;
    }

    public function handle_redirect() {
        if (!get_query_var('dv2_hot18_link')) {
            return;
        }

        $query_args = $this->get_preserved_query_args();

        $live = $this->fetch_hot18_live();
        if (!$live) {
            $redirect_url = home_url('/');
            if (!empty($query_args)) {
                $redirect_url = add_query_arg($query_args, $redirect_url);
            }
            wp_safe_redirect($redirect_url, 302);
            exit;
        }

        $query_args['liveId'] = $live['liveId'];

        $redirect_url = home_url('/streams/' . rawurlencode($live['matchId']) . '/');
        $redirect_url = add_query_arg($query_args, $redirect_url);

        wp_safe_redirect($redirect_url, 302);
        exit;
    }

    /**
     * Keep inbound marketing/tracking params from /tructiephotlink request.
     *
     * @return array<string, string>
     */
    private function get_preserved_query_args() {
        $args = array();

        if (empty($_GET) || !is_array($_GET)) {
            return $args;
        }

        foreach ($_GET as $key => $value) {
            $key = sanitize_key($key);
            if ($key === '' || $key === 'dv2_hot18_link') {
                continue;
            }

            if (is_array($value)) {
                continue;
            }

            $value = sanitize_text_field(wp_unslash($value));
            if ($value === '') {
                continue;
            }

            $args[$key] = $value;
        }

        return $args;
    }

    /**
     * @return array{matchId: string, liveId: string|int}|null
     */
    private function fetch_hot18_live() {
        $response = wp_remote_get(API_URL . self::API_ENDPOINT, array(
            'timeout' => 10,
        ));

        if (is_wp_error($response)) {
            return null;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code < 200 || $status_code >= 300) {
            return null;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($body) || (int) ($body['code'] ?? 0) !== 1000) {
            return null;
        }

        $result = $body['result'] ?? null;
        if (!is_array($result)) {
            return null;
        }

        $match_id = isset($result['matchId']) ? trim((string) $result['matchId']) : '';
        $live_id = isset($result['liveId']) ? $result['liveId'] : '';

        if ($match_id === '' || $live_id === '' || $live_id === null) {
            return null;
        }

        return array(
            'matchId' => $match_id,
            'liveId' => $live_id,
        );
    }
}
