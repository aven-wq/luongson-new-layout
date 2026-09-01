<?php
/**
 * Ads Right Sidebar page template helpers.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Get the custom page template slug for the current page.
 */
function luongson_get_page_layout_template() {
	if ( ! is_singular( 'page' ) ) {
		return '';
	}

	return (string) get_page_template_slug( get_queried_object_id() );
}

/**
 * Whether the current request uses the Ads Right Sidebar page template.
 */
function luongson_is_ads_right_sidebar_template() {
	return 'page-templates/ads-right-sidebar.php' === luongson_get_page_layout_template();
}

/**
 * Render page content using the layout assigned in admin.
 */
function luongson_render_page_layout() {
	if ( luongson_is_ads_right_sidebar_template() ) {
		get_template_part( 'template-parts/luongson/ads-right-sidebar/layout' );
		return;
	}

	echo '<div class="luongson-wp-content">';
	the_content();
	echo '</div>';
}

/**
 * Enqueue layout assets for Ads Right Sidebar pages.
 */
function luongson_enqueue_ads_right_sidebar_assets() {
	if ( ! luongson_is_ads_right_sidebar_template() ) {
		return;
	}

	$theme_ver = wp_get_theme()->get( 'Version' );
	$css_path  = get_stylesheet_directory() . '/assets/css/blog.css';

	wp_enqueue_style(
		'luongson-ads-right-sidebar',
		luongson_asset_uri( 'css/blog.css' ),
		array( 'luongson-custom' ),
		file_exists( $css_path ) ? (string) filemtime( $css_path ) : $theme_ver
	);
}
add_action( 'wp_enqueue_scripts', 'luongson_enqueue_ads_right_sidebar_assets', 100 );

/**
 * Add layout class for Ads Right Sidebar pages.
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function luongson_ads_right_sidebar_body_class( $classes ) {
	if ( luongson_is_ads_right_sidebar_template() ) {
		$classes[] = 'luongson-ads-right-sidebar';
	}

	return $classes;
}
add_filter( 'body_class', 'luongson_ads_right_sidebar_body_class' );
