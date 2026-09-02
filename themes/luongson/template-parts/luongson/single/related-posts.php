<?php
/**
 * Related posts block — "Tin tức cùng chuyên mục".
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$related_query  = luongson_get_related_category_posts();
$primary_term   = luongson_get_single_primary_category();
$small_thumb    = false;

if ( ! $primary_term instanceof WP_Term ) {
	return;
}

$small_thumb = luongson_category_has_small_thumb( (int) $primary_term->term_id );
?>
<section class="luongson-single-related" aria-labelledby="luongson-related-posts-heading">
	<div class="framer-ftnzea">
		<div class="framer-1sp4gth ls-blog-s98" data-framer-component-type="RichTextContainer">
			<h2 id="luongson-related-posts-heading" dir="auto" class="framer-text ls-blog-s104">
				<strong class="framer-text"><?php esc_html_e( 'Tin tức cùng chuyên mục', 'luongson' ); ?></strong>
			</h2>
		</div>
	</div>

	<?php
	get_template_part(
		'template-parts/luongson/archive/posts',
		'grid',
		array(
			'query'          => $related_query,
			'small_thumb'    => $small_thumb,
			'grid_class'     => 'luongson-single-related-grid',
			'reset_postdata' => true,
		)
	);

	luongson_render_single_related_pagination( $related_query );
	?>
</section>
