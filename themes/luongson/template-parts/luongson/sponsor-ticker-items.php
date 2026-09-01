<?php
/**
 * Sponsor ticker logo items.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$sponsors = luongson_get_footer_sponsors();
$total    = count( $sponsors );

if ( 0 === $total ) {
	return;
}

foreach ( $sponsors as $index => $sponsor ) :
	$position = $index + 1;
	$image_url = $sponsor['image_url'];
	$link_url      = $sponsor['link'];
	$alt       = $sponsor['alt'] ?: __( 'Nhà tài trợ', 'luongson' );
	?>
	<li aria-hidden="false" aria-posinset="<?php echo esc_attr( (string) $position ); ?>" aria-setsize="<?php echo esc_attr( (string) $total ); ?>" class="ticker-item ls-s25">
		<?php if ( $link_url ) : ?>
			<a href="<?php echo esc_attr( $link_url ); ?>" target="_blank" rel="noopener noreferrer">
				<img alt="<?php echo esc_attr( $alt ); ?>" class="ls-s6" decoding="auto" loading="lazy" src="<?php echo esc_url( $image_url ); ?>" />
			</a>
		<?php else : ?>
			<img alt="<?php echo esc_attr( $alt ); ?>" class="ls-s6" decoding="auto" loading="lazy" src="<?php echo esc_url( $image_url ); ?>" />
		<?php endif; ?>
	</li>
	<?php
endforeach;
