<?php
/**
 * Single post layout helpers (Ads Right Sidebar shell + related posts).
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Whether the current request uses the single post layout.
 */
function luongson_is_single_post_layout() {
	return is_singular( 'post' );
}

/**
 * Primary category for a post (Yoast primary when available).
 *
 * @param int $post_id Post ID.
 * @return WP_Term|null
 */
function luongson_get_single_primary_category( $post_id = 0 ) {
	$post_id = $post_id ? (int) $post_id : (int) get_the_ID();

	if ( ! $post_id ) {
		return null;
	}

	$categories = get_the_category( $post_id );

	if ( empty( $categories ) ) {
		return null;
	}

	if ( class_exists( 'WPSEO_Primary_Term' ) ) {
		$primary = new WPSEO_Primary_Term( 'category', $post_id );
		$term_id = (int) $primary->get_primary_term();

		if ( $term_id ) {
			$term = get_term( $term_id, 'category' );

			if ( $term instanceof WP_Term && ! is_wp_error( $term ) ) {
				return $term;
			}
		}
	}

	return $categories[0];
}

/**
 * Breadcrumb items for single posts.
 *
 * @param int $post_id Post ID.
 * @return array<int, array<string, mixed>>
 */
function luongson_get_single_breadcrumb_items( $post_id = 0 ) {
	$post_id = $post_id ? (int) $post_id : (int) get_the_ID();
	$items   = array(
		array(
			'label' => __( 'Trang chủ', 'luongson' ),
			'url'   => home_url( '/' ),
			'type'  => 'home',
		),
	);

	$term = luongson_get_single_primary_category( $post_id );

	if ( $term instanceof WP_Term ) {
		$link = get_term_link( $term );

		if ( ! is_wp_error( $link ) ) {
			$items[] = array(
				'label' => $term->name,
				'url'   => $link,
			);
		}
	}

	$title = get_the_title( $post_id );

	if ( '' !== $title ) {
		$items[] = array(
			'label'   => $title,
			'current' => true,
		);
	}

	return $items;
}

/**
 * Post title shown in the single layout (append publish date when missing).
 *
 * @param int|WP_Post|null $post Post ID or object.
 * @return string
 */
function luongson_get_single_post_display_title( $post = null ) {
	$post  = get_post( $post );
	$title = $post ? get_the_title( $post ) : '';

	if ( '' === $title ) {
		return '';
	}

	$date_label = get_the_date( 'd/m/Y', $post );

	if ( '' === $date_label || false !== strpos( $title, $date_label ) ) {
		return $title;
	}

	return trim( $title . ' ' . $date_label );
}

/**
 * Related posts query for single views (same rules as category archive).
 *
 * @param int $post_id Post ID.
 * @return WP_Query
 */
function luongson_get_related_category_posts( $post_id = 0 ) {
	$post_id = $post_id ? (int) $post_id : (int) get_the_ID();
	$term    = luongson_get_single_primary_category( $post_id );
	$term_id = $term instanceof WP_Term ? (int) $term->term_id : 0;

	$args = array(
		'post_type'           => 'post',
		'posts_per_page'      => luongson_get_category_posts_per_page( $term_id ),
		'paged'               => luongson_get_single_related_paged(),
		'ignore_sticky_posts' => true,
	);

	if ( $term_id ) {
		$args['cat'] = $term_id;
	}

	/**
	 * Filter related posts query on single post views.
	 *
	 * @param array<string, mixed> $args    Query arguments.
	 * @param int                  $post_id Current post ID.
	 */
	$args = apply_filters( 'luongson_single_related_posts_query_args', $args, $post_id );

	return new WP_Query( $args );
}

/**
 * Register query var for related-post pagination on single views.
 *
 * @param string[] $vars Public query vars.
 * @return string[]
 */
function luongson_register_single_related_query_vars( $vars ) {
	$vars[] = 'ls_related_paged';

	return $vars;
}
add_filter( 'query_vars', 'luongson_register_single_related_query_vars' );

/**
 * Current related-post page on single views.
 */
function luongson_get_single_related_paged() {
	$paged = get_query_var( 'ls_related_paged' );

	return max( 1, (int) $paged );
}

/**
 * Build pagination URL for related posts on single views.
 *
 * @param int $page Page number.
 * @return string
 */
function luongson_get_single_related_page_url( $page ) {
	$page = max( 1, (int) $page );
	$url  = get_permalink();

	if ( $page <= 1 ) {
		return (string) remove_query_arg( 'ls_related_paged', $url );
	}

	return (string) add_query_arg( 'ls_related_paged', $page, $url );
}

/**
 * Render related-post pagination on single views.
 *
 * @param WP_Query $query Related posts query.
 */
function luongson_render_single_related_pagination( $query ) {
	luongson_render_archive_pagination( $query, 'luongson_get_single_related_page_url' );
}

/**
 * Enqueue blog.css for single post layout.
 */
function luongson_enqueue_single_post_assets() {
	if ( ! luongson_is_single_post_layout() ) {
		return;
	}

	$theme_ver = wp_get_theme()->get( 'Version' );
	$css_path  = get_stylesheet_directory() . '/assets/css/blog.css';

	wp_enqueue_style(
		'luongson-single-post',
		luongson_asset_uri( 'css/blog.css' ),
		array( 'luongson-custom' ),
		file_exists( $css_path ) ? (string) filemtime( $css_path ) : $theme_ver
	);
}
add_action( 'wp_enqueue_scripts', 'luongson_enqueue_single_post_assets', 100 );

/**
 * Body class for single post layout.
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function luongson_single_post_body_class( $classes ) {
	if ( luongson_is_single_post_layout() ) {
		$classes[] = 'luongson-ads-right-sidebar';
		$classes[] = 'luongson-single-post';
	}

	return $classes;
}
add_filter( 'body_class', 'luongson_single_post_body_class' );

/**
 * Render the single post inside the Ads Right Sidebar shell.
 */
function luongson_render_single_post_layout() {
	get_template_part( 'template-parts/luongson/single/layout' );
}
