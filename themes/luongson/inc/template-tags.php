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
 * Site logo from Flatsome Customizer (Header → Logo & Site Identity).
 *
 * @return array{url: string, width: int, height: int}|null
 */
function luongson_get_site_logo() {
	$site_logo_id = function_exists( 'flatsome_option' ) ? flatsome_option( 'site_logo' ) : get_theme_mod( 'site_logo' );

	if ( empty( $site_logo_id ) ) {
		return null;
	}

	$width  = (int) get_theme_mod( 'logo_width', 200 );
	$height = (int) get_theme_mod( 'header_height', 90 );

	if ( ! is_numeric( $site_logo_id ) ) {
		return array(
			'url'    => $site_logo_id,
			'width'  => $width,
			'height' => $height,
		);
	}

	$site_logo = wp_get_attachment_image_src( (int) $site_logo_id, 'large' );

	if ( ! $site_logo ) {
		return null;
	}

	return array(
		'url'    => $site_logo[0],
		'width'  => (int) $site_logo[1],
		'height' => (int) $site_logo[2],
	);
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
 * Compact whitespace inside Framer list markup.
 *
 * The WP editor inserts newlines between <li> and inner <p>. Parent
 * RichTextContainer blocks use white-space: pre-wrap, so those newlines
 * render as line breaks and misalign custom ::before list bullets.
 *
 * @param string $html Sanitized HTML.
 * @return string
 */
function luongson_normalize_framer_list_markup( $html ) {
	$html = (string) $html;

	if ( '' === $html || ! preg_match( '/<(?:ul|ol)\b/i', $html ) ) {
		return $html;
	}

	$html = preg_replace( '/(<(?:ul|ol|li)\b[^>]*>)\s+/i', '$1', $html );
	$html = preg_replace( '/\s+(<\/(?:ul|ol|li)>)/i', '$1', $html );

	return $html;
}

/**
 * Add Framer typography classes to footer rich text paragraphs.
 *
 * @param string   $html              Sanitized HTML from the editor.
 * @param string   $default_class     Default ls-s* class for paragraphs.
 * @param string[] $paragraph_classes Optional per-paragraph class overrides.
 * @return string
 */
function luongson_format_footer_rich_text( $html, $default_class, $paragraph_classes = array() ) {
	$html = trim( (string) $html );

	if ( '' === $html ) {
		return '';
	}

	if ( ! preg_match( '/<p[\s>]/i', $html ) ) {
		$html = wpautop( $html );
	}

	$index = 0;

	$formatted = preg_replace_callback(
		'/<p(\s[^>]*)?>/i',
		static function ( $matches ) use ( &$index, $default_class, $paragraph_classes ) {
			$class = $paragraph_classes[ $index ] ?? $default_class;
			++$index;

			$attrs = $matches[1] ?? '';

			if ( preg_match( '/\sclass=(["\'])([^"\']*)\1/i', $attrs, $class_match ) ) {
				$merged = trim( $class_match[2] . ' framer-text ' . $class );
				$attrs  = preg_replace(
					'/\sclass=(["\'])([^"\']*)\1/i',
					' class="' . esc_attr( $merged ) . '"',
					$attrs,
					1
				);
			} else {
				$attrs .= ' class="framer-text ' . esc_attr( $class ) . '"';
			}

			if ( ! preg_match( '/\sdir=/i', $attrs ) ) {
				$attrs .= ' dir="auto"';
			}

			return '<p' . $attrs . '>';
		},
		$html
	);

	if ( ! preg_match( '/<p[\s>]/i', $formatted ) ) {
		return '<p class="framer-text ' . esc_attr( $default_class ) . '" dir="auto">' . $formatted . '</p>';
	}

	return $formatted;
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
