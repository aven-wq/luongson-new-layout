<?php
/**
 * Single post — Ads Right Sidebar layout + related posts.
 *
 * @package LuongSon
 */

get_header();

while ( have_posts() ) {
	the_post();
	luongson_render_single_post_layout();
}

get_footer();
