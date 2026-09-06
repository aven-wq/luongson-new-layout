<?php
/**
 * Single post layout — Ads Right Sidebar shell.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$title     = luongson_get_single_post_display_title();
$image_id  = get_post_thumbnail_id();
$author    = get_the_author();
$image_alt = $title;
?>
<div class="luongson-ads-right-sidebar-page framer-Q1644 ls-blog-s85">
	<div class="framer-iggz1v">
		<div class="framer-1um4fyq">
			<?php
			echo do_shortcode( '[block id="notice-marquee"]' );
			echo luongson_render_breadcrumb();
			?>

			<article class="luongson-single-article">
				<header class="framer-ftnzea luongson-single-header">
					<div class="framer-1sp4gth ls-blog-s98" data-framer-component-type="RichTextContainer">
						<h1 dir="auto" class="framer-text ls-blog-s104">
							<strong class="framer-text"><?php echo esc_html( $title ); ?></strong>
						</h1>
					</div>
				</header>

				<div class="luongson-single-content luongson-wp-content entry-content">
					<?php the_content(); ?>
				</div>

				<?php if ( '' !== trim( (string) $author ) ) : ?>
					<footer class="luongson-single-author">
						<p>
							<?php
							printf(
								/* translators: %s: post author display name */
								esc_html__( 'Tác giả: %s', 'luongson' ),
								esc_html( $author )
							);
							?>
						</p>
					</footer>
				<?php endif; ?>
			</article>

			<?php get_template_part( 'template-parts/luongson/single/related-posts' ); ?>
		</div>

		<div class="framer-1374ghc hidden-38kgo1 hidden-1j9nxh3 ads-right-sidebar">
			<?php echo do_shortcode('[block id="du-doan-ty-so"]'); ?>
		</div>
	</div>
</div>
