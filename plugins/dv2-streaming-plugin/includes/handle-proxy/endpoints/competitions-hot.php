<?php
/**
 * Proxy endpoint: hot competitions
 *
 * Public:   GET /api/dv2-streaming-plugin/competitions-hot
 * Upstream: GET https://vscapiv2stg.growix.dev/external/v1/competitions?isHot=true&page=1&pageSize=50
 *
 * Equivalent curl:
 *   curl --location 'https://vscapiv2stg.growix.dev/external/v1/competitions?isHot=true&page=1&pageSize=50' \
 *     --header 'X-API-Key: …'
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

return array(
    'method'    => 'GET',
    'cache_ttl' => DAY_IN_SECONDS, // Hot list changes infrequently
    'handle'    => function () {
        return DV2_Proxy_Client::get(
            '/external/v1/competitions',
            array(
                'isHot'    => 'true',
                'page'     => 1,
                'pageSize' => 50,
            ),
            DV2_Proxy_Client::hot_competitions_args()
        );
    },
);
