<?php
/**
 * Category / archive layout helpers (tin.html design + Ads Right Sidebar shell).
 *
 * @package LuongSon
 */

defined( 'ABSPATH' ) || exit;

/**
 * Whether the current request uses the news archive layout.
 */
function luongson_is_news_archive_layout() {
	return is_category() || is_tag() || ( is_home() && ! is_front_page() );
}

/**
 * Posts per page on news archive views.
 */
function luongson_get_news_archive_posts_per_page() {
	/**
	 * Filter posts per page on news category/archive templates.
	 *
	 * @param int $per_page Default 12 (matches tin.html).
	 */
	return (int) apply_filters( 'luongson_news_archive_posts_per_page', 12 );
}

/**
 * Insert Top Nhà Cái block after this many posts.
 */
function luongson_get_news_archive_nha_cai_position() {
	/**
	 * Filter post index after which [luongson_nha_cai_uy_tin] is rendered.
	 *
	 * @param int $position Default 6 (2 rows × 3 columns before Top Nhà Cái).
	 */
	return (int) apply_filters( 'luongson_news_archive_nha_cai_position', 6 );
}

/**
 * Archive page heading (category title or posts page title).
 */
function luongson_get_news_archive_heading() {
	if ( is_category() ) {
		$term = get_queried_object();
		if ( $term instanceof WP_Term && '' !== trim( (string) $term->name ) ) {
			return (string) $term->name;
		}
	}

	if ( is_tag() ) {
		$label = single_tag_title( '', false );
		if ( '' !== $label ) {
			return $label;
		}
	}

	if ( is_home() && ! is_front_page() ) {
		$posts_page_id = (int) get_option( 'page_for_posts' );
		if ( $posts_page_id ) {
			$title = get_the_title( $posts_page_id );
			if ( '' !== $title ) {
				return $title;
			}
		}
	}

	/**
	 * Filter archive heading text.
	 *
	 * @param string $heading Default heading.
	 */
	return (string) apply_filters( 'luongson_news_archive_heading', __( 'Tin tức', 'luongson' ) );
}

/**
 * Trim post excerpt for archive cards (2-line clamp in tin.html).
 *
 * @param int|WP_Post|null $post Post ID or object.
 * @return string
 */
function luongson_get_archive_excerpt( $post = null ) {
	$post = get_post( $post );

	if ( ! $post ) {
		return '';
	}

	$excerpt = get_the_excerpt( $post );
	$excerpt = wp_strip_all_tags( (string) $excerpt );
	$excerpt = preg_replace( '/\[&hellip;\]|\[\.\.\.\]|…/u', '', $excerpt );
	$excerpt = trim( $excerpt );

	if ( '' === $excerpt ) {
		$content = wp_strip_all_tags( (string) $post->post_content );
		$excerpt = wp_trim_words( $content, 24, '' );
	}

	return wp_trim_words( $excerpt, 24, '' );
}

/**
 * Set posts per page for news archive views.
 *
 * @param WP_Query $query Main query.
 */
function luongson_news_archive_pre_get_posts( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}

	if ( ! ( $query->is_category() || $query->is_tag() || ( $query->is_home() && ! $query->is_front_page() ) ) ) {
		return;
	}

	$query->set( 'posts_per_page', luongson_get_news_archive_posts_per_page() );
}
add_action( 'pre_get_posts', 'luongson_news_archive_pre_get_posts' );

/**
 * Enqueue blog.css for news archive layout.
 */
function luongson_enqueue_news_archive_assets() {
	if ( ! luongson_is_news_archive_layout() ) {
		return;
	}

	$theme_ver = wp_get_theme()->get( 'Version' );
	$css_path  = get_stylesheet_directory() . '/assets/css/blog.css';

	wp_enqueue_style(
		'luongson-news-archive',
		luongson_asset_uri( 'css/blog.css' ),
		array( 'luongson-custom' ),
		file_exists( $css_path ) ? (string) filemtime( $css_path ) : $theme_ver
	);
}
add_action( 'wp_enqueue_scripts', 'luongson_enqueue_news_archive_assets', 100 );

/**
 * Body class for news archive layout.
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function luongson_news_archive_body_class( $classes ) {
	if ( luongson_is_news_archive_layout() ) {
		$classes[] = 'luongson-ads-right-sidebar';
	}

	return $classes;
}
add_filter( 'body_class', 'luongson_news_archive_body_class' );

/**
 * Build pagination item list for the Framer pager.
 *
 * @param int $current Current page.
 * @param int $total   Total pages.
 * @return array<int, array<string, int|string>>
 */
function luongson_build_archive_pagination_items( $current, $total ) {
	$items   = array();
	$pages   = array( 1 );
	$mid_size = 1;

	for ( $i = $current - $mid_size; $i <= $current + $mid_size; $i++ ) {
		if ( $i > 1 && $i < $total ) {
			$pages[] = $i;
		}
	}

	if ( $total > 1 ) {
		$pages[] = $total;
	}

	$pages = array_values( array_unique( array_map( 'intval', $pages ) ) );
	sort( $pages, SORT_NUMERIC );

	$previous = 0;
	foreach ( $pages as $page ) {
		if ( $previous && ( $page - $previous ) > 1 ) {
			$items[] = array( 'type' => 'dots' );
		}

		$items[] = array(
			'type'   => 'page',
			'number' => $page,
		);

		$previous = $page;
	}

	return $items;
}

/**
 * Render archive pagination (tin.html framer-1c73n61).
 */
function luongson_render_archive_pagination() {
	global $wp_query;

	$total   = (int) $wp_query->max_num_pages;
	$current = max( 1, (int) get_query_var( 'paged' ) );

	if ( $total <= 1 ) {
		return;
	}

	get_template_part(
		'template-parts/luongson/archive/pagination',
		null,
		array(
			'current' => $current,
			'total'   => $total,
			'items'   => luongson_build_archive_pagination_items( $current, $total ),
		)
	);
}

/**
 * Render the news archive inside the Ads Right Sidebar shell.
 */
function luongson_render_news_archive_layout() {
	get_template_part( 'template-parts/luongson/archive/layout' );
}
