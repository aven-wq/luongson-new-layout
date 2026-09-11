<?php
/**
 * Proxy endpoint: all competitions (id + name), cached 7 days.
 *
 * Public:   GET /api/dv2-streaming-plugin/competitions
 * Upstream: GET /external/v1/competitions?page=&pageSize= (all pages, no isHot filter)
 *
 * Cache: uploads/dv2-streaming/competitions-cache.json + transient (WEEK_IN_SECONDS).
 * After expiry the file is deleted and the full list is fetched again.
 *
 * Response shape (slim):
 *   { "result": [ { "id": "...", "name": "..." }, ... ] }
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Transient + file cache key/version. */
if (!defined('DV2_COMPETITIONS_CACHE_KEY')) {
    define('DV2_COMPETITIONS_CACHE_KEY', 'dv2_competitions_all_v1');
}
if (!defined('DV2_COMPETITIONS_CACHE_TTL')) {
    define('DV2_COMPETITIONS_CACHE_TTL', WEEK_IN_SECONDS);
}
if (!defined('DV2_COMPETITIONS_PAGE_SIZE')) {
    define('DV2_COMPETITIONS_PAGE_SIZE', 100);
}
if (!defined('DV2_COMPETITIONS_MAX_PAGES')) {
    define('DV2_COMPETITIONS_MAX_PAGES', 100);
}

/**
 * Absolute path to the competitions JSON cache file.
 *
 * @return string
 */
function dv2_competitions_cache_file() {
    $upload = wp_upload_dir();
    $dir    = trailingslashit($upload['basedir']) . 'dv2-streaming';

    if (!is_dir($dir)) {
        wp_mkdir_p($dir);
    }

    return $dir . '/competitions-cache.json';
}

/**
 * Normalize one competition to {id, name}.
 *
 * @param mixed $item
 * @return array{id:string,name:string}|null
 */
function dv2_competitions_normalize_item($item) {
    if (!is_array($item)) {
        return null;
    }

    $id = '';
    if (!empty($item['id'])) {
        $id = sanitize_text_field((string) $item['id']);
    } elseif (!empty($item['competitionId'])) {
        $id = sanitize_text_field((string) $item['competitionId']);
    } elseif (!empty($item['competition_id'])) {
        $id = sanitize_text_field((string) $item['competition_id']);
    }

    if ($id === '' || !preg_match('/^[a-zA-Z0-9_-]+$/', $id)) {
        return null;
    }

    $name = '';
    if (!empty($item['name'])) {
        $name = sanitize_text_field((string) $item['name']);
    } elseif (!empty($item['competitionName'])) {
        $name = sanitize_text_field((string) $item['competitionName']);
    } elseif (!empty($item['competition_name'])) {
        $name = sanitize_text_field((string) $item['competition_name']);
    } elseif (!empty($item['title'])) {
        $name = sanitize_text_field((string) $item['title']);
    }

    return array(
        'id'   => $id,
        'name' => $name !== '' ? $name : $id,
    );
}

/**
 * Read valid (non-expired) cache from file.
 *
 * @return array{items:array<int,array{id:string,name:string}>,expires_at:int}|null
 */
function dv2_competitions_read_file_cache() {
    $file = dv2_competitions_cache_file();
    if (!is_readable($file)) {
        return null;
    }

    $raw = file_get_contents($file);
    if ($raw === false || $raw === '') {
        return null;
    }

    $data = json_decode($raw, true);
    if (!is_array($data) || empty($data['items']) || !is_array($data['items'])) {
        return null;
    }

    $expires_at = isset($data['expires_at']) ? (int) $data['expires_at'] : 0;
    if ($expires_at > 0 && $expires_at <= time()) {
        // Expired — delete once then refetch.
        @unlink($file);
        delete_transient(DV2_COMPETITIONS_CACHE_KEY);
        return null;
    }

    $items = array();
    foreach ($data['items'] as $item) {
        $normalized = dv2_competitions_normalize_item($item);
        if ($normalized) {
            $items[] = $normalized;
        }
    }

    if (empty($items)) {
        return null;
    }

    return array(
        'items'      => $items,
        'expires_at' => $expires_at > 0 ? $expires_at : (time() + DV2_COMPETITIONS_CACHE_TTL),
    );
}

/**
 * Persist slim competition list to file + transient (7 days).
 *
 * @param array<int,array{id:string,name:string}> $items
 * @return void
 */
function dv2_competitions_write_cache($items) {
    $expires_at = time() + DV2_COMPETITIONS_CACHE_TTL;
    $payload    = array(
        'fetched_at' => time(),
        'expires_at' => $expires_at,
        'items'      => array_values($items),
    );

    $file = dv2_competitions_cache_file();
    $json = wp_json_encode($payload);
    if ($json !== false) {
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
        file_put_contents($file, $json, LOCK_EX);
    }

    set_transient(
        DV2_COMPETITIONS_CACHE_KEY,
        array(
            'expires_at' => $expires_at,
            'items'      => array_values($items),
        ),
        DV2_COMPETITIONS_CACHE_TTL
    );
}

