<?php
/**
 * LuongSon admin bootstrap.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register top-level admin menu.
 */
function luongson_admin_menu() {
	add_menu_page(
		__( 'Lương Sơn Setting', 'luongson' ),
		__( 'Lương Sơn Setting', 'luongson' ),
		'manage_options',
		'luongson-settings',
		'luongson_render_settings_dashboard',
		'dashicons-admin-generic',
		58
	);

	add_submenu_page(
		'luongson-settings',
		__( 'Banner & Quảng cáo', 'luongson' ),
		__( 'Banner & Quảng cáo', 'luongson' ),
		'manage_options',
		'luongson-promo',
		array( 'LuongSon_Promo_Settings', 'render_page' )
	);

	add_submenu_page(
		'luongson-settings',
		__( 'Footer', 'luongson' ),
		__( 'Footer', 'luongson' ),
		'manage_options',
		'luongson-footer',
		array( 'LuongSon_Footer_Settings', 'render_page' )
	);

	remove_submenu_page( 'luongson-settings', 'luongson-settings' );
}
add_action( 'admin_menu', 'luongson_admin_menu' );

/**
 * Default landing page for the settings menu.
 */
function luongson_render_settings_dashboard() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	wp_safe_redirect( admin_url( 'admin.php?page=luongson-footer' ) );
	exit;
}
