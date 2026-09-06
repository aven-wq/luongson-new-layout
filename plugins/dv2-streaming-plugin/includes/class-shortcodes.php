<?php
/**
 * Shortcodes Handler
 * Registers streaming shortcodes and loads layout templates
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_Shortcodes {

    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('init', array($this, 'register_shortcodes'));
    }

    /**
     * Register all shortcodes
     */
    public function register_shortcodes() {
        add_shortcode('danh_sach_featured_video', array($this, 'shortcode_home_featured_streams'));
        add_shortcode('danh_sach_blv_hot', array($this, 'shortcode_hot_blv_list'));
        add_shortcode('danh_sach_video_hot', array($this, 'shortcode_hot_live_streams'));
        add_shortcode('lich_truc_tiep', array($this, 'shortcode_live_calander'));
        add_shortcode('highlights_moi_nhat', array($this, 'shortcode_latest_highlights'));
        add_shortcode('highlights', array($this, 'shortcode_highlights'));
        add_shortcode('de_xuat_video', array($this, 'shortcode_suggested_streams'));
        add_shortcode('stream_detail', array($this, 'shortcode_stream_detail'));
        add_shortcode('ket_qua_hom_nay', array($this, 'shortcode_today_results'));
    }

    /**
     * Get all available layouts dynamically from filesystem
     * 
     * @return array Array of available layout names
     */
    private function get_available_layouts() {
        static $layouts = null;

        // Cache the result
        if ($layouts !== null) {
            return $layouts;
        }

        $layouts = array();
        $layouts_dir = DV2_STREAMING_PLUGIN_DIR . 'includes/layouts/';

        // Check if layouts directory exists
        if (is_dir($layouts_dir)) {
            // Scan directory for layout folders
            $dirs = scandir($layouts_dir);
            foreach ($dirs as $dir) {
                // Skip . and .. and non-directories
                if ($dir === '.' || $dir === '..' || !is_dir($layouts_dir . $dir)) {
                    continue;
                }

                // Sanitize and add to layouts
                $sanitized = sanitize_file_name($dir);
                if (!empty($sanitized) && $sanitized === $dir) {
                    $layouts[] = $sanitized;
                }
            }
        }

        // Always ensure socolive exists as default
        if (empty($layouts) || !in_array('socolive', $layouts)) {
            $layouts[] = 'socolive';
        }

        // Sort layouts, with socolive first
        usort($layouts, function($a, $b) {
            if ($a === 'socolive') return -1;
            if ($b === 'socolive') return 1;
            return strcmp($a, $b);
        });

        return $layouts;
    }

    /**
     * Get template file path based on layout
     * Dynamically supports any number of layouts
     *
     * @param string $template_name Template file name (e.g., 'home-featured-streams.block.php')
     * @param string $layout        Layout name (dynamically detected from filesystem)
     * @param string|null $fallback_layout When set, used instead of socolive for invalid layout or missing file (must exist in layouts dir)
     * @return string Full path to template file
     */
    private function get_template_path($template_name, $layout = 'socolive', $fallback_layout = null) {
        $layout = sanitize_file_name($layout);
        $available_layouts = $this->get_available_layouts();

        $fallback = 'socolive';
        if ($fallback_layout !== null) {
            $fb = sanitize_file_name((string) $fallback_layout);
            if (in_array($fb, $available_layouts, true)) {
                $fallback = $fb;
            }
        }

        if (!in_array($layout, $available_layouts, true)) {
            $layout = $fallback;
        }

        $template_path = DV2_STREAMING_PLUGIN_DIR . 'includes/layouts/' . $layout . '/' . $template_name;

        if (!file_exists($template_path) && $layout !== $fallback) {
            $template_path = DV2_STREAMING_PLUGIN_DIR . 'includes/layouts/' . $fallback . '/' . $template_name;
        }

        return $template_path;
    }

    /**
     * Shortcode: [danh_sach_featured_video count="3" layout="socolive" banner_zone_id="2724"]
     * Display featured streams
     * 
     * Available layouts: socolive, vebo, thapcam
     */
    public function shortcode_home_featured_streams($atts) {
        $atts = shortcode_atts(array(
            'count'  => 3,
            'layout' => 'socolive',
            'ads-block-id' => '',
            'banner_zone_id' => '2724',
        ), $atts);

        $atts['banner_zone_id'] = absint($atts['banner_zone_id']) ?: 2724;

        $template_path = $this->get_template_path('home-featured-streams.block.php', $atts['layout']);

        ob_start();
        if (file_exists($template_path)) {
            require $template_path;
        } else {
            echo '<!-- Template not found: ' . esc_html($template_path) . ' -->';
        }

        return ob_get_clean();
    }

    /**
     * Shortcode: [danh_sach_video_hot count="3" layout="socolive"]
     * Hiện danh sách live streams hot
     * 
     * Available layouts: socolive, vebo, thapcam
     */
    public function shortcode_hot_live_streams($atts) {
        $atts = shortcode_atts(array(
            'count'  => 3,
            'layout' => 'socolive',
        ), $atts);

        $template_path = $this->get_template_path('hot-live-streams.block.php', $atts['layout']);

        ob_start();
        if (file_exists($template_path)) {
            require $template_path;
        } else {
            echo '<!-- Template not found: ' . esc_html($template_path) . ' -->';
        }

        return ob_get_clean();
    }

    /**
     * Shortcode: [danh_sach_blv_hot count="10" category="" layout="socolive"]
     * Hiện danh sách BLV hot
     *
     * Available layouts: socolive, vebo, thapcam, luongson-v2
     */
    public function shortcode_hot_blv_list($atts) {
        $atts = shortcode_atts(array(
            'count'    => 10,
            'category' => '',
            'order'    => 'DESC',
            'orderby'  => 'date',
            'layout'   => 'socolive',
        ), $atts);

        $template_path = $this->get_template_path('hot-blv-list.block.php', $atts['layout']);

        ob_start();
        if (file_exists($template_path)) {
            require $template_path;
        } else {
            echo '<!-- Template not found: ' . esc_html($template_path) . ' -->';
        }

        return ob_get_clean();
    }

    /**
     * Shortcode: [lich_truc_tiep count="3" layout="socolive"]
     * Hiện lịch trực tiếp
     * 
     * Available layouts: socolive, vebo, thapcam
     */
    public function shortcode_live_calander($atts) {
        $atts = shortcode_atts(array(
            'count'  => 3,
            'layout' => 'socolive',
        ), $atts);

        $template_path = $this->get_template_path('stream-calander.block.php', $atts['layout']);

        ob_start();
        if (file_exists($template_path)) {
            require $template_path;
        } else {
            echo '<!-- Template not found: ' . esc_html($template_path) . ' -->';
        }

        return ob_get_clean();
    }

    /**
     * Shortcode: [highlights_moi_nhat count="3" layout="socolive"]
     * Hiện highlights mới nhất
     * 
     * Available layouts: socolive, vebo, thapcam
     */
    public function shortcode_latest_highlights($atts) {
        $atts = shortcode_atts(array(
            'count'  => 3,
            'layout' => 'socolive',
        ), $atts);

        $template_path = $this->get_template_path('latest-highlights.block.php', $atts['layout']);

        ob_start();
        if (file_exists($template_path)) {
            require $template_path;
        } else {
            echo '<!-- Template not found: ' . esc_html($template_path) . ' -->';
        }

        return ob_get_clean();
    }

    /**
     * Shortcode: [highlights layout="cakhia-v2" title="" size="12"]
     * CSS/JS highlights nạp toàn cục trong DV2_Assets_Loader::enqueue_local_assets().
     * Layout khác: hook dv2_highlights_enqueue_assets để bổ sung asset nếu cần.
     *
     * size: số item mỗi lần tải (API page size), mặc định 12
     */
    public function shortcode_highlights($atts) {
        $atts = shortcode_atts(
            array(
                'layout' => 'cakhia-v2',
                'title'  => '',
                'size'   => 12,
            ),
            $atts,
            'highlights'
        );

        $dv2_highlights_title = trim((string) $atts['title']) !== ''
            ? $atts['title']
            : __('HIGHLIGHTS BÓNG ĐÁ MỚI NHẤT', 'dv2-streaming');

        $dv2_highlights_page_size = absint($atts['size']);
        if ($dv2_highlights_page_size < 1) {
            $dv2_highlights_page_size = 12;
        } elseif ($dv2_highlights_page_size > 100) {
            $dv2_highlights_page_size = 100;
        }

        $template_path = $this->get_template_path('highlights.block.php', $atts['layout'], 'cakhia-v2');
        $layout = basename(dirname($template_path));

        do_action('dv2_highlights_enqueue_assets', $layout);

        ob_start();
        if (file_exists($template_path)) {
            require $template_path;
        } else {
            echo '<!-- Template not found: ' . esc_html($template_path) . ' -->';
        }

        return ob_get_clean();
    }

    /**
     * Shortcode: [de_xuat_video count="3" layout="socolive" view_more="0"]
     * Hiện danh sách video được đề xuất
     *
     * view_more: 0 (mặc định) — tối đa 12 trận, không nút Xem thêm; 1 — phân trang + nút Xem thêm
     *
     * Available layouts: socolive, vebo, thapcam, cakhia-v2
     */
    public function shortcode_suggested_streams($atts) {
        $atts = shortcode_atts(array(
            'count'     => 3,
            'layout'    => 'socolive',
            'view_more' => '0',
        ), $atts, 'de_xuat_video');

        $dv2_suggested_view_more = (int) $atts['view_more'] === 1 ? 1 : 0;

        $template_path = $this->get_template_path('suggested-streams.block.php', $atts['layout']);

        ob_start();
        if (file_exists($template_path)) {
            require $template_path;
        } else {
            echo '<!-- Template not found: ' . esc_html($template_path) . ' -->';
        }

        return ob_get_clean();
    }

    /**
     * Shortcode: [stream_detail layout="socolive" shortcode_stream="dv2_livechat" banner_zone_id="2724"]
     * Display stream detail page - reads ID from URL /streams/{id}
     * 
     * Available layouts: socolive, vebo, thapcam
     */
    public function shortcode_stream_detail($atts) {
        global $wp_query;

        $atts = shortcode_atts(array(
            'layout' => 'socolive',
            'ads-block-id' => '',
            'block-id' => '',
            'shortcode_stream' => 'dv2_livechat',
            'banner_zone_id' => '2724',
        ), $atts, 'stream_detail');

        $atts['banner_zone_id'] = absint($atts['banner_zone_id']) ?: 2724;

        $stream_chat_tag = sanitize_key((string) $atts['shortcode_stream']);
        $atts['shortcode_stream'] = $stream_chat_tag !== '' ? $stream_chat_tag : 'dv2_livechat';

        // Get stream ID from query var
        $stream_id = get_query_var('stream_id');

        // If stream not found, show error
        if (empty($stream_id)) {
            return '<div class="dv2-stream-not-found"><p>' . esc_html__('Stream not found.', 'dv2-streaming') . '</p></div>';
        }

        $template_path = $this->get_template_path('stream-detail.block.php', $atts['layout']);

        // Render stream detail
        ob_start();
        if (file_exists($template_path)) {
            require $template_path;
        } else {
            echo '<!-- Template not found: ' . esc_html($template_path) . ' -->';
        }

        return ob_get_clean();
    }

    /**
     * Shortcode: [ket_qua_hom_nay count="10" layout="socolive" arg=""]
     * Hiện kết quả hôm nay
     * 
     * Available layouts: socolive, vebo, thapcam, vebo-v2
     * arg: "lich-thi-dau-bong-da" for schedule page, empty for results page
     */
    public function shortcode_today_results($atts)
    {
        $atts = shortcode_atts(array(
            'count'  => 10,
            'layout' => 'cakhia',
            'arg'    => '',
        ), $atts);

        $template_path = $this->get_template_path('today-results.block.php', $atts['layout']);

        ob_start();
        if (file_exists($template_path)) {
            require $template_path;
        } else {
            echo '<!-- Template not found: ' . esc_html($template_path) . ' -->';
        }

        return ob_get_clean();
    }
}
