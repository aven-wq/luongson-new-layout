<?php
/**
 * Breadcrumb markup (Framer tin.html design).
 *
 * @package LuongSon
 *
 * @var string                           $home_label Home link text.
 * @var string                           $home_url   Home link URL.
 * @var string                           $label      Current page label (legacy).
 * @var array<int, array<string, mixed>> $items      Ordered breadcrumb items.
 */

defined( 'ABSPATH' ) || exit;

$args       = isset( $args ) && is_array( $args ) ? $args : array();
$home_label = $args['home_label'] ?? __( 'Trang chủ', 'luongson' );
$home_url   = $args['home_url'] ?? home_url( '/' );
$label      = trim( (string) ( $args['label'] ?? '' ) );
$items      = isset( $args['items'] ) && is_array( $args['items'] ) ? $args['items'] : array();

if ( empty( $items ) && '' !== $label ) {
	$items = array(
		array(
			'label' => $home_label,
			'url'   => $home_url,
			'type'  => 'home',
		),
		array(
			'label'   => $label,
			'current' => true,
		),
	);
}

if ( empty( $items ) ) {
	return;
}
?>
<div class="framer-1hhnbaz">
	<nav aria-label="<?php esc_attr_e( 'Breadcrumb', 'luongson' ); ?>" class="framer-18m6mx2" data-framer-name="Breadcrumb">
		<?php foreach ( $items as $index => $item ) : ?>
			<?php
			$item_label = trim( (string) ( $item['label'] ?? '' ) );

			if ( '' === $item_label ) {
				continue;
			}

			$is_home    = ! empty( $item['type'] ) && 'home' === $item['type'];
			$is_current = ! empty( $item['current'] );
			$item_url   = isset( $item['url'] ) ? (string) $item['url'] : '';
			?>

			<?php if ( $index > 0 ) : ?>
				<div class="framer-1lqjkfu ls-blog-s98" data-framer-component-type="RichTextContainer">
					<p dir="auto" class="framer-text ls-blog-s102">&gt;</p>
				</div>
			<?php endif; ?>

			<?php if ( $is_home ) : ?>
				<a class="framer-jokgij framer-2zqk9m luongson-breadcrumb-home" href="<?php echo esc_url( $item_url ?: $home_url ); ?>">
					<svg class="framer-Z8SHu framer-1qzokvb" role="presentation" viewBox="0 0 24 24" aria-hidden="true" style="color: #262626;">
						<path
							d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linejoin="round"
						/>
					</svg>
					<div class="framer-wudaff ls-blog-s98" data-framer-name="<?php echo esc_attr( $item_label ); ?>" data-framer-component-type="RichTextContainer">
						<p dir="auto" class="framer-text ls-blog-s101"><?php echo esc_html( $item_label ); ?></p>
					</div>
				</a>
			<?php elseif ( $is_current ) : ?>
				<div class="framer-1jezyeg ls-blog-s98 luongson-breadcrumb-current" data-framer-name="<?php echo esc_attr( $item_label ); ?>" data-framer-component-type="RichTextContainer">
					<p dir="auto" class="framer-text ls-blog-s103"><?php echo esc_html( $item_label ); ?></p>
				</div>
			<?php elseif ( '' !== $item_url ) : ?>
				<a class="framer-jokgij framer-2zqk9m luongson-breadcrumb-link" href="<?php echo esc_url( $item_url ); ?>">
					<div class="framer-1jezyeg ls-blog-s98" data-framer-name="<?php echo esc_attr( $item_label ); ?>" data-framer-component-type="RichTextContainer">
						<p dir="auto" class="framer-text ls-blog-s101"><?php echo esc_html( $item_label ); ?></p>
					</div>
				</a>
			<?php else : ?>
				<div class="framer-1jezyeg ls-blog-s98" data-framer-name="<?php echo esc_attr( $item_label ); ?>" data-framer-component-type="RichTextContainer">
					<p dir="auto" class="framer-text ls-blog-s101"><?php echo esc_html( $item_label ); ?></p>
				</div>
			<?php endif; ?>
		<?php endforeach; ?>
	</nav>
</div>
