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
