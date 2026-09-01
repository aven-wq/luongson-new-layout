<?php
/**
 * Banner header and catfish promo image settings.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Promo banner settings handler.
 */
class LuongSon_Promo_Settings {

	const PAGE_SLUG    = 'luongson-promo';
	const OPTION_KEY   = 'luongson_footer_promo_images';
	const SETTINGS_KEY = 'luongson_promo_settings';

	/**
	 * Whether the current request is the promo settings screen.
	 */
	public static function is_promo_admin_page() {
		return isset( $_GET['page'] ) && self::PAGE_SLUG === sanitize_key( wp_unslash( $_GET['page'] ) );
	}

	/**
	 * Register settings.
	 */
	public static function register() {
		register_setting(
			self::SETTINGS_KEY,
			self::OPTION_KEY,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize_promo_images' ),
				'default'           => array(),
			)
		);
	}

	/**
	 * Enqueue admin styles and media library on the promo settings page.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public static function enqueue_assets( $hook = '' ) {
		unset( $hook );

		if ( ! self::is_promo_admin_page() ) {
			return;
		}

		wp_enqueue_media();

		$css_path = get_stylesheet_directory() . '/admin/assets/css/footer-sponsors.css';

		wp_enqueue_style(
			'luongson-promo-admin',
			get_stylesheet_directory_uri() . '/admin/assets/css/footer-sponsors.css',
			array(),
			file_exists( $css_path ) ? (string) filemtime( $css_path ) : '1.0.0'
		);
	}

	/**
	 * Sanitize banner header and catfish image fields.
	 *
	 * @param mixed $input Raw POST data.
	 * @return array<string, array<string, int|string>>
	 */
	public static function sanitize_promo_images( $input ) {
		if ( ! is_array( $input ) ) {
			return array();
		}

		$clean = array();

		foreach ( luongson_get_promo_image_keys() as $key ) {
			if ( ! isset( $input[ $key ] ) || ! is_array( $input[ $key ] ) ) {
				continue;
			}

			$image_id = isset( $input[ $key ]['image_id'] ) ? absint( $input[ $key ]['image_id'] ) : 0;

			if ( ! $image_id || ! wp_attachment_is_image( $image_id ) ) {
				continue;
			}

			$clean[ $key ] = array(
				'image_id' => $image_id,
			);
		}

		return $clean;
	}

	/**
	 * Render the promo settings page.
	 */
	public static function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		add_action( 'admin_print_footer_scripts', array( __CLASS__, 'print_page_scripts' ) );
		?>
		<div class="wrap luongson-admin-page luongson-promo-settings">
			<h1><?php esc_html_e( 'Banner & Quảng cáo', 'luongson' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Upload ảnh từ Thư viện Media. Để trống sẽ không hiển thị trên website.', 'luongson' ); ?>
			</p>

			<form method="post" action="options.php">
				<?php settings_fields( self::SETTINGS_KEY ); ?>

				<div class="luongson-settings-stack">
					<section class="luongson-settings-block">
						<header class="luongson-settings-block__head">
							<h2><?php esc_html_e( 'Banner đầu trang', 'luongson' ); ?></h2>
							<p><?php esc_html_e( 'Ba ảnh quảng cáo hiển thị phía trên nội dung chính (ngay dưới header).', 'luongson' ); ?></p>
						</header>
						<div class="luongson-settings-block__body">
							<?php self::render_promo_image_fields( 'banner' ); ?>
						</div>
					</section>

					<section class="luongson-settings-block">
						<header class="luongson-settings-block__head">
							<h2><?php esc_html_e( 'Catfish (banner dưới cùng)', 'luongson' ); ?></h2>
							<p><?php esc_html_e( 'Hai ảnh quảng cáo cố định ở cuối trang, người dùng có thể đóng.', 'luongson' ); ?></p>
						</header>
						<div class="luongson-settings-block__body">
							<?php self::render_promo_image_fields( 'catfish' ); ?>
						</div>
					</section>
				</div>

				<?php submit_button( __( 'Lưu thay đổi', 'luongson' ) ); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Print page-specific scripts in the admin footer.
	 */
	public static function print_page_scripts() {
		if ( ! self::is_promo_admin_page() ) {
			return;
		}
		?>
		<script>
		(function ($) {
			'use strict';

			function setImageField($field, attachment) {
				var previewUrl = attachment.sizes && attachment.sizes.thumbnail
					? attachment.sizes.thumbnail.url
					: attachment.url;

				$field.find('.luongson-image-id').val(attachment.id);
				$field.find('.luongson-image-preview img').attr('src', previewUrl);
				$field.find('.luongson-image-preview').show();
				$field.find('.luongson-remove-image').show();
			}

			function clearImageField($field) {
				$field.find('.luongson-image-id').val('');
				$field.find('.luongson-image-preview img').attr('src', '');
				$field.find('.luongson-image-preview').hide();
				$field.find('.luongson-remove-image').hide();
			}

			function openMediaFrame($field, title) {
				var frame = wp.media({
					title: title || <?php echo wp_json_encode( __( 'Chọn ảnh', 'luongson' ) ); ?>,
					button: { text: <?php echo wp_json_encode( __( 'Chọn ảnh', 'luongson' ) ); ?> },
					multiple: false
				});

				frame.on('select', function () {
					var attachment = frame.state().get('selection').first().toJSON();
					setImageField($field, attachment);
				});

				frame.open();
			}

			$(function () {
				$(document).on('click', '.luongson-select-image', function (event) {
					event.preventDefault();
					var $field = $(this).closest('.luongson-promo-image-field');
					var title = $field.data('media-title') || undefined;
					openMediaFrame($field, title);
				});

				$(document).on('click', '.luongson-remove-image', function (event) {
					event.preventDefault();
					clearImageField($(this).closest('.luongson-promo-image-field'));
				});
			});
		})(jQuery);
		</script>
		<?php
	}

	/**
	 * Output banner or catfish image fields.
	 *
	 * @param string $group Field group: banner|catfish.
	 */
	private static function render_promo_image_fields( $group ) {
		$promo_images = luongson_get_saved_promo_images();
		$labels       = luongson_get_promo_image_labels();
		$keys         = 'banner' === $group
			? array( 'banner_left', 'banner_mid', 'banner_right' )
			: array( 'catfish_left', 'catfish_right' );
		?>
		<div class="luongson-promo-images">
			<?php foreach ( $keys as $key ) : ?>
				<?php
				self::render_promo_image_field(
					$key,
					$labels[ $key ],
					isset( $promo_images[ $key ] ) ? $promo_images[ $key ] : array()
				);
				?>
			<?php endforeach; ?>
		</div>
		<?php
	}

	/**
	 * Output a single promo image picker field.
	 *
	 * @param string               $key   Field key.
	 * @param string               $label Field label.
	 * @param array<string, mixed> $image Image data.
	 */
	private static function render_promo_image_field( $key, $label, $image ) {
		$image_id  = isset( $image['image_id'] ) ? absint( $image['image_id'] ) : 0;
		$image_url = $image_id ? (string) wp_get_attachment_image_url( $image_id, 'thumbnail' ) : '';
		$preview_style = $image_url ? '' : ' style="display:none;"';
		?>
		<div
			class="luongson-promo-image-field"
			data-media-title="<?php echo esc_attr( $label ); ?>"
		>
			<label><?php echo esc_html( $label ); ?></label>
			<div class="luongson-image-picker">
				<div class="luongson-image-preview"<?php echo $preview_style; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
					<img src="<?php echo esc_url( $image_url ); ?>" alt="" />
				</div>
				<div class="luongson-image-actions">
					<input
						type="hidden"
						name="<?php echo esc_attr( self::OPTION_KEY ); ?>[<?php echo esc_attr( $key ); ?>][image_id]"
						value="<?php echo esc_attr( (string) $image_id ); ?>"
						class="luongson-image-id"
					/>
					<button type="button" class="button button-secondary luongson-select-image">
						<?php esc_html_e( 'Chọn ảnh', 'luongson' ); ?>
					</button>
					<button
						type="button"
						class="button luongson-remove-image"
						<?php echo $image_id ? '' : ' style="display:none;"'; ?>
					>
						<?php esc_html_e( 'Gỡ ảnh', 'luongson' ); ?>
					</button>
				</div>
			</div>
		</div>
		<?php
	}
}

if ( is_admin() ) {
	add_action( 'admin_init', array( 'LuongSon_Promo_Settings', 'register' ) );
	add_action( 'admin_enqueue_scripts', array( 'LuongSon_Promo_Settings', 'enqueue_assets' ) );
}
