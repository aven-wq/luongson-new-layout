<?php
/**
 * News category/archive layout — Ads Right Sidebar shell (tin.html).
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$heading = luongson_get_news_archive_heading();
?>
<div class="luongson-ads-right-sidebar-page framer-Q1644 ls-blog-s85">
	<div class="framer-iggz1v">
		<div class="framer-1um4fyq">
			<?php
			echo do_shortcode( '[block id="notice-marquee"]' );
			echo luongson_render_breadcrumb();
			?>

			<div class="framer-ftnzea">
				<div class="framer-1sp4gth ls-blog-s98" data-framer-component-type="RichTextContainer"><p dir="auto" class="framer-text ls-blog-s104"><strong class="framer-text"><?php echo esc_html( $heading ); ?></strong></p></div>
			</div>

			<?php get_template_part( 'template-parts/luongson/archive/posts', 'grid' ); ?>

			<?php luongson_render_archive_pagination(); ?>
		</div>

		<?php get_template_part( 'template-parts/luongson/ads-right-sidebar/sidebar-ads' ); ?>
	</div>
</div>
