/**
 * =========================================================
 * VI-VN virtual language URLs for Home / Page / Post / Category
 * =========================================================
 */

/**
 * Helper: kiểm tra đang ở URL /.../vi-vn hay không
 */
function k18_is_vi_vn_request() {
    return (bool) get_query_var('is_vi_vn');
}

/**
 * Helper: lấy path hiện tại
 */
function k18_current_request_path() {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    return trim($path, '/');
}

/**
 * Rewrite rules
 */
add_action('init', function () {
    // Home: /vi-vn/
    add_rewrite_rule(
        '^vi-vn/?$',
        'index.php?is_vi_vn=1&vi_vn_type=home',
        'top'
    );

    // Category: /category-slug/vi-vn/
    // hỗ trợ category parent/child nếu category base đang có trong path thật
    add_rewrite_rule(
        '^(.+?)/vi-vn/?$',
        'index.php?vi_vn_path=$matches[1]&is_vi_vn=1',
        'top'
    );

    if (!get_option('K18_VI_VN_REWRITE_FLUSHED')) {
        flush_rewrite_rules(false);
        update_option('K18_VI_VN_REWRITE_FLUSHED', 1);
    }
});

/**
 * Query vars
 */
add_filter('query_vars', function ($vars) {
    $vars[] = 'is_vi_vn';
    $vars[] = 'vi_vn_type';
    $vars[] = 'vi_vn_path';
    return $vars;
});

/**
 * Tắt redirect canonical mặc định với URL /vi-vn
 */
add_filter('redirect_canonical', function ($redirect_url) {
    if (get_query_var('is_vi_vn')) {
        return false;
    }
    return $redirect_url;
});

/**
 * Parse request cho các URL /.../vi-vn/
 * Hỗ trợ:
 * - home
 * - page
 * - post
 * - category
 */
add_action('parse_request', function ($wp) {
    if (empty($wp->query_vars['is_vi_vn'])) {
        return;
    }

    // Trường hợp home /vi-vn/
    if (!empty($wp->query_vars['vi_vn_type']) && $wp->query_vars['vi_vn_type'] === 'home') {
        return;
    }

    $path = isset($wp->query_vars['vi_vn_path']) ? trim($wp->query_vars['vi_vn_path'], '/') : '';
    if ($path === '') {
        return;
    }

    // 1) Tìm page theo path
    $page = get_page_by_path($path, OBJECT, 'page');
    if ($page) {
        $wp->query_vars = array(
            'page_id'  => $page->ID,
            'is_vi_vn' => 1,
        );
        return;
    }

    // 2) Tìm single post theo path hiện có của permalink
    // Duyệt post types public
    $public_post_types = get_post_types(array(
        'public'   => true,
        '_builtin' => false,
    ), 'names');

    // thêm post mặc định
    $post_types = array_merge(array('post'), array_values($public_post_types));

    foreach ($post_types as $pt) {
        $posts = get_posts(array(
            'name'           => basename($path),
            'post_type'      => $pt,
            'post_status'    => 'publish',
            'numberposts'    => 20,
            'suppress_filters' => false,
        ));

        if (!empty($posts)) {
            foreach ($posts as $p) {
                $permalink_path = trim(parse_url(get_permalink($p->ID), PHP_URL_PATH), '/');
                if ($permalink_path === $path) {
                    $wp->query_vars = array(
                        'p'        => $p->ID,
                        'post_type'=> $pt,
                        'is_vi_vn' => 1,
                    );
                    return;
                }
            }
        }
    }

    // 3) Tìm category theo path
    $category_base = get_option('category_base');
    $category_base = $category_base ? trim($category_base, '/') : 'category';

    // path ví dụ:
    // category/tin-tuc
    // category/cha/con
    if ($path === $category_base || strpos($path, $category_base . '/') === 0) {
        $cat_rel_path = trim(substr($path, strlen($category_base)), '/');

        if ($cat_rel_path !== '') {
            $segments = explode('/', $cat_rel_path);
            $slug = end($segments);

            $term = get_term_by('slug', $slug, 'category');
            if ($term && !is_wp_error($term)) {
                $term_path = trim(str_replace(home_url('/'), '', get_term_link($term)), '/');
                if (!is_wp_error($term_path)) {
                    $real_term_path = trim(parse_url(get_term_link($term), PHP_URL_PATH), '/');
                    if ($real_term_path === $path) {
                        $wp->query_vars = array(
                            'cat'      => $term->term_id,
                            'is_vi_vn' => 1,
                        );
                        return;
                    }
                }
            }
        }
    }

    // Không match gì -> để WP xử lý 404
});

