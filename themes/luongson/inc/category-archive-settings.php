<?php
/**
 * Category archive display options (e.g. small thumbnail layout).
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

const LUONGSON_CATEGORY_SMALL_THUMB_META = 'luongson_small_thumb';

/**
 * Register custom image size for small archive thumbnails.
 */
function luongson_register_archive_image_sizes() {
	add_image_size( 'luongson-small-thumb', 436, 160, true );
}
add_action( 'after_setup_theme', 'luongson_register_archive_image_sizes' );

/**
 * Whether the current news archive view uses small thumbnails.
 */
function luongson_news_archive_has_small_thumb() {
	if ( ! is_category() ) {
		return false;
	}

	$term = get_queried_object();
	if ( ! ( $term instanceof WP_Term ) ) {
		return false;
	}

	return (bool) get_term_meta( $term->term_id, LUONGSON_CATEGORY_SMALL_THUMB_META, true );
}

/**
 * Render small-thumb checkbox on "Add category" screen.
 */
function luongson_category_add_small_thumb_field() {
	?>
	<div class="form-field term-small-thumb-wrap">
		<label for="luongson-small-thumb">
			<input type="checkbox" name="luongson_small_thumb" id="luongson-small-thumb" value="1" />
			<?php esc_html_e( 'Small thumb', 'luongson' ); ?>
		</label>
		<p class="description">
			<?php esc_html_e( 'Hiển thị ảnh thumbnail nhỏ (436×160px) trên trang danh mục. Mặc định (434x247px)', 'luongson' ); ?>
		</p>
	</div>
	<?php
}
add_action( 'category_add_form_fields', 'luongson_category_add_small_thumb_field' );

/**
 * Render small-thumb checkbox on "Edit category" screen.
 *
 * @param WP_Term $term Current category term.
 */
function luongson_category_edit_small_thumb_field( $term ) {
	$enabled = (bool) get_term_meta( $term->term_id, LUONGSON_CATEGORY_SMALL_THUMB_META, true );
	?>
	<tr class="form-field term-small-thumb-wrap">
		<th scope="row"><?php esc_html_e( 'Small thumb', 'luongson' ); ?></th>
		<td>
			<label for="luongson-small-thumb">
				<input type="checkbox" name="luongson_small_thumb" id="luongson-small-thumb" value="1" <?php checked( $enabled ); ?> />
				<?php esc_html_e( 'Bật thumbnail nhỏ', 'luongson' ); ?>
			</label>
			<p class="description">
				<?php esc_html_e( 'Hiển thị ảnh thumbnail nhỏ (436×160px) trên trang danh mục. Mặc định (434x247px)', 'luongson' ); ?>
			</p>
		</td>
	</tr>
	<?php
}
add_action( 'category_edit_form_fields', 'luongson_category_edit_small_thumb_field' );

/**
 * Save small-thumb option for a category.
 *
 * @param int $term_id Category term ID.
 */
function luongson_save_category_small_thumb_meta( $term_id ) {
	if ( ! current_user_can( 'manage_categories' ) ) {
		return;
	}

	if ( ! empty( $_POST['luongson_small_thumb'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		update_term_meta( $term_id, LUONGSON_CATEGORY_SMALL_THUMB_META, '1' );
	} else {
		delete_term_meta( $term_id, LUONGSON_CATEGORY_SMALL_THUMB_META );
	}
}
add_action( 'created_category', 'luongson_save_category_small_thumb_meta' );
add_action( 'edited_category', 'luongson_save_category_small_thumb_meta' );
