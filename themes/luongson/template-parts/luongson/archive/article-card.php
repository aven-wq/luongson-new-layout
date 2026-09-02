<?php
/**
 * News archive article card (tin.html framer-w6ehl).
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$permalink = get_permalink();
$title     = get_the_title();
$excerpt   = luongson_get_archive_excerpt();
$image_id    = get_post_thumbnail_id();
$small_thumb = luongson_news_archive_has_small_thumb();

$image_sizes = $small_thumb
	? '436px'
	: '(min-width: 1440px) max((max(max(min(max(100vw - 220px, 1px), 1500px), 0px) - 160px, 1px) - 32px) / 3, 50px), (min-width: 1280px) and (max-width: 1439.98px) max((max(max(min(max(100vw - 220px, 1px), 1500px), 0px) - 160px, 1px) - 32px) / 3, 50px), (min-width: 960px) and (max-width: 1279.98px) max((max(max(min(max(100vw - 220px, 1px), 1500px), 0px) - 20px, 1px) - 16px) / 2, 50px), (max-width: 759.98px) max((max(max(min(100vw, 1500px), 0px) - 20px, 1px) - 8px) / 2, 50px), (min-width: 760px) and (max-width: 959.98px) max((max(max(min(max(100vw, 1px), 1500px), 0px) - 160px, 1px) - 16px) / 2, 50px)';

$image_size = $small_thumb ? 'luongson-small-thumb' : 'medium_large';

$thumb_wrapper_classes = 'ls-blog-s87' . ( $small_thumb ? ' luongson-small-thumb' : '' );

$image_attrs = array(
	'class'    => 'ls-blog-s88',
	'decoding' => 'auto',
	'loading'  => 'lazy',
	'alt'      => $title,
	'sizes'    => $image_sizes,
);
?>
<div class="framer-w6ehl" data-framer-name="New">
	<a class="luongson-article-card-link" href="<?php echo esc_url( $permalink ); ?>" aria-label="<?php echo esc_attr( $title ); ?>"></a>
	<div class="ssr-variant">
		<div class="framer-16xpdaf">
			<div class="<?php echo esc_attr( $thumb_wrapper_classes ); ?>" data-framer-background-image-wrapper="true">
				<?php
				if ( $image_id ) {
					echo wp_get_attachment_image( $image_id, $image_size, false, $image_attrs );
				}
				?>
			</div>
		</div>
	</div>
	<div class="framer-u5kxfl">
		<div class="framer-dozwec ls-blog-s98" data-framer-component-type="RichTextContainer"><p dir="auto" class="framer-text ls-blog-s105"><?php echo esc_html( $title ); ?></p></div>
		<div class="framer-suxw8t">
			<div class="framer-ol33z ls-blog-s98" data-framer-component-type="RichTextContainer"><p dir="auto" class="framer-text ls-blog-s106"><?php echo esc_html( $excerpt ); ?></p></div>
		</div>
	</div>
</div>
