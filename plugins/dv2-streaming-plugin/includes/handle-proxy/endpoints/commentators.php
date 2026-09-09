<?php
/**
 * Proxy endpoint: commentators
 *
 * Public:   GET /api/dv2-streaming-plugin/commentators
 * Upstream: GET https://vscapiv2.cdnx.tech/external/v1/commentators
 *
 * Equivalent curl:
 *   curl --location 'https://vscapiv2.cdnx.tech/external/v1/commentators' \
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
    'cache_ttl' => 12 * HOUR_IN_SECONDS, // BLV list changes infrequently
    'handle'    => function () {
        return DV2_Proxy_Client::get('/external/v1/commentators');
    },
);
