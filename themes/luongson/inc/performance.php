<?php
/**
 * Front-end performance helpers (PageSpeed-oriented, UI-safe).
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Resolve a theme CSS asset, preferring the minified dist copy when present.
 *
 * @param string $relative Relative path under assets/css/ (e.g. blog.css or dist/luongson-core.min.css).
 * @return array{uri:string,path:string,ver:string}
 */
function luongson_resolve_css_asset( $relative ) {
	$theme_ver = wp_get_theme()->get( 'Version' );
	$base_dir  = get_stylesheet_directory() . '/assets/css/';
	$relative  = ltrim( (string) $relative, '/' );

	$candidates = array( $relative );

	// Prefer dist/*.min.css for non-dist sources.
	if ( 0 !== strpos( $relative, 'dist/' ) && substr( $relative, -4 ) === '.css' ) {
		$base         = basename( $relative, '.css' );
		$candidates[] = 'dist/' . $base . '.min.css';
	}

	foreach ( array_reverse( $candidates ) as $candidate ) {
		$path = $base_dir . $candidate;
		if ( file_exists( $path ) ) {
			return array(
				'uri'  => luongson_asset_uri( 'css/' . $candidate ),
				'path' => $path,
				'ver'  => (string) filemtime( $path ),
			);
		}
	}

	$path = $base_dir . $relative;
	return array(
		'uri'  => luongson_asset_uri( 'css/' . $relative ),
		'path' => $path,
		'ver'  => file_exists( $path ) ? (string) filemtime( $path ) : $theme_ver,
	);
}

/**
 * Whether the core CSS bundle is newer than all source stylesheets.
 *
 * @return bool
 */
function luongson_core_css_bundle_is_fresh() {
	$bundle = get_stylesheet_directory() . '/assets/css/dist/luongson-core.min.css';
	if ( ! file_exists( $bundle ) ) {
		return false;
	}

	$bundle_mtime = (int) filemtime( $bundle );
	$sources      = array(
		'reset.css',
		'global.css',
		'components.css',
		'responsive.css',
		'animations.css',
		'luongson-overrides.css',
		'custom.css',
	);

	foreach ( $sources as $file ) {
		$path = get_stylesheet_directory() . '/assets/css/' . $file;
		if ( file_exists( $path ) && (int) filemtime( $path ) > $bundle_mtime ) {
			return false;
		}
	}

	return true;
}

/**
 * Preconnect to third-party origins still referenced by theme CSS (fonts / Framer assets).
 *
 * @param array<int, string|array<string, mixed>> $urls          URLs.
 * @param string                                  $relation_type Relation type.
 * @return array<int, string|array<string, mixed>>
 */
function luongson_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' !== $relation_type ) {
		return $urls;
	}

	$origins = array(
		array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		),
		array(
			'href'        => 'https://framerusercontent.com',
			'crossorigin' => 'anonymous',
		),
	);

	foreach ( $origins as $origin ) {
		$urls[] = $origin;
	}

	return $urls;
}
add_filter( 'wp_resource_hints', 'luongson_resource_hints', 10, 2 );

/**
 * Add defer to theme scripts that are safe to defer (footer, no document.write).
 *
 * @param string $tag    Script tag HTML.
 * @param string $handle Script handle.
 * @param string $src    Script src.
 * @return string
 */
function luongson_defer_theme_scripts( $tag, $handle, $src ) {
	$defer_handles = array(
		'luongson-navigation',
		'luongson-custom',
		'luongson-nha-cai-uy-tin',
		'luongson-blv-form',
	);

	if ( ! in_array( $handle, $defer_handles, true ) ) {
		return $tag;
	}

	if ( false !== strpos( $tag, ' defer' ) || false !== strpos( $tag, ' defer=' ) ) {
		return $tag;
	}

	return str_replace( ' src', ' defer src', $tag );
}
add_filter( 'script_loader_tag', 'luongson_defer_theme_scripts', 10, 3 );

/**
 * Preload the primary UI font (local woff2) to reduce FOIT/FOUT on first paint.
 */
function luongson_preload_critical_fonts() {
	$font = get_stylesheet_directory() . '/assets/fonts/BXRzvFfHh_fFyXlQWZgO0TyUN7PH0r2z_f28af473.woff2';
	if ( ! file_exists( $font ) ) {
		return;
	}

	$href = luongson_asset_uri( 'fonts/BXRzvFfHh_fFyXlQWZgO0TyUN7PH0r2z_f28af473.woff2' );
	printf(
		'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin />' . "\n",
		esc_url( $href )
	);
}
add_action( 'wp_head', 'luongson_preload_critical_fonts', 1 );
