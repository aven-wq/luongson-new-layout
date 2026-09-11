<?php
/**
 * Proxy endpoint: streams range (paginated match list)
 *
 * Public:   GET /api/dv2-streaming-plugin/streams-range
 * Upstream: GET https://vscapiv2.cdnx.tech/external/v2/streams/range
 *
 * Query params:
 *   from                 YYYY-MM-DD (required)
 *   to                   YYYY-MM-DD (required)
 *   pageSize             Optional (default upstream)
 *   page                 Optional (default 1)
 *   competitions         Optional — single competition id (sanitized); forwarded upstream only when valid
 *
 * statuses (1,2 = not started + live) and priorityCompetitions are set server-side.
 * Do not accept statuses or priorityCompetitions from the front-end.
 * Response matches_by_date is a flat array (API order; not grouped by date).
 *
 * Equivalent curl:
 *   curl --location 'https://vscapiv2.cdnx.tech/external/v2/streams/range?from=…&to=…&statuses=1%2C2&priorityCompetitions=…&pageSize=33&page=1' \
 *     --header 'Accept: application/json' \
 *     --header 'X-API-Key: …'
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Normalize comma-separated competition ids.
 *
 * @param string $raw
 * @return string
 */
function dv2_streams_range_sanitize_priority_ids($raw) {
    $parts = preg_split('/\s*,\s*/', trim((string) $raw));
    if (!is_array($parts)) {
        return '';
    }

    $ids = array();
    foreach ($parts as $part) {
        $id = sanitize_text_field($part);
        if ($id !== '' && preg_match('/^[a-zA-Z0-9_-]+$/', $id)) {
            $ids[] = $id;
        }
    }

    return implode(',', array_values(array_unique($ids)));
}

/**
 * Resolve priorityCompetitions: WP admin setting, else hot competitions API.
 *
 * @return string Comma-separated ids (may be empty)
 */
function dv2_streams_range_resolve_priority_competitions() {
    if (function_exists('dv2_get_setting')) {
        $admin = dv2_streams_range_sanitize_priority_ids(
            (string) dv2_get_setting('dv2_priority_competition_id', '')
        );
        if ($admin !== '') {
            return $admin;
        }
    }

    $cache_key = 'dv2_proxy_hot_competition_ids';
    $cached   = get_transient($cache_key);
    if (is_string($cached)) {
        return $cached;
    }

    // Hardcoded upstream (not exposed / not passed from FE).
    // Same source as GET /api/dv2-streaming-plugin/competitions-hot
    $response = DV2_Proxy_Client::get(
        '/external/v1/competitions',
        array(
            'isHot'    => 'true',
            'page'     => 1,
            'pageSize' => 50,
        ),
        DV2_Proxy_Client::hot_competitions_args()
    );

    $ids = '';
    if (!empty($response['ok']) && is_array($response['json']) && !empty($response['json']['result']) && is_array($response['json']['result'])) {
        $collected = array();
        foreach ($response['json']['result'] as $item) {
            if (!is_array($item) || empty($item['id'])) {
                continue;
            }
            $id = sanitize_text_field((string) $item['id']);
            if ($id !== '' && preg_match('/^[a-zA-Z0-9_-]+$/', $id)) {
                $collected[] = $id;
            }
        }
        $ids = implode(',', array_values(array_unique($collected)));
    }

    set_transient($cache_key, $ids, DAY_IN_SECONDS);

    return $ids;
}

return array(
    'method'    => 'GET',
    'cache_ttl' => 20, // List scores change often
    'handle'    => function () {
        $from = isset($_GET['from']) ? sanitize_text_field(wp_unslash($_GET['from'])) : '';
        $to   = isset($_GET['to']) ? sanitize_text_field(wp_unslash($_GET['to'])) : '';

        if ($from === '' || $to === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            return array(
                'ok'     => false,
                'status' => 400,
                'body'   => '',
                'json'   => array(
                    'message' => 'error',
                    'error'   => 'Missing or invalid from/to date (YYYY-MM-DD)',
                ),
                'error'  => 'Missing or invalid from/to date',
            );
        }

        $query = array(
            'from'         => $from,
            'to'           => $to,
            // Hardcoded: 1 not started, 2 live (not accepted from FE).
            'statuses'     => '1,2',
            'priorityLive' => 'true',
        );

        $priority = dv2_streams_range_resolve_priority_competitions();
        if ($priority !== '') {
            $query['priorityCompetitions'] = $priority;
        }

        // Optional FE filter (league schedule page). Default-off — omit when empty/invalid.
        if (isset($_GET['competitions'])) {
            $competitions = dv2_streams_range_sanitize_priority_ids(
                (string) wp_unslash($_GET['competitions'])
            );
            // Forward at most one id (league page selects a single competition).
            if ($competitions !== '') {
                $first = explode(',', $competitions);
                $query['competitions'] = $first[0];
            }
        }

        if (isset($_GET['pageSize'])) {
            $page_size = (int) $_GET['pageSize'];
            if ($page_size > 0 && $page_size <= 100) {
                $query['pageSize'] = $page_size;
            }
        }

        if (isset($_GET['page'])) {
            $page = (int) $_GET['page'];
            if ($page > 0) {
                $query['page'] = $page;
            }
        }

        $result = DV2_Proxy_Client::get('/external/v2/streams/range', $query);

        // Expose resolved priority IDs so FE can mark hot matches.
        if (!empty($result['ok']) && is_array($result['json'])) {
            $result['json']['priorityCompetitions'] = $priority !== ''
                ? array_values(array_filter(explode(',', $priority)))
                : array();
        }

        return $result;
    },
);