/**
 * Với home /vi-vn/ -> nạp front page
 */
add_action('pre_get_posts', function ($query) {
    if (is_admin() || !$query->is_main_query()) return;

    if (!get_query_var('is_vi_vn')) return;

    if (get_query_var('vi_vn_type') === 'home' || k18_current_request_path() === 'vi-vn') {
        $front_page_id = get_option('page_on_front');
        if ($front_page_id) {
            $query->set('page_id', $front_page_id);
            $query->is_page = true;
            $query->is_home = false;
            $query->is_singular = true;
            $query->is_front_page = false;
        }
    }
});

/**
 * Helper: lấy URL gốc hiện tại (không có /vi-vn/)
 */
function k18_get_current_original_url() {
    if (is_front_page()) {
        return home_url('/');
    }

    if (is_page() || is_single()) {
        return get_permalink();
    }

    if (is_category()) {
        $term = get_queried_object();
        if ($term && !empty($term->term_id)) {
            return get_term_link($term);
        }
    }

    if (k18_is_vi_vn_request()) {
        $path = k18_current_request_path();

        // /vi-vn/
        if ($path === 'vi-vn') {
            return home_url('/');
        }

        // /xxx/vi-vn/
        if (substr($path, -6) === 'vi-vn') {
            $original_path = preg_replace('#/vi-vn$#', '', $path);
            return home_url('/' . trim($original_path, '/') . '/');
        }
    }

    return '';
}

/**
 * Helper: lấy URL vi-vn tương ứng
 */
function k18_get_current_vi_url() {
    // Nếu đang ở URL vi-vn thì trả về chính nó
    if (k18_is_vi_vn_request()) {
        $path = k18_current_request_path();
        return home_url('/' . $path . '/');
    }

    if (is_front_page()) {
        return home_url('/vi-vn/');
    }

    if (is_page() || is_single()) {
        $url  = get_permalink();
        $path = trim(parse_url($url, PHP_URL_PATH), '/');
        return home_url('/' . $path . '/vi-vn/');
    }

    if (is_category()) {
        $term = get_queried_object();
        if ($term && !empty($term->term_id)) {
            $url  = get_term_link($term);
            if (!is_wp_error($url)) {
                $path = trim(parse_url($url, PHP_URL_PATH), '/');
                return home_url('/' . $path . '/vi-vn/');
            }
        }
    }

    return '';
}

/**
 * Canonical logic
 * Theo yêu cầu của bạn:
 * - URL gốc canonical sang URL /vi-vn/
 * - URL /vi-vn/ canonical về chính nó
 */
function k18_get_canonical_url() {
    if (k18_is_vi_vn_request()) {
        return k18_get_current_vi_url();
    }

    $vi_url = k18_get_current_vi_url();
    if ($vi_url) {
        return $vi_url;
    }

    return '';
}

/**
 * Rank Math canonical
 */
add_filter('rank_math/frontend/canonical', function ($canonical) {
    $custom = k18_get_canonical_url();
    if ($custom) {
        return $custom;
    }
    return $canonical;
});

/**
 * Yoast canonical fallback nếu site dùng Yoast
 */
add_filter('wpseo_canonical', function ($canonical) {
    $custom = k18_get_canonical_url();
    if ($custom) {
        return $custom;
    }
    return $canonical;
});

/**
 * In hreflang + canonical fallback
 */
add_action('wp_head', function () {
    // Chỉ áp dụng cho home, page, single post, category archive, hoặc chính URL vi-vn
    if (!(is_front_page() || is_page() || is_single() || is_category() || k18_is_vi_vn_request())) {
        return;
    }

    $original_url = k18_get_current_original_url();
    $vi_url       = k18_get_current_vi_url();
    $canonical    = k18_get_canonical_url();

    if ($vi_url) {
        echo '<link rel="alternate" hreflang="vi" href="' . esc_url($vi_url) . '">' . "\n";
        echo '<link rel="alternate" hreflang="vi-vn" href="' . esc_url($vi_url) . '">' . "\n";
        echo '<link rel="alternate" hreflang="x-default" href="' . esc_url($vi_url) . '">' . "\n";
    }

    // Có thể thêm alternate cho URL gốc nếu muốn cặp 2 chiều rõ hơn
    if ($original_url) {
        echo '<link rel="alternate" hreflang="x-original" href="' . esc_url($original_url) . '">' . "\n";
    }

    // Fallback canonical nếu SEO plugin không in
    if ($canonical) {
        echo '<link rel="canonical" href="' . esc_url($canonical) . '" />' . "\n";
    }
}, 1);