/**
 * Fetch every competition page from upstream and return slim {id,name}[].
 *
 * @return array{ok:bool,status:int,items:array<int,array{id:string,name:string}>,error:?string}
 */
function dv2_competitions_fetch_all_from_upstream() {
    $page      = 1;
    $page_size = DV2_COMPETITIONS_PAGE_SIZE;
    $seen      = array();
    $items     = array();
    $last_status = 200;

    while ($page <= DV2_COMPETITIONS_MAX_PAGES) {
        $response = DV2_Proxy_Client::get(
            '/external/v1/competitions',
            array(
                'page'     => $page,
                'pageSize' => $page_size,
            ),
            DV2_Proxy_Client::hot_competitions_args()
        );

        $last_status = isset($response['status']) ? (int) $response['status'] : 502;

        if (empty($response['ok']) || !is_array($response['json'])) {
            return array(
                'ok'     => false,
                'status' => $last_status > 0 ? $last_status : 502,
                'items'  => array(),
                'error'  => !empty($response['error'])
                    ? (string) $response['error']
                    : 'Failed to fetch competitions page ' . $page,
            );
        }

        $json   = $response['json'];
        $raw    = array();
        if (!empty($json['result']) && is_array($json['result'])) {
            $raw = $json['result'];
        } elseif (!empty($json['data']) && is_array($json['data'])) {
            $raw = $json['data'];
        }

        if (empty($raw)) {
            break;
        }

        foreach ($raw as $row) {
            $normalized = dv2_competitions_normalize_item($row);
            if (!$normalized) {
                continue;
            }
            if (isset($seen[ $normalized['id'] ])) {
                continue;
            }
            $seen[ $normalized['id'] ] = true;
            $items[] = $normalized;
        }

        $total_pages = 1;
        if (!empty($json['pagination']['totalPages'])) {
            $total_pages = max(1, (int) $json['pagination']['totalPages']);
        } elseif (!empty($json['pagination']['total_pages'])) {
            $total_pages = max(1, (int) $json['pagination']['total_pages']);
        } elseif (count($raw) < $page_size) {
            // Last page inferred from short page.
            break;
        } else {
            $total_pages = $page + 1;
        }

        if ($page >= $total_pages) {
            break;
        }

        $page++;
    }

    usort(
        $items,
        function ($a, $b) {
            return strcasecmp((string) $a['name'], (string) $b['name']);
        }
    );

    return array(
        'ok'     => true,
        'status' => 200,
        'items'  => $items,
        'error'  => null,
    );
}

/**
 * Resolve competitions list: transient → file → upstream refresh.
 *
 * @return array{ok:bool,status:int,body:string,json:mixed,error:?string}
 */
function dv2_competitions_resolve_list() {
    $cached = get_transient(DV2_COMPETITIONS_CACHE_KEY);
    if (is_array($cached) && !empty($cached['items']) && is_array($cached['items'])) {
        $expires_at = isset($cached['expires_at']) ? (int) $cached['expires_at'] : 0;
        if ($expires_at === 0 || $expires_at > time()) {
            return array(
                'ok'     => true,
                'status' => 200,
                'body'   => '',
                'json'   => array(
                    'result' => array_values($cached['items']),
                ),
                'error'  => null,
            );
        }
        delete_transient(DV2_COMPETITIONS_CACHE_KEY);
    }

    $from_file = dv2_competitions_read_file_cache();
    if (is_array($from_file) && !empty($from_file['items'])) {
        $expires_at = isset($from_file['expires_at']) ? (int) $from_file['expires_at'] : (time() + DV2_COMPETITIONS_CACHE_TTL);
        $ttl        = max(60, $expires_at - time());

        set_transient(
            DV2_COMPETITIONS_CACHE_KEY,
            array(
                'expires_at' => $expires_at,
                'items'      => $from_file['items'],
            ),
            $ttl
        );

        return array(
            'ok'     => true,
            'status' => 200,
            'body'   => '',
            'json'   => array(
                'result' => $from_file['items'],
            ),
            'error'  => null,
        );
    }

    $fetched = dv2_competitions_fetch_all_from_upstream();
    if (empty($fetched['ok'])) {
        return array(
            'ok'     => false,
            'status' => isset($fetched['status']) ? (int) $fetched['status'] : 502,
            'body'   => '',
            'json'   => array(
                'message' => 'error',
                'error'   => isset($fetched['error']) ? $fetched['error'] : 'Failed to fetch competitions',
            ),
            'error'  => isset($fetched['error']) ? $fetched['error'] : null,
        );
    }

    dv2_competitions_write_cache($fetched['items']);

    return array(
        'ok'     => true,
        'status' => 200,
        'body'   => '',
        'json'   => array(
            'result' => array_values($fetched['items']),
        ),
        'error'  => null,
    );
}

return array(
    // Caching is handled inside the handler (file + transient, 7 days).
    'method'    => 'GET',
    'cache_ttl' => 0,
    'handle'    => 'dv2_competitions_resolve_list',
);
