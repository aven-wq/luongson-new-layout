<?php
/**
 * Page template — respects the page template chosen in admin.
 *
 * @package LuongSon
 */

get_header();

while ( have_posts() ) {
	the_post();
	luongson_render_page_layout();
}

get_footer();
