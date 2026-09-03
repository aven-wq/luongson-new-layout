<?php
/**
 * Brand ambassador and SEO block settings.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Block Common settings handler.
 */
class LuongSon_Block_Common_Settings {

	const PAGE_SLUG    = 'luongson-block-common';
	const OPTION_KEY   = 'luongson_ambassador_seo_content';
	const SETTINGS_KEY = 'luongson_block_common_settings';

	/**
	 * Whether the current request is the Block Common settings screen.
	 */
	public static function is_block_common_admin_page() {
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
				'sanitize_callback' => array( __CLASS__, 'sanitize_ambassador_seo' ),
				'default'           => array(),
			)
		);
	}

	/**
	 * Enqueue admin styles and media library on the Block Common settings page.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public static function enqueue_assets( $hook = '' ) {
		unset( $hook );

		if ( ! self::is_block_common_admin_page() ) {
			return;
		}

		wp_enqueue_media();
		wp_enqueue_editor();

		$css_path = get_stylesheet_directory() . '/admin/assets/css/footer-sponsors.css';

		wp_enqueue_style(
			'luongson-block-common-admin',
			get_stylesheet_directory_uri() . '/admin/assets/css/footer-sponsors.css',
			array(),
			file_exists( $css_path ) ? (string) filemtime( $css_path ) : '1.0.0'
		);
	}

	/**
	 * Sanitize ambassador and SEO block fields.
	 *
	 * @param mixed $input Raw POST data.
	 * @return array<string, int|string>
	 */
	public static function sanitize_ambassador_seo( $input ) {
		if ( ! is_array( $input ) ) {
			return array();
		}

		$image_id = isset( $input['image_id'] ) ? absint( $input['image_id'] ) : 0;

		if ( $image_id && ! wp_attachment_is_image( $image_id ) ) {
			$image_id = 0;
		}

		return array(
			'title'       => isset( $input['title'] ) ? sanitize_text_field( $input['title'] ) : '',
			'description' => isset( $input['description'] ) ? wp_kses_post( $input['description'] ) : '',
			'image_id'    => $image_id,
			'image_alt'   => isset( $input['image_alt'] ) ? sanitize_text_field( $input['image_alt'] ) : '',
			'seo_content' => isset( $input['seo_content'] ) ? wp_kses_post( $input['seo_content'] ) : '',
		);
	}

	/**
	 * Render the Block Common settings page.
	 */
	public static function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		add_action( 'admin_print_footer_scripts', array( __CLASS__, 'print_page_scripts' ) );
		?>
		<div class="wrap luongson-admin-page luongson-block-common-settings">
			<h1><?php esc_html_e( 'Block Common', 'luongson' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Quản lý khối đại sứ thương hiệu và nội dung SEO hiển thị phía trên footer.', 'luongson' ); ?>
			</p>

			<form method="post" action="options.php">
				<?php settings_fields( self::SETTINGS_KEY ); ?>

				<div class="luongson-settings-stack">
					<section class="luongson-settings-block">
						<header class="luongson-settings-block__head">
							<h2><?php esc_html_e( 'Đại sứ thương hiệu', 'luongson' ); ?></h2>
							<p><?php esc_html_e( 'Tiêu đề, mô tả và ảnh hiển thị phía trên footer.', 'luongson' ); ?></p>
						</header>
						<div class="luongson-settings-block__body">
							<?php self::render_ambassador_fields(); ?>
						</div>
					</section>

					<section class="luongson-settings-block">
						<header class="luongson-settings-block__head">
							<h2><?php esc_html_e( 'Block SEO', 'luongson' ); ?></h2>
							<p><?php esc_html_e( 'Nội dung SEO cuộn hiển thị cạnh khối đại sứ thương hiệu.', 'luongson' ); ?></p>
						</header>
						<div class="luongson-settings-block__body">
							<?php self::render_seo_content_field(); ?>
						</div>
					</section>
				</div>

				<?php submit_button( __( 'Lưu thay đổi', 'luongson' ) ); ?>
			</form>

			<div class="luongson-settings-stack luongson-settings-stack--shortcodes">
				<section class="luongson-settings-block">
					<header class="luongson-settings-block__head">
						<h2><?php esc_html_e( 'Shortcode', 'luongson' ); ?></h2>
						<p><?php esc_html_e( 'Dán shortcode vào trang/bài viết (UX Builder, Classic Editor hoặc block Shortcode) để hiển thị các khối nội dung của theme.', 'luongson' ); ?></p>
					</header>
					<div class="luongson-settings-block__body">
						<?php self::render_shortcodes_section(); ?>
					</div>
				</section>
			</div>
		</div>
		<?php
	}

	/**
	 * Print page-specific scripts in the admin footer.
	 */
	public static function print_page_scripts() {
		if ( ! self::is_block_common_admin_page() ) {
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
	 * Theme shortcode definitions for the admin reference panel.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private static function get_shortcode_definitions() {
		return array(
			array(
				'tag'         => 'luongson_breadcrumb',
				'title'       => __( 'Breadcrumb', 'luongson' ),
				'description' => __( 'Hiển thị thanh điều hướng Trang chủ → trang hiện tại. Tự lấy tiêu đề bài viết/danh mục nếu không truyền label.', 'luongson' ),
				'example'     => '[luongson_breadcrumb]',
				'attributes'  => array(
					'label'      => __( 'Nhãn trang hiện tại (mặc định: tiêu đề bài/trang).', 'luongson' ),
					'home_label' => __( 'Nhãn liên kết trang chủ (mặc định: Trang chủ).', 'luongson' ),
					'home_url'   => __( 'URL trang chủ (mặc định: trang chủ site).', 'luongson' ),
				),
			),
			array(
				'tag'         => 'luongson_nha_cai_uy_tin',
				'title'       => __( 'Top nhà cái uy tín', 'luongson' ),
				'description' => __( 'Khối ticker logo nhà cái lấy dữ liệu từ plugin Brandview. Dùng trong trang tin tức hoặc bất kỳ trang nào cần hiển thị top nhà cái.', 'luongson' ),
				'example'     => '[luongson_nha_cai_uy_tin]',
				'attributes'  => array(
					'limit' => __( 'Số lượng tối đa (0 = tất cả).', 'luongson' ),
					'type'  => __( 'Lọc loại: G (Game) hoặc S (Sport).', 'luongson' ),
				),
			),
			array(
				'tag'         => 'luongson_blv_form_submit',
				'title'       => __( 'Form ứng tuyển BLV', 'luongson' ),
				'description' => __( 'Form đăng ký bình luận viên theo thiết kế trang Ứng tuyển BLV. Hồ sơ được lưu tại menu WP Admin → Ứng tuyển BLV.', 'luongson' ),
				'example'     => '[luongson_blv_form_submit]',
				'attributes'  => array(
					'title'        => __( 'Tiêu đề form.', 'luongson' ),
					'description'  => __( 'Mô tả phía dưới tiêu đề.', 'luongson' ),
					'submit_label' => __( 'Nhãn nút gửi.', 'luongson' ),
					'form_id'      => __( 'ID phần tử form (mặc định: luongson-blv-form).', 'luongson' ),
					'card_id'      => __( 'ID anchor cho liên kết #blv (mặc định: blv).', 'luongson' ),
				),
			),
			array(
				'tag'         => 'luongson_sponsor_ticker',
				'title'       => __( 'Ticker nhà tài trợ', 'luongson' ),
				'description' => __( 'Danh sách logo đối tác/nhà tài trợ cuộn ngang. Logo được quản lý tại LuongSon → Footer.', 'luongson' ),
				'example'     => '[luongson_sponsor_ticker]',
				'attributes'  => array(
					'title'   => __( 'Hiện tiêu đề khối: yes hoặc no (mặc định: yes).', 'luongson' ),
					'wrapper' => __( 'Bọc khối footer sponsors: yes hoặc no (mặc định: yes).', 'luongson' ),
					'label'   => __( 'Tiêu đề tùy chỉnh (mặc định: ĐỐI TÁC & NHÀ TÀI TRỢ).', 'luongson' ),
				),
			),
			array(
				'tag'         => 'banner_chao_tan_thu',
				'title'       => __( 'Banner chào tân thủ', 'luongson' ),
				'description' => __( 'Banner khuyến mãi chào tân thủ (Free Live Football Banner) từ thiết kế Framer trang chủ.', 'luongson' ),
				'example'     => '[banner_chao_tan_thu]',
				'attributes'  => array(
					'title'    => __( 'Tiêu đề chính (mặc định: chào tân thủ, cược thả ga).', 'luongson' ),
					'subtitle' => __( 'Dòng mô tả khuyến mãi.', 'luongson' ),
					'cta'      => __( 'Nhãn nút CTA (mặc định: Cược ngay).', 'luongson' ),
					'url'      => __( 'URL khi click banner (mở tab mới).', 'luongson' ),
					'image'    => __( 'URL ảnh nhân vật bên phải.', 'luongson' ),
					'mark'     => __( 'URL logo Premier League trên nút CTA.', 'luongson' ),
				),
			),
		);
	}

	/**
	 * Output the shortcode reference list.
	 */
	private static function render_shortcodes_section() {
		$shortcodes = self::get_shortcode_definitions();
		?>
		<div class="luongson-shortcodes-list">
			<?php foreach ( $shortcodes as $shortcode ) : ?>
				<?php self::render_shortcode_item( $shortcode ); ?>
			<?php endforeach; ?>
		</div>
		<?php
	}

	/**
	 * Output a single shortcode reference card.
	 *
	 * @param array<string, mixed> $shortcode Shortcode definition.
	 */
	private static function render_shortcode_item( $shortcode ) {
		$tag         = isset( $shortcode['tag'] ) ? (string) $shortcode['tag'] : '';
		$title       = isset( $shortcode['title'] ) ? (string) $shortcode['title'] : $tag;
		$description = isset( $shortcode['description'] ) ? (string) $shortcode['description'] : '';
		$example     = isset( $shortcode['example'] ) ? (string) $shortcode['example'] : '[' . $tag . ']';
		$attributes  = isset( $shortcode['attributes'] ) && is_array( $shortcode['attributes'] ) ? $shortcode['attributes'] : array();
		?>
		<article class="luongson-shortcode-item">
			<div class="luongson-shortcode-item__head">
				<h3 class="luongson-shortcode-item__title"><?php echo esc_html( $title ); ?></h3>
				<code class="luongson-shortcode-item__tag"><?php echo esc_html( $tag ); ?></code>
			</div>

			<?php if ( '' !== $description ) : ?>
				<p class="luongson-shortcode-item__description"><?php echo esc_html( $description ); ?></p>
			<?php endif; ?>

			<div class="luongson-shortcode-copy">
				<label class="luongson-shortcode-copy__label"><?php esc_html_e( 'Shortcode', 'luongson' ); ?></label>
				<div class="luongson-shortcode-copy__field">
					<input
						type="text"
						class="luongson-shortcode-input"
						readonly
						value="<?php echo esc_attr( $example ); ?>"
						aria-label="<?php echo esc_attr( $title ); ?>"
					/>
					<button type="button" class="button button-secondary luongson-copy-shortcode">
						<?php esc_html_e( 'Sao chép', 'luongson' ); ?>
					</button>
				</div>
			</div>

			<?php if ( ! empty( $attributes ) ) : ?>
				<div class="luongson-shortcode-item__attrs">
					<p class="luongson-shortcode-item__attrs-label"><?php esc_html_e( 'Thuộc tính tùy chọn', 'luongson' ); ?></p>
					<ul class="luongson-shortcode-item__attrs-list">
						<?php foreach ( $attributes as $name => $help ) : ?>
							<li>
								<code><?php echo esc_html( (string) $name ); ?></code>
								<span><?php echo esc_html( (string) $help ); ?></span>
							</li>
						<?php endforeach; ?>
					</ul>
				</div>
			<?php endif; ?>
		</article>
		<?php
	}

	/**
	 * Output ambassador title, description, and image fields.
	 */
	private static function render_ambassador_fields() {
		$content       = luongson_get_ambassador_seo_content();
		$image_id      = isset( $content['image_id'] ) ? absint( $content['image_id'] ) : 0;
		$image_url     = $image_id ? (string) wp_get_attachment_image_url( $image_id, 'thumbnail' ) : '';
		$preview_style = $image_url ? '' : ' style="display:none;"';
		?>
		<div class="luongson-footer-content-fields">
			<div class="luongson-footer-content-field">
				<label for="luongson-ambassador-title"><?php esc_html_e( 'Tiêu đề', 'luongson' ); ?></label>
				<input
					type="text"
					id="luongson-ambassador-title"
					name="<?php echo esc_attr( self::OPTION_KEY ); ?>[title]"
					value="<?php echo esc_attr( $content['title'] ); ?>"
					class="large-text"
				/>
			</div>

			<div class="luongson-footer-content-field">
				<label for="luongson-ambassador-description"><?php esc_html_e( 'Mô tả', 'luongson' ); ?></label>
				<?php
				wp_editor(
					$content['description'],
					'luongson_ambassador_description',
					array(
						'textarea_name' => self::OPTION_KEY . '[description]',
						'textarea_rows' => 5,
						'media_buttons' => false,
						'teeny'         => true,
						'quicktags'     => true,
					)
				);
				?>
			</div>

			<div
				class="luongson-promo-image-field"
				data-media-title="<?php echo esc_attr__( 'Ảnh đại sứ thương hiệu', 'luongson' ); ?>"
			>
				<label><?php esc_html_e( 'Ảnh đại sứ', 'luongson' ); ?></label>
				<p class="description"><?php esc_html_e( 'Để trống sẽ không hiển thị ảnh trên website.', 'luongson' ); ?></p>
				<div class="luongson-image-picker">
					<div class="luongson-image-preview"<?php echo $preview_style; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
						<img src="<?php echo esc_url( $image_url ); ?>" alt="" />
					</div>
					<div class="luongson-image-actions">
						<input
							type="hidden"
							name="<?php echo esc_attr( self::OPTION_KEY ); ?>[image_id]"
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

			<div class="luongson-footer-content-field">
				<label for="luongson-ambassador-image-alt"><?php esc_html_e( 'Mô tả ảnh (alt)', 'luongson' ); ?></label>
				<input
					type="text"
					id="luongson-ambassador-image-alt"
					name="<?php echo esc_attr( self::OPTION_KEY ); ?>[image_alt]"
					value="<?php echo esc_attr( $content['image_alt'] ); ?>"
					class="regular-text"
				/>
			</div>
		</div>
		<?php
	}

	/**
	 * Output the SEO block rich text field.
	 */
	private static function render_seo_content_field() {
		$content = luongson_get_ambassador_seo_content();
		?>
		<div class="luongson-footer-content-fields">
			<div class="luongson-footer-content-field">
				<label for="luongson-ambassador-seo-content"><?php esc_html_e( 'Nội dung SEO', 'luongson' ); ?></label>
				<p class="description"><?php esc_html_e( 'Giữ nguyên cấu trúc HTML (tiêu đề, danh sách, đoạn văn) để hiển thị đúng thiết kế.', 'luongson' ); ?></p>
				<?php
				wp_editor(
					$content['seo_content'],
					'luongson_ambassador_seo_content',
					array(
						'textarea_name' => self::OPTION_KEY . '[seo_content]',
						'textarea_rows' => 18,
						'media_buttons' => false,
						'teeny'         => false,
						'quicktags'     => true,
					)
				);
				?>
			</div>
		</div>
		<?php
	}
}

/**
 * Default ambassador and SEO block content from the Framer design.
 *
 * @return array<string, string>
 */
function luongson_get_default_ambassador_seo_content() {
	return array(
		'title'       => 'Đại sứ thương hiệu',
		'description' => '<p>Bước sang năm 2026, cựu tiền đạo huyền thoại <strong>Phạm Văn Quyến</strong> tiếp tục khẳng định sức hút bền bỉ và tình yêu dành cho trái bóng tròn khi tiếp tục đồng hành trong vai trò <strong>đại sứ thương hiệu của Lương Sơn TV</strong> .</p>',
		'image_alt'   => 'Đại sứ Phạm Văn Quyến',
		'seo_content' => '<div class="framer-rl1hba ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto">Giải Nghĩa Kèo Nhà Cái Là Gì?</p></div><div class="framer-98qyuq ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s163" dir="auto">Kèo nhà cái là tỷ lệ cược được đặt ra bởi các nhà cái để người chơi tham chiếu và đặt cược cho các trận đấu bóng đá. Mỗi loại kèo phản ánh nhận định của nhà cái về xác suất thắng thua của hai đội, dựa trên phân tích chuyên sâu từ đội ngũ chuyên gia và dữ liệu thống kê thực tế.</p></div><div class="framer-erb97x ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto">Kèo Nhà Cái - Chuyên Trang Soi Kèo Bóng Đá Trực Tuyến Hàng Đầu</p></div><div class="framer-1orf0ln ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s163" dir="auto">Đam mê trái bóng tròn và muốn tìm kiếm một địa chỉ đáng tin cậy để theo dõi <strong class="framer-text">tỷ lệ kèo</strong> cũng như <strong class="framer-text">nhận định trận đấu</strong> ? <strong class="framer-text">Keonhacai</strong> chính là điểm đến lý tưởng dành cho bạn. Chúng tôi tự hào là chuyên trang soi kèo bóng đá uy tín, cung cấp thông tin đa chiều và cập nhật biến động tỷ lệ cược nhanh chóng, chính xác nhất hiện nay.</p></div><div class="framer-15s0yyc ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto">🏆 Tại Sao Bạn Nên Đồng Hành Cùng Keonhacai?</p></div><div class="framer-1y3idz ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s163" dir="auto">Để giành chiến thắng trong mỗi vòng đấu, việc nắm bắt thông tin nhanh nhạy là yếu tố sống còn. Dưới đây là những lý do hàng triệu người hâm mộ lựa chọn chúng tôi:</p><p class="framer-text ls-s163" dir="auto"><br class="framer-text trailing-break" /></p><ul class="framer-text ls-s163" dir="auto"><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Cập nhật bảng kèo siêu tốc:</strong> Hệ thống bảng tỷ lệ cược (Kèo Châu Á, Kèo Châu Âu, Kèo Tài Xỉu, Kèo Phạt Góc,...) được đồng bộ trực tiếp từ các nhà cái lớn. Biến động tỷ lệ được cập nhật theo thời gian thực, đảm bảo bạn không bỏ lỡ bất kỳ nhịp đập nào của trận đấu.</p></li><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Soi kèo &amp; Nhận định chuyên sâu:</strong> Trước mỗi giờ bóng lăn, đội ngũ chuyên gia giàu kinh nghiệm của Keonhacai sẽ mang đến những bài phân tích chi tiết về phong độ, chiến thuật, tình hình chấn thương và lịch sử đối đầu. Đây là cơ sở vững chắc để bạn đưa ra quyết định chuẩn xác.</p></li><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Phủ sóng mọi giải đấu đỉnh cao:</strong> Từ các giải đấu hấp dẫn nhất hành tinh như Ngoại Hạng Anh (Premier League), Cúp C1 (Champions League), La Liga, Serie A cho đến các giải quốc nội và khu vực như V-League hay AFF Cup – tất cả đều có sẵn trên hệ thống.</p></li><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Giao diện thông minh, dễ thao tác:</strong> Website được thiết kế tối ưu, thân thiện với người dùng trên cả nền tảng máy tính lẫn điện thoại di động. Bạn có thể dễ dàng tra cứu thông tin và đọc bài soi kèo mọi lúc, mọi nơi.</p></li></ul></div><div class="framer-1svpknn ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto">💡 Bứt Phá Thành Công Cùng Chuyên Gia</p></div><div class="framer-tuwv1m ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s163" dir="auto">Bóng đá luôn chứa đựng những điều bất ngờ, nhưng với sự đồng hành của <strong class="framer-text">Keonhacai</strong> , bạn sẽ luôn có cái nhìn tổng quan và sắc bén nhất. Chúng tôi không chỉ cung cấp những con số vô tri, mà còn mang đến những góc nhìn chiến thuật mang tính quyết định.</p><p class="framer-text ls-s163" dir="auto">👉 <strong class="framer-text">Hãy truy cập Keonhacai mỗi ngày</strong> để cập nhật tin tức thể thao nóng hổi, tham khảo các tips bóng đá chất lượng cao và tự tin đưa ra những lựa chọn "vào bờ" an toàn, thắng lớn!</p></div><div class="framer-11jv6c2 ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto">🔍 Giải Mã Các Tỷ Lệ Kèo Phổ Biến Trên Bảng Kèo</p></div><div class="framer-11ymahe ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s163" dir="auto">Để trở thành một người chơi thông thái, việc hiểu rõ các loại tỷ lệ cược là vô cùng quan trọng. Tại <strong class="framer-text">Keonhacai</strong> , chúng tôi trình bày hệ thống bảng tỷ lệ một cách khoa học, giúp bạn dễ dàng nắm bắt những loại kèo cơ bản và được ưa chuộng nhất:</p><ul class="framer-text ls-s163" dir="auto"><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Kèo Châu Á (Handicap):</strong> Loại kèo phổ biến nhất tại thị trường Việt Nam. Dựa trên sự chênh lệch thực lực giữa hai đội, hệ thống sẽ đưa ra các tỷ lệ chấp (chấp 0.25, 0.5, 1 trái...) nhằm tạo ra thế cân bằng, đòi hỏi người chơi phải có khả năng phân tích sâu sắc.</p></li><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Kèo Châu Âu (1X2):</strong> Lối chơi đơn giản, trực diện. Bạn chỉ cần dự đoán kết quả cuối cùng của trận đấu: Đội nhà thắng (1), Hai đội hòa (X), hoặc Đội khách thắng (2).</p></li><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Kèo Tài Xỉu (Over/Under - O/U):</strong> Không cần quan tâm đến kết quả thắng thua của hai đội, điều bạn cần phân tích là tổng số bàn thắng được ghi trong 90 phút thi đấu sẽ cao hơn (Tài) hay thấp hơn (Xỉu) con số mà nhà cái đưa ra.</p></li><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Các kèo phụ hấp dẫn:</strong> Để tăng thêm phần kịch tính cho mỗi phút giây bóng lăn, hệ thống liên tục cập nhật các loại kèo phụ như: kèo phạt góc, kèo thẻ phạt, kèo tỷ số chính xác, kèo giao bóng trước...</p></li></ul></div><div class="framer-jy1xr7 ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s162" dir="auto">🧠 Bí Quyết "Vào Bờ" An Toàn Từ Cao Thủ</p></div><div class="framer-n2tqdy ls-s26" data-framer-component-type="RichTextContainer"><p class="framer-text ls-s163" dir="auto">Bên cạnh việc theo dõi bảng biến động tỷ lệ trực tuyến, người chơi cần trang bị cho mình những kỹ năng độc lập. Các chuyên gia của chúng tôi luôn khuyến nghị người hâm mộ áp dụng 3 nguyên tắc "vàng" sau:</p><ol class="framer-text ls-s165" dir="auto"><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Nghiên cứu kỹ thông tin trước trận:</strong> Đừng chỉ đánh giá qua tên tuổi đội bóng. Hãy tìm hiểu chi tiết về phong độ ở 5 trận gần nhất, danh sách chấn thương/treo giò của các trụ cột, và động lực thi đấu (ví dụ: khát điểm trụ hạng hay cần dưỡng sức cho đấu trường Cúp).</p></li><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Quản lý nguồn vốn thông minh:</strong> Phân bổ ngân sách hợp lý, chia nhỏ rủi ro cho nhiều trận đấu khác nhau. Tuyệt đối tránh tâm lý "tất tay" (all-in) hay cố gắng đánh gấp thếp để gỡ gạc khi đang trong chuỗi thua.</p></li><li class="framer-text" data-preset-tag="p"><p class="framer-text"><strong class="framer-text">Cẩn trọng với "Kèo Dụ":</strong> Trước giờ bóng lăn, tỷ lệ cược đôi khi sẽ có những biến động bất thường (nháy kèo liên tục) nhằm điều hướng tâm lý đám đông. Hãy giữ cái đầu lạnh, tin tưởng vào dữ liệu thống kê và kiên định với nhận định ban đầu.</p></li></ol></div>',
	);
}

/**
 * Get ambassador and SEO block content for the site footer.
 *
 * @return array<string, int|string>
 */
function luongson_get_ambassador_seo_content() {
	static $content = null;

	if ( null !== $content ) {
		return $content;
	}

	$defaults = luongson_get_default_ambassador_seo_content();
	$saved    = get_option( LuongSon_Block_Common_Settings::OPTION_KEY, array() );

	if ( ! is_array( $saved ) ) {
		$saved = array();
	}

	$image_id = isset( $saved['image_id'] ) ? absint( $saved['image_id'] ) : 0;

	if ( $image_id && ! wp_attachment_is_image( $image_id ) ) {
		$image_id = 0;
	}

	$content = array(
		'title'       => ! empty( $saved['title'] ) ? sanitize_text_field( $saved['title'] ) : $defaults['title'],
		'description' => ! empty( $saved['description'] ) ? wp_kses_post( $saved['description'] ) : $defaults['description'],
		'image_id'    => $image_id,
		'image_alt'   => array_key_exists( 'image_alt', $saved ) && '' !== $saved['image_alt']
			? sanitize_text_field( $saved['image_alt'] )
			: $defaults['image_alt'],
		'seo_content' => luongson_normalize_framer_list_markup(
			! empty( $saved['seo_content'] ) ? wp_kses_post( $saved['seo_content'] ) : $defaults['seo_content']
		),
	);

	/**
	 * Filter ambassador and SEO block content shown above the footer.
	 *
	 * @param array<string, int|string> $content Ambassador and SEO fields.
	 */
	return apply_filters( 'luongson_ambassador_seo_content', $content );
}

/**
 * Get ambassador image attributes for the footer template.
 *
 * @return array<string, int|string>|null Image attributes, or null when no image is set.
 */
function luongson_get_ambassador_seo_image_attrs() {
	$content  = luongson_get_ambassador_seo_content();
	$image_id = isset( $content['image_id'] ) ? absint( $content['image_id'] ) : 0;

	if ( ! $image_id ) {
		return null;
	}

	$alt   = isset( $content['image_alt'] ) ? (string) $content['image_alt'] : '';
	$sizes = '(min-width: 1440px) max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3.4, 1px), (min-width: 1280px) and (max-width: 1439.98px) max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3.4, 1px), (min-width: 960px) and (max-width: 1279.98px) max((max(min(max(100vw - 220px, 1px), 1500px), 0px) - 40px) / 3.4, 1px), (min-width: 760px) and (max-width: 959.98px) max((max(min(max(100vw, 1px), 1500px), 0px) - 40px) / 3.4, 1px), (max-width: 759.98px) calc(max(min(100vw, 1500px), 0px) - 20px)';
	$src    = (string) wp_get_attachment_image_url( $image_id, 'full' );
	$srcset = (string) wp_get_attachment_image_srcset( $image_id, 'full' );
	$meta   = wp_get_attachment_metadata( $image_id );

	if ( ! $src ) {
		return null;
	}

	return array(
		'src'    => $src,
		'srcset' => $srcset,
		'width'  => isset( $meta['width'] ) ? (int) $meta['width'] : 527,
		'height' => isset( $meta['height'] ) ? (int) $meta['height'] : 523,
		'alt'    => $alt,
		'sizes'  => $sizes,
	);
}

if ( is_admin() ) {
	add_action( 'admin_init', array( 'LuongSon_Block_Common_Settings', 'register' ) );
	add_action( 'admin_enqueue_scripts', array( 'LuongSon_Block_Common_Settings', 'enqueue_assets' ) );
}
