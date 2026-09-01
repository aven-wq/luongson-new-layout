<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DV2_Set_Vn {

	const OPTION_REWRITE_FLUSHED = 'dv2_set_vn_rewrite_flushed';

	public static function init() {
		if ( ! self::is_enabled() ) {
			return;
		}

		add_action( 'init', array( __CLASS__, 'register_rewrite_rules' ) );
		add_filter( 'query_vars', array( __CLASS__, 'register_query_vars' ) );
		add_filter( 'redirect_canonical', array( __CLASS__, 'disable_redirect_canonical' ) );
		add_action( 'parse_request', array( __CLASS__, 'parse_vi_vn_request' ) );
		add_action( 'pre_get_posts', array( __CLASS__, 'handle_home_vi_vn' ) );
		add_filter( 'rank_math/frontend/canonical', array( __CLASS__, 'filter_canonical' ) );
		add_filter( 'wpseo_canonical', array( __CLASS__, 'filter_canonical' ) );
		add_action( 'wp_head', array( __CLASS__, 'output_hreflang_and_canonical' ), 1 );
	}

	public static function is_enabled() {
		return '1' === get_option( DV2_Canonical_Domain_Admin::OPTION_SET_VN, '' );
	}

	public static function register_rewrite_rules() {
		add_rewrite_rule(
			'^vi-vn/?$',
			'index.php?is_vi_vn=1&vi_vn_type=home',
			'top'
		);

		add_rewrite_rule(
			'^(.+?)/vi-vn/?$',
			'index.php?vi_vn_path=$matches[1]&is_vi_vn=1',
			'top'
		);

		if ( ! get_option( self::OPTION_REWRITE_FLUSHED ) ) {
			flush_rewrite_rules( false );
			update_option( self::OPTION_REWRITE_FLUSHED, 1 );
		}
	}

	public static function flush_rewrite_rules() {
		delete_option( self::OPTION_REWRITE_FLUSHED );
	}

	public static function register_query_vars( $vars ) {
		$vars[] = 'is_vi_vn';
		$vars[] = 'vi_vn_type';
		$vars[] = 'vi_vn_path';

		return $vars;
	}

	public static function disable_redirect_canonical( $redirect_url ) {
		if ( get_query_var( 'is_vi_vn' ) ) {
			return false;
		}

		return $redirect_url;
	}

	public static function parse_vi_vn_request( $wp ) {
		if ( empty( $wp->query_vars['is_vi_vn'] ) ) {
			return;
		}

		if ( ! empty( $wp->query_vars['vi_vn_type'] ) && 'home' === $wp->query_vars['vi_vn_type'] ) {
			return;
		}

		$path = isset( $wp->query_vars['vi_vn_path'] ) ? trim( $wp->query_vars['vi_vn_path'], '/' ) : '';
		if ( '' === $path ) {
			return;
		}

		$page = get_page_by_path( $path, OBJECT, 'page' );
		if ( $page ) {
			$wp->query_vars = array(
				'page_id'  => $page->ID,
				'is_vi_vn' => 1,
			);
			return;
		}

		$public_post_types = get_post_types(
			array(
				'public'   => true,
				'_builtin' => false,
			),
			'names'
		);

		$post_types = array_merge( array( 'post' ), array_values( $public_post_types ) );

		foreach ( $post_types as $post_type ) {
			$posts = get_posts(
				array(
					'name'               => basename( $path ),
					'post_type'          => $post_type,
					'post_status'        => 'publish',
					'numberposts'        => 20,
					'suppress_filters'   => false,
				)
			);

			if ( empty( $posts ) ) {
				continue;
			}

			foreach ( $posts as $post ) {
				$permalink_path = trim( (string) parse_url( get_permalink( $post->ID ), PHP_URL_PATH ), '/' );
				if ( $permalink_path === $path ) {
					$wp->query_vars = array(
						'p'         => $post->ID,
						'post_type' => $post_type,
						'is_vi_vn'  => 1,
					);
					return;
				}
			}
		}

		$category_base = get_option( 'category_base' );
		$category_base = $category_base ? trim( $category_base, '/' ) : 'category';

		if ( $path === $category_base || 0 === strpos( $path, $category_base . '/' ) ) {
			$cat_rel_path = trim( substr( $path, strlen( $category_base ) ), '/' );

			if ( '' !== $cat_rel_path ) {
				$segments = explode( '/', $cat_rel_path );
				$slug     = end( $segments );

				$term = get_term_by( 'slug', $slug, 'category' );
				if ( $term && ! is_wp_error( $term ) ) {
					$real_term_path = trim( (string) parse_url( get_term_link( $term ), PHP_URL_PATH ), '/' );
					if ( $real_term_path === $path ) {
						$wp->query_vars = array(
							'cat'      => $term->term_id,
							'is_vi_vn' => 1,
						);
					}
				}
			}
		}
	}

	public static function handle_home_vi_vn( $query ) {
		if ( is_admin() || ! $query->is_main_query() ) {
			return;
		}

		if ( ! get_query_var( 'is_vi_vn' ) ) {
			return;
		}

		if ( 'home' === get_query_var( 'vi_vn_type' ) || 'vi-vn' === self::current_request_path() ) {
			$front_page_id = (int) get_option( 'page_on_front' );
			if ( $front_page_id ) {
				$query->set( 'page_id', $front_page_id );
				$query->is_page         = true;
				$query->is_home         = false;
				$query->is_singular     = true;
				$query->is_front_page   = false;
			}
		}
	}

	public static function filter_canonical( $canonical ) {
		$custom = self::get_canonical_url();
		if ( $custom ) {
			return $custom;
		}

		return $canonical;
	}

	public static function output_hreflang_and_canonical() {
		if ( ! ( is_front_page() || is_page() || is_single() || is_category() || self::is_vi_vn_request() ) ) {
			return;
		}

		$original_url = self::get_current_original_url();
		$vi_url       = self::get_current_vi_url();
		$canonical    = self::get_canonical_url();

		if ( $vi_url ) {
			echo '<link rel="alternate" hreflang="vi" href="' . esc_url( $vi_url ) . "\">\n";
			echo '<link rel="alternate" hreflang="vi-vn" href="' . esc_url( $vi_url ) . "\">\n";
			echo '<link rel="alternate" hreflang="x-default" href="' . esc_url( $vi_url ) . "\">\n";
		}

		if ( $original_url ) {
			echo '<link rel="alternate" hreflang="x-original" href="' . esc_url( $original_url ) . "\">\n";
		}

		if ( $canonical ) {
			echo '<link rel="canonical" href="' . esc_url( $canonical ) . "\" />\n";
		}
	}

	public static function is_vi_vn_request() {
		return (bool) get_query_var( 'is_vi_vn' );
	}

	public static function current_request_path() {
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';
		$path        = parse_url( $request_uri, PHP_URL_PATH );

		return trim( (string) $path, '/' );
	}

	public static function get_current_original_url() {
		if ( is_front_page() ) {
			return home_url( '/' );
		}

		if ( is_page() || is_single() ) {
			return get_permalink();
		}

		if ( is_category() ) {
			$term = get_queried_object();
			if ( $term && ! empty( $term->term_id ) ) {
				return get_term_link( $term );
			}
		}

		if ( self::is_vi_vn_request() ) {
			$path = self::current_request_path();

			if ( 'vi-vn' === $path ) {
				return home_url( '/' );
			}

			if ( substr( $path, -6 ) === 'vi-vn' ) {
				$original_path = preg_replace( '#/vi-vn$#', '', $path );
				return home_url( '/' . trim( $original_path, '/' ) . '/' );
			}
		}

		return '';
	}

	public static function get_current_vi_url() {
		if ( self::is_vi_vn_request() ) {
			$path = self::current_request_path();
			return home_url( '/' . $path . '/' );
		}

		if ( is_front_page() ) {
			return home_url( '/vi-vn/' );
		}

		if ( is_page() || is_single() ) {
			$url  = get_permalink();
			$path = trim( (string) parse_url( $url, PHP_URL_PATH ), '/' );
			return home_url( '/' . $path . '/vi-vn/' );
		}

		if ( is_category() ) {
			$term = get_queried_object();
			if ( $term && ! empty( $term->term_id ) ) {
				$url = get_term_link( $term );
				if ( ! is_wp_error( $url ) ) {
					$path = trim( (string) parse_url( $url, PHP_URL_PATH ), '/' );
					return home_url( '/' . $path . '/vi-vn/' );
				}
			}
		}

		return '';
	}

	public static function get_canonical_url() {
		if ( self::is_vi_vn_request() ) {
			return self::get_current_vi_url();
		}

		$vi_url = self::get_current_vi_url();
		if ( $vi_url ) {
			return $vi_url;
		}

		return '';
	}
}
