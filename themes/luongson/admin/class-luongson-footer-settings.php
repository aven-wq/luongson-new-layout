<?php
/**
 * Footer settings: sponsor ticker images and links.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Footer sponsor settings handler.
 */
class LuongSon_Footer_Settings {

	const OPTION_KEY         = 'luongson_footer_sponsors';
	const CONTENT_OPTION_KEY = 'luongson_footer_content';

	/**
	 * Whether the current request is the Footer settings screen.
	 */
	public static function is_footer_admin_page() {
		return isset( $_GET['page'] ) && 'luongson-footer' === sanitize_key( wp_unslash( $_GET['page'] ) );
	}

	/**
	 * Register settings.
	 */
	public static function register() {
		register_setting(
			'luongson_footer_settings',
			self::OPTION_KEY,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize_sponsors' ),
				'default'           => array(),
			)
		);

		register_setting(
			'luongson_footer_settings',
			self::CONTENT_OPTION_KEY,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize_content' ),
				'default'           => array(),
			)
		);
	}

	/**
	 * Enqueue admin styles and media library on the Footer settings page.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public static function enqueue_assets( $hook = '' ) {
		unset( $hook );

		if ( ! self::is_footer_admin_page() ) {
			return;
		}

		wp_enqueue_media();
		wp_enqueue_editor();

		$css_path = get_stylesheet_directory() . '/admin/assets/css/footer-sponsors.css';

		wp_enqueue_style(
			'luongson-footer-admin',
			get_stylesheet_directory_uri() . '/admin/assets/css/footer-sponsors.css',
			array(),
			file_exists( $css_path ) ? (string) filemtime( $css_path ) : '1.0.0'
		);
	}

	/**
	 * Sanitize sponsor items from the settings form.
	 *
	 * @param mixed $input Raw POST data.
	 * @return array<int, array<string, int|string>>
	 */
	public static function sanitize_sponsors( $input ) {
		if ( ! is_array( $input ) ) {
			return array();
		}

		$clean = array();

		foreach ( $input as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}

			$image_id  = isset( $item['image_id'] ) ? absint( $item['image_id'] ) : 0;
			$image_url = isset( $item['image_url'] ) ? esc_url_raw( $item['image_url'] ) : '';
			$link      = isset( $item['link'] ) ? sanitize_text_field( $item['link'] ) : '';
			$alt       = isset( $item['alt'] ) ? sanitize_text_field( $item['alt'] ) : '';

			if ( $image_id ) {
				$attachment_url = wp_get_attachment_image_url( $image_id, 'full' );
				if ( $attachment_url ) {
					$image_url = $attachment_url;
				}
			}

			if ( ! $image_id && '' === $image_url ) {
				continue;
			}

			$clean[] = array(
				'image_id'  => $image_id,
				'image_url' => $image_url,
				'link'      => $link,
				'alt'       => $alt,
			);
		}

		return $clean;
	}

	/**
	 * Sanitize footer text content from the settings form.
	 *
	 * @param mixed $input Raw POST data.
	 * @return array<string, string>
	 */
	public static function sanitize_content( $input ) {
		if ( ! is_array( $input ) ) {
			return array();
		}

		return array(
			'intro_title'        => isset( $input['intro_title'] ) ? sanitize_text_field( $input['intro_title'] ) : '',
			'intro_description'  => isset( $input['intro_description'] ) ? wp_kses_post( $input['intro_description'] ) : '',
			'contact_content'    => isset( $input['contact_content'] ) ? wp_kses_post( $input['contact_content'] ) : '',
			'disclaimer_content' => isset( $input['disclaimer_content'] ) ? wp_kses_post( $input['disclaimer_content'] ) : '',
		);
	}

	/**
	 * Render the Footer settings page.
	 */
	public static function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		add_action( 'admin_print_footer_scripts', array( __CLASS__, 'print_page_scripts' ) );

		$sponsors = luongson_get_footer_sponsors();
		?>
		<div class="wrap luongson-admin-page luongson-footer-settings">
			<h1><?php esc_html_e( 'Footer', 'luongson' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Quản lý nội dung hiển thị ở chân trang website.', 'luongson' ); ?>
			</p>

			<form method="post" action="options.php">
				<?php settings_fields( 'luongson_footer_settings' ); ?>

				<div class="luongson-settings-stack">
					<section class="luongson-settings-block">
						<header class="luongson-settings-block__head">
							<h2><?php esc_html_e( 'Nội dung Footer', 'luongson' ); ?></h2>
							<p><?php esc_html_e( 'Tiêu đề, mô tả, địa chỉ và miễn trừ trách nhiệm.', 'luongson' ); ?></p>
						</header>
						<div class="luongson-settings-block__body">
							<?php self::render_content_fields(); ?>
						</div>
					</section>

					<section class="luongson-settings-block">
						<header class="luongson-settings-block__head">
							<h2><?php esc_html_e( 'Đối tác & Nhà tài trợ', 'luongson' ); ?></h2>
							<p><?php esc_html_e( 'Logo và liên kết hiển thị trong ticker nhà tài trợ ở footer.', 'luongson' ); ?></p>
							<?php self::render_shortcode_copy( 'luongson_sponsor_ticker' ); ?>
						</header>

						<div class="luongson-settings-block__body">
							<div id="luongson-sponsor-items" class="luongson-sponsor-items">
								<?php
								if ( ! empty( $sponsors ) ) {
									foreach ( $sponsors as $index => $sponsor ) {
										self::render_sponsor_row( $index, $sponsor );
									}
								}
								?>
							</div>

							<div id="luongson-sponsor-empty" class="luongson-sponsor-empty"<?php echo ! empty( $sponsors ) ? ' style="display:none;"' : ''; ?>>
								<strong><?php esc_html_e( 'Chưa có nhà tài trợ nào', 'luongson' ); ?></strong>
								<span><?php esc_html_e( 'Nhấn nút bên dưới để thêm logo đầu tiên.', 'luongson' ); ?></span>
							</div>

							<div class="luongson-sponsor-toolbar">
								<p class="description"><?php esc_html_e( 'Thứ tự hiển thị theo danh sách từ trên xuống dưới.', 'luongson' ); ?></p>
								<button type="button" class="button button-primary" id="luongson-add-sponsor">
									<?php esc_html_e( '+ Thêm nhà tài trợ', 'luongson' ); ?>
								</button>
							</div>
						</div>
					</section>
				</div>

				<?php submit_button( __( 'Lưu thay đổi', 'luongson' ) ); ?>
			</form>

			<div id="luongson-sponsor-row-template" hidden>
				<?php self::render_sponsor_row( '__INDEX__', array() ); ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Print page-specific scripts in the admin footer.
	 */
	public static function print_page_scripts() {
		if ( ! self::is_footer_admin_page() ) {
			return;
		}
		?>
		<script>
		(function ($) {
			'use strict';

			function getNextIndex() {
				var max = -1;

				$('#luongson-sponsor-items .luongson-sponsor-row').each(function () {
					var index = parseInt($(this).attr('data-index'), 10);
					if (!isNaN(index) && index > max) {
						max = index;
					}
				});

				return max + 1;
			}

			function toggleEmptyState() {
				var hasRows = $('#luongson-sponsor-items .luongson-sponsor-row').length > 0;
				$('#luongson-sponsor-empty').toggle(!hasRows);
			}

			function renumberRows() {
				$('#luongson-sponsor-items .luongson-sponsor-row').each(function (rowIndex) {
					$(this).find('.luongson-sponsor-number').text(rowIndex + 1);
				});
				toggleEmptyState();
			}

			function addRow() {
				var template = $('#luongson-sponsor-row-template').html();
				if (!template) {
					return;
				}

				var index = getNextIndex();
				var html = template.replace(/__INDEX__/g, String(index));
				var $row = $(html.trim());

				$('#luongson-sponsor-items').append($row);
				renumberRows();

				if ($row.offset()) {
					$('html, body').animate({ scrollTop: $row.offset().top - 120 }, 200);
				}
			}

			function setImageField($field, attachment) {
				var previewUrl = attachment.sizes && attachment.sizes.thumbnail
					? attachment.sizes.thumbnail.url
					: attachment.url;

				$field.find('.luongson-image-id').val(attachment.id);
				$field.find('.luongson-image-url').val(attachment.url);
				$field.find('.luongson-image-preview img').attr('src', previewUrl);
				$field.find('.luongson-image-preview').show();
				$field.find('.luongson-remove-image').show();
			}

			function clearImageField($field) {
				$field.find('.luongson-image-id').val('');
				$field.find('.luongson-image-url').val('');
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
				toggleEmptyState();

				$('#luongson-add-sponsor').on('click', function (event) {
					event.preventDefault();
					addRow();
				});

				$(document).on('click', '.luongson-remove-sponsor', function (event) {
					event.preventDefault();
					$(this).closest('.luongson-sponsor-row').remove();
					renumberRows();
				});

				$(document).on('click', '.luongson-select-image', function (event) {
					event.preventDefault();
					openMediaFrame($(this).closest('.luongson-sponsor-row'));
				});

				$(document).on('click', '.luongson-remove-image', function (event) {
					event.preventDefault();
					clearImageField($(this).closest('.luongson-sponsor-row'));
				});

				$(document).on('click', '.luongson-copy-shortcode', function (event) {
					event.preventDefault();

					var $wrap = $(this).closest('.luongson-shortcode-copy');
					var $input = $wrap.find('.luongson-shortcode-input');
					var $button = $(this);
					var text = $input.val();

					function markCopied() {
						var original = $button.data('label') || $button.text();
						$button.data('label', original);
						$button.text(<?php echo wp_json_encode( __( 'Đã sao chép!', 'luongson' ) ); ?>);
						window.setTimeout(function () {
							$button.text($button.data('label'));
						}, 1600);
					}

					if (navigator.clipboard && navigator.clipboard.writeText) {
						navigator.clipboard.writeText(text).then(markCopied);
						return;
					}

					$input.trigger('focus').trigger('select');
					document.execCommand('copy');
					markCopied();
				});
			});
		})(jQuery);
		</script>
		<?php
	}

	/**
	 * Output footer text content fields.
	 */
	private static function render_content_fields() {
		$content = luongson_get_footer_content();
		?>
		<div class="luongson-footer-content-fields">
			<div class="luongson-footer-content-field">
				<label for="luongson-footer-intro-title"><?php esc_html_e( 'Tiêu đề giới thiệu', 'luongson' ); ?></label>
				<input
					type="text"
					id="luongson-footer-intro-title"
					name="<?php echo esc_attr( self::CONTENT_OPTION_KEY ); ?>[intro_title]"
					value="<?php echo esc_attr( $content['intro_title'] ); ?>"
					class="large-text"
				/>
			</div>

			<div class="luongson-footer-content-field">
				<label for="luongson-footer-intro-description"><?php esc_html_e( 'Mô tả giới thiệu', 'luongson' ); ?></label>
				<?php
				wp_editor(
					$content['intro_description'],
					'luongson_footer_intro_description',
					array(
						'textarea_name' => self::CONTENT_OPTION_KEY . '[intro_description]',
						'textarea_rows' => 5,
						'media_buttons' => false,
						'teeny'         => true,
						'quicktags'     => true,
					)
				);
				?>
			</div>

			<div class="luongson-footer-content-field">
				<label for="luongson-footer-contact-content"><?php esc_html_e( 'Địa chỉ liên hệ', 'luongson' ); ?></label>
				<p class="description"><?php esc_html_e( 'Có thể dùng nhiều đoạn văn (mỗi đoạn một dòng riêng).', 'luongson' ); ?></p>
				<?php
				wp_editor(
					$content['contact_content'],
					'luongson_footer_contact_content',
					array(
						'textarea_name' => self::CONTENT_OPTION_KEY . '[contact_content]',
						'textarea_rows' => 5,
						'media_buttons' => false,
						'teeny'         => true,
						'quicktags'     => true,
					)
				);
				?>
			</div>

			<div class="luongson-footer-content-field">
				<label for="luongson-footer-disclaimer-content"><?php esc_html_e( 'Miễn trừ trách nhiệm', 'luongson' ); ?></label>
				<?php
				wp_editor(
					$content['disclaimer_content'],
					'luongson_footer_disclaimer_content',
					array(
						'textarea_name' => self::CONTENT_OPTION_KEY . '[disclaimer_content]',
						'textarea_rows' => 5,
						'media_buttons' => false,
						'teeny'         => true,
						'quicktags'     => true,
					)
				);
				?>
			</div>
		</div>
		<?php
	}

	/**
	 * Output a copyable shortcode field.
	 *
	 * @param string $tag Shortcode tag without brackets.
	 */
	private static function render_shortcode_copy( $tag ) {
		$shortcode = '[' . $tag . ']';
		?>
		<div class="luongson-shortcode-copy">
			<label class="luongson-shortcode-copy__label"><?php esc_html_e( 'Shortcode', 'luongson' ); ?></label>
			<div class="luongson-shortcode-copy__field">
				<input
					type="text"
					class="luongson-shortcode-input"
					readonly
					value="<?php echo esc_attr( $shortcode ); ?>"
					aria-label="<?php esc_attr_e( 'Shortcode', 'luongson' ); ?>"
				/>
				<button type="button" class="button button-secondary luongson-copy-shortcode">
					<?php esc_html_e( 'Sao chép', 'luongson' ); ?>
				</button>
			</div>
			<p class="luongson-shortcode-copy__hint description">
				<?php
				printf(
					/* translators: %s: shortcode example with attributes */
					esc_html__( 'Dán vào trang/bài viết. Tùy chọn: %s', 'luongson' ),
					'<code>[' . esc_html( $tag ) . ' title="no" wrapper="no"]</code>'
				);
				?>
			</p>
		</div>
		<?php
	}

	/**
	 * Output a single sponsor repeater row.
	 *
	 * @param int|string           $index   Row index.
	 * @param array<string, mixed> $sponsor Sponsor data.
	 */
	private static function render_sponsor_row( $index, $sponsor ) {
		$image_id  = isset( $sponsor['image_id'] ) ? absint( $sponsor['image_id'] ) : 0;
		$image_url = isset( $sponsor['image_url'] ) ? esc_url( $sponsor['image_url'] ) : '';
		$link      = isset( $sponsor['link'] ) ? sanitize_text_field( $sponsor['link'] ) : '';
		$alt       = isset( $sponsor['alt'] ) ? esc_attr( $sponsor['alt'] ) : '';
		$is_tpl    = '__INDEX__' === (string) $index;

		if ( $image_id && ! $image_url ) {
			$image_url = (string) wp_get_attachment_image_url( $image_id, 'thumbnail' );
		}

		$display_number = $is_tpl ? 1 : ( (int) $index + 1 );
		$preview_style  = $image_url ? '' : ' style="display:none;"';
		?>
		<div class="luongson-sponsor-row" data-index="<?php echo esc_attr( (string) $index ); ?>">
			<div class="luongson-sponsor-row__header">
				<div class="luongson-sponsor-row__title">
					<span class="luongson-sponsor-row__badge" aria-hidden="true"></span>
					<strong>
						<?php esc_html_e( 'Nhà tài trợ', 'luongson' ); ?>
						#<span class="luongson-sponsor-number"><?php echo esc_html( (string) $display_number ); ?></span>
					</strong>
				</div>
				<button type="button" class="button-link-delete luongson-remove-sponsor" aria-label="<?php esc_attr_e( 'Xóa', 'luongson' ); ?>">
					<?php esc_html_e( 'Xóa', 'luongson' ); ?>
				</button>
			</div>

			<div class="luongson-sponsor-row__fields">
				<div class="luongson-sponsor-field luongson-sponsor-field--image">
					<label><?php esc_html_e( 'Ảnh logo', 'luongson' ); ?></label>
					<div class="luongson-image-picker">
						<div class="luongson-image-preview"<?php echo $preview_style; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
							<img src="<?php echo esc_url( $image_url ); ?>" alt="" />
						</div>
						<div class="luongson-image-actions">
							<input type="hidden" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[<?php echo esc_attr( (string) $index ); ?>][image_id]" value="<?php echo esc_attr( (string) $image_id ); ?>" class="luongson-image-id" />
							<input type="hidden" name="<?php echo esc_attr( self::OPTION_KEY ); ?>[<?php echo esc_attr( (string) $index ); ?>][image_url]" value="<?php echo esc_url( $image_url ); ?>" class="luongson-image-url" />
							<button type="button" class="button button-secondary luongson-select-image"><?php esc_html_e( 'Chọn ảnh', 'luongson' ); ?></button>
							<button type="button" class="button luongson-remove-image"<?php echo $image_url ? '' : ' style="display:none;"'; ?>><?php esc_html_e( 'Gỡ ảnh', 'luongson' ); ?></button>
						</div>
					</div>
				</div>

				<div class="luongson-sponsor-field">
					<label for="luongson-sponsor-link-<?php echo esc_attr( (string) $index ); ?>"><?php esc_html_e( 'Liên kết', 'luongson' ); ?></label>
					<input
						type="text"
						id="luongson-sponsor-link-<?php echo esc_attr( (string) $index ); ?>"
						name="<?php echo esc_attr( self::OPTION_KEY ); ?>[<?php echo esc_attr( (string) $index ); ?>][link]"
						value="<?php echo esc_attr( $link ); ?>"
						class="regular-text"
						placeholder="<?php esc_attr_e( 'https:// hoặc javascript:...', 'luongson' ); ?>"
					/>
				</div>

				<div class="luongson-sponsor-field">
					<label for="luongson-sponsor-alt-<?php echo esc_attr( (string) $index ); ?>"><?php esc_html_e( 'Mô tả ảnh (alt)', 'luongson' ); ?></label>
					<input
						type="text"
						id="luongson-sponsor-alt-<?php echo esc_attr( (string) $index ); ?>"
						name="<?php echo esc_attr( self::OPTION_KEY ); ?>[<?php echo esc_attr( (string) $index ); ?>][alt]"
						value="<?php echo esc_attr( $alt ); ?>"
						class="regular-text"
						placeholder="<?php esc_attr_e( 'Tên nhà tài trợ', 'luongson' ); ?>"
					/>
				</div>
			</div>
		</div>
		<?php
	}
}

