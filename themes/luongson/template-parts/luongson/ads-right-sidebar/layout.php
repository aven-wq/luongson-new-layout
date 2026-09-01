<?php
/**
 * Ads Right Sidebar page layout shell.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;
?>
<div class="luongson-ads-right-sidebar-page framer-Q1644 ls-blog-s85">
	<div class="framer-iggz1v">
		<div class="framer-1um4fyq">
			<?php 
				echo do_shortcode('[block id="notice-marquee"]');
				echo luongson_render_breadcrumb();
			?>
			<div class="luongson-wp-content">
				<?php the_content(); ?>
			</div>
		</div>

		<?php get_template_part( 'template-parts/luongson/ads-right-sidebar/sidebar-ads' ); ?>
	</div>
</div>
