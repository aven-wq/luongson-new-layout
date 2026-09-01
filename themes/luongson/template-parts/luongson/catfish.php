<?php
/**
 * Sticky bottom catfish ad banner.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

if ( ! luongson_has_promo_catfish() ) {
	return;
}

$catfish_left_id  = luongson_get_promo_image_id( 'catfish_left' );
$catfish_right_id = luongson_get_promo_image_id( 'catfish_right' );
?>
<div class="framer-9hgzo luongson-catfish" data-framer-name="Catfish">
	<div class="framer-1ofl1o3 hidden-gimj73 hidden-f1vof3"></div>
	<div class="framer-9pns00">
		<?php if ( $catfish_left_id ) : ?>
		<div class="framer-195wq2k hidden-f1vof3">
			<div class="ssr-variant">
				<div class="framer-1aahoaj" data-framer-name="Color Map">
					<div class="ls-s4" data-framer-background-image-wrapper="true">
						<img
							class="ls-s5"
							alt=""
							decoding="auto"
							height="135"
							sizes="(min-width: 1440px) max((max(min(100vw, 1920px) - 540px, 1px) - 10px) / 2, 1px), (min-width: 1280px) and (max-width: 1439.98px) max((max(min(100vw, 1920px) - 540px, 1px) - 10px) / 2, 1px), (max-width: 759.98px) max((max(min(100vw, 1920px) - 540px, 1px) - 10px) / 2, 1px), (min-width: 760px) and (max-width: 959.98px) max((max(min(100vw, 1920px) - 20px, 1px) - 10px) / 2, 1px), (min-width: 960px) and (max-width: 1279.98px) max((max(min(100vw, 1920px) - 230px, 1px) - 10px) / 2, 1px)"
							src="<?php echo esc_url( luongson_get_promo_image_url( 'catfish_left' ) ); ?>"
							<?php if ( $srcset = wp_get_attachment_image_srcset( $catfish_left_id, 'full' ) ) : ?>
							srcset="<?php echo esc_attr( $srcset ); ?>"
							<?php endif; ?>
							width="1092"
						/>
					</div>
				</div>
			</div>
		</div>
		<?php endif; ?>

		<?php if ( $catfish_right_id ) : ?>
		<div class="framer-1dbij14">
			<div class="ssr-variant">
				<div class="framer-90iulr ls-s20" data-framer-name="Image">
					<div class="ls-s4" data-framer-background-image-wrapper="true">
						<img
							class="ls-s5"
							alt=""
							decoding="auto"
							height="180"
							sizes="(min-width: 1440px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 60px) / 3, 50px) * 3 - 0px) / 3, 1px), max((max(min(100vw, 1920px) - 540px, 1px) - 10px) / 2, 1px)), (min-width: 1280px) and (max-width: 1439.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 2, 50px) * 2 - 20px) / 3, 1px), max((max(min(100vw, 1920px) - 540px, 1px) - 10px) / 2, 1px)), (min-width: 760px) and (max-width: 959.98px) max(max((max(min(max(100vw, 1px), 1500px), 0px) - 30px) / 2, 1px), max((max((max(min(max(100vw, 1px), 1500px), 0px) - 30px) / 2, 50px) * 2 + 2px) / 2, 1px), max((max(min(100vw, 1920px) - 20px, 1px) - 10px) / 2, 1px)), (min-width: 960px) and (max-width: 1279.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 30px) / 2, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 2, 50px) * 2 - 0px) / 2, 1px), max((max(min(100vw, 1920px) - 230px, 1px) - 10px) / 2, 1px)), (max-width: 759.98px) max(calc(max(min(100vw, 1500px), 0px) - 8px), max(max(min(100vw, 1500px), 0px) - 20px, 50px), min(100vw, 1920px))"
							src="<?php echo esc_url( luongson_get_promo_image_url( 'catfish_right' ) ); ?>"
							<?php if ( $srcset = wp_get_attachment_image_srcset( $catfish_right_id, 'full' ) ) : ?>
							srcset="<?php echo esc_attr( $srcset ); ?>"
							<?php endif; ?>
							width="1456"
						/>
					</div>
				</div>
			</div>
		</div>
		<?php endif; ?>

		<div aria-label="<?php echo esc_attr__( 'Đóng quảng cáo', 'luongson' ); ?>" class="framer-hsrn5s" tabindex="0">
			<svg class="framer-KpKpK framer-1d3ejv3" role="presentation" viewBox="0 0 24 24">
				<path
					d="M18 6L6 18M6 6l12 12"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
	</div>
	<div class="framer-8fw8a0 hidden-gimj73 hidden-15ovph7 hidden-f1vof3"></div>
</div>
