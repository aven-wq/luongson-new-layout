<?php
/**
 * News archive posts grid (cards + Top Nhà Cái block).
 *
 * @package LuongSon
 *
 * @var WP_Query|null $query             Optional custom query. Defaults to main loop.
 * @var bool          $small_thumb       Whether cards use the small thumbnail layout.
 * @var string        $grid_class        Extra grid wrapper classes.
 * @var string        $empty_message     Message when no posts are found.
 * @var bool          $reset_postdata    Whether to call wp_reset_postdata() after a custom query.
 */

defined( 'ABSPATH' ) || exit;

$args            = isset( $args ) && is_array( $args ) ? $args : array();
$query           = isset( $args['query'] ) && $args['query'] instanceof WP_Query ? $args['query'] : null;
$small_thumb     = array_key_exists( 'small_thumb', $args ) ? (bool) $args['small_thumb'] : luongson_news_archive_has_small_thumb();
$grid_class      = trim( (string) ( $args['grid_class'] ?? '' ) );
$empty_message   = (string) ( $args['empty_message'] ?? __( 'Chưa có bài viết nào.', 'luongson' ) );
$reset_postdata  = ! empty( $args['reset_postdata'] );
$nha_cai_position = luongson_get_news_archive_nha_cai_position();
$post_index      = 0;
$grid_classes    = trim( 'framer-zecxh3' . ( $small_thumb ? ' luongson-small-thumb' : '' ) . ( '' !== $grid_class ? ' ' . $grid_class : '' ) );
$has_posts       = $query instanceof WP_Query ? $query->have_posts() : have_posts();
?>
<div class="<?php echo esc_attr( $grid_classes ); ?>">
	<?php if ( $has_posts ) : ?>
		<?php
		if ( $query instanceof WP_Query ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				++$post_index;

				get_template_part( 'template-parts/luongson/archive/article', 'card' );

				if ( $post_index === $nha_cai_position ) {
					get_template_part( 'template-parts/luongson/archive/nha-cai', 'block' );
				}
			}

			if ( $reset_postdata ) {
				wp_reset_postdata();
			}
		} else {
			while ( have_posts() ) {
				the_post();
				++$post_index;

				get_template_part( 'template-parts/luongson/archive/article', 'card' );

				if ( $post_index === $nha_cai_position ) {
					get_template_part( 'template-parts/luongson/archive/nha-cai', 'block' );
				}
			}
		}
		?>
	<?php else : ?>
		<div class="framer-w6ehl luongson-archive-empty" data-framer-name="New">
			<div class="framer-u5kxfl">
				<div class="framer-dozwec ls-blog-s98" data-framer-component-type="RichTextContainer">
					<p dir="auto" class="framer-text ls-blog-s105"><?php echo esc_html( $empty_message ); ?></p>
				</div>
			</div>
		</div>
	<?php endif; ?>
</div>