/**
 * Promo image field keys.
 *
 * @return array<int, string>
 */
function luongson_get_promo_image_keys() {
	return array(
		'banner_left',
		'banner_mid',
		'banner_right',
		'catfish_left',
		'catfish_right',
	);
}

/**
 * Admin labels for promo image fields.
 *
 * @return array<string, string>
 */
function luongson_get_promo_image_labels() {
	return array(
		'banner_left'  => __( 'Banner trái', 'luongson' ),
		'banner_mid'   => __( 'Banner giữa', 'luongson' ),
		'banner_right' => __( 'Banner phải', 'luongson' ),
		'catfish_left' => __( 'Catfish trái', 'luongson' ),
		'catfish_right' => __( 'Catfish phải', 'luongson' ),
	);
}

/**
 * Get saved promo image settings from the database.
 *
 * @return array<string, array<string, int>>
 */
function luongson_get_saved_promo_images() {
	$saved = get_option( LuongSon_Promo_Settings::OPTION_KEY, array() );

	return is_array( $saved ) ? $saved : array();
}

/**
 * Get a promo image attachment ID.
 *
 * @param string $key Promo image key.
 * @return int
 */
function luongson_get_promo_image_id( $key ) {
	static $image_ids = null;

	if ( null === $image_ids ) {
		$saved    = luongson_get_saved_promo_images();
		$image_ids = array();

		foreach ( luongson_get_promo_image_keys() as $image_key ) {
			$image_id = isset( $saved[ $image_key ]['image_id'] ) ? absint( $saved[ $image_key ]['image_id'] ) : 0;

			if ( $image_id && wp_attachment_is_image( $image_id ) ) {
				$image_ids[ $image_key ] = $image_id;
			}
		}
	}

	return isset( $image_ids[ $key ] ) ? (int) $image_ids[ $key ] : 0;
}

