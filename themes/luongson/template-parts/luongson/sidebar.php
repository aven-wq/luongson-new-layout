<?php
/**
 * Left sidebar — desktop navigation.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

$logo     = luongson_get_site_logo();
$logo_url = $logo ? $logo['url'] : '';
$logo_w   = $logo ? $logo['width'] : 600;
$logo_h   = $logo ? $logo['height'] : 142;
$bg_url   = luongson_asset_url( 'images/pTd7CCLT508FqMHQ7dFkL9QKk_8ddf363d.png?width=4775&height=7432' );
?>
<div class="framer-ea4vkm-container luongson-sidebar-left" id="lsSidebar">
	<div class="framer-QbuP0 framer-1ei7e2m framer-v-1ei7e2m ls-s2" data-border="true" data-framer-name="Desktop">
		<div class="framer-1omzemv ls-s3" data-framer-name="Image">
			<div class="ls-s4" data-framer-background-image-wrapper="true">
				<img class="ls-s5" alt="" decoding="auto" height="7432" width="4775" src="<?php echo esc_url( $bg_url ); ?>" />
			</div>
		</div>
		<div class="framer-1supw53 ls-s6" data-framer-name="Menu LS">
			<div class="framer-pr73oa ls-s6" data-framer-name="Logo">
				<div class="ls-s4" data-framer-background-image-wrapper="true">
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>" style="display:block;width:100%;height:100%;">
						<?php if ( $logo_url ) : ?>
						<img class="ls-s5" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" decoding="auto" height="<?php echo esc_attr( (string) $logo_h ); ?>" width="<?php echo esc_attr( (string) $logo_w ); ?>" src="<?php echo esc_url( $logo_url ); ?>" />
						<?php endif; ?>
					</a>
				</div>
			</div>
		</div>
		<div class="framer-xuduv3 ls-s6 luongson-sidebar-nav" data-framer-name="Navigation Items">
			<?php luongson_render_nav_links(); ?>
		</div>
		<div class="framer-1fs5sty ls-s13"></div>
		<div class="framer-174nt9o ls-s14 luongson-sidebar-banner" data-framer-name="Football Betting Banner">
			<div class="framer-1u5fm4z ls-s15" data-framer-component-type="RichTextContainer">
				<p class="framer-text ls-s16" dir="auto">LIVE FOOTBALL</p>
			</div>
			<div class="framer-1k52wdm ls-s17" data-framer-component-type="RichTextContainer">
				<p class="framer-text ls-s18" dir="auto">BÓNG ĐÁ ĐỈNH CAO</p>
			</div>
			<div class="framer-arse6 ls-s19" data-framer-component-type="RichTextContainer">
				<p class="framer-text ls-s19" dir="auto">Cược thả ga</p>
			</div>
		</div>
	</div>
</div>
