<?php
/**
 * Category archive display options (e.g. small thumbnail layout).
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

const LUONGSON_CATEGORY_SMALL_THUMB_META       = 'luongson_small_thumb';
const LUONGSON_CATEGORY_POSTS_PER_PAGE_META    = 'luongson_posts_per_page';
const LUONGSON_CATEGORY_SUB_TITLE_META         = 'sub_title';
const LUONGSON_CATEGORY_POSTS_PER_PAGE_DEFAULT = 15;

/**
 * Category archive heading: sub_title when set, otherwise term name.
 *
 * @param int|WP_Term $term Category term ID or object.
 * @return string
 */
function luongson_get_category_sub_title( $term ) {
	if ( $term instanceof WP_Term ) {
		$term_id   = (int) $term->term_id;
		$term_name = (string) $term->name;
	} else {
		$term_id = absint( $term );
		$term    = $term_id ? get_term( $term_id, 'category' ) : null;
		$term_name = ( $term instanceof WP_Term ) ? (string) $term->name : '';
	}

	if ( ! $term_id ) {
		return '';
	}

	$sub_title = trim( (string) get_term_meta( $term_id, LUONGSON_CATEGORY_SUB_TITLE_META, true ) );

	if ( '' !== $sub_title ) {
		return $sub_title;
	}

	return trim( $term_name );
}

/**
 * Register custom image size for small archive thumbnails.
 */
function luongson_register_archive_image_sizes() {
	add_image_size( 'luongson-small-thumb', 436, 160, true );
}
add_action( 'after_setup_theme', 'luongson_register_archive_image_sizes' );

/**
 * Whether a category uses small thumbnails on archive/related cards.
 *
 * @param int $term_id Category term ID.
 * @return bool
 */
function luongson_category_has_small_thumb( $term_id ) {
	$term_id = absint( $term_id );

	if ( ! $term_id ) {
		return false;
	}

	return (bool) get_term_meta( $term_id, LUONGSON_CATEGORY_SMALL_THUMB_META, true );
}

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

	return luongson_category_has_small_thumb( (int) $term->term_id );
}

/**
 * Posts per page for a category archive.
 *
 * @param int $term_id Category term ID. Uses current category when omitted.
 * @return int
 */
function luongson_get_category_posts_per_page( $term_id = 0 ) {
	if ( ! $term_id && is_category() ) {
		$term = get_queried_object();
		if ( $term instanceof WP_Term ) {
			$term_id = (int) $term->term_id;
		}
	}

	if ( ! $term_id ) {
		return LUONGSON_CATEGORY_POSTS_PER_PAGE_DEFAULT;
	}

	$value = get_term_meta( $term_id, LUONGSON_CATEGORY_POSTS_PER_PAGE_META, true );

	if ( '' === $value || false === $value ) {
		return LUONGSON_CATEGORY_POSTS_PER_PAGE_DEFAULT;
	}

	return max( 1, min( 100, absint( $value ) ) );
}

/**
 * Render archive settings on "Add category" screen.
 */
