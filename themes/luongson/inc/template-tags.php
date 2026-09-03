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
 * Menu object assigned to the sidebar (falls back to Main Menu).
 *
 * @return WP_Term|false
 */
function luongson_get_sidebar_nav_menu() {
	$locations = get_nav_menu_locations();

	foreach ( array( 'luongson-sidebar', 'primary' ) as $location ) {
		if ( empty( $locations[ $location ] ) ) {
			continue;
		}

		$menu = wp_get_nav_menu_object( (int) $locations[ $location ] );
		if ( $menu ) {
			return $menu;
		}
	}

	return false;
}

/**
 * Flatsome menu-icon fields for a nav item.
 *
 * @param int $item_id Menu item post ID.
 * @return array{type:string,url?:string,alt?:string,html?:string}|null
 */
function luongson_get_menu_item_icon( $item_id ) {
	$item_id   = (int) $item_id;
	$icon_type = get_post_meta( $item_id, '_menu_item_icon-type', true );
	$icon_id   = (int) get_post_meta( $item_id, '_menu_item_icon-id', true );
	$icon_html = get_post_meta( $item_id, '_menu_item_icon-html', true );

	if ( 'html' === $icon_type && '' !== (string) $icon_html ) {
		return array(
			'type' => 'html',
			'html' => (string) $icon_html,
		);
	}

	if ( $icon_id ) {
		$src = wp_get_attachment_image_src( $icon_id, 'full' );
		if ( $src ) {
			return array(
				'type' => 'image',
				'url'  => $src[0],
				'alt'  => (string) get_post_meta( $icon_id, '_wp_attachment_image_alt', true ),
			);
		}
	}

	return null;
}

/**
 * Navigation items from Appearance → Menus.
 *
 * @return array<int, array<string, mixed>>
 */
function luongson_get_nav_items() {
	$menu = luongson_get_sidebar_nav_menu();
	if ( ! $menu ) {
		return array();
	}

	$menu_items = wp_get_nav_menu_items( $menu->term_id );
	if ( empty( $menu_items ) || ! is_array( $menu_items ) ) {
		return array();
	}

	_wp_menu_item_classes_by_context( $menu_items );

	$items = array();

	foreach ( $menu_items as $menu_item ) {
		if ( (int) $menu_item->menu_item_parent !== 0 ) {
			continue;
		}

		$classes = is_array( $menu_item->classes ) ? $menu_item->classes : array();
		$current = in_array( 'current-menu-item', $classes, true )
			|| in_array( 'current-menu-ancestor', $classes, true )
			|| in_array( 'current-menu-parent', $classes, true )
			|| ! empty( $menu_item->current )
			|| ! empty( $menu_item->current_item_ancestor )
			|| ! empty( $menu_item->current_item_parent );

		$items[] = array(
			'id'       => (int) $menu_item->ID,
			'label'    => $menu_item->title,
			'url'      => $menu_item->url,
			'target'   => $menu_item->target,
			'xfn'      => $menu_item->xfn,
			'icon'     => luongson_get_menu_item_icon( (int) $menu_item->ID ),
			'current'  => $current,
		);
	}

	return $items;
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

	if ( $current_path === $target_path ) {
		return true;
	}

	if ( is_category() && trailingslashit( $url ) === trailingslashit( home_url( '/tin-tuc/' ) ) ) {
		$term = get_queried_object();
		if ( $term instanceof WP_Term ) {
			if ( 'tin-tuc' === $term->slug ) {
				return true;
			}

			$news_root = get_category_by_slug( 'tin-tuc' );
			if ( $news_root instanceof WP_Term && cat_is_ancestor_of( (int) $news_root->term_id, (int) $term->term_id ) ) {
				return true;
			}
		}
	}

	return false;
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
 * Render sidebar navigation links from the WP menu.
 */
function luongson_render_nav_links() {
	foreach ( luongson_get_nav_items() as $item ) {
		$is_active = ! empty( $item['current'] ) || luongson_is_nav_active( $item['url'] );
		$icon      = $item['icon'] ?? null;
		?>
		<a
			class="framer-qohcna ls-s7"
			href="<?php echo esc_url( $item['url'] ); ?>"
			<?php echo ! empty( $item['target'] ) ? ' target="' . esc_attr( $item['target'] ) . '"' : ''; ?>
			<?php echo ! empty( $item['xfn'] ) ? ' rel="' . esc_attr( $item['xfn'] ) . '"' : ''; ?>
			<?php echo $is_active ? ' data-framer-page-link-current="true"' : ''; ?>
		>
			<div class="ls-s8 luongson-sidebar-nav-icon">
				<?php if ( is_array( $icon ) && 'image' === ( $icon['type'] ?? '' ) && ! empty( $icon['url'] ) ) : ?>
					<img
						src="<?php echo esc_url( $icon['url'] ); ?>"
						alt="<?php echo esc_attr( $icon['alt'] ?? '' ); ?>"
						width="18"
						height="18"
						decoding="async"
					/>
				<?php elseif ( is_array( $icon ) && 'html' === ( $icon['type'] ?? '' ) && ! empty( $icon['html'] ) ) : ?>
					<?php echo do_shortcode( $icon['html'] ); ?>
				<?php endif; ?>
			</div>
			<div class="ls-s9" data-framer-component-type="RichTextContainer">
				<p class="framer-text ls-s10" dir="auto"><?php echo esc_html( $item['label'] ); ?></p>
			</div>
		</a>
		<?php
	}
}
