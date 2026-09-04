<?php
/**
 * Plugin Name: LuongSon Sport
 * Description: Shortcodes: [luongson_top_commentators], [luongson_home_match], [luongson_list_matches], [luongson_schedule]
 * Version: 1.3.0
 * Author: LuongSon
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LUONGSON_SPORT_VERSION', '1.3.3' );
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

/**
 * Shortcode [luongson_list_matches]
 *
 * Live matches grid ("Đang phát sóng") with match cards, odds, BLV dropdown, status modal.
 *
 * @return string
 */
function luongson_sport_shortcode_list_matches() {
	wp_enqueue_style(
		'luongson-sport-list-matches',
		LUONGSON_SPORT_URL . 'assets/css/list-matches.css',
		array(),
		LUONGSON_SPORT_VERSION
	);

	wp_enqueue_script(
		'luongson-sport-list-matches',
		LUONGSON_SPORT_URL . 'assets/js/list-matches.js',
		array(),
		LUONGSON_SPORT_VERSION,
		true
	);

	$img = LUONGSON_SPORT_URL . 'assets/images/';

	wp_localize_script(
		'luongson-sport-list-matches',
		'luongsonListMatches',
		array(
			'imgUrl' => $img,
		)
	);

	ob_start();
	include LUONGSON_SPORT_DIR . 'templates/list-matches.php';
	return (string) ob_get_clean();
}
add_shortcode( 'luongson_list_matches', 'luongson_sport_shortcode_list_matches' );

/**
 * Shortcode [luongson_schedule]
 *
 * Match schedule ("Lịch thi đấu") with date picker and match rows (odds + bet CTAs).
 *
 * @return string
 */
function luongson_sport_shortcode_schedule() {
	wp_enqueue_style(
		'luongson-sport-schedule',
		LUONGSON_SPORT_URL . 'assets/css/schedule.css',
		array(),
		LUONGSON_SPORT_VERSION
	);

	wp_enqueue_script(
		'luongson-sport-schedule',
		LUONGSON_SPORT_URL . 'assets/js/schedule.js',
		array(),
		LUONGSON_SPORT_VERSION,
		true
	);

	$img = LUONGSON_SPORT_URL . 'assets/images/';

	ob_start();
	include LUONGSON_SPORT_DIR . 'templates/schedule.php';
	return (string) ob_get_clean();
}
add_shortcode( 'luongson_schedule', 'luongson_sport_shortcode_schedule' );
