<?php
/**
 * Theme shortcodes.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Return sponsor ticker list item markup.
 *
 * @return string
 */
function luongson_get_sponsor_ticker_items_html() {
	static $cached = null;

	if ( null !== $cached ) {
		return $cached;
	}

	ob_start();
	get_template_part( 'template-parts/luongson/sponsor-ticker', 'items' );
	$cached = (string) ob_get_clean();

	/**
	 * Filter sponsor logo list items HTML.
	 *
	 * @param string $items Ticker `<li>` markup.
	 */
	return apply_filters( 'luongson_footer_sponsor_items', $cached );
}

/**
 * Render sponsor ticker block from the Framer footer design.
 *
 * @param array<string, mixed> $args {
 *     Optional. Rendering options.
 *
 *     @type bool   $title   Whether to show the section heading.
 *     @type bool   $wrapper Whether to wrap in `.luongson-footer-sponsors`.
 *     @type string $label   Section heading text.
 * }
 * @return string
 */
function luongson_render_sponsor_ticker( $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'title'   => true,
			'wrapper' => true,
			'label'   => 'ĐỐI TÁC & NHÀ TÀI TRỢ',
		)
	);

	$items = luongson_get_sponsor_ticker_items_html();
	if ( '' === trim( $items ) ) {
		return '';
	}

	ob_start();

	if ( $args['wrapper'] ) {
		?>
		<div class="framer-1f6jmnw ls-s171 luongson-footer-sponsors" data-border="true" data-framer-name="Nhà tài trợ">
			<?php if ( $args['title'] ) : ?>
				<div class="framer-3aed5t ls-s172" data-framer-component-type="RichTextContainer" data-framer-name="Nhãn Nhà tài trợ">
					<h3 class="framer-text ls-s173" dir="auto"><?php echo esc_html( $args['label'] ); ?></h3>
				</div>
			<?php endif; ?>
			<div class="framer-35hpbh ls-s174" data-framer-name="Logo Nhà tài trợ" draggable="false">
				<ul class="ls-s175">
					<?php echo $items; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</ul>
			</div>
		</div>
		<?php
	} else {
		?>
		<div class="framer-35hpbh ls-s174" data-framer-name="Logo Nhà tài trợ" draggable="false">
			<ul class="ls-s175">
				<?php echo $items; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</ul>
		</div>
		<?php
	}

	return (string) ob_get_clean();
}

/**
 * Shortcode: [luongson_sponsor_ticker]
 *
 * Attributes:
 * - title="yes|no"   Show section heading (default: yes).
 * - wrapper="yes|no" Wrap in footer sponsors section (default: yes).
 * - label="..."      Custom heading text.
 *
 * @param array<string, string>|string $atts Shortcode attributes.
 * @return string
 */
function luongson_shortcode_sponsor_ticker( $atts ) {
	$atts = shortcode_atts(
		array(
			'title'   => 'yes',
			'wrapper' => 'yes',
			'label'   => 'ĐỐI TÁC & NHÀ TÀI TRỢ',
		),
		$atts,
		'luongson_sponsor_ticker'
	);

	return luongson_render_sponsor_ticker(
		array(
			'title'   => 'yes' === strtolower( $atts['title'] ),
			'wrapper' => 'yes' === strtolower( $atts['wrapper'] ),
			'label'   => $atts['label'],
		)
	);
}
add_shortcode( 'luongson_sponsor_ticker', 'luongson_shortcode_sponsor_ticker' );

/**
 * Resolve breadcrumb current-page label.
 *
 * @param string $label Optional override from shortcode attribute.
 * @return string
 */
function luongson_get_breadcrumb_label( $label = '' ) {
	$label = trim( (string) $label );

	if ( '' !== $label ) {
		return $label;
	}

	if ( is_category() ) {
		$label = single_cat_title( '', false );
		if ( '' !== $label ) {
			return $label;
		}
	}

	if ( is_tag() ) {
		$label = single_tag_title( '', false );
		if ( '' !== $label ) {
			return $label;
		}
	}

	if ( is_home() && ! is_front_page() ) {
		$posts_page_id = (int) get_option( 'page_for_posts' );
		if ( $posts_page_id ) {
			$title = get_the_title( $posts_page_id );
			if ( '' !== $title ) {
				return $title;
			}
		}
	}

	if ( is_singular() ) {
		$title = get_the_title();

		if ( '' !== $title ) {
			return $title;
		}
	}

	return '';
}

