<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DV2_Canonical_Domain_Admin {

	const OPTION_MOBILE_DOMAIN = 'dv2_canonical_mobile_domain';
	const OPTION_PC_DOMAIN     = 'dv2_canonical_pc_domain';
	const OPTION_SET_VN        = 'dv2_set_vn_enabled';
	const OPTION_ASYNC_JS_URL  = 'dv2_async_js_url';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'update_option_' . self::OPTION_SET_VN, array( __CLASS__, 'on_set_vn_updated' ), 10, 2 );
	}

	public static function add_menu() {
		add_options_page(
			__( 'DV2 Canonical Domain', 'dv2-canonical-domain' ),
			__( 'DV2 Canonical Domain', 'dv2-canonical-domain' ),
			'manage_options',
			'dv2-canonical-domain',
			array( __CLASS__, 'render_page' )
		);
	}

	public static function register_settings() {
		register_setting(
			'dv2_canonical_domain',
			self::OPTION_MOBILE_DOMAIN,
			array(
				'type'              => 'string',
				'sanitize_callback' => array( __CLASS__, 'sanitize_domain' ),
				'default'           => '',
			)
		);

		register_setting(
			'dv2_canonical_domain',
			self::OPTION_PC_DOMAIN,
			array(
				'type'              => 'string',
				'sanitize_callback' => array( __CLASS__, 'sanitize_domain' ),
				'default'           => '',
			)
		);

		add_settings_section(
			'dv2_canonical_domain_section',
			__( 'Cấu hình Domain', 'dv2-canonical-domain' ),
			array( __CLASS__, 'render_section' ),
			'dv2-canonical-domain'
		);

		add_settings_field(
			self::OPTION_MOBILE_DOMAIN,
			__( 'PC set canonical mobile (Domain Mobile)', 'dv2-canonical-domain' ),
			array( __CLASS__, 'render_mobile_field' ),
			'dv2-canonical-domain',
			'dv2_canonical_domain_section'
		);

		add_settings_field(
			self::OPTION_PC_DOMAIN,
			__( 'Mobile set canonical PC (Domain PC)', 'dv2-canonical-domain' ),
			array( __CLASS__, 'render_pc_field' ),
			'dv2-canonical-domain',
			'dv2_canonical_domain_section'
		);

		register_setting(
			'dv2_canonical_domain',
			self::OPTION_SET_VN,
			array(
				'type'              => 'string',
				'sanitize_callback' => array( __CLASS__, 'sanitize_checkbox' ),
				'default'           => '',
			)
		);

		add_settings_section(
			'dv2_set_vn_section',
			__( 'Set VN', 'dv2-canonical-domain' ),
			array( __CLASS__, 'render_set_vn_section' ),
			'dv2-canonical-domain'
		);

		add_settings_field(
			self::OPTION_SET_VN,
			__( 'Set Vn', 'dv2-canonical-domain' ),
			array( __CLASS__, 'render_set_vn_field' ),
			'dv2-canonical-domain',
			'dv2_set_vn_section'
		);

		register_setting(
			'dv2_canonical_domain',
			self::OPTION_ASYNC_JS_URL,
			array(
				'type'              => 'string',
				'sanitize_callback' => array( __CLASS__, 'sanitize_url' ),
				'default'           => '',
			)
		);

		add_settings_section(
			'dv2_async_js_section',
			__( 'Async Script', 'dv2-canonical-domain' ),
			array( __CLASS__, 'render_async_js_section' ),
			'dv2-canonical-domain'
		);

		add_settings_field(
			self::OPTION_ASYNC_JS_URL,
			__( 'Async JS URL', 'dv2-canonical-domain' ),
			array( __CLASS__, 'render_async_js_field' ),
			'dv2-canonical-domain',
			'dv2_async_js_section'
		);
	}

	public static function sanitize_url( $value ) {
		$value = trim( (string) $value );

		if ( '' === $value ) {
			return '';
		}

		if ( ! preg_match( '#^https?://#i', $value ) ) {
			$value = 'https://' . $value;
		}

		return esc_url_raw( $value );
	}

	public static function sanitize_checkbox( $value ) {
		return '1' === $value ? '1' : '';
	}

	public static function on_set_vn_updated( $old_value, $new_value ) {
		if ( $old_value !== $new_value && class_exists( 'DV2_Set_Vn' ) ) {
			DV2_Set_Vn::flush_rewrite_rules();
		}
	}

	public static function sanitize_domain( $value ) {
		$value = trim( (string) $value );

		if ( '' === $value ) {
			return '';
		}

		if ( ! preg_match( '#^https?://#i', $value ) ) {
			$value = 'https://' . $value;
		}

		return esc_url_raw( untrailingslashit( $value ) );
	}

	public static function render_section() {
		echo '<p>' . esc_html__( 'Cấu hình một lần cho cả 2 domain (chung source/DB). Plugin tự detect domain hiện tại qua HTTP_HOST.', 'dv2-canonical-domain' ) . '</p>';
	}

	public static function render_mobile_field() {
		$value = get_option( self::OPTION_MOBILE_DOMAIN, '' );
		?>
		<input
			type="text"
			name="<?php echo esc_attr( self::OPTION_MOBILE_DOMAIN ); ?>"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
			placeholder="domain mobile"
		/>
		<p class="description">
			<?php esc_html_e( 'Domain Mobile. Khi truy cập từ domain PC, plugin sẽ thêm alternate link trỏ về domain này.', 'dv2-canonical-domain' ); ?>
		</p>
		<?php
	}

	public static function render_pc_field() {
		$value = get_option( self::OPTION_PC_DOMAIN, '' );
		?>
		<input
			type="text"
			name="<?php echo esc_attr( self::OPTION_PC_DOMAIN ); ?>"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
			placeholder="domain pc"
		/>
		<p class="description">
			<?php esc_html_e( 'Domain PC. Canonical luôn trỏ về domain này (cả PC lẫn Mobile).', 'dv2-canonical-domain' ); ?>
		</p>
		<?php
	}

	public static function render_set_vn_section() {
		echo '<p>' . esc_html__( 'Bật virtual URL /vi-vn/ cho Home, Page, Post, Category và canonical hreflang.', 'dv2-canonical-domain' ) . '</p>';
	}

	public static function render_set_vn_field() {
		$value = get_option( self::OPTION_SET_VN, '' );
		?>
		<input type="hidden" name="<?php echo esc_attr( self::OPTION_SET_VN ); ?>" value="0" />
		<label>
			<input
				type="checkbox"
				name="<?php echo esc_attr( self::OPTION_SET_VN ); ?>"
				value="1"
				<?php checked( $value, '1' ); ?>
			/>
			<?php esc_html_e( 'Bật Set Vn (/vi-vn/)', 'dv2-canonical-domain' ); ?>
		</label>
		<p class="description">
			<?php esc_html_e( 'URL gốc canonical sang /vi-vn/, URL /vi-vn/ canonical về chính nó.', 'dv2-canonical-domain' ); ?>
		</p>
		<?php
	}

	public static function render_async_js_section() {
		echo '<p>' . esc_html__( 'Nhập URL script sẽ được nạp bất đồng bộ (async) vào site. Script được nạp trễ (khi user tương tác hoặc lúc trình duyệt rảnh) để không ảnh hưởng điểm Google PageSpeed.', 'dv2-canonical-domain' ) . '</p>';
	}

	public static function render_async_js_field() {
		$value = get_option( self::OPTION_ASYNC_JS_URL, '' );
		?>
		<input
			type="text"
			name="<?php echo esc_attr( self::OPTION_ASYNC_JS_URL ); ?>"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
			placeholder="https://example.com/c-asyncjs.php"
		/>
		<p class="description">
			<?php esc_html_e( 'Ví dụ: https://10ju26.xemlichvannien.com/c-asyncjs.php — Để trống nếu không muốn nạp script.', 'dv2-canonical-domain' ); ?>
		</p>
		<?php
	}

	public static function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( 'dv2_canonical_domain' );
				do_settings_sections( 'dv2-canonical-domain' );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}
}
