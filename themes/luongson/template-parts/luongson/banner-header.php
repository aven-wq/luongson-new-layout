<?php
/**
 * Top banner strip above main page content.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

if ( ! luongson_has_promo_banner() ) {
	return;
}

$banner_left_id  = luongson_get_promo_image_id( 'banner_left' );
$banner_mid_id   = luongson_get_promo_image_id( 'banner_mid' );
$banner_right_id = luongson_get_promo_image_id( 'banner_right' );
?>
<div class="framer-1snn28d luongson-banner-header">
	<?php if ( $banner_left_id ) : ?>
	<div class="framer-1xsjli6">
		<div class="ssr-variant">
			<div class="framer-1b5mt53" data-framer-name="Image">
				<div class="ls-s4" data-framer-background-image-wrapper="true">
					<img
						class="ls-s5"
						alt=""
						decoding="auto"
						height="200"
						sizes="(min-width: 1440px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 60px) / 3, 50px) * 3 - 0px) / 3, 1px)), (min-width: 1280px) and (max-width: 1439.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 2, 50px) * 2 - 20px) / 3, 1px)), (min-width: 760px) and (max-width: 959.98px) max(max((max(min(max(100vw, 1px), 1500px), 0px) - 30px) / 2, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 60px) / 3, 50px) * 3 - 0px) / 3, 1px)), (min-width: 960px) and (max-width: 1279.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 30px) / 2, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 60px) / 3, 50px) * 3 - 0px) / 3, 1px)), (max-width: 759.98px) max(calc(max(min(100vw, 1500px), 0px) - 8px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 60px) / 3, 50px) * 3 - 0px) / 3, 1px))"
						src="<?php echo esc_url( luongson_get_promo_image_url( 'banner_left' ) ); ?>"
						<?php if ( $srcset = wp_get_attachment_image_srcset( $banner_left_id, 'full' ) ) : ?>
						srcset="<?php echo esc_attr( $srcset ); ?>"
						<?php endif; ?>
						width="1572"
					/>
				</div>
			</div>
		</div>
	</div>
	<?php endif; ?>

	<?php if ( $banner_mid_id ) : ?>
	<div class="framer-czae09">
		<div class="ssr-variant">
			<div class="framer-lbrofv ls-s20" data-framer-name="Image">
				<div class="ls-s4" data-framer-background-image-wrapper="true">
					<img
						class="ls-s5"
						alt=""
						decoding="auto"
						height="180"
						sizes="(min-width: 1440px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 60px) / 3, 50px) * 3 - 0px) / 3, 1px), max((max(min(100vw, 1920px) - 540px, 1px) - 10px) / 2, 1px)), (min-width: 1280px) and (max-width: 1439.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 2, 50px) * 2 - 20px) / 3, 1px), max((max(min(100vw, 1920px) - 540px, 1px) - 10px) / 2, 1px)), (min-width: 760px) and (max-width: 959.98px) max(max((max(min(max(100vw, 1px), 1500px), 0px) - 30px) / 2, 1px), max((max((max(min(max(100vw, 1px), 1500px), 0px) - 30px) / 2, 50px) * 2 + 2px) / 2, 1px), max((max(min(100vw, 1920px) - 20px, 1px) - 10px) / 2, 1px)), (min-width: 960px) and (max-width: 1279.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 30px) / 2, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 2, 50px) * 2 - 0px) / 2, 1px), max((max(min(100vw, 1920px) - 230px, 1px) - 10px) / 2, 1px)), (max-width: 759.98px) max(calc(max(min(100vw, 1500px), 0px) - 8px), max(max(min(100vw, 1500px), 0px) - 20px, 50px), min(100vw, 1920px))"
						src="<?php echo esc_url( luongson_get_promo_image_url( 'banner_mid' ) ); ?>"
						<?php if ( $srcset = wp_get_attachment_image_srcset( $banner_mid_id, 'full' ) ) : ?>
						srcset="<?php echo esc_attr( $srcset ); ?>"
						<?php endif; ?>
						width="1456"
					/>
				</div>
			</div>
		</div>
	</div>
	<?php endif; ?>

	<?php if ( $banner_right_id ) : ?>
	<div class="framer-1ui2lv9 hidden-gimj73 hidden-15ovph7 hidden-f1vof3">
		<div class="framer-481t0q ls-s20" data-framer-name="Image">
			<div class="ls-s4" data-framer-background-image-wrapper="true">
				<img
					class="ls-s5"
					alt=""
					decoding="auto"
					height="200"
					sizes="(min-width: 1440px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 60px) / 3, 50px) * 3 - 0px) / 3, 1px)), (min-width: 1280px) and (max-width: 1439.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 2, 50px) * 2 - 20px) / 3, 1px)), (min-width: 960px) and (max-width: 1279.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 2, 50px) * 2 - 0px) / 2, 1px)), (min-width: 760px) and (max-width: 959.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max((max((max(min(max(100vw, 1px), 1500px), 0px) - 30px) / 2, 50px) * 2 + 2px) / 2, 1px)), (max-width: 759.98px) max(max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3, 1px), max(max(min(100vw, 1500px), 0px) - 20px, 50px))"
					src="<?php echo esc_url( luongson_get_promo_image_url( 'banner_right' ) ); ?>"
					<?php if ( $srcset = wp_get_attachment_image_srcset( $banner_right_id, 'full' ) ) : ?>
					srcset="<?php echo esc_attr( $srcset ); ?>"
					<?php endif; ?>
					width="1572"
				/>
			</div>
		</div>
	</div>
	<?php endif; ?>
</div>
