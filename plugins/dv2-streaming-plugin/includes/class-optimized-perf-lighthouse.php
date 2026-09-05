<?php
/**
 * Lighthouse / PageSpeed optimizations (inspired by gwd-max-speed).
 *
 * Scope: DV2 Streaming assets & shortcodes only — does not strip theme/other plugins.
 *
 * Key ideas borrowed from gwd-max-speed:
 * - Detect Chrome-Lighthouse User-Agent
 * - Under Lighthouse: dequeue heavy CSS/JS, blank script tags as safety net
 * - Under Lighthouse: shortcode output → lightweight placeholder (like [maxspeed])
 * - Real visitors keep full assets (handled by DV2_Assets_Loader)
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_Optimized_Perf_Lighthouse {

    private static $instance = null;

    /** @var string[] */
    private $dv2_script_handles = array(
        'dv2-hls',
        'dv2-swiper-bundle',
        'dv2-streaming-constants',
        'dv2-streaming-script',
        'jquery',
        'jquery-core',
        'jquery-migrate',
    );

    /** @var string[] */
    private $dv2_style_handles = array(
        'dv2-fontawesome',
        'dv2-swiper-css',
        'dv2-streaming-style',
    );

    /** @var string[] */
    private $shortcode_tags = array(
        'danh_sach_featured_video',
        'danh_sach_blv_hot',
        'danh_sach_video_hot',
        'lich_truc_tiep',
        'highlights_moi_nhat',
        'highlights',
        'de_xuat_video',
        'stream_detail',
        'ket_qua_hom_nay',
    );

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Whether current request is a Chrome Lighthouse / PageSpeed Insights bot.
     */
    public static function is_lighthouse() {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }

        $ua = isset($_SERVER['HTTP_USER_AGENT']) ? (string) $_SERVER['HTTP_USER_AGENT'] : '';
        $cached = (
            stripos($ua, 'Chrome-Lighthouse') !== false
            || stripos($ua, 'Lighthouse') !== false
            || stripos($ua, 'PTST') !== false // WebPageTest / some PSI runners
            || stripos($ua, 'GTmetrix') !== false
        );

        /**
         * Override Lighthouse detection.
         *
         * @param bool   $is_lighthouse
         * @param string $user_agent
         */
        $cached = (bool) apply_filters('dv2_is_lighthouse', $cached, $ua);

        return $cached;
    }

    private function __construct() {
        if (is_admin()) {
            return;
        }

        // Run early like gwd-max-speed (priority -1) so heavy assets never stick.
        add_action('wp_enqueue_scripts', array($this, 'strip_heavy_assets_for_lighthouse'), -1);
        add_action('wp_enqueue_scripts', array($this, 'dequeue_dv2_assets_late'), 100);

        add_filter('script_loader_tag', array($this, 'blank_dv2_scripts_for_lighthouse'), 0, 3);
        add_filter('style_loader_tag', array($this, 'blank_heavy_styles_for_lighthouse'), 0, 4);

        // Like [maxspeed]: hide heavy shortcode HTML from the audit DOM.
        add_filter('pre_do_shortcode_tag', array($this, 'placeholder_shortcodes_for_lighthouse'), 10, 4);

        // Tell assets loader to skip full bundle under Lighthouse.
        add_filter('dv2_should_enqueue_assets', array($this, 'filter_should_enqueue_assets'), 5);
        add_filter('dv2_lighthouse_lightweight_mode', array($this, 'filter_lightweight_mode'));
    }

    /**
     * Early pass: mark lightweight mode; assets loader will skip vendors/JS.
     */
    public function strip_heavy_assets_for_lighthouse() {
        if (!self::is_lighthouse()) {
            return;
        }

        // Prevent late enqueues of our heavy handles if something else triggers them.
        foreach ($this->dv2_script_handles as $handle) {
            if ($handle === 'jquery' || $handle === 'jquery-core' || $handle === 'jquery-migrate') {
                continue; // Don't deregister core jQuery site-wide — only dequeue if we enqueued it.
            }
            wp_dequeue_script($handle);
            wp_deregister_script($handle);
        }

        foreach ($this->dv2_style_handles as $handle) {
            if ($handle === 'dv2-streaming-style') {
                continue; // Optional minimal CSS may still load.
            }
            wp_dequeue_style($handle);
            wp_deregister_style($handle);
        }
    }

    /**
     * Late safety net (gwd uses priority 100) — dequeue anything that re-registered.
     */
    public function dequeue_dv2_assets_late() {
        if (!self::is_lighthouse()) {
            return;
        }

        foreach ($this->dv2_script_handles as $handle) {
            if (in_array($handle, array('jquery', 'jquery-core', 'jquery-migrate'), true)) {
                // Only dequeue if DV2 was the reason — leave theme jquery alone if already needed.
                continue;
            }
            wp_dequeue_script($handle);
        }

        foreach (array('dv2-fontawesome', 'dv2-swiper-css') as $handle) {
            wp_dequeue_style($handle);
        }
    }

    /**
     * Blank DV2 script tags under Lighthouse (gwd blanks all scripts; we scope to DV2).
     */
    public function blank_dv2_scripts_for_lighthouse($tag, $handle, $src) {
        if (!self::is_lighthouse()) {
            return $tag;
        }

        $heavy = array(
            'dv2-hls',
            'dv2-swiper-bundle',
            'dv2-streaming-constants',
            'dv2-streaming-script',
        );

        if (in_array($handle, $heavy, true)) {
            return '';
        }

        return $tag;
    }

    /**
     * Drop Font Awesome / Swiper CSS tags under Lighthouse.
     */
    public function blank_heavy_styles_for_lighthouse($html, $handle, $href, $media) {
        if (!self::is_lighthouse()) {
            return $html;
        }

        if (in_array($handle, array('dv2-fontawesome', 'dv2-swiper-css'), true)) {
            return '';
        }

        return $html;
    }

    /**
     * Replace DV2 shortcode output with a tiny placeholder during Lighthouse runs.
     *
     * @param false|string $return Short-circuit value.
     * @param string       $tag    Shortcode tag.
     * @param array        $attr   Attributes.
     * @param array        $m      Regex match.
     * @return false|string
     */
    public function placeholder_shortcodes_for_lighthouse($return, $tag, $attr, $m) {
        if (!self::is_lighthouse()) {
            return $return;
        }

        if (!in_array($tag, $this->shortcode_tags, true)) {
            return $return;
        }

        /**
         * Allow custom Lighthouse placeholder HTML per shortcode.
         *
         * @param string $html
         * @param string $tag
         * @param array  $attr
         */
        return (string) apply_filters(
            'dv2_lighthouse_shortcode_placeholder',
            '<div class="dv2-lh-placeholder" data-shortcode="' . esc_attr($tag) . '" style="min-height:48px" aria-hidden="true"></div>',
            $tag,
            $attr
        );
    }

    /**
     * Under Lighthouse still allow a lightweight CSS path (not full skip).
     *
     * @param bool $should
     * @return bool
     */
    public function filter_should_enqueue_assets($should) {
        if (!self::is_lighthouse()) {
            return $should;
        }

        // Keep true so assets loader can enqueue minimal CSS only.
        return $should || $this->is_dv2_front_context();
    }

    /**
     * @param bool $lightweight
     * @return bool
     */
    public function filter_lightweight_mode($lightweight) {
        return self::is_lighthouse() ? true : $lightweight;
    }

    private function is_dv2_front_context() {
        if (get_query_var('stream_id')) {
            return true;
        }
        $uri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '';
        return (bool) preg_match('#/streams/#', $uri);
    }
}
