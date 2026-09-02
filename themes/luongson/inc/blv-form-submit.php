<?php
/**
 * BLV recruitment form shortcode and submission handler.
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register hidden post type for BLV applications.
 */
function luongson_register_blv_application_post_type() {
	register_post_type(
		'ls_blv_application',
		array(
			'labels'              => array(
				'name'          => __( 'Ứng tuyển BLV', 'luongson' ),
				'singular_name' => __( 'Hồ sơ ứng tuyển BLV', 'luongson' ),
				'menu_name'     => __( 'Ứng tuyển BLV', 'luongson' ),
				'all_items'     => __( 'Tất cả hồ sơ', 'luongson' ),
				'view_item'     => __( 'Xem hồ sơ', 'luongson' ),
				'search_items'  => __( 'Tìm hồ sơ', 'luongson' ),
				'not_found'     => __( 'Chưa có hồ sơ.', 'luongson' ),
			),
			'public'              => false,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'menu_icon'           => 'dashicons-id-alt',
			'capability_type'     => 'post',
			'map_meta_cap'        => true,
			'hierarchical'        => false,
			'supports'            => array( 'title' ),
			'has_archive'         => false,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
		)
	);
}
add_action( 'init', 'luongson_register_blv_application_post_type' );

/**
 * Enqueue BLV form assets.
 */
function luongson_enqueue_blv_form_assets() {
	static $enqueued = false;

	if ( $enqueued ) {
		return;
	}

	$enqueued  = true;
	$theme_ver = wp_get_theme()->get( 'Version' );
	$css_path  = get_stylesheet_directory() . '/assets/css/blv-form.css';
	$js_path   = get_stylesheet_directory() . '/assets/js/blv-form.js';

	wp_enqueue_style(
		'luongson-blv-form',
		luongson_asset_uri( 'css/blv-form.css' ),
		array( 'luongson-custom' ),
		file_exists( $css_path ) ? (string) filemtime( $css_path ) : $theme_ver
	);

	wp_enqueue_script(
		'luongson-blv-form',
		luongson_asset_uri( 'js/blv-form.js' ),
		array(),
		file_exists( $js_path ) ? (string) filemtime( $js_path ) : $theme_ver,
		true
	);

	wp_localize_script(
		'luongson-blv-form',
		'luongsonBlvForm',
		array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'luongson_blv_form' ),
			'i18n'    => array(
				'sending'      => __( 'Đang gửi...', 'luongson' ),
				'success'      => __( 'Đăng ký thành công! Ban nhân sự sẽ liên hệ với bạn trong vòng 3 ngày làm việc.', 'luongson' ),
				'error'        => __( 'Không thể gửi đăng ký. Vui lòng thử lại sau.', 'luongson' ),
				'required'     => __( 'Vui lòng điền đầy đủ các trường bắt buộc.', 'luongson' ),
				'invalidEmail' => __( 'Email không hợp lệ.', 'luongson' ),
			),
		)
	);
}

/**
 * Render BLV registration form.
 *
 * @param array<string, mixed> $args Optional rendering options.
 * @return string
 */
function luongson_render_blv_form( $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'title'        => __( 'ĐĂNG KÝ THÔNG TIN', 'luongson' ),
			'description'  => __( 'Hãy điền đầy đủ thông tin dưới đây. Ban nhân sự sẽ liên hệ với các ứng viên phù hợp trong vòng 3 ngày làm việc.', 'luongson' ),
			'submit_label' => __( 'ĐĂNG KÝ NGAY', 'luongson' ),
			'form_id'      => 'luongson-blv-form',
			'card_id'      => 'blv',
		)
	);

	luongson_enqueue_blv_form_assets();

	ob_start();
	get_template_part(
		'template-parts/luongson/blv-form',
		null,
		$args
	);

	return (string) ob_get_clean();
}

/**
 * Shortcode: [luongson_blv_form_submit]
 *
 * Attributes:
 * - title="..."        Form heading.
 * - description="..."  Form description.
 * - submit_label="..." Submit button text.
 * - form_id="..."      Form element ID.
 * - card_id="..."      Card anchor ID (default: blv).
 *
 * @param array<string, string>|string $atts Shortcode attributes.
 * @return string
 */
