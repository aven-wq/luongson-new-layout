<?php
/**
 * LuongSon template helpers.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Base URI for theme static assets.
 */
function luongson_asset_uri( $path = '' ) {
	$base = trailingslashit( get_stylesheet_directory_uri() ) . 'assets/';
	return $path ? $base . ltrim( $path, '/' ) : $base;
}

/**
 * Base URL for theme images and other static files.
 */
function luongson_asset_url( $path = '' ) {
	return luongson_asset_uri( $path );
}

/**
 * Navigation items mirrored from the design sidebar.
 *
 * @return array<int, array<string, string>>
 */
function luongson_get_nav_items() {
	return array(
		array(
			'slug'       => 'home',
			'label'      => 'Trang chủ',
			'url'        => home_url( '/' ),
			'icon'       => 'framer-BHaPX framer-an6fg4',
			'link_class' => 'framer-k92g5e',
			'text_class' => 'framer-527tjl',
		),
		array(
			'slug'       => 'lich-thi-dau',
			'label'      => 'Lịch thi đấu',
			'url'        => home_url( '/lich-thi-dau/' ),
			'icon'       => 'framer-deoUy framer-17bmagu',
			'link_class' => 'framer-qweaht',
			'text_class' => 'framer-pdwkbf',
		),
		array(
			'slug'       => 'highlights',
			'label'      => 'Highlights',
			'url'        => home_url( '/highlights/' ),
			'icon'       => 'framer-ry8uE framer-cr94t6',
			'link_class' => 'framer-fm51jy',
			'text_class' => 'framer-1f8d32j',
		),
		array(
			'slug'       => 'aff',
			'label'      => 'AFF Cup',
			'url'        => home_url( '/aff/' ),
			'icon'       => 'aff-icon',
			'link_class' => 'framer-rtdaqv',
			'text_class' => 'framer-1w0oiiz',
		),
		array(
			'slug'       => 'nhan-dinh',
			'label'      => 'Nhận định',
			'url'        => home_url( '/nhan-dinh/' ),
			'icon'       => 'framer-mh61q framer-e15086',
			'link_class' => 'framer-17zqi0c',
			'text_class' => 'framer-1wh0vnl',
		),
		array(
			'slug'       => 'soi-keo',
			'label'      => 'Soi kèo',
			'url'        => home_url( '/soi-keo/' ),
			'icon'       => 'framer-8myKw framer-1oy5sfo',
			'link_class' => 'framer-n8ithq',
			'text_class' => 'framer-bnvzw0',
		),
		array(
			'slug'       => 'tin-tuc',
			'label'      => 'Tin tức',
			'url'        => home_url( '/tin-tuc/' ),
			'icon'       => 'framer-p1WUs framer-jal8by',
			'link_class' => 'framer-mzboi1',
			'text_class' => 'framer-2fyly2',
		),
		array(
			'slug'       => 'khuyen-mai',
			'label'      => 'Khuyến mãi',
			'url'        => home_url( '/khuyen-mai/' ),
			'icon'       => 'framer-i1TDP framer-10iggq5',
			'link_class' => 'framer-o1anxw',
			'text_class' => 'framer-7anvse',
		),
		array(
			'slug'       => 'ung-tuyen-blv',
			'label'      => 'Ứng tuyển BLV',
			'url'        => home_url( '/ung-tuyen-blv/' ),
			'icon'       => 'framer-sQNpM framer-n6e0s1',
			'link_class' => 'framer-1ryvz9p',
			'text_class' => 'framer-ld3gan',
		),
	);
}

/**
 * Whether a nav item should be marked active.
 */
function luongson_is_nav_active( $url ) {
	if ( is_front_page() && trailingslashit( $url ) === trailingslashit( home_url( '/' ) ) ) {
		return true;
	}

	$current_path = trailingslashit( wp_parse_url( home_url( add_query_arg( array() ) ), PHP_URL_PATH ) ?: '/' );
	$target_path  = trailingslashit( wp_parse_url( $url, PHP_URL_PATH ) ?: '/' );

	return $current_path === $target_path;
}

/**
 * Render sidebar navigation links.
 */
function luongson_render_nav_links() {
	foreach ( luongson_get_nav_items() as $item ) {
		$is_active = luongson_is_nav_active( $item['url'] );
		$classes   = trim( ( $item['link_class'] ?? '' ) . ' framer-qohcna ls-s7' );
		?>
		<a
			class="<?php echo esc_attr( $classes ); ?>"
			href="<?php echo esc_url( $item['url'] ); ?>"
			<?php echo $is_active ? ' data-framer-page-link-current="true"' : ''; ?>
		>
			<?php if ( 'aff-icon' === $item['icon'] ) : ?>
				<div class="framer-1p5zqos ls-s11">
					<div class="framer-3yq53u ls-s12" data-framer-name="Image">
						<div class="ls-s4" data-framer-background-image-wrapper="true">
							<img
								class="ls-s5"
								alt="AFF Cup"
								decoding="auto"
								height="1205"
								width="1280"
								src="<?php echo esc_url( luongson_asset_url( 'images/PuTsiLumL1D8AfGmuOinRVCOIj8_beaad5ce.png?width=1280&height=1205' ) ); ?>"
							/>
						</div>
					</div>
				</div>
			<?php else : ?>
				<div class="<?php echo esc_attr( $item['icon'] ); ?> ls-s8"></div>
			<?php endif; ?>
			<div class="<?php echo esc_attr( trim( ( $item['text_class'] ?? '' ) . ' ls-s9' ) ); ?>" data-framer-component-type="RichTextContainer">
				<p class="framer-text ls-s10" dir="auto"><?php echo esc_html( $item['label'] ); ?></p>
			</div>
		</a>
		<?php
	}
}
