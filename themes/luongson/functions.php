<?php
/**
 * LuongSon Child Theme
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

require_once get_stylesheet_directory() . '/inc/template-tags.php';
require_once get_stylesheet_directory() . '/inc/performance.php';
require_once get_stylesheet_directory() . '/inc/ads-right-sidebar-template.php';
require_once get_stylesheet_directory() . '/inc/archive-template.php';
require_once get_stylesheet_directory() . '/inc/single-template.php';
require_once get_stylesheet_directory() . '/inc/category-archive-settings.php';
require_once get_stylesheet_directory() . '/inc/shortcodes.php';
require_once get_stylesheet_directory() . '/inc/nha-cai-uy-tin.php';
require_once get_stylesheet_directory() . '/inc/blv-form-submit.php';
require_once get_stylesheet_directory() . '/admin/class-luongson-footer-settings.php';
require_once get_stylesheet_directory() . '/admin/class-luongson-promo-settings.php';
require_once get_stylesheet_directory() . '/admin/class-luongson-block-common-settings.php';

if ( is_admin() ) {
	require_once get_stylesheet_directory() . '/admin/class-luongson-admin.php';
}

/**
 * Theme setup.
 */
function luongson_setup() {
	register_nav_menus(
		array(
			'luongson-sidebar' => __( 'Sidebar Navigation', 'luongson' ),
		)
	);
}
add_action( 'after_setup_theme', 'luongson_setup' );

/**
 * Hide default Flatsome header/footer shell.
 */
function luongson_hide_flatsome_shell() {
	?>
	<style id="luongson-hide-flatsome-shell">
		#header.header,
		#footer.footer-wrapper,
		body.luongson-theme #wrapper > #header {
			display: none !important;
		}
	</style>
	<?php
}
add_action( 'wp_head', 'luongson_hide_flatsome_shell', 100 );

/**
 * Enqueue layout CSS + navigation script.
 *
 * Uses a single minified core bundle when available (same cascade order as the
 * source files) to cut render-blocking round trips without changing UI styles.
 */
function luongson_enqueue_assets() {
	$theme_ver = wp_get_theme()->get( 'Version' );
	$core      = luongson_resolve_css_asset( 'dist/luongson-core.min.css' );

	if ( file_exists( $core['path'] ) && luongson_core_css_bundle_is_fresh() ) {
		wp_enqueue_style(
			'luongson-custom',
			$core['uri'],
			array( 'flatsome-style' ),
			$core['ver']
		);
	} else {
		$css_dir = get_stylesheet_directory() . '/assets/css/';
		$styles  = array(
			'luongson-reset'      => 'reset.css',
			'luongson-global'     => 'global.css',
			'luongson-components' => 'components.css',
			'luongson-responsive' => 'responsive.css',
			'luongson-animations' => 'animations.css',
			'luongson-overrides'  => 'luongson-overrides.css',
			'luongson-custom'     => 'custom.css',
		);

		$prev = array( 'flatsome-style' );
		foreach ( $styles as $handle => $file ) {
			$path = $css_dir . $file;
			$ver  = file_exists( $path ) ? (string) filemtime( $path ) : $theme_ver;
			wp_enqueue_style( $handle, luongson_asset_uri( 'css/' . $file ), $prev, $ver );
			$prev = array( $handle );
		}
	}

	$js_path = get_stylesheet_directory() . '/assets/js/navigation.js';
	wp_enqueue_script(
		'luongson-navigation',
		luongson_asset_uri( 'js/navigation.js' ),
		array(),
		file_exists( $js_path ) ? (string) filemtime( $js_path ) : $theme_ver,
		true
	);

	wp_localize_script(
		'luongson-navigation',
		'luongsonNav',
		array(
			'homeUrl'   => home_url( '/' ),
			'assetBase' => luongson_asset_uri(),
		)
	);

	$custom_js_path = get_stylesheet_directory() . '/assets/js/custom.js';
	wp_enqueue_script(
		'luongson-custom',
		luongson_asset_uri( 'js/custom.js' ),
		array(),
		file_exists( $custom_js_path ) ? (string) filemtime( $custom_js_path ) : $theme_ver,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'luongson_enqueue_assets', 99 );

/**
 * Body class for layout scoping.
 */
function luongson_body_class( $classes ) {
	$classes[] = 'luongson-theme';
	$classes[] = 'framer-body';
	return $classes;
}
add_filter( 'body_class', 'luongson_body_class' );
