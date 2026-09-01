<?php
/**
 * Template Name: Ads Right Sidebar
 * Description: Layout nội dung trái + ads sidebar phải. Nội dung nhập từ WordPress editor.
 *
 * @package LuongSon
 */

get_header();

while ( have_posts() ) {
	the_post();
	luongson_render_page_layout();
}

get_footer();
