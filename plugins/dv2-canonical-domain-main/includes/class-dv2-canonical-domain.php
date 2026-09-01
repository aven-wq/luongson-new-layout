<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DV2_Canonical_Domain {

	public static function init() {
		$mobile_domain = get_option( DV2_Canonical_Domain_Admin::OPTION_MOBILE_DOMAIN, '' );
		$pc_domain     = get_option( DV2_Canonical_Domain_Admin::OPTION_PC_DOMAIN, '' );

		if ( empty( $pc_domain ) ) {
			return;
		}

		self::init_canonical_to_pc( $pc_domain );

		if ( ! empty( $mobile_domain ) && self::is_pc_request( $pc_domain ) ) {
			self::init_mobile_alternate( $mobile_domain );
		}
	}

	/**
	 * Canonical về domain PC — chạy trên cả PC và Mobile.
	 */
	private static function init_canonical_to_pc( $pc_domain ) {
		add_filter(
			'rank_math/frontend/canonical',
			function ( $canonical ) use ( $pc_domain ) {
				$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';

				return untrailingslashit( $pc_domain ) . $request_uri;
			}
		);
	}

	/**
	 * Alternate link cho Mobile — chỉ chạy khi request từ domain PC.
	 */
	private static function init_mobile_alternate( $mobile_domain ) {
		add_action(
			'wp_head',
			function () use ( $mobile_domain ) {
				$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';
				$path        = strtok( $request_uri, '?' );
				$mobile_url  = trailingslashit( untrailingslashit( $mobile_domain ) . $path );

				echo '<link rel="alternate" media="only screen and (max-width: 640px)" href="'
					. esc_url( $mobile_url ) . "\" />\n";
			}
		);
	}

	/**
	 * Detect request đang từ domain PC hay Mobile dựa trên HTTP_HOST.
	 */
	private static function is_pc_request( $pc_domain ) {
		$current_host = self::get_host_from_request();
		$pc_host      = self::get_host_from_url( $pc_domain );

		return $current_host === $pc_host;
	}

	private static function get_host_from_request() {
		if ( isset( $_SERVER['HTTP_HOST'] ) ) {
			return self::normalize_host( wp_unslash( $_SERVER['HTTP_HOST'] ) );
		}

		return self::get_host_from_url( home_url() );
	}

	private static function get_host_from_url( $url ) {
		$host = parse_url( $url, PHP_URL_HOST );

		return $host ? self::normalize_host( $host ) : '';
	}

	private static function normalize_host( $host ) {
		$host = strtolower( trim( (string) $host ) );

		if ( 0 === strpos( $host, 'www.' ) ) {
			$host = substr( $host, 4 );
		}

		return $host;
	}
}
