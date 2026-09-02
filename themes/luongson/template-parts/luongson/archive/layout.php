<?php
/**
 * News category/archive layout — Ads Right Sidebar shell (tin.html).
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$heading           = luongson_get_news_archive_heading();
$nha_cai_position  = luongson_get_news_archive_nha_cai_position();
$post_index        = 0;
$small_thumb       = luongson_news_archive_has_small_thumb();
$grid_classes      = 'framer-zecxh3' . ( $small_thumb ? ' luongson-small-thumb' : '' );
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

			<div class="<?php echo esc_attr( $grid_classes ); ?>">
				<?php if ( have_posts() ) : ?>
					<?php
					while ( have_posts() ) {
						the_post();
						++$post_index;

						get_template_part( 'template-parts/luongson/archive/article', 'card' );

						if ( $post_index === $nha_cai_position ) {
							?>
							<div class="framer-cbakad">
								<div class="ssr-variant">
									<div class="framer-yy5utx-container luongson-top-bookmakers">
										<?php echo do_shortcode( '[luongson_nha_cai_uy_tin]' ); ?>
									</div>
								</div>
							</div>
							<?php
						}
					}
					?>
				<?php else : ?>
					<div class="framer-w6ehl luongson-archive-empty" data-framer-name="New">
						<div class="framer-u5kxfl">
							<div class="framer-dozwec ls-blog-s98" data-framer-component-type="RichTextContainer">
								<p dir="auto" class="framer-text ls-blog-s105"><?php esc_html_e( 'Chưa có bài viết nào.', 'luongson' ); ?></p>
							</div>
						</div>
					</div>
				<?php endif; ?>
			</div>

			<?php luongson_render_archive_pagination(); ?>
		</div>

		<?php get_template_part( 'template-parts/luongson/ads-right-sidebar/sidebar-ads' ); ?>
	</div>
</div>