function luongson_shortcode_blv_form_submit( $atts ) {
	$atts = shortcode_atts(
		array(
			'title'        => __( 'ĐĂNG KÝ THÔNG TIN', 'luongson' ),
			'description'  => __( 'Hãy điền đầy đủ thông tin dưới đây. Ban nhân sự sẽ liên hệ với các ứng viên phù hợp trong vòng 3 ngày làm việc.', 'luongson' ),
			'submit_label' => __( 'ĐĂNG KÝ NGAY', 'luongson' ),
			'form_id'      => 'luongson-blv-form',
			'card_id'      => 'blv',
		),
		$atts,
		'luongson_blv_form_submit'
	);

	return luongson_render_blv_form( $atts );
}
add_shortcode( 'luongson_blv_form_submit', 'luongson_shortcode_blv_form_submit' );

/**
 * Validate BLV form payload.
 *
 * @param array<string, mixed> $data Raw POST data.
 * @return string|true Error message or true when valid.
 */
function luongson_validate_blv_form_data( $data ) {
	$full_name  = isset( $data['full_name'] ) ? trim( (string) $data['full_name'] ) : '';
	$phone      = isset( $data['phone'] ) ? trim( (string) $data['phone'] ) : '';
	$email      = isset( $data['email'] ) ? trim( (string) $data['email'] ) : '';
	$experience = isset( $data['experience'] ) ? trim( (string) $data['experience'] ) : '';

	if ( '' === $full_name || '' === $phone || '' === $email || '' === $experience ) {
		return __( 'Vui lòng điền đầy đủ các trường bắt buộc.', 'luongson' );
	}

	if ( ! is_email( $email ) ) {
		return __( 'Email không hợp lệ.', 'luongson' );
	}

	if ( strlen( $full_name ) > 120 || strlen( $phone ) > 30 || strlen( $email ) > 120 ) {
		return __( 'Dữ liệu nhập quá dài.', 'luongson' );
	}

	if ( strlen( $experience ) > 5000 ) {
		return __( 'Nội dung kinh nghiệm quá dài.', 'luongson' );
	}

	return true;
}

/**
 * Persist BLV application and notify admin.
 *
 * @param array<string, string> $data Sanitized form data.
 * @return int|\WP_Error
 */
function luongson_save_blv_application( $data ) {
	$post_id = wp_insert_post(
		array(
			'post_type'   => 'ls_blv_application',
			'post_status' => 'publish',
			'post_title'  => $data['full_name'],
		),
		true
	);

	if ( is_wp_error( $post_id ) ) {
		return $post_id;
	}

	update_post_meta( $post_id, '_blv_phone', $data['phone'] );
	update_post_meta( $post_id, '_blv_email', $data['email'] );
	update_post_meta( $post_id, '_blv_experience', $data['experience'] );
	update_post_meta( $post_id, '_blv_submitted_at', current_time( 'mysql' ) );

	/**
	 * Filter recipient email for BLV form notifications.
	 *
	 * @param string $email Admin notification email.
	 */
	$recipient = apply_filters( 'luongson_blv_form_recipient', get_option( 'admin_email' ) );

	if ( is_email( $recipient ) ) {
		$subject = sprintf(
			/* translators: %s: applicant full name */
			__( '[Ứng tuyển BLV] Hồ sơ mới từ %s', 'luongson' ),
			$data['full_name']
		);

		$body = sprintf(
			"%s\n\n%s: %s\n%s: %s\n%s: %s\n\n%s:\n%s\n",
			__( 'Có hồ sơ ứng tuyển BLV mới:', 'luongson' ),
			__( 'Họ và tên', 'luongson' ),
			$data['full_name'],
			__( 'Số điện thoại', 'luongson' ),
			$data['phone'],
			__( 'Email', 'luongson' ),
			$data['email'],
			__( 'Kinh nghiệm bình luận', 'luongson' ),
			$data['experience']
		);

		wp_mail( $recipient, $subject, $body );
	}

	return $post_id;
}

/**
 * AJAX handler for BLV form submission.
 */
