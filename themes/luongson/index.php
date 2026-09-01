<?php
/**
 * Main template — wraps Flatsome content inside LuongSon layout shell.
 *
 * @package LuongSon
 */

get_header();
?>

<div class="luongson-wp-content">
	<?php
	if ( have_posts() ) {
		while ( have_posts() ) {
			the_post();
			the_content();
		}
	}
	?>
</div>

<?php
get_footer();
