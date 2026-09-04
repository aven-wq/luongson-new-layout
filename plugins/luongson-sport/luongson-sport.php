<?php
/**
 * Plugin Name: LuongSon Sport
 * Description: Top bình luận viên — shortcode [luongson_top_commentators]
 * Version: 1.0.0
 * Author: LuongSon
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LUONGSON_SPORT_VERSION', '1.0.0' );
define( 'LUONGSON_SPORT_URL', plugin_dir_url( __FILE__ ) );
define( 'LUONGSON_SPORT_DIR', plugin_dir_path( __FILE__ ) );

/**
 * Shortcode [luongson_top_commentators]
 *
 * @return string
 */
function luongson_sport_shortcode_top_commentators() {
	wp_enqueue_style(
		'luongson-sport-commentators',
		LUONGSON_SPORT_URL . 'assets/css/commentators.css',
		array(),
		LUONGSON_SPORT_VERSION
	);

	wp_enqueue_script(
		'luongson-sport-commentators',
		LUONGSON_SPORT_URL . 'assets/js/commentators.js',
		array(),
		LUONGSON_SPORT_VERSION,
		true
	);

	$img = LUONGSON_SPORT_URL . 'assets/images/';

	ob_start();
	include LUONGSON_SPORT_DIR . 'templates/top-commentators.php';
	return (string) ob_get_clean();
}
add_shortcode( 'luongson_top_commentators', 'luongson_sport_shortcode_top_commentators' );
