<?php
/**
 * Proxy endpoint: streams range (paginated match list)
 *
 * Public:   GET /api/dv2-streaming-plugin/streams-range
 * Upstream: GET https://vscapiv2.cdnx.tech/external/v1/streams/range
 *
 * Query params:
 *   from                 YYYY-MM-DD (required)
 *   to                   YYYY-MM-DD (required)
 *   statuses             Optional comma-separated: 1 not started, 2 live, 3 finished
 *   priorityCompetitions Optional comma-separated competition ids
 *   pageSize             Optional (default upstream)
 *   page                 Optional (default 1)
 *
 * Equivalent curl:
 *   curl --location 'https://vscapiv2.cdnx.tech/external/v1/streams/range?from=…&to=…&statuses=1%2C2&priorityCompetitions=…&pageSize=33&page=1' \
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
            'from' => $from,
            'to'   => $to,
        );

        if (isset($_GET['statuses']) && is_string($_GET['statuses'])) {
            $statuses = sanitize_text_field(wp_unslash($_GET['statuses']));
            if ($statuses !== '' && preg_match('/^[0-9]+(,[0-9]+)*$/', $statuses)) {
                $query['statuses'] = $statuses;
            }
        }

        if (isset($_GET['priorityCompetitions']) && is_string($_GET['priorityCompetitions'])) {
            $priority = sanitize_text_field(wp_unslash($_GET['priorityCompetitions']));
            // Allow alphanumeric ids separated by commas.
            if ($priority !== '' && preg_match('/^[a-zA-Z0-9_-]+(,[a-zA-Z0-9_-]+)*$/', $priority)) {
                $query['priorityCompetitions'] = $priority;
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

        return DV2_Proxy_Client::get('/external/v1/streams/range', $query);
    },
);
