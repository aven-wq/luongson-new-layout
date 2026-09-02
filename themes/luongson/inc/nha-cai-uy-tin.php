<?php
/**
 * Top Nhà Cái Uy Tín — reads Brandview toplist data without modifying the plugin.
 *
 * Uses plugin constants/transient (TF_CACHE_KEY, TF_API_URL, TF_TABLE, …)
 * so data stays in sync with [toplist_style3].
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Whether Brandview toplist constants are available.
 */
function luongson_toplist_is_available() {
	return defined( 'TF_CACHE_KEY' ) && defined( 'TF_API_URL' ) && defined( 'TF_TABLE' );
}

/**
 * Read toplist payload from plugin transient (fetch API if empty).
 *
 * @return array{items: array<int, array<string, mixed>>, settings: array<string, mixed>}
 */
function luongson_toplist_get_payload() {
	$empty = array(
		'items'    => array(),
		'settings' => array(),
	);

	if ( ! luongson_toplist_is_available() ) {
		return $empty;
	}

	$cached = get_transient( TF_CACHE_KEY );

	if ( false !== $cached ) {
		return array(
			'items'    => isset( $cached['items'] ) ? (array) $cached['items'] : ( is_array( $cached ) ? $cached : array() ),
			'settings' => isset( $cached['settings'] ) ? (array) $cached['settings'] : array(),
		);
	}

	$resp = wp_remote_get( TF_API_URL, array( 'timeout' => 10 ) );

	if ( is_wp_error( $resp ) || 200 !== wp_remote_retrieve_response_code( $resp ) ) {
		$parts = wp_parse_url( TF_API_URL );
		if ( ! empty( $parts['port'] ) ) {
			$alt = $parts['scheme'] . '://' . $parts['host'] . ( $parts['path'] ?? '' );
			if ( ! empty( $parts['query'] ) ) {
				$alt .= '?' . $parts['query'];
			}
			$resp = wp_remote_get( $alt, array( 'timeout' => 10 ) );
		}
	}

	if ( is_wp_error( $resp ) || 200 !== wp_remote_retrieve_response_code( $resp ) ) {
		return $empty;
	}

	$data = json_decode( wp_remote_retrieve_body( $resp ), true );
	if ( ! is_array( $data ) ) {
		$data = array();
	}

	$items    = isset( $data['items'] ) ? (array) $data['items'] : $data;
	$settings = isset( $data['settings'] ) ? (array) $data['settings'] : array();
	$ttl      = defined( 'TF_CACHE_TIME' ) ? (int) TF_CACHE_TIME : 10;

	set_transient(
		TF_CACHE_KEY,
		array(
			'items'    => $items,
			'settings' => $settings,
		),
		$ttl
	);

	return array(
		'items'    => $items,
		'settings' => $settings,
	);
}

/**
 * Domain/code → mlink map from plugin DB table.
 *
 * @return array<string, array<string, string>>
 */
