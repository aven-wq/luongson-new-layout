<?php
/**
 * Proxy endpoint: match detail
 *
 * Public:   GET /api/dv2-streaming-plugin/matches?id={matchId}
 * Upstream: GET https://vscapiv2.cdnx.tech/external/v1/matches/{matchId}
 *
 * Equivalent curl:
 *   curl --location 'https://vscapiv2.cdnx.tech/external/v1/matches/{matchId}' \
 *     --header 'Accept: application/json' \
 *     --header 'X-API-Key: …'
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

return array(
    'method'    => 'GET',
    'cache_ttl' => 30, // Live score/stats change frequently
    'handle'    => function () {
        $match_id = isset($_GET['id']) ? sanitize_text_field(wp_unslash($_GET['id'])) : '';

        if ($match_id === '' || !preg_match('/^[a-zA-Z0-9_-]+$/', $match_id)) {
            return array(
                'ok'     => false,
                'status' => 400,
                'body'   => '',
                'json'   => array(
                    'message' => 'error',
                    'error'   => 'Missing or invalid match id',
                ),
                'error'  => 'Missing or invalid match id',
            );
        }

        return DV2_Proxy_Client::get('/external/v1/matches/' . rawurlencode($match_id));
    },
);