/**
 * Get a promo image URL from the media library.
 *
 * @param string $key  Promo image key.
 * @param string $size Image size.
 * @return string
 */
function luongson_get_promo_image_url( $key, $size = 'full' ) {
	$image_id = luongson_get_promo_image_id( $key );

	if ( ! $image_id ) {
		return '';
	}

	$url = wp_get_attachment_image_url( $image_id, $size );

	return $url ? $url : '';
}

/**
 * Whether any banner header images are configured.
 *
 * @return bool
 */
function luongson_has_promo_banner() {
	foreach ( array( 'banner_left', 'banner_mid', 'banner_right' ) as $key ) {
		if ( luongson_get_promo_image_id( $key ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Whether any catfish images are configured.
 *
 * @return bool
 */
function luongson_has_promo_catfish() {
	foreach ( array( 'catfish_left', 'catfish_right' ) as $key ) {
		if ( luongson_get_promo_image_id( $key ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Default footer copy from the Framer design.
 *
 * @return array<string, string>
 */
function luongson_get_default_footer_content() {
	return array(
		'intro_title'        => 'LƯƠNG SƠN TV — XEM BÓNG ĐÁ TRỰC TIẾP MIỄN PHÍ',
		'intro_description'    => '<p>Lương Sơn TV mang đến trải nghiệm xem bóng đá trực tiếp miễn phí với lịch thi đấu, tỷ số và thông tin trận đấu được cập nhật liên tục. Chúng tôi ưu tiên tốc độ, sự thuận tiện và khả năng theo dõi các giải đấu nổi bật trên nhiều thiết bị.</p>',
		'contact_content'    => '<p>Lương Sơn TV — Trung tâm nội dung thể thao trực tuyến. Liên hệ hỗ trợ và hợp tác qua các kênh chính thức được công bố trên website.</p><p>Địa chỉ: Số 99 Nguyễn Chánh, Hà Nội</p>',
		'disclaimer_content' => '<p>Lương Sơn TV không sở hữu bản quyền các nội dung phát sóng từ bên thứ ba. Website chỉ tổng hợp và cung cấp thông tin tham khảo; người dùng tự chịu trách nhiệm khi truy cập các liên kết bên ngoài và cần tuân thủ quy định pháp luật tại nơi cư trú.</p>',
	);
}

/**
 * Get footer intro, contact, and disclaimer content.
 *
 * @return array<string, string>
 */
function luongson_get_footer_content() {
	static $content = null;

	if ( null !== $content ) {
		return $content;
	}

	$defaults = luongson_get_default_footer_content();
	$saved    = get_option( LuongSon_Footer_Settings::CONTENT_OPTION_KEY, array() );

	if ( ! is_array( $saved ) ) {
		$saved = array();
	}

	$content = array(
		'intro_title'        => ! empty( $saved['intro_title'] ) ? sanitize_text_field( $saved['intro_title'] ) : $defaults['intro_title'],
		'intro_description'  => ! empty( $saved['intro_description'] ) ? wp_kses_post( $saved['intro_description'] ) : $defaults['intro_description'],
		'contact_content'    => ! empty( $saved['contact_content'] ) ? wp_kses_post( $saved['contact_content'] ) : $defaults['contact_content'],
		'disclaimer_content' => ! empty( $saved['disclaimer_content'] ) ? wp_kses_post( $saved['disclaimer_content'] ) : $defaults['disclaimer_content'],
	);

	/**
	 * Filter footer text content shown in the site footer.
	 *
	 * @param array<string, string> $content Footer content fields.
	 */
	return apply_filters( 'luongson_footer_content', $content );
}

/**
 * Get saved footer sponsor items.
 *
 * @return array<int, array<string, int|string>>
 */
function luongson_get_footer_sponsors() {
	$sponsors = get_option( LuongSon_Footer_Settings::OPTION_KEY, array() );

	if ( ! is_array( $sponsors ) ) {
		return array();
	}

	$normalized = array();

	foreach ( $sponsors as $sponsor ) {
		if ( ! is_array( $sponsor ) ) {
			continue;
		}

		$image_id  = isset( $sponsor['image_id'] ) ? absint( $sponsor['image_id'] ) : 0;
		$image_url = isset( $sponsor['image_url'] ) ? esc_url_raw( $sponsor['image_url'] ) : '';
		$link      = isset( $sponsor['link'] ) ? sanitize_text_field( $sponsor['link'] ) : '';
		$alt       = isset( $sponsor['alt'] ) ? sanitize_text_field( $sponsor['alt'] ) : '';

		if ( $image_id ) {
			$attachment_url = wp_get_attachment_image_url( $image_id, 'full' );
			if ( $attachment_url ) {
				$image_url = $attachment_url;
			}
		}

		if ( '' === $image_url ) {
			continue;
		}

		$normalized[] = array(
			'image_id'  => $image_id,
			'image_url' => $image_url,
			'link'      => $link,
			'alt'       => $alt,
		);
	}

	return $normalized;
}

if ( is_admin() ) {
	add_action( 'admin_init', array( 'LuongSon_Footer_Settings', 'register' ) );
	add_action( 'admin_enqueue_scripts', array( 'LuongSon_Footer_Settings', 'enqueue_assets' ) );
}