function luongson_toplist_get_links() {
	global $wpdb;

	if ( ! luongson_toplist_is_available() ) {
		return array();
	}

	$table = $wpdb->prefix . TF_TABLE;
	$rows  = $wpdb->get_results( "SELECT code, domain, mlink, review_link FROM {$table}", ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared

	if ( ! is_array( $rows ) ) {
		return array();
	}

	$result = array();

	foreach ( $rows as $row ) {
		$result[ $row['domain'] ] = $row;
		if ( ! empty( $row['code'] ) ) {
			$result[ $row['code'] ] = $row;
		}
	}

	return $result;
}

/**
 * Resolve outbound href for a toplist item (same rules as toplist_style3).
 *
 * @param array<string, mixed>         $item  Toplist item.
 * @param array<string, array<string, string>> $links Link map.
 * @return string
 */
function luongson_toplist_get_item_href( $item, $links ) {
	$domain = isset( $item['domain'] ) ? (string) $item['domain'] : '';
	$code   = isset( $item['code'] ) ? (string) $item['code'] : '';

	$mlink = '';
	if ( $code && ! empty( $links[ $code ]['mlink'] ) ) {
		$mlink = (string) $links[ $code ]['mlink'];
	} elseif ( $domain && ! empty( $links[ $domain ]['mlink'] ) ) {
		$mlink = (string) $links[ $domain ]['mlink'];
	}

	if ( $mlink ) {
		return preg_match( '#^(https?://|/)#', $mlink ) ? $mlink : '/' . ltrim( $mlink, '/' );
	}

	if ( ! $domain ) {
		return '';
	}

	return 'https://' . preg_replace( '#^https?://#', '', $domain );
}

/**
 * Resolve logo URL — prefer plugin local cache, fallback to remote icon.
 *
 * @param array<string, mixed> $item Toplist item.
 * @return string
 */
function luongson_toplist_get_item_icon( $item ) {
	$url = '';

	if ( ! empty( $item['header_icon'] ) ) {
		$url = (string) $item['header_icon'];
	} elseif ( ! empty( $item['icon'] ) ) {
		$url = (string) $item['icon'];
	}

	if ( '' === $url ) {
		return '';
	}

	if ( defined( 'TF_IMG_CACHE_OPTION' ) ) {
		$mapping = get_option( TF_IMG_CACHE_OPTION, array() );
		$hash    = md5( $url );

		if ( isset( $mapping[ $hash ]['path'], $mapping[ $hash ]['url'] ) && file_exists( $mapping[ $hash ]['path'] ) ) {
			return (string) $mapping[ $hash ]['url'];
		}
	}

	return $url;
}

/**
 * Get Top Nhà Cái items (same filters as [toplist_style3]).
 *
 * @param array<string, mixed> $atts Optional. limit, type.
 * @return array{items: array<int, array<string, string>>, cta: string}
 */
function luongson_get_nha_cai_uy_tin_context( $atts = array() ) {
	$fallback = array(
		'items' => array(),
		'cta'   => __( 'Cược ngay', 'luongson' ),
	);

	if ( ! luongson_toplist_is_available() ) {
		return $fallback;
	}

	$atts = wp_parse_args(
		$atts,
		array(
			'limit' => 0,
			'type'  => '',
		)
	);

	$payload  = luongson_toplist_get_payload();
	$items    = $payload['items'];
	$settings = $payload['settings'];

	if ( empty( $items ) ) {
		return $fallback;
	}

	$filter_type = ! empty( $atts['type'] ) && 'S' === strtoupper( (string) $atts['type'] ) ? 'S' : 'G';
	$items       = array_values(
		array_filter(
			$items,
			static function ( $item ) use ( $filter_type ) {
				return ( isset( $item['type'] ) && $item['type'] === $filter_type ) || ( ! isset( $item['type'] ) && 'G' === $filter_type );
			}
		)
	);

	if ( (int) $atts['limit'] > 0 ) {
		$items = array_slice( $items, 0, (int) $atts['limit'] );
	}

	if ( empty( $items ) ) {
		return $fallback;
	}

	$cta_text = ! empty( $settings['cta'] ) ? (string) $settings['cta'] : __( 'Cược ngay', 'luongson' );
	$links    = luongson_toplist_get_links();
	$prepared = array();

	foreach ( $items as $item ) {
		$domain = isset( $item['domain'] ) ? (string) $item['domain'] : '';
		$code   = isset( $item['code'] ) ? (string) $item['code'] : '';

		$prepared[] = array(
			'code'   => $code,
			'domain' => $domain,
			'href'   => luongson_toplist_get_item_href( $item, $links ),
			'icon'   => luongson_toplist_get_item_icon( $item ),
			'alt'    => ! empty( $item['slogan'] ) ? (string) $item['slogan'] : $domain,
		);
	}

	return array(
		'items' => $prepared,
		'cta'   => $cta_text,
	);
}

/**
 * Enqueue Top Nhà Cái Uy Tín block assets.
 */
function luongson_enqueue_nha_cai_uy_tin_assets() {
	static $enqueued = false;

	if ( $enqueued ) {
		return;
	}

	$enqueued  = true;
	$theme_ver = wp_get_theme()->get( 'Version' );
	$css_path  = get_stylesheet_directory() . '/assets/css/nha-cai-uy-tin.css';
	$js_path   = get_stylesheet_directory() . '/assets/js/nha-cai-uy-tin.js';

	wp_enqueue_style(
		'luongson-nha-cai-uy-tin',
		luongson_asset_uri( 'css/nha-cai-uy-tin.css' ),
		array( 'luongson-custom' ),
		file_exists( $css_path ) ? (string) filemtime( $css_path ) : $theme_ver
	);

	wp_enqueue_script(
		'luongson-nha-cai-uy-tin',
		luongson_asset_uri( 'js/nha-cai-uy-tin.js' ),
		wp_script_is( 'tf-script', 'registered' ) ? array( 'tf-script' ) : array(),
		file_exists( $js_path ) ? (string) filemtime( $js_path ) : $theme_ver,
		true
	);

	if ( wp_script_is( 'tf-script', 'registered' ) ) {
		wp_enqueue_script( 'tf-script' );
	}
}

/**
 * Render Top Nhà Cái Uy Tín block.
 *
 * @param array<string, mixed> $args Optional. limit, type.
 * @return string
 */
function luongson_render_nha_cai_uy_tin( $args = array() ) {
	$context = luongson_get_nha_cai_uy_tin_context( $args );

	if ( empty( $context['items'] ) ) {
		return '';
	}

	luongson_enqueue_nha_cai_uy_tin_assets();

	ob_start();
	get_template_part(
		'template-parts/luongson/nha-cai-uy-tin',
		null,
		$context
	);

	return (string) ob_get_clean();
}

/**
 * Shortcode: [luongson_nha_cai_uy_tin]
 *
 * Attributes (same as [toplist_style3]):
 * - limit="N"  Max items (0 = all).
 * - type="G|S" Filter Game or Sport (default: G).
 *
 * @param array<string, string>|string $atts Shortcode attributes.
 * @return string
 */
function luongson_shortcode_nha_cai_uy_tin( $atts ) {
	$atts = shortcode_atts(
		array(
			'limit' => 0,
			'type'  => '',
		),
		$atts,
		'luongson_nha_cai_uy_tin'
	);

	return luongson_render_nha_cai_uy_tin( $atts );
}
add_shortcode( 'luongson_nha_cai_uy_tin', 'luongson_shortcode_nha_cai_uy_tin' );
