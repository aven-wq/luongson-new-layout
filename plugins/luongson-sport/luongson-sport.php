<?php
/**
 * Plugin Name: LuongSon Sport
 * Description: Shortcodes: [luongson_top_commentators], [luongson_home_match]
 * Version: 1.1.0
 * Author: LuongSon
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LUONGSON_SPORT_VERSION', '1.1.0' );
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

/**
 * Shortcode [luongson_home_match]
 *
 * Featured home match card (stadium BG, ads ticker, teams, odds, CTA).
 *
 * @return string
 */
function luongson_sport_shortcode_home_match() {
	wp_enqueue_style(
		'luongson-sport-home-match',
		LUONGSON_SPORT_URL . 'assets/css/home-match.css',
		array(),
		LUONGSON_SPORT_VERSION
	);

	wp_enqueue_script(
		'luongson-sport-home-match',
		LUONGSON_SPORT_URL . 'assets/js/home-match.js',
		array(),
		LUONGSON_SPORT_VERSION,
		true
	);

	$img = LUONGSON_SPORT_URL . 'assets/images/';

	ob_start();
	include LUONGSON_SPORT_DIR . 'templates/home-match.php';
	return (string) ob_get_clean();
}
add_shortcode( 'luongson_home_match', 'luongson_sport_shortcode_home_match' );
