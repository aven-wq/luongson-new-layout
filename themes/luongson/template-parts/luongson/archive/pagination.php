<?php
/**
 * News archive pagination (tin.html framer-1c73n61).
 *
 * @package LuongSon
 *
 * @var int   $current Current page.
 * @var int   $total   Total pages.
 * @var array $items   Pagination items from luongson_build_archive_pagination_items().
 */

defined( 'ABSPATH' ) || exit;

$args    = isset( $args ) && is_array( $args ) ? $args : array();
$current = max( 1, (int) ( $args['current'] ?? 1 ) );
$total   = max( 1, (int) ( $args['total'] ?? 1 ) );
$items   = isset( $args['items'] ) && is_array( $args['items'] ) ? $args['items'] : array();

if ( empty( $items ) ) {
	return;
}

$pagination_base = str_replace( 999999999, '%#%', esc_url( get_pagenum_link( 999999999 ) ) );
?>
<nav class="framer-1c73n61 luongson-archive-pagination" aria-label="<?php esc_attr_e( 'Phân trang bài viết', 'luongson' ); ?>">
	<?php foreach ( $items as $item ) : ?>
		<?php if ( 'dots' === ( $item['type'] ?? '' ) ) : ?>
			<div class="framer-1f3rioz" data-framer-name="Logo">
				<div class="framer-1i6j189 ls-blog-s22" data-framer-name="Cược ngay" data-framer-component-type="RichTextContainer">
					<p dir="auto" class="framer-text ls-blog-s40">&hellip;</p>
				</div>
			</div>
			<?php
			continue;
		endif;

		$page_number = (int) ( $item['number'] ?? 0 );
		if ( $page_number < 1 ) {
			continue;
		}

		$is_active = $page_number === $current;
		$page_url  = 1 === $page_number ? get_pagenum_link( 1 ) : str_replace( '%#%', (string) $page_number, $pagination_base );
		$tag       = $is_active ? 'div' : 'a';
		$attrs     = $is_active ? '' : ' href="' . esc_url( $page_url ) . '"';
		?>
		<<?php echo $tag; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> class="framer-1f3rioz<?php echo $is_active ? ' active' : ''; ?>" data-framer-name="Logo"<?php echo $attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<div class="framer-1i6j189 ls-blog-s22" data-framer-name="Cược ngay" data-framer-component-type="RichTextContainer">
				<p dir="auto" class="framer-text ls-blog-s40"><?php echo esc_html( (string) $page_number ); ?></p>
			</div>
		</<?php echo $tag; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php endforeach; ?>

	<?php if ( $current < $total ) : ?>
		<a class="framer-1f3rioz" data-framer-name="Logo" href="<?php echo esc_url( get_pagenum_link( $current + 1 ) ); ?>" aria-label="<?php esc_attr_e( 'Trang sau', 'luongson' ); ?>">
			<div class="framer-1npjkgl">
				<div
					class="framer-i76why ls-blog-s41"
					data-framer-component-type="SVG"
					aria-hidden="true"
				></div>
			</div>
		</a>
	<?php endif; ?>
</nav>
