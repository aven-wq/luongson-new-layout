<?php
/**
 * DV2 Streaming — upstream proxy config (server-side only).
 *
 * Public path for front-end: /api/dv2-streaming-plugin/{endpoint}
 * API key must NEVER be exposed to browser JS.
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Public URL prefix (no trailing slash). */
if (!defined('DV2_PROXY_PUBLIC_BASE')) {
    define('DV2_PROXY_PUBLIC_BASE', '/api/dv2-streaming-plugin');
}

/** Upstream API host (no trailing slash). */
if (!defined('DV2_PROXY_UPSTREAM_BASE')) {
    define('DV2_PROXY_UPSTREAM_BASE', 'https://vscapiv2.cdnx.tech');
}

/** Upstream API key (X-API-Key). */
if (!defined('DV2_PROXY_UPSTREAM_API_KEY')) {
    define(
        'DV2_PROXY_UPSTREAM_API_KEY',
        'vsc_live_ck_f10cbc57597ef3e4_OSxUTbvv4Ev-4iR56zPjEkE8a4_ETEZyukb5d4LNbVM'
    );
}

/** Default timeout for upstream requests (seconds). */
if (!defined('DV2_PROXY_TIMEOUT')) {
    define('DV2_PROXY_TIMEOUT', 20);
}