/**
 * Render breadcrumb block from the Framer tin.html design.
 *
 * @param array<string, string> $args {
 *     Optional. Rendering options.
 *
 *     @type string $label      Current page label. Defaults to singular title.
 *     @type string $home_label Home link text.
 *     @type string $home_url   Home link URL.
 * }
 * @return string
 */
function luongson_render_breadcrumb( $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'label'      => '',
			'home_label' => __( 'Trang chủ', 'luongson' ),
			'home_url'   => home_url( '/' ),
			'items'      => array(),
		)
	);

	if ( empty( $args['items'] ) && is_singular( 'post' ) ) {
		$args['items'] = luongson_get_single_breadcrumb_items();
	}

	if ( empty( $args['items'] ) ) {
		$args['label'] = luongson_get_breadcrumb_label( $args['label'] );

		if ( '' === $args['label'] ) {
			return '';
		}
	}

	ob_start();
	get_template_part(
		'template-parts/luongson/breadcrumb',
		null,
		$args
	);

	return (string) ob_get_clean();
}

/**
 * Shortcode: [luongson_breadcrumb]
 *
 * Attributes:
 * - label="..."      Current page label (default: current post/page title).
 * - home_label="..." Home link text (default: Trang chủ).
 * - home_url="..."   Home link URL (default: site home).
 *
 * @param array<string, string>|string $atts Shortcode attributes.
 * @return string
 */
function luongson_shortcode_breadcrumb( $atts ) {
	$atts = shortcode_atts(
		array(
			'label'      => '',
			'home_label' => __( 'Trang chủ', 'luongson' ),
			'home_url'   => home_url( '/' ),
		),
		$atts,
		'luongson_breadcrumb'
	);

	return luongson_render_breadcrumb( $atts );
}
add_shortcode( 'luongson_breadcrumb', 'luongson_shortcode_breadcrumb' );

/**
 * Render banner chào tân thủ from the Framer index design.
 *
 * @param array<string, string> $args {
 *     Optional. Rendering options.
 *
 *     @type string $title    Headline text.
 *     @type string $subtitle Supporting line.
 *     @type string $cta      CTA button label.
 *     @type string $url      Optional link URL.
 *     @type string $image    Banner image URL.
 *     @type string $mark     Premier League mark URL.
 * }
 * @return string
 */
function luongson_render_banner_chao_tan_thu( $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'title'    => 'chào tân thủ, cược thả ga',
			'subtitle' => 'Khuyễn mãi nạp đầu - hoàn tiền cược cực cao',
			'cta'      => 'Cược ngay',
			'url'      => luongson_get_promo_link_url( 'banner_chao_tan_thu_link' ),
			'image'    => luongson_asset_uri( 'images/U949SLmfNe0t7dwd8nihkNdARM_1cd668a5.png' ),
			'mark'     => luongson_get_promo_image_url( 'banner_chao_tan_thu_mark' ) ?: luongson_asset_uri( 'images/premier-league-mark.svg' ),
		)
	);

	ob_start();
	get_template_part(
		'template-parts/luongson/banner-chao-tan-thu',
		null,
		$args
	);

	return (string) ob_get_clean();
}

/**
 * Shortcode: [banner_chao_tan_thu]
 *
 * Attributes:
 * - title="..."    Headline (default: chào tân thủ, cược thả ga).
 * - subtitle="..." Supporting line.
 * - cta="..."      CTA label (default: Cược ngay).
 * - url="..."      Optional link wrapping the banner.
 * - image="..."    Banner image URL.
 * - mark="..."     Premier League mark URL.
 *
 * @param array<string, string>|string $atts Shortcode attributes.
 * @return string
 */
function luongson_shortcode_banner_chao_tan_thu( $atts ) {
	$atts = shortcode_atts(
		array(
			'title'    => 'chào tân thủ, cược thả ga',
			'subtitle' => 'Khuyễn mãi nạp đầu - hoàn tiền cược cực cao',
			'cta'      => 'Cược ngay',
			'url'      => '',
			'image'    => '',
			'mark'     => '',
		),
		$atts,
		'banner_chao_tan_thu'
	);

	if ( '' === trim( $atts['url'] ) ) {
		unset( $atts['url'] );
	}
	if ( '' === trim( $atts['image'] ) ) {
		unset( $atts['image'] );
	}
	if ( '' === trim( $atts['mark'] ) ) {
		unset( $atts['mark'] );
	}

	return luongson_render_banner_chao_tan_thu( $atts );
}
add_shortcode( 'banner_chao_tan_thu', 'luongson_shortcode_banner_chao_tan_thu' );
