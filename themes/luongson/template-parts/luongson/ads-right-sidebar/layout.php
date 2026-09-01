<?php
/**
 * Ads Right Sidebar page layout shell.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;
?>
<div class="luongson-ads-right-sidebar-page">
	<div class="framer-iggz1v">
		<div class="framer-1um4fyq">
			<div class="luongson-wp-content">
				<?php the_content(); ?>
			</div>
		</div>

		<?php get_template_part( 'template-parts/luongson/ads-right-sidebar/sidebar-ads' ); ?>
	</div>
</div>
