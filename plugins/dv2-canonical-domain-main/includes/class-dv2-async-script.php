<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DV2_Async_Script {

	public static function init() {
		if ( is_admin() ) {
			return;
		}

		add_action( 'wp_footer', array( __CLASS__, 'output_loader' ), 99 );
	}

	public static function get_url() {
		return trim( (string) get_option( DV2_Canonical_Domain_Admin::OPTION_ASYNC_JS_URL, '' ) );
	}

	/**
	 * Inject script bất đồng bộ theo hướng "lazy load":
	 * - Chỉ nạp khi user tương tác lần đầu (scroll, di chuột, chạm, gõ phím...)
	 *   hoặc khi trình duyệt rảnh (requestIdleCallback) / sau timeout.
	 * - Nhờ đó third-party script không chặn render, không tính vào LCP/TBT,
	 *   giữ điểm Google PageSpeed cao.
	 * - Thẻ tạo ra tương đương: <script async src="..."></script>
	 */
	public static function output_loader() {
		$url = self::get_url();

		if ( '' === $url ) {
			return;
		}

		$src = wp_json_encode( esc_url_raw( $url ) );
		?>
<script id="dv2-async-script-loader">
(function () {
	var src = <?php echo $src; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;
	var loaded = false;
	var events = ['scroll', 'mousemove', 'mousedown', 'touchstart', 'keydown', 'click'];

	function cleanup() {
		events.forEach(function (evt) {
			window.removeEventListener(evt, load, { passive: true });
		});
	}

	function load() {
		if (loaded) { return; }
		loaded = true;
		cleanup();

		var s = document.createElement('script');
		s.async = true;
		s.src = src;
		(document.body || document.head || document.documentElement).appendChild(s);
	}

	events.forEach(function (evt) {
		window.addEventListener(evt, load, { passive: true });
	});

	if ('requestIdleCallback' in window) {
		requestIdleCallback(load, { timeout: 5000 });
	} else {
		window.addEventListener('load', function () {
			setTimeout(load, 3000);
		});
	}
})();
</script>
		<?php
	}
}
