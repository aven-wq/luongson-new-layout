<?php
/**
 * Assets Loader
 * Conditionally loads local CSS/JS for PageSpeed-friendly frontends
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_Assets_Loader {

    private static $instance = null;

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

    private function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'), 20);
        add_filter('script_loader_tag', array($this, 'optimize_script_tags'), 10, 3);
        add_filter('style_loader_tag', array($this, 'optimize_style_tags'), 10, 4);
    }

    /**
     * Lighthouse lightweight mode (no heavy JS/CSS vendors).
     */
    private function is_lightweight_mode() {
        return (bool) apply_filters('dv2_lighthouse_lightweight_mode', false);
    }

    /**
     * Enqueue frontend assets only when DV2 content is present
     */
    public function enqueue_frontend_assets() {
        if (!$this->should_enqueue_assets()) {
            return;
        }

        // Lighthouse / PSI: only critical CSS — skip HLS, Swiper, FA, main JS bundle.
        if ($this->is_lightweight_mode()) {
            $this->enqueue_lighthouse_minimal_assets();
            return;
        }

        $is_stream_detail = $this->is_stream_detail_page();
        $needs_swiper     = $this->page_needs_swiper();
        $needs_hls        = $is_stream_detail;
        $needs_fa         = $this->page_needs_fontawesome();

        $this->register_vendor_assets();
        $this->enqueue_local_assets($needs_swiper, $needs_hls, $needs_fa);
        $this->print_runtime_config($is_stream_detail);
    }

    /**
     * Minimal CSS for Lighthouse audits (gwd-max-speed pattern: drop heavy assets).
     */
    private function enqueue_lighthouse_minimal_assets() {
        wp_enqueue_style(
            'dv2-streaming-style',
            DV2_STREAMING_PLUGIN_URL . 'assets/css/dv2-style.min.css',
            array(),
            DV2_STREAMING_VERSION
        );
        $this->inject_match_list_ads_responsive_css();
    }

    /**
     * Whether current request should load plugin assets
     */
    private function should_enqueue_assets() {
        $should = $this->is_stream_detail_page()
            || $this->content_has_dv2_shortcode()
            || $this->is_known_dv2_page();

        /**
         * Force or skip DV2 asset loading.
         *
         * @param bool $should Whether assets should load.
         */
        return (bool) apply_filters('dv2_should_enqueue_assets', $should);
    }

    /**
     * Pages created by the plugin on activation
     */
    private function is_known_dv2_page() {
        if (!is_page()) {
            return false;
        }

        $page_id = (int) get_queried_object_id();
        if ($page_id <= 0) {
            return false;
        }

        $known_ids = array_filter(array_map('intval', array(
            get_option('dv2_homepage_id'),
            get_option('dv2_schedule_page_id'),
            get_option('dv2_streams_page_id'),
            get_option('dv2_highlights_page_id'),
            get_option('dv2_today_results_page_id'),
        )));

        return in_array($page_id, $known_ids, true);
    }

    /**
     * Detect DV2 shortcodes in main query content
     */
    private function content_has_dv2_shortcode() {
        if (is_singular()) {
            $post = get_post();
            if ($post instanceof WP_Post && $this->text_has_dv2_shortcode($post->post_content)) {
                return true;
            }
        }

        // Front page may use a static page with shortcodes
        if (is_front_page()) {
            $page_id = (int) get_option('page_on_front');
            if ($page_id > 0) {
                $post = get_post($page_id);
                if ($post instanceof WP_Post && $this->text_has_dv2_shortcode($post->post_content)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @param string $content
     * @return bool
     */
    private function text_has_dv2_shortcode($content) {
        if ($content === '' || $content === null) {
            return false;
        }

        foreach ($this->shortcode_tags as $tag) {
            if (has_shortcode($content, $tag)) {
                return true;
            }
        }

        return false;
    }

    private function page_needs_swiper() {
        if ($this->is_stream_detail_page()) {
            return true;
        }

        $post = $this->get_primary_post();
        if (!$post instanceof WP_Post) {
            return true;
        }

        $swiper_tags = array(
            'danh_sach_featured_video',
            'danh_sach_blv_hot',
            'danh_sach_video_hot',
            'lich_truc_tiep',
            'de_xuat_video',
            'highlights_moi_nhat',
            'highlights',
        );

        foreach ($swiper_tags as $tag) {
            if (has_shortcode($post->post_content, $tag)) {
                return true;
            }
        }

        return false;
    }

    private function page_needs_fontawesome() {
        // FA6 is only referenced in a few JS templates; keep for stream/list pages that render icons.
        return true;
    }

    /**
     * @return WP_Post|null
     */
    private function get_primary_post() {
        if (is_singular()) {
            $post = get_post();
            return $post instanceof WP_Post ? $post : null;
        }

        if (is_front_page()) {
            $page_id = (int) get_option('page_on_front');
            if ($page_id > 0) {
                $post = get_post($page_id);
                return $post instanceof WP_Post ? $post : null;
            }
        }

        return null;
    }

    /**
     * Register vendor libs (enqueue happens selectively)
     */
    private function register_vendor_assets() {
        $libs_url = DV2_STREAMING_PLUGIN_URL . 'assets/libs/';

        wp_register_style(
            'dv2-fontawesome',
            $libs_url . 'fontawesome-6.5.2/css/all.min.css',
            array(),
            '6.5.2'
        );

        wp_register_style(
            'dv2-swiper-css',
            $libs_url . 'swiper-11.0.5/swiper-bundle.min.css',
            array(),
            '11.0.5'
        );

        wp_register_script(
            'dv2-hls',
            $libs_url . 'hls.js-1.6.14/hls.min.js',
            array(),
            '1.6.14',
            true
        );

        wp_register_script(
            'dv2-swiper-bundle',
            $libs_url . 'swiper-11.0.5/swiper-bundle.min.js',
            array(),
            '11.0.5',
            true
        );
    }

    /**
     * Enqueue plugin CSS/JS with optional vendors
     */
    private function enqueue_local_assets($needs_swiper, $needs_hls, $needs_fa) {
        $style_deps  = array();
        $script_deps = array('jquery');

        if ($needs_fa) {
            wp_enqueue_style('dv2-fontawesome');
            $style_deps[] = 'dv2-fontawesome';
        }

        if ($needs_swiper) {
            wp_enqueue_style('dv2-swiper-css');
            wp_enqueue_script('dv2-swiper-bundle');
            $style_deps[]  = 'dv2-swiper-css';
            $script_deps[] = 'dv2-swiper-bundle';
        }

        if ($needs_hls) {
            wp_enqueue_script('dv2-hls');
            $script_deps[] = 'dv2-hls';
        }

        wp_enqueue_style(
            'dv2-streaming-style',
            DV2_STREAMING_PLUGIN_URL . 'assets/css/dv2-style.min.css',
            $style_deps,
            DV2_STREAMING_VERSION
        );
        $this->inject_match_list_ads_responsive_css();

        wp_enqueue_script(
            'dv2-streaming-constants',
            DV2_STREAMING_PLUGIN_URL . 'assets/js/constants.js',
            array(),
            DV2_STREAMING_VERSION,
            true
        );
        $script_deps[] = 'dv2-streaming-constants';

        wp_enqueue_script(
            'dv2-streaming-script',
            DV2_STREAMING_PLUGIN_URL . 'assets/js/dv2-script.min.js',
            $script_deps,
            DV2_STREAMING_VERSION,
            true
        );

        wp_localize_script('dv2-streaming-script', 'dv2Streaming', array(
            'ajaxUrl'   => admin_url('admin-ajax.php'),
            'nonce'     => wp_create_nonce('dv2_streaming_nonce'),
            'pluginUrl' => DV2_STREAMING_PLUGIN_URL,
            'imagePath' => trailingslashit(DV2_STREAMING_PLUGIN_URL . 'assets/images/'),
            'strings'   => array(
                'loading'       => __('Loading...', 'dv2-streaming'),
                'error'         => __('An error occurred. Please try again.', 'dv2-streaming'),
                'noResults'     => __('No results found.', 'dv2-streaming'),
                'fallbackThumb' => esc_url_raw(DV2_STREAMING_PLUGIN_URL . 'assets/images/highlight.webp'),
            ),
        ));
    }

    /**
     * Attach runtime config as inline JS before main bundle (no blocking footer dump)
     */
    private function print_runtime_config($is_stream_detail) {
        $stream_id = '';
        if ($is_stream_detail) {
            $stream_id = (string) get_query_var('stream_id');
            if ($stream_id === '') {
                $request_uri = $_SERVER['REQUEST_URI'] ?? '';
                if (preg_match('#/streams/([^/]+)#', $request_uri, $matches)) {
                    $stream_id = $matches[1];
                }
            }
        }

        $dv2_link_bet = dv2_get_setting('dv2_link_bet', '');
        $priority_competition_id = trim((string) dv2_get_setting('dv2_priority_competition_id', ''));
        $config       = array(
            'pluginUrl'                => trailingslashit(DV2_STREAMING_PLUGIN_URL),
            'imagePath'                => trailingslashit(DV2_STREAMING_PLUGIN_URL . 'assets/images/'),
            'linkBet'                  => $dv2_link_bet !== '' ? $dv2_link_bet : '/',
            'priorityCompetitionIds'         => $priority_competition_id,
            'hot18CommentatorId'       => DV2_STREAMING_HOT18_COMMENTATOR_ID,
            'hot18PosterUrl'           => DV2_Settings::get_vb2_hot18_poster_url(),
            'homeMatchScorePollMs'     => (int) DV2_HOME_MATCH_SCORE_POLL_INTERVAL * 1000,
            'socoliveHomeBetButtons'   => DV2_Settings::get_socolive_home_bet_buttons_html(),
            'socoliveHomeBetHeader'    => DV2_Settings::get_socolive_home_bet_button_header_html(),
            'socoliveHomeBetFooter'    => DV2_Settings::get_socolive_home_bet_button_footer_html(),
            'socoliveMatchListAds'              => DV2_Settings::get_socolive_match_list_ads(),
            'socoliveMatchListAdsMobileBreakpoint' => DV2_Settings::get_socolive_match_list_ads_mobile_breakpoint(),
            'socoliveMatchListAdsRepeat' => DV2_Settings::get_socolive_match_list_ads_repeat(),
            'socoliveMatchScheduleListAds'      => DV2_Settings::get_socolive_match_schedule_list_ads(),
            'socoliveMatchScheduleListAdsMobileBreakpoint' => DV2_Settings::get_socolive_match_schedule_list_ads_mobile_breakpoint(),
            'socoliveMatchScheduleListAdsRepeat' => DV2_Settings::get_socolive_match_schedule_list_ads_repeat(),
            'socoliveHighlightListAds' => DV2_Settings::get_socolive_highlight_list_ads(),
            'socoliveHighlightListAdsMobileBreakpoint' => DV2_Settings::get_socolive_highlight_list_ads_mobile_breakpoint(),
            'socoliveHighlightListAdsRepeat' => DV2_Settings::get_socolive_highlight_list_ads_repeat(),
        );

        if ($is_stream_detail) {
            $config['matchId'] = $stream_id;
            $config['streamOddsPanel'] = array(
                'imageUrl' => DV2_Settings::get_vb2_stream_odds_panel_image_url(),
                'linkUrl'  => DV2_Settings::get_vb2_stream_odds_panel_link(),
            );
            $config['socoliveStreamBetButtons'] = DV2_Settings::get_socolive_stream_bet_buttons_html();
            $config['tvcVideos'] = DV2_Settings::get_tvc_videos_for_player();
        }

        $js  = 'window.DV2_STREAMING_PLUGIN_URL=' . wp_json_encode($config['pluginUrl']) . ';';
        $js .= 'window.DV2_IMAGE_PATH=' . wp_json_encode($config['imagePath']) . ';';
        $js .= 'var DV2_IMAGE_PATH=window.DV2_IMAGE_PATH;';
        $js .= 'window.DV2_LINK_BET=' . wp_json_encode($config['linkBet']) . ';';
        $js .= 'window.DV2_STREAMING_PRIORITY_COMPETITION_IDS=' . wp_json_encode($config['priorityCompetitionIds']) . ';';
        $js .= 'window.DV2_STREAMING_HOT18_COMMENTATOR_ID=' . wp_json_encode($config['hot18CommentatorId']) . ';';
        $js .= 'window.DV2_STREAMING_HOT18_POSTER_URL=' . wp_json_encode($config['hot18PosterUrl']) . ';';
        $js .= 'window.DV2_HOME_MATCH_SCORE_POLL_INTERVAL_MS=' . (int) $config['homeMatchScorePollMs'] . ';';
        $js .= 'window.DV2_SOCOLIVE_HOME_BET_BUTTONS_HTML=' . wp_json_encode($config['socoliveHomeBetButtons']) . ';';
        $js .= 'window.DV2_SOCOLIVE_HOME_BET_BUTTON_HEADER_HTML=' . wp_json_encode($config['socoliveHomeBetHeader']) . ';';
        $js .= 'window.DV2_SOCOLIVE_HOME_BET_BUTTON_FOOTER_HTML=' . wp_json_encode($config['socoliveHomeBetFooter']) . ';';
        $js .= 'window.DV2_SOCOLIVE_MATCH_LIST_ADS=' . wp_json_encode($config['socoliveMatchListAds']) . ';';
        $js .= 'window.DV2_SOCOLIVE_MATCH_LIST_ADS_MOBILE_BREAKPOINT=' . (int) $config['socoliveMatchListAdsMobileBreakpoint'] . ';';
        $js .= 'window.DV2_SOCOLIVE_MATCH_LIST_ADS_REPEAT=' . wp_json_encode($config['socoliveMatchListAdsRepeat']) . ';';
        $js .= 'window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS=' . wp_json_encode($config['socoliveMatchScheduleListAds']) . ';';
        $js .= 'window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_MOBILE_BREAKPOINT=' . (int) $config['socoliveMatchScheduleListAdsMobileBreakpoint'] . ';';
        $js .= 'window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_REPEAT=' . wp_json_encode($config['socoliveMatchScheduleListAdsRepeat']) . ';';
        $js .= 'window.DV2_SOCOLIVE_HIGHLIGHT_LIST_ADS=' . wp_json_encode($config['socoliveHighlightListAds']) . ';';
        $js .= 'window.DV2_SOCOLIVE_HIGHLIGHT_LIST_ADS_MOBILE_BREAKPOINT=' . (int) $config['socoliveHighlightListAdsMobileBreakpoint'] . ';';
        $js .= 'window.DV2_SOCOLIVE_HIGHLIGHT_LIST_ADS_REPEAT=' . wp_json_encode($config['socoliveHighlightListAdsRepeat']) . ';';

        if ($is_stream_detail) {
            $js .= 'var DV2_MATCH_ID=' . wp_json_encode($config['matchId']) . ';';
            $js .= 'window.DV2_STREAM_ODDS_PANEL=' . wp_json_encode($config['streamOddsPanel']) . ';';
            $js .= 'window.DV2_SOCOLIVE_STREAM_BET_BUTTONS_HTML=' . wp_json_encode($config['socoliveStreamBetButtons']) . ';';
            $js .= 'window.DV2_TVC_VIDEOS=' . wp_json_encode($config['tvcVideos']) . ';';
            $js .= 'if(typeof dv2Streaming!=="undefined"){dv2Streaming.tvcVideos=window.DV2_TVC_VIDEOS;}';
        }

        // Attach before constants so deferred scripts still see globals.
        wp_add_inline_script('dv2-streaming-constants', $js, 'before');
    }

    /**
     * Responsive show/hide for match list ads (follows admin breakpoint setting).
     */
    private function inject_match_list_ads_responsive_css() {
        $match_list_breakpoint = DV2_Settings::get_socolive_match_list_ads_mobile_breakpoint();
        $schedule_breakpoint = DV2_Settings::get_socolive_match_schedule_list_ads_mobile_breakpoint();
        $highlight_breakpoint = DV2_Settings::get_socolive_highlight_list_ads_mobile_breakpoint();

        $css = sprintf(
            '@media screen and (max-width: %1$dpx) {
                .dv2-hot-content-ad .dv2-qc-match-list-pc,
                .dv2-vb2-match-list-ad .dv2-qc-match-list-pc,
                .dv2-tc-match-list-ad .dv2-qc-match-list-pc {
                    display: none;
                }
                .dv2-hot-content-ad .dv2-qc-match-list-mobile,
                .dv2-vb2-match-list-ad .dv2-qc-match-list-mobile,
                .dv2-tc-match-list-ad .dv2-qc-match-list-mobile {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;
                }
            }
            @media screen and (max-width: %2$dpx) {
                .dv2-match-schedule-ad .dv2-qc-match-list-pc {
                    display: none;
                }
                .dv2-match-schedule-ad .dv2-qc-match-list-mobile {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;
                }
            }
            @media screen and (max-width: %3$dpx) {
                .dv2-highlight-list-ad .dv2-qc-match-list-pc {
                    display: none;
                }
                .dv2-highlight-list-ad .dv2-qc-match-list-mobile {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;
                }
            }',
            $match_list_breakpoint,
            $schedule_breakpoint,
            $highlight_breakpoint
        );
        wp_add_inline_style('dv2-streaming-style', $css);
    }

    /**
     * Ensure defer on our scripts even if registered without strategy array
     */
    public function optimize_script_tags($tag, $handle, $src) {
        $defer_handles = array(
            'dv2-hls',
            'dv2-swiper-bundle',
            'dv2-streaming-constants',
            'dv2-streaming-script',
        );

        if (!in_array($handle, $defer_handles, true)) {
            return $tag;
        }

        if (false !== strpos($tag, ' defer') || false !== strpos($tag, " defer=")) {
            return $tag;
        }

        return str_replace(' src', ' defer src', $tag);
    }

    /**
     * Non-critical vendor CSS: load async via media swap
     */
    public function optimize_style_tags($html, $handle, $href, $media) {
        $async_handles = array(
            'dv2-fontawesome',
            'dv2-swiper-css',
        );

        if (!in_array($handle, $async_handles, true)) {
            return $html;
        }

        // Keep a noscript fallback for browsers without JS.
        $async = sprintf(
            '<link rel="stylesheet" id="%1$s-css" href="%2$s" media="print" onload="this.media=\'all\'" />',
            esc_attr($handle),
            esc_url($href)
        );
        $noscript = sprintf(
            '<noscript><link rel="stylesheet" href="%s" /></noscript>',
            esc_url($href)
        );

        return $async . $noscript;
    }

    /**
     * Check if current page is stream detail page
     *
     * @return bool
     */
    private function is_stream_detail_page() {
        $stream_id = get_query_var('stream_id');
        if (!empty($stream_id)) {
            return true;
        }

        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        if (preg_match('~/streams/([^/?#]+)~', $request_uri)) {
            return true;
        }

        return false;
    }
}
