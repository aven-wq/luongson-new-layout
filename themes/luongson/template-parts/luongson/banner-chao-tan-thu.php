<?php
/**
 * Banner chào tân thủ (Framer Free Live Football Banner).
 *
 * @package LuongSon
 *
 * @var array<string, string> $args {
 *     @type string $title    Headline text.
 *     @type string $subtitle Supporting line.
 *     @type string $cta      CTA button label.
 *     @type string $url      Optional link URL (wraps whole banner).
 *     @type string $image    Banner image URL.
 *     @type string $mark     Premier League mark image URL.
 * }
 */

defined( 'ABSPATH' ) || exit;

$args = isset( $args ) && is_array( $args ) ? $args : array();

$title    = (string) ( $args['title'] ?? 'chào tân thủ, cược thả ga' );
$subtitle = (string) ( $args['subtitle'] ?? 'Khuyễn mãi nạp đầu - hoàn tiền cược cực cao' );
$cta      = (string) ( $args['cta'] ?? 'Cược ngay' );
$url      = trim( (string) ( $args['url'] ?? '' ) );
$image    = (string) ( $args['image'] ?? luongson_asset_uri( 'images/U949SLmfNe0t7dwd8nihkNdARM_1cd668a5.png' ) );
$mark     = (string) ( $args['mark'] ?? luongson_asset_uri( 'images/premier-league-mark.svg' ) );

?>
<?php if ( '' !== $url ) : ?>
<a class="framer-xfzr2e luongson-live-banner" data-framer-name="Free Live Football Banner" href="<?php echo esc_attr( $url ); ?>" target="_blank" rel="noopener noreferrer">
<?php else : ?>
<div class="framer-xfzr2e luongson-live-banner" data-framer-name="Free Live Football Banner">
<?php endif; ?>
	<div class="framer-eqm2fn" data-framer-name="Banner Copy">
		<div
			class="framer-uplkz7 ls-s131"
			data-framer-appear-id="uplkz7"
			data-framer-component-type="RichTextContainer"
		><p class="framer-text ls-s132" dir="auto"><?php echo esc_html( $title ); ?></p></div>
		<div
			class="framer-lcc8gm ls-s131"
			data-framer-appear-id="lcc8gm"
			data-framer-component-type="RichTextContainer"
		><p class="framer-text ls-s133" dir="auto"><?php echo esc_html( $subtitle ); ?></p></div>
		<div class="framer-1lxno9o ls-s134" data-border="true" data-framer-name="Premier League Identity">
			<div class="framer-f12aqz ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s135" dir="auto"><?php echo esc_html( $cta ); ?></p></div>
			<img
				alt=""
				class="framer-R2J9X framer-1jnvic5"
				src="<?php echo esc_url( $mark ); ?>"
			/>
		</div>
	</div>
	<div class="framer-1tpla2v ls-s59" data-framer-name="Image">
		<div class="ls-s4" data-framer-background-image-wrapper="true">
			<img
				class="ls-s5"
				alt=""
				decoding="auto"
				height="350"
				src="<?php echo esc_url( $image ); ?>"
				width="286"
			/>
		</div>
	</div>
<?php if ( '' !== $url ) : ?>
</a>
<?php else : ?>
</div>
<?php endif; ?>
