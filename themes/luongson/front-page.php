<?php
/**
 * Front page template — static homepage inside LuongSon layout shell.
 *
 * @package LuongSon
 */

get_header();
?>

<div class="luongson-wp-content">
	<?php
	while ( have_posts() ) {
		the_post();
		the_content();
	}
	?>
</div>

<?php
get_footer();