function luongson_category_add_archive_fields() {
	?>
	<div class="form-field term-sub-title-wrap">
		<label for="luongson-sub-title"><?php esc_html_e( 'Sub title', 'luongson' ); ?></label>
		<input type="text" name="sub_title" id="luongson-sub-title" value="" />
		<p class="description">
			<?php esc_html_e( 'Tiêu đề hiển thị trên trang danh mục. Để trống sẽ dùng tên danh mục.', 'luongson' ); ?>
		</p>
	</div>
	<div class="form-field term-posts-per-page-wrap">
		<label for="luongson-posts-per-page"><?php esc_html_e( 'Số bài trên 1 trang', 'luongson' ); ?></label>
		<input
			type="number"
			name="luongson_posts_per_page"
			id="luongson-posts-per-page"
			value="<?php echo esc_attr( (string) LUONGSON_CATEGORY_POSTS_PER_PAGE_DEFAULT ); ?>"
			min="1"
			max="100"
			step="1"
			class="small-text"
		/>
		<p class="description">
			<?php
			printf(
				/* translators: %d: default posts per page */
				esc_html__( 'Số bài viết hiển thị trên mỗi trang danh mục. Mặc định: %d.', 'luongson' ),
				LUONGSON_CATEGORY_POSTS_PER_PAGE_DEFAULT
			);
			?>
		</p>
	</div>
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
add_action( 'category_add_form_fields', 'luongson_category_add_archive_fields' );

/**
 * Render archive settings on "Edit category" screen.
 *
 * @param WP_Term $term Current category term.
 */
function luongson_category_edit_archive_fields( $term ) {
	$enabled        = (bool) get_term_meta( $term->term_id, LUONGSON_CATEGORY_SMALL_THUMB_META, true );
	$posts_per_page = luongson_get_category_posts_per_page( (int) $term->term_id );
	$sub_title      = (string) get_term_meta( $term->term_id, LUONGSON_CATEGORY_SUB_TITLE_META, true );
	?>
	<tr class="form-field term-sub-title-wrap">
		<th scope="row">
			<label for="luongson-sub-title"><?php esc_html_e( 'Sub title', 'luongson' ); ?></label>
		</th>
		<td>
			<input
				type="text"
				name="sub_title"
				id="luongson-sub-title"
				value="<?php echo esc_attr( $sub_title ); ?>"
				class="regular-text"
			/>
			<p class="description">
				<?php esc_html_e( 'Tiêu đề hiển thị trên trang danh mục. Để trống sẽ dùng tên danh mục.', 'luongson' ); ?>
			</p>
		</td>
	</tr>
	<tr class="form-field term-posts-per-page-wrap">
		<th scope="row">
			<label for="luongson-posts-per-page"><?php esc_html_e( 'Số bài trên 1 trang', 'luongson' ); ?></label>
		</th>
		<td>
			<input
				type="number"
				name="luongson_posts_per_page"
				id="luongson-posts-per-page"
				value="<?php echo esc_attr( (string) $posts_per_page ); ?>"
				min="1"
				max="100"
				step="1"
				class="small-text"
			/>
			<p class="description">
				<?php
				printf(
					/* translators: %d: default posts per page */
					esc_html__( 'Số bài viết hiển thị trên mỗi trang danh mục. Mặc định: %d.', 'luongson' ),
					LUONGSON_CATEGORY_POSTS_PER_PAGE_DEFAULT
				);
				?>
			</p>
		</td>
	</tr>
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
add_action( 'category_edit_form_fields', 'luongson_category_edit_archive_fields' );

/**
 * Save archive display options for a category.
 *
 * @param int $term_id Category term ID.
 */
function luongson_save_category_archive_settings( $term_id ) {
	if ( ! current_user_can( 'manage_categories' ) ) {
		return;
	}

	if ( isset( $_POST['sub_title'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$sub_title = sanitize_text_field( wp_unslash( $_POST['sub_title'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		if ( '' === $sub_title ) {
			delete_term_meta( $term_id, LUONGSON_CATEGORY_SUB_TITLE_META );
		} else {
			update_term_meta( $term_id, LUONGSON_CATEGORY_SUB_TITLE_META, $sub_title );
		}
	}

	if ( isset( $_POST['luongson_posts_per_page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$posts_per_page = max( 1, min( 100, absint( wp_unslash( $_POST['luongson_posts_per_page'] ) ) ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		if ( LUONGSON_CATEGORY_POSTS_PER_PAGE_DEFAULT === $posts_per_page ) {
			delete_term_meta( $term_id, LUONGSON_CATEGORY_POSTS_PER_PAGE_META );
		} else {
			update_term_meta( $term_id, LUONGSON_CATEGORY_POSTS_PER_PAGE_META, (string) $posts_per_page );
		}
	}

	if ( ! empty( $_POST['luongson_small_thumb'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		update_term_meta( $term_id, LUONGSON_CATEGORY_SMALL_THUMB_META, '1' );
	} else {
		delete_term_meta( $term_id, LUONGSON_CATEGORY_SMALL_THUMB_META );
	}
}
add_action( 'created_category', 'luongson_save_category_archive_settings' );
add_action( 'edited_category', 'luongson_save_category_archive_settings' );