function luongson_ajax_blv_form_submit() {
	check_ajax_referer( 'luongson_blv_form', 'nonce' );

	if ( ! empty( $_POST['blv_website'] ) ) {
		wp_send_json_success(
			array(
				'message' => __( 'Đăng ký thành công! Ban nhân sự sẽ liên hệ với bạn trong vòng 3 ngày làm việc.', 'luongson' ),
			)
		);
	}

	$raw_data = array(
		'full_name'  => isset( $_POST['full_name'] ) ? wp_unslash( $_POST['full_name'] ) : '',
		'phone'      => isset( $_POST['phone'] ) ? wp_unslash( $_POST['phone'] ) : '',
		'email'      => isset( $_POST['email'] ) ? wp_unslash( $_POST['email'] ) : '',
		'experience' => isset( $_POST['experience'] ) ? wp_unslash( $_POST['experience'] ) : '',
	);

	$validation = luongson_validate_blv_form_data( $raw_data );
	if ( true !== $validation ) {
		wp_send_json_error(
			array(
				'message' => $validation,
			),
			400
		);
	}

	$data = array(
		'full_name'  => sanitize_text_field( $raw_data['full_name'] ),
		'phone'      => sanitize_text_field( $raw_data['phone'] ),
		'email'      => sanitize_email( $raw_data['email'] ),
		'experience' => sanitize_textarea_field( $raw_data['experience'] ),
	);

	$result = luongson_save_blv_application( $data );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error(
			array(
				'message' => __( 'Không thể gửi đăng ký. Vui lòng thử lại sau.', 'luongson' ),
			),
			500
		);
	}

	wp_send_json_success(
		array(
			'message' => __( 'Đăng ký thành công! Ban nhân sự sẽ liên hệ với bạn trong vòng 3 ngày làm việc.', 'luongson' ),
		)
	);
}
add_action( 'wp_ajax_luongson_blv_form_submit', 'luongson_ajax_blv_form_submit' );
add_action( 'wp_ajax_nopriv_luongson_blv_form_submit', 'luongson_ajax_blv_form_submit' );

/**
 * Show application meta in admin edit screen.
 *
 * @param WP_Post $post Current post.
 */
function luongson_blv_application_meta_box( $post ) {
	$phone      = (string) get_post_meta( $post->ID, '_blv_phone', true );
	$email      = (string) get_post_meta( $post->ID, '_blv_email', true );
	$experience = (string) get_post_meta( $post->ID, '_blv_experience', true );
	$submitted  = (string) get_post_meta( $post->ID, '_blv_submitted_at', true );
	?>
	<table class="form-table" role="presentation">
		<tr>
			<th scope="row"><?php esc_html_e( 'Số điện thoại', 'luongson' ); ?></th>
			<td><?php echo esc_html( $phone ); ?></td>
		</tr>
		<tr>
			<th scope="row"><?php esc_html_e( 'Email', 'luongson' ); ?></th>
			<td><a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ); ?></a></td>
		</tr>
		<tr>
			<th scope="row"><?php esc_html_e( 'Thời gian gửi', 'luongson' ); ?></th>
			<td><?php echo esc_html( $submitted ); ?></td>
		</tr>
		<tr>
			<th scope="row"><?php esc_html_e( 'Kinh nghiệm bình luận', 'luongson' ); ?></th>
			<td><textarea class="large-text" rows="8" readonly><?php echo esc_textarea( $experience ); ?></textarea></td>
		</tr>
	</table>
	<?php
}

/**
 * Register BLV application meta box.
 */
function luongson_register_blv_application_meta_box() {
	add_meta_box(
		'luongson-blv-application-details',
		__( 'Thông tin ứng viên', 'luongson' ),
		'luongson_blv_application_meta_box',
		'ls_blv_application',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'luongson_register_blv_application_meta_box' );

/**
 * Add list table columns for BLV applications.
 *
 * @param array<string, string> $columns Existing columns.
 * @return array<string, string>
 */
function luongson_blv_application_columns( $columns ) {
	$new_columns = array();

	foreach ( $columns as $key => $label ) {
		$new_columns[ $key ] = $label;

		if ( 'title' === $key ) {
			$new_columns['blv_phone'] = __( 'Số điện thoại', 'luongson' );
			$new_columns['blv_email'] = __( 'Email', 'luongson' );
		}
	}

	return $new_columns;
}
add_filter( 'manage_ls_blv_application_posts_columns', 'luongson_blv_application_columns' );

/**
 * Render custom list table column values.
 *
 * @param string $column  Column key.
 * @param int    $post_id Post ID.
 */
function luongson_blv_application_column_content( $column, $post_id ) {
	if ( 'blv_phone' === $column ) {
		echo esc_html( (string) get_post_meta( $post_id, '_blv_phone', true ) );
	}

	if ( 'blv_email' === $column ) {
		$email = (string) get_post_meta( $post_id, '_blv_email', true );
		if ( $email ) {
			echo '<a href="mailto:' . esc_attr( $email ) . '">' . esc_html( $email ) . '</a>';
		}
	}
}
add_action( 'manage_ls_blv_application_posts_custom_column', 'luongson_blv_application_column_content', 10, 2 );
