<?php
/**
 * Mobile / tablet sticky header.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$logo     = luongson_get_site_logo();
$logo_url = $logo ? $logo['url'] : '';
$logo_w   = $logo ? $logo['width'] : 600;
$logo_h   = $logo ? $logo['height'] : 142;
?>
<div class="ssr-variant luongson-mobile-header">
	<div class="framer-1thqph1-container">
		<div class="framer-GRble framer-tcv7bq framer-v-17laidi framer-v-4lv5aa ls-s212" data-framer-name="Tablet">
			<div class="framer-1byd5n2 ls-s6" data-framer-name="Menu LS">
				<div class="framer-1hocoz ls-s6" data-framer-name="Logo">
					<div class="ls-s4" data-framer-background-image-wrapper="true">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>" style="display:block;width:100%;height:100%;">
							<?php if ( $logo_url ) : ?>
							<img
								class="ls-s5"
								alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>"
								decoding="auto"
								height="<?php echo esc_attr( (string) $logo_h ); ?>"
								width="<?php echo esc_attr( (string) $logo_w ); ?>"
								src="<?php echo esc_url( $logo_url ); ?>"
							/>
							<?php endif; ?>
						</a>
					</div>
				</div>
			</div>
			<div class="framer-2zreyi ls-s6">
				<div
					class="framer-q2hsys ls-s6"
					data-highlight="true"
					id="sidebarToggle"
					tabindex="0"
					role="button"
					aria-label="<?php esc_attr_e( 'Mở menu', 'luongson' ); ?>"
				>
					<svg class="framer-OmG2n framer-19di80 ls-s176" role="presentation" viewBox="0 0 24 24">
						<path d="M 4.75 5.75 L 19.25 5.75" fill="transparent" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" stroke="rgb(255, 255, 255)" />
						<path d="M 4.75 12 L 19.25 12" fill="transparent" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" stroke="rgb(255, 255, 255)" />
						<path d="M 4.75 18.25 L 19.25 18.25" fill="transparent" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" stroke="rgb(255, 255, 255)" />
					</svg>
				</div>
			</div>
		</div>
	</div>
</div>
