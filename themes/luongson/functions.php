<?php
/**
 * LuongSon Child Theme
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

require_once get_stylesheet_directory() . '/inc/template-tags.php';
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
 */
function luongson_enqueue_assets() {
	$theme_ver = wp_get_theme()->get( 'Version' );
	$css_dir   = get_stylesheet_directory() . '/assets/css/';

	$styles = array(
		'luongson-reset'      => 'reset.css',
		'luongson-global'     => 'global.css',
		'luongson-components' => 'components.css',
		'luongson-responsive' => 'responsive.css',
		'luongson-animations' => 'animations.css',
	);

	$prev = array( 'flatsome-style' );
	foreach ( $styles as $handle => $file ) {
		$path = $css_dir . $file;
		$ver  = file_exists( $path ) ? (string) filemtime( $path ) : $theme_ver;
		wp_enqueue_style( $handle, luongson_asset_uri( 'css/' . $file ), $prev, $ver );
		$prev = array( $handle );
	}

	$override_path = get_stylesheet_directory() . '/assets/css/luongson-overrides.css';
	wp_enqueue_style(
		'luongson-overrides',
		luongson_asset_uri( 'css/luongson-overrides.css' ),
		array( 'luongson-animations' ),
		file_exists( $override_path ) ? (string) filemtime( $override_path ) : $theme_ver
	);

	$custom_path = get_stylesheet_directory() . '/assets/css/custom.css';
	wp_enqueue_style(
		'luongson-custom',
		luongson_asset_uri( 'css/custom.css' ),
		array( 'luongson-overrides' ),
		file_exists( $custom_path ) ? (string) filemtime( $custom_path ) : $theme_ver
	);

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
}
add_action( 'wp_enqueue_scripts', 'luongson_enqueue_assets', 99 );

/**
 * Google Fonts used by the design.
 */
function luongson_enqueue_fonts() {
	wp_enqueue_style(
		'luongson-fonts',
		'https://fonts.googleapis.com/css2?family=Anton+SC&family=Momo+Trust+Sans:wght@400;600;700;800&display=swap',
		array(),
		null
	);
}
add_action( 'wp_enqueue_scripts', 'luongson_enqueue_fonts', 5 );

/**
 * Body class for layout scoping.
 */
function luongson_body_class( $classes ) {
	$classes[] = 'luongson-theme';
	$classes[] = 'framer-body';
	return $classes;
}
add_filter( 'body_class', 'luongson_body_class' );
