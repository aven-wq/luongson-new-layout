<?php
/**
 * Shared HTTP client for upstream VSC API calls.
 *
 * Usage from an endpoint file:
 *   $result = DV2_Proxy_Client::get('/external/v1/commentators');
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_Proxy_Client {

    /**
     * GET upstream path (relative to DV2_PROXY_UPSTREAM_BASE).
     *
     * @param string               $path    e.g. '/external/v1/commentators'
     * @param array<string,mixed>  $query   Optional query string params
     * @param array<string,mixed>  $args    Extra wp_remote_* args
     * @return array{ok:bool,status:int,body:string,json:mixed,error:?string}
     */
    public static function get($path, $query = array(), $args = array()) {
        return self::request('GET', $path, $query, null, $args);
    }

    /**
     * POST JSON to upstream path.
     *
     * @param string               $path
     * @param mixed                $body    Will be JSON-encoded
     * @param array<string,mixed>  $query
     * @param array<string,mixed>  $args
     * @return array{ok:bool,status:int,body:string,json:mixed,error:?string}
     */
    public static function post_json($path, $body = null, $query = array(), $args = array()) {
        $args['headers'] = isset($args['headers']) && is_array($args['headers'])
            ? $args['headers']
            : array();
        $args['headers']['Content-Type'] = 'application/json';
        $args['body'] = wp_json_encode($body);

        return self::request('POST', $path, $query, null, $args);
    }

    /**
     * Generic upstream request.
     *
     * @param string               $method  GET|POST|PUT|PATCH|DELETE
     * @param string               $path    Relative path starting with /
     * @param array<string,mixed>  $query
     * @param mixed                $body    Raw body (string) or null; ignored if $args['body'] set
     * @param array<string,mixed>  $args    Extra wp_remote_* args (headers, timeout, body, …)
     * @return array{ok:bool,status:int,body:string,json:mixed,error:?string}
     */
    public static function request($method, $path, $query = array(), $body = null, $args = array()) {
        $url = self::build_url($path, $query);

        $headers = array(
            'Accept'   => 'application/json',
            'X-API-Key' => DV2_PROXY_UPSTREAM_API_KEY,
        );

        if (!empty($args['headers']) && is_array($args['headers'])) {
            $headers = array_merge($headers, $args['headers']);
            unset($args['headers']);
        }

        $request_args = array_merge(
            array(
                'method'  => strtoupper((string) $method),
                'timeout' => DV2_PROXY_TIMEOUT,
                'headers' => $headers,
            ),
            $args
        );

        if ($body !== null && !isset($request_args['body'])) {
            $request_args['body'] = $body;
        }

        $response = wp_remote_request($url, $request_args);

        if (is_wp_error($response)) {
            return array(
                'ok'     => false,
                'status' => 502,
                'body'   => '',
                'json'   => null,
                'error'  => $response->get_error_message(),
            );
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $raw    = (string) wp_remote_retrieve_body($response);
        $json   = json_decode($raw, true);

        return array(
            'ok'     => $status >= 200 && $status < 300,
            'status' => $status > 0 ? $status : 502,
            'body'   => $raw,
            'json'   => $json,
            'error'  => null,
        );
    }

    /**
     * Build absolute upstream URL.
     *
     * @param string              $path
     * @param array<string,mixed> $query
     * @return string
     */
    public static function build_url($path, $query = array()) {
        $path = '/' . ltrim((string) $path, '/');
        $url  = rtrim(DV2_PROXY_UPSTREAM_BASE, '/') . $path;

        if (!empty($query) && is_array($query)) {
            $url = add_query_arg($query, $url);
        }

        return $url;
    }
}
