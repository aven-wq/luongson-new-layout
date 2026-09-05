<?php
/**
 * Settings Page Handler
 * Manages plugin settings and configuration
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_Settings {
    
    private static $instance = null;
    
    // Settings option name
    private $option_group = 'dv2_streaming_settings';
    private $option_name = 'dv2_streaming_options';
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_settings_assets'));
        add_action('wp_ajax_dv2_tvc_s3_upload', array($this, 'ajax_tvc_s3_upload'));
        add_action('wp_ajax_dv2_tvc_s3_register', array($this, 'ajax_tvc_s3_register'));
    }
    
    /**
     * Add settings page to admin menu
     */
    public function add_settings_page() {
        // Main menu item
        add_menu_page(
            __('DV2 Streaming', 'dv2-streaming'),
            __('DV2 Streaming', 'dv2-streaming'),
            'manage_options',
            'dv2-streaming',
            array($this, 'render_settings_page'),
            'dashicons-video-alt3',
            100
        );
        
        // Settings submenu (default page)
        add_submenu_page(
            'dv2-streaming',
            __('Settings', 'dv2-streaming'),
            __('Settings', 'dv2-streaming'),
            'manage_options',
            'dv2-streaming',
            array($this, 'render_settings_page')
        );

        add_submenu_page(
            'dv2-streaming',
            __('Ads Match List ', 'dv2-streaming'),
            __('Ads Match List', 'dv2-streaming'),
            'manage_options',
            'dv2-streaming-ads-match-list',
            array($this, 'render_ads_match_list_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        // Register settings
        register_setting(
            $this->option_group,
            $this->option_name,
            array($this, 'sanitize_settings')
        );
        
        // Add settings section
        add_settings_section(
            'dv2_general_settings',
            __('Cài đặt chung', 'dv2-streaming'),
            array($this, 'render_section_general'),
            'dv2-streaming'
        );
        
         add_settings_field(
            'dv2_link_bet',
            __('Link đặt cược', 'dv2-streaming'),
            array($this, 'render_field_dv2_link_bet'),
            'dv2-streaming',
            'dv2_general_settings'
        );

        add_settings_field(
            'dv2_priority_competition_id',
            __('ID giải ưu tiên', 'dv2-streaming'),
            array($this, 'render_field_dv2_priority_competition_id'),
            'dv2-streaming',
            'dv2_general_settings'
        );

        add_settings_section(
            'dv2_vb2_stream_chrome_settings',
            __('Vebo V2 – Stream Chrome', 'dv2-streaming'),
            array($this, 'render_section_vb2_stream_chrome'),
            'dv2-streaming'
        );

        add_settings_field(
            'vb2_stream_chrome_header_ad',
            __('Quảng cáo header cuộn', 'dv2-streaming'),
            array($this, 'render_field_vb2_stream_chrome_header_ad'),
            'dv2-streaming',
            'dv2_vb2_stream_chrome_settings'
        );

        add_settings_field(
            'vb2_stream_chrome_ft_head_ad',
            __('Quảng cáo footer – Head', 'dv2-streaming'),
            array($this, 'render_field_vb2_stream_chrome_ft_head_ad'),
            'dv2-streaming',
            'dv2_vb2_stream_chrome_settings'
        );

        add_settings_field(
            'vb2_stream_chrome_ft_left_ad',
            __('Quảng cáo footer – Trái', 'dv2-streaming'),
            array($this, 'render_field_vb2_stream_chrome_ft_left_ad'),
            'dv2-streaming',
            'dv2_vb2_stream_chrome_settings'
        );

        add_settings_field(
            'vb2_stream_chrome_ft_right_ad',
            __('Quảng cáo footer – Phải', 'dv2-streaming'),
            array($this, 'render_field_vb2_stream_chrome_ft_right_ad'),
            'dv2-streaming',
            'dv2_vb2_stream_chrome_settings'
        );

        add_settings_field(
            'vb2_stream_chrome_right_ad',
            __('Quảng cáo góc phải (fullscreen)', 'dv2-streaming'),
            array($this, 'render_field_vb2_stream_chrome_right_ad'),
            'dv2-streaming',
            'dv2_vb2_stream_chrome_settings'
        );

        add_settings_field(
            'vb2_hot18_poster_id',
            __('Ảnh nền BLV 18+', 'dv2-streaming'),
            array($this, 'render_field_vb2_hot18_poster'),
            'dv2-streaming',
            'dv2_vb2_stream_chrome_settings'
        );

        add_settings_field(
            'vb2_stream_odds_panel_image_id',
            __('Bảng kèo – Ảnh giữa', 'dv2-streaming'),
            array($this, 'render_field_vb2_stream_odds_panel_image'),
            'dv2-streaming',
            'dv2_vb2_stream_chrome_settings'
        );

        add_settings_field(
            'vb2_stream_odds_panel_link',
            __('Bảng kèo – Link ảnh', 'dv2-streaming'),
            array($this, 'render_field_vb2_stream_odds_panel_link'),
            'dv2-streaming',
            'dv2_vb2_stream_chrome_settings'
        );

        add_settings_section(
            'dv2_tvc_settings',
            __('Pre-roll TVC', 'dv2-streaming'),
            array($this, 'render_section_tvc'),
            'dv2-streaming'
        );

        add_settings_field(
            'tvc_upload_api_url',
            __('Upload API URL', 'dv2-streaming'),
            array($this, 'render_field_tvc_upload_api_url'),
            'dv2-streaming',
            'dv2_tvc_settings'
        );

        add_settings_field(
            'tvc_upload_api_token',
            __('Upload API Token', 'dv2-streaming'),
            array($this, 'render_field_tvc_upload_api_token'),
            'dv2-streaming',
            'dv2_tvc_settings'
        );

        add_settings_field(
            'tvc_videos',
            __('Video quảng cáo', 'dv2-streaming'),
            array($this, 'render_field_tvc_videos'),
            'dv2-streaming',
            'dv2_tvc_settings'
        );

        add_settings_section(
            'dv2_socolive_home_settings',
            __('Socolive – Trang chủ', 'dv2-streaming'),
            array($this, 'render_section_socolive_home'),
            'dv2-streaming'
        );

        add_settings_field(
            'socolive_home_bet_button_list',
            __('Socolive home bet button list', 'dv2-streaming'),
            array($this, 'render_field_socolive_home_bet_button_list'),
            'dv2-streaming',
            'dv2_socolive_home_settings'
        );

        add_settings_field(
            'socolive_home_bet_button_header',
            __('Socolive home bet button header', 'dv2-streaming'),
            array($this, 'render_field_socolive_home_bet_button_header'),
            'dv2-streaming',
            'dv2_socolive_home_settings'
        );

        add_settings_field(
            'socolive_home_bet_button_footer',
            __('Socolive home bet button footer', 'dv2-streaming'),
            array($this, 'render_field_socolive_home_bet_button_footer'),
            'dv2-streaming',
            'dv2_socolive_home_settings'
        );

        add_settings_section(
            'dv2_socolive_stream_settings',
            __('Socolive – Trang chi tiết', 'dv2-streaming'),
            array($this, 'render_section_socolive_stream'),
            'dv2-streaming'
        );

        add_settings_field(
            'socolive_stream_bet_button_list',
            __('Socolive stream bet button list', 'dv2-streaming'),
            array($this, 'render_field_socolive_stream_bet_button_list'),
            'dv2-streaming',
            'dv2_socolive_stream_settings'
        );

        add_settings_section(
            'dv2_ads_match_list_settings',
            __('Ads Match List', 'dv2-streaming'),
            array($this, 'render_section_ads_match_list'),
            'dv2-streaming-ads-match-list'
        );

        add_settings_field(
            'socolive_match_list_ads_mobile_breakpoint',
            __('Breakpoint Block ads item match list', 'dv2-streaming'),
            array($this, 'render_field_socolive_match_list_ads_mobile_breakpoint'),
            'dv2-streaming-ads-match-list',
            'dv2_ads_match_list_settings'
        );

        add_settings_field(
            'socolive_match_list_ads_repeat',
            __('Repeat block ads item match list', 'dv2-streaming'),
            array($this, 'render_field_socolive_match_list_ads_repeat'),
            'dv2-streaming-ads-match-list',
            'dv2_ads_match_list_settings'
        );

        add_settings_field(
            'socolive_match_list_ads',
            __('Block ads item match list', 'dv2-streaming'),
            array($this, 'render_field_socolive_match_list_ads'),
            'dv2-streaming-ads-match-list',
            'dv2_ads_match_list_settings'
        );

        add_settings_field(
            'socolive_match_schedule_list_ads_mobile_breakpoint',
            __('Breakpoint Block ads item match schedule list', 'dv2-streaming'),
            array($this, 'render_field_socolive_match_schedule_list_ads_mobile_breakpoint'),
            'dv2-streaming-ads-match-list',
            'dv2_ads_match_list_settings'
        );

        add_settings_field(
            'socolive_match_schedule_list_ads_repeat',
            __('Repeat block ads item match schedule list', 'dv2-streaming'),
            array($this, 'render_field_socolive_match_schedule_list_ads_repeat'),
            'dv2-streaming-ads-match-list',
            'dv2_ads_match_list_settings'
        );

        add_settings_field(
            'socolive_match_schedule_list_ads',
            __('Block ads item match schedule list', 'dv2-streaming'),
            array($this, 'render_field_socolive_match_schedule_list_ads'),
            'dv2-streaming-ads-match-list',
            'dv2_ads_match_list_settings'
        );

        add_settings_field(
            'socolive_highlight_list_ads_mobile_breakpoint',
            __('Breakpoint Block ads item highlight list', 'dv2-streaming'),
            array($this, 'render_field_socolive_highlight_list_ads_mobile_breakpoint'),
            'dv2-streaming-ads-match-list',
            'dv2_ads_match_list_settings'
        );

        add_settings_field(
            'socolive_highlight_list_ads_repeat',
            __('Repeat block ads item highlight list', 'dv2-streaming'),
            array($this, 'render_field_socolive_highlight_list_ads_repeat'),
            'dv2-streaming-ads-match-list',
            'dv2_ads_match_list_settings'
        );

        add_settings_field(
            'socolive_highlight_list_ads',
            __('Block ads item highlight list', 'dv2-streaming'),
            array($this, 'render_field_socolive_highlight_list_ads'),
            'dv2-streaming-ads-match-list',
            'dv2_ads_match_list_settings'
        );

        // Placeholder for future fields (easy to add more later)
        // add_settings_field(
        //     'field_name',
        //     __('Field Label', 'dv2-streaming'),
        //     array($this, 'render_field_name'),
        //     'dv2-streaming',
        //     'dv2_general_settings'
        // );
    }
    
    /**
     * Render general settings section
     */
    public function render_section_general() {
        echo '<p>' . esc_html__('Cấu hình các cài đặt plugin chung bên dưới.', 'dv2-streaming') . '</p>';
    }

    public function render_section_vb2_stream_chrome() {
        echo '<p>' . esc_html__('Cấu hình header/footer/góc phải quảng cáo trên player livestream layout Vebo V2.', 'dv2-streaming') . '</p>';
    }

    public function render_section_tvc() {
        echo '<p>' . esc_html__('Upload video quảng cáo pre-roll trước khi phát livestream. Hệ thống chọn ngẫu nhiên một video mỗi lần vào trang. Không upload video thì TVC sẽ không chạy.', 'dv2-streaming') . '</p>';
        if (DV2_TVC_S3_Uploader::is_configured()) {
            $status = DV2_TVC_S3_Uploader::can_connect()
                ? __('đã cấu hình — video upload lên Storage API qua server', 'dv2-streaming')
                : __('thiếu cURL — video TVC sẽ lưu trên server WordPress', 'dv2-streaming');
            echo '<p class="description">' . esc_html(sprintf(
                /* translators: %s: storage API status */
                __('Cấu hình Storage: %s.', 'dv2-streaming'),
                $status
            )) . '</p>';
        } else {
            echo '<p class="description">' . esc_html__(
                'Chưa cấu hình Upload API URL và Token — video TVC sẽ lưu trên server WordPress.',
                'dv2-streaming'
            ) . '</p>';
        }
    }

    public function render_section_socolive_home() {
        echo '<p>' . esc_html__('Cấu hình khối featured stream trên trang chủ Socolive.', 'dv2-streaming') . '</p>';
    }

    public function render_section_socolive_stream() {
        echo '<p>' . esc_html__('Cấu hình nút cược trên trang chi tiết livestream Socolive.', 'dv2-streaming') . '</p>';
    }

    public function render_section_ads_match_list() {
        echo '<p>' . esc_html__('Cấu hình các block ads đan xen trong match list hot-live. Mỗi block có HTML desktop, HTML mobile và số lượng item trước khi chèn ads.', 'dv2-streaming') . '</p>';
    }

    /**
     * @return array<int, string>
     */
    public static function get_socolive_home_bet_button_items() {
        $options = get_option('dv2_streaming_options', array());

        if (!isset($options['socolive_home_bet_button_list']) || !is_array($options['socolive_home_bet_button_list'])) {
            return array();
        }

        return array_values(array_filter(array_map('strval', $options['socolive_home_bet_button_list']), static function ($html) {
            return trim($html) !== '';
        }));
    }

    public static function get_socolive_home_bet_buttons_html() {
        return implode("\n", self::get_socolive_home_bet_button_items());
    }

    public static function get_socolive_home_bet_button_header_html() {
        $options = get_option('dv2_streaming_options', array());

        if (!array_key_exists('socolive_home_bet_button_header', $options)) {
            return '';
        }

        return trim((string) $options['socolive_home_bet_button_header']);
    }

    public static function get_socolive_home_bet_button_footer_html() {
        $options = get_option('dv2_streaming_options', array());

        if (!array_key_exists('socolive_home_bet_button_footer', $options)) {
            return '';
        }

        return trim((string) $options['socolive_home_bet_button_footer']);
    }

    /**
     * @return array<int, string>
     */
    public static function get_socolive_stream_bet_button_items() {
        $options = get_option('dv2_streaming_options', array());

        if (!isset($options['socolive_stream_bet_button_list']) || !is_array($options['socolive_stream_bet_button_list'])) {
            return array();
        }

        return array_values(array_filter(array_map('strval', $options['socolive_stream_bet_button_list']), static function ($html) {
            return trim($html) !== '';
        }));
    }

    public static function get_socolive_stream_bet_buttons_html() {
        return implode("\n", self::get_socolive_stream_bet_button_items());
    }

    /**
     * @return array<int, array{desktopHtml: string, mobileHtml: string, renderAfterDesktop: int, renderAfterMobile: int}>
     */
    public static function get_socolive_match_list_ads() {
        $options = get_option('dv2_streaming_options', array());
        $items = isset($options['socolive_match_list_ads']) && is_array($options['socolive_match_list_ads'])
            ? $options['socolive_match_list_ads']
            : array();

        $result = array();
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $desktop_html = isset($item['desktop_html']) ? trim((string) $item['desktop_html']) : '';
            $mobile_html = isset($item['mobile_html']) ? trim((string) $item['mobile_html']) : '';
            $legacy_render_after = isset($item['render_after']) ? absint($item['render_after']) : 0;
            $render_after_desktop = isset($item['render_after_desktop']) ? absint($item['render_after_desktop']) : $legacy_render_after;
            $render_after_mobile = isset($item['render_after_mobile']) ? absint($item['render_after_mobile']) : $legacy_render_after;

            if ($desktop_html === '' && $mobile_html === '') {
                continue;
            }

            if ($render_after_desktop <= 0 && $render_after_mobile <= 0) {
                continue;
            }

            $result[] = array(
                'desktopHtml' => wp_kses($desktop_html, self::get_vb2_stream_chrome_ad_allowed_html()),
                'mobileHtml' => wp_kses($mobile_html, self::get_vb2_stream_chrome_ad_allowed_html()),
                'renderAfterDesktop' => $render_after_desktop,
                'renderAfterMobile' => $render_after_mobile,
            );
        }

        return $result;
    }

    public static function get_socolive_match_list_ads_mobile_breakpoint() {
        $value = absint(self::get_option('socolive_match_list_ads_mobile_breakpoint', 768));
        return $value > 0 ? $value : 768;
    }

    public static function get_socolive_match_list_ads_repeat() {
        return !empty(self::get_option('socolive_match_list_ads_repeat', 0));
    }

    public static function get_socolive_match_schedule_list_ads_mobile_breakpoint() {
        $value = absint(self::get_option('socolive_match_schedule_list_ads_mobile_breakpoint', 768));
        return $value > 0 ? $value : 768;
    }

    public static function get_socolive_match_schedule_list_ads_repeat() {
        return !empty(self::get_option('socolive_match_schedule_list_ads_repeat', 0));
    }

    public static function get_socolive_highlight_list_ads_mobile_breakpoint() {
        $value = absint(self::get_option('socolive_highlight_list_ads_mobile_breakpoint', 768));
        return $value > 0 ? $value : 768;
    }

    public static function get_socolive_highlight_list_ads_repeat() {
        return !empty(self::get_option('socolive_highlight_list_ads_repeat', 0));
    }

    /**
     * @return array<int, array{desktopHtml: string, mobileHtml: string, renderAfterDesktop: int, renderAfterMobile: int}>
     */
    public static function get_socolive_highlight_list_ads() {
        $options = get_option('dv2_streaming_options', array());
        $items = isset($options['socolive_highlight_list_ads']) && is_array($options['socolive_highlight_list_ads'])
            ? $options['socolive_highlight_list_ads']
            : array();

        $result = array();
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $desktop_html = isset($item['desktop_html']) ? trim((string) $item['desktop_html']) : '';
            $mobile_html = isset($item['mobile_html']) ? trim((string) $item['mobile_html']) : '';
            $legacy_render_after = isset($item['render_after']) ? absint($item['render_after']) : 0;
            $render_after_desktop = isset($item['render_after_desktop']) ? absint($item['render_after_desktop']) : $legacy_render_after;
            $render_after_mobile = isset($item['render_after_mobile']) ? absint($item['render_after_mobile']) : $legacy_render_after;

            if ($desktop_html === '' && $mobile_html === '') {
                continue;
            }

            if ($render_after_desktop <= 0 && $render_after_mobile <= 0) {
                continue;
            }

            $result[] = array(
                'desktopHtml' => wp_kses($desktop_html, self::get_vb2_stream_chrome_ad_allowed_html()),
                'mobileHtml' => wp_kses($mobile_html, self::get_vb2_stream_chrome_ad_allowed_html()),
                'renderAfterDesktop' => $render_after_desktop,
                'renderAfterMobile' => $render_after_mobile,
            );
        }

        return $result;
    }

    /**
     * @return array<int, array{desktopHtml: string, mobileHtml: string, renderAfterDesktop: int, renderAfterMobile: int}>
     */
    public static function get_socolive_match_schedule_list_ads() {
        $options = get_option('dv2_streaming_options', array());
        $items = isset($options['socolive_match_schedule_list_ads']) && is_array($options['socolive_match_schedule_list_ads'])
            ? $options['socolive_match_schedule_list_ads']
            : array();

        $result = array();
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $desktop_html = isset($item['desktop_html']) ? trim((string) $item['desktop_html']) : '';
            $mobile_html = isset($item['mobile_html']) ? trim((string) $item['mobile_html']) : '';
            $legacy_render_after = isset($item['render_after']) ? absint($item['render_after']) : 0;
            $render_after_desktop = isset($item['render_after_desktop']) ? absint($item['render_after_desktop']) : $legacy_render_after;
            $render_after_mobile = isset($item['render_after_mobile']) ? absint($item['render_after_mobile']) : $legacy_render_after;

            if ($desktop_html === '' && $mobile_html === '') {
                continue;
            }

            if ($render_after_desktop <= 0 && $render_after_mobile <= 0) {
                continue;
            }

            $result[] = array(
                'desktopHtml' => wp_kses($desktop_html, self::get_vb2_stream_chrome_ad_allowed_html()),
                'mobileHtml' => wp_kses($mobile_html, self::get_vb2_stream_chrome_ad_allowed_html()),
                'renderAfterDesktop' => $render_after_desktop,
                'renderAfterMobile' => $render_after_mobile,
            );
        }

        return $result;
    }

    /**
     * @return array<int, array{id: int, redirect_url: string, s3_url: string, label: string}>
     */
    public static function get_tvc_video_items() {
        $items = self::get_option('tvc_videos', array());
        if (!is_array($items)) {
            return array();
        }

        $result = array();
        foreach ($items as $item) {
            if (is_numeric($item)) {
                $id = absint($item);
                if ($id) {
                    $result[] = array('id' => $id, 'redirect_url' => '', 's3_url' => '', 'label' => '');
                }
                continue;
            }

            if (!is_array($item)) {
                continue;
            }

            $id = isset($item['id']) ? absint($item['id']) : 0;
            $s3_url = isset($item['s3_url']) ? (string) $item['s3_url'] : '';
            if (!$id && $s3_url === '') {
                continue;
            }

            $result[] = array(
                'id' => $id,
                'redirect_url' => isset($item['redirect_url']) ? (string) $item['redirect_url'] : '',
                's3_url' => $s3_url,
                'label' => isset($item['label']) ? (string) $item['label'] : '',
            );
        }

        return $result;
    }

    /**
     * @param array{id?: int, s3_url?: string} $item
     * @return string
     */
    public static function get_tvc_video_playback_url($item) {
        if (!empty($item['s3_url'])) {
            return DV2_TVC_S3_Uploader::get_playback_url((string) $item['s3_url']);
        }

        $id = isset($item['id']) ? absint($item['id']) : 0;
        if (!$id) {
            return '';
        }

        $url = wp_get_attachment_url($id);
        return $url ? $url : '';
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array<string, mixed>>
     */
    private static function index_tvc_items_by_id($items) {
        $indexed = array();
        if (!is_array($items)) {
            return $indexed;
        }

        foreach ($items as $item) {
            if (is_array($item) && !empty($item['id'])) {
                $indexed[(int) $item['id']] = $item;
            } elseif (is_numeric($item)) {
                $indexed[(int) $item] = array('id' => (int) $item);
            }
        }

        return $indexed;
    }

    /**
     * @param int $attachment_id
     * @param array<int, array<string, mixed>> $existing_by_id
     * @return string
     */
    private static function resolve_tvc_s3_url($attachment_id, $existing_by_id) {
        if (isset($existing_by_id[$attachment_id]['s3_url']) && $existing_by_id[$attachment_id]['s3_url'] !== '') {
            return (string) $existing_by_id[$attachment_id]['s3_url'];
        }

        if (!DV2_TVC_S3_Uploader::is_configured() || !DV2_TVC_S3_Uploader::can_connect()) {
            return '';
        }

        $uploaded_url = DV2_TVC_S3_Uploader::upload_attachment($attachment_id);
        if (!$uploaded_url) {
            return '';
        }

        wp_delete_attachment($attachment_id, true);
        return esc_url_raw($uploaded_url);
    }

    /**
     * @param string $url
     * @return bool
     */
    private static function is_valid_tvc_s3_url($url) {
        return DV2_TVC_S3_Uploader::is_valid_storage_url($url);
    }

    public function ajax_tvc_s3_upload() {
        check_ajax_referer('dv2_tvc_s3_upload', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Không có quyền.', 'dv2-streaming')), 403);
        }

        if (!DV2_TVC_S3_Uploader::uses_direct_upload()) {
            wp_send_json_error(array('message' => __('Chưa cấu hình Storage API.', 'dv2-streaming')), 503);
        }

        if (empty($_FILES['video']) || !is_array($_FILES['video'])) {
            wp_send_json_error(array('message' => __('Không nhận được file video.', 'dv2-streaming')), 400);
        }

        $file = $_FILES['video'];
        if (!empty($file['error']) && (int) $file['error'] !== UPLOAD_ERR_OK) {
            $message = __('Upload file thất bại.', 'dv2-streaming');
            if ((int) $file['error'] === UPLOAD_ERR_INI_SIZE || (int) $file['error'] === UPLOAD_ERR_FORM_SIZE) {
                $message = __('File quá lớn. Tăng upload_max_filesize và post_max_size trong PHP.', 'dv2-streaming');
            }
            wp_send_json_error(array('message' => $message), 400);
        }

        $tmp_path = isset($file['tmp_name']) ? $file['tmp_name'] : '';
        if ($tmp_path === '' || !is_uploaded_file($tmp_path)) {
            wp_send_json_error(array('message' => __('File tạm không hợp lệ.', 'dv2-streaming')), 400);
        }

        $filename = isset($file['name']) ? sanitize_file_name(wp_unslash($file['name'])) : '';
        $content_type = isset($file['type']) ? sanitize_text_field(wp_unslash($file['type'])) : '';

        @set_time_limit(0);

        $upload_result = DV2_TVC_S3_Uploader::upload_file_with_details($tmp_path, $filename, $content_type);
        @unlink($tmp_path);

        $object_url = $upload_result['url'];
        if (!$object_url) {
            $message = !empty($upload_result['error'])
                ? $upload_result['error']
                : __('Upload Storage thất bại.', 'dv2-streaming');
            wp_send_json_error(array('message' => $message), 500);
        }

        $object_url = esc_url_raw($object_url);
        self::append_tvc_s3_video($object_url, $filename);

        wp_send_json_success(array(
            'objectUrl' => $object_url,
            'playbackUrl' => DV2_TVC_S3_Uploader::get_playback_url($object_url),
            'label' => $filename,
        ));
    }

    public function ajax_tvc_s3_register() {
        check_ajax_referer('dv2_tvc_s3_upload', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Không có quyền.', 'dv2-streaming')), 403);
        }

        if (!DV2_TVC_S3_Uploader::uses_direct_upload()) {
            wp_send_json_error(array('message' => __('Chưa cấu hình Storage API.', 'dv2-streaming')), 503);
        }

        $object_url = isset($_POST['object_url']) ? esc_url_raw(wp_unslash($_POST['object_url'])) : '';
        $label = isset($_POST['label']) ? sanitize_text_field(wp_unslash($_POST['label'])) : '';

        if ($object_url === '' || !self::is_valid_tvc_s3_url($object_url)) {
            wp_send_json_error(array('message' => __('URL Storage không hợp lệ.', 'dv2-streaming')), 400);
        }

        self::append_tvc_s3_video($object_url, $label);

        wp_send_json_success(array(
            'objectUrl' => $object_url,
            'playbackUrl' => DV2_TVC_S3_Uploader::get_playback_url($object_url),
            'label' => $label,
        ));
    }

    /**
     * @param string $s3_url
     * @param string $label
     */
    private static function append_tvc_s3_video($s3_url, $label = '') {
        if ($s3_url === '' || !self::is_valid_tvc_s3_url($s3_url)) {
            return;
        }

        $options = get_option('dv2_streaming_options', array());
        if (!is_array($options)) {
            $options = array();
        }

        $videos = isset($options['tvc_videos']) && is_array($options['tvc_videos'])
            ? $options['tvc_videos']
            : array();

        foreach ($videos as $existing) {
            if (!is_array($existing)) {
                continue;
            }
            if (!empty($existing['s3_url']) && (string) $existing['s3_url'] === $s3_url) {
                return;
            }
        }

        $videos[] = array(
            'id' => 0,
            'redirect_url' => '',
            's3_url' => $s3_url,
            'label' => sanitize_text_field($label),
        );

        $options['tvc_videos'] = $videos;
        update_option('dv2_streaming_options', $options);
    }

    /**
     * @return int[]
     */
    public static function get_tvc_video_ids() {
        return array_values(array_map(
            function ($item) {
                return $item['id'];
            },
            self::get_tvc_video_items()
        ));
    }

    /**
     * @return string[]
     */
    public static function get_tvc_video_urls() {
        $urls = array();

        foreach (self::get_tvc_video_items() as $item) {
            if (empty($item['s3_url'])) {
                $mime = get_post_mime_type($item['id']);
                if ($mime && strpos($mime, 'video/') !== 0) {
                    continue;
                }
            }

            $url = self::get_tvc_video_playback_url($item);
            if ($url) {
                $urls[] = esc_url_raw($url);
            }
        }

        return $urls;
    }

    /**
     * @return array<int, array{url: string, s3Url: string, redirectUrl: string}>
     */
    public static function get_tvc_videos_for_player() {
        $videos = array();

        foreach (self::get_tvc_video_items() as $item) {
            if (empty($item['s3_url'])) {
                $mime = get_post_mime_type($item['id']);
                if ($mime && strpos($mime, 'video/') !== 0) {
                    continue;
                }
            }

            $url = self::get_tvc_video_playback_url($item);
            if (!$url) {
                continue;
            }

            $videos[] = array(
                'url' => esc_url_raw($url),
                's3Url' => esc_url_raw($url),
                'fallbackUrl' => '',
                'redirectUrl' => $item['redirect_url'],
            );
        }

        return $videos;
    }

    public static function get_vb2_stream_chrome_defaults() {
        return array(
            'vb2_stream_chrome_header_ad' =>
                '',
            'vb2_stream_chrome_ft_head_ad' =>
                '',
            'vb2_stream_chrome_ft_left_ad' =>
                '',
            'vb2_stream_chrome_ft_right_ad' =>
                '',
            'vb2_stream_chrome_right_ad' =>
                '',
        );
    }

    private static function get_vb2_stream_chrome_ad_allowed_html() {
        return array(
            'div' => array(
                'class' => true,
                'id' => true,
                'style' => true,
                'aria-hidden' => true,
            ),
            'ins' => array(
                'data-z' => true,
                'data-revive-zoneid' => true,
                'data-revive-id' => true,
                'data-revive-seq' => true,
                'data-revive-loaded' => true,
                'data-ad-client' => true,
                'data-ad-slot' => true,
                'data-ad-format' => true,
                'data-full-width-responsive' => true,
                'class' => true,
                'id' => true,
                'style' => true,
            ),
            'img' => array(
                'src' => true,
                'alt' => true,
                'decoding' => true,
                'loading' => true,
                'width' => true,
                'height' => true,
                'border' => true,
                'title' => true,
                'class' => true,
                'id' => true,
                'style' => true,
            ),
            'a' => array(
                'href' => true,
                'target' => true,
                'rel' => true,
                'class' => true,
            ),
        );
    }

    /**
     * Footer slot HTML from admin (safe for echo in stream-detail block).
     *
     * @param string $key vb2_stream_chrome_header_ad|ft_head_ad|left_ad|right_ad|vb2_stream_chrome_right_ad
     * @return string
     */
    public static function get_vb2_stream_chrome_ft_ad_html($key) {
        $defaults = self::get_vb2_stream_chrome_defaults();
        if (!array_key_exists($key, $defaults)) {
            return '';
        }

        $html = self::get_option($key, '');
        if ($html === '') {
            return '';
        }

        return wp_kses($html, self::get_vb2_stream_chrome_ad_allowed_html());
    }

    /**
     * @param string $key vb2_stream_chrome_ft_head_ad|left_ad|right_ad
     */
    public static function has_vb2_stream_chrome_ft_ad($key) {
        return self::get_vb2_stream_chrome_ft_ad_html($key) !== '';
    }

    public static function get_vb2_stream_chrome_header_ad_html() {
        return self::get_vb2_stream_chrome_ft_ad_html('vb2_stream_chrome_header_ad');
    }

    public static function has_vb2_stream_chrome_header() {
        return self::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_header_ad');
    }

    public static function has_vb2_stream_chrome_footer() {
        return self::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_ft_head_ad')
            || self::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_ft_left_ad')
            || self::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_ft_right_ad');
    }

    public static function get_vb2_stream_chrome_right_ad_html() {
        return self::get_vb2_stream_chrome_ft_ad_html('vb2_stream_chrome_right_ad');
    }

    public static function has_vb2_stream_chrome_right() {
        return self::has_vb2_stream_chrome_ft_ad('vb2_stream_chrome_right_ad');
    }

    public static function has_vb2_stream_chrome() {
        return self::has_vb2_stream_chrome_footer()
            || self::has_vb2_stream_chrome_right()
            || self::has_vb2_stream_odds_panel();
    }

    /**
     * Stream odds panel is always available on livestream detail pages.
     *
     * @return bool
     */
    public static function has_vb2_stream_odds_panel() {
        return true;
    }

    /**
     * @return string
     */
    public static function get_vb2_stream_odds_panel_image_url() {
        $attachment_id = absint(self::get_option('vb2_stream_odds_panel_image_id', 0));
        if (!$attachment_id) {
            return '';
        }

        $mime = get_post_mime_type($attachment_id);
        if (!$mime || strpos($mime, 'image/') !== 0) {
            return '';
        }

        $url = wp_get_attachment_url($attachment_id);
        return $url ? esc_url_raw($url) : '';
    }

    /**
     * @return string
     */
    public static function get_vb2_stream_odds_panel_link() {
        return trim((string) self::get_option('vb2_stream_odds_panel_link', ''));
    }

    /**
     * Custom poster URL for HOT18 BLV from admin media library.
     *
     * @return string
     */
    public static function get_vb2_hot18_poster_url() {
        $attachment_id = absint(self::get_option('vb2_hot18_poster_id', 0));
        if (!$attachment_id) {
            return '';
        }

        $mime = get_post_mime_type($attachment_id);
        if (!$mime || strpos($mime, 'image/') !== 0) {
            return '';
        }

        $url = wp_get_attachment_url($attachment_id);
        return $url ? esc_url_raw($url) : '';
    }
    
     public function render_field_dv2_link_bet() {
        $options = get_option($this->option_name);
        $value = isset($options['dv2_link_bet']) ? $options['dv2_link_bet'] : '';
        ?>
        <input type="text"
            id="dv2_link_bet"
            name="<?php echo esc_attr($this->option_name); ?>[dv2_link_bet]"
            value="<?php echo esc_attr($value); ?>"
            class="regular-text" style="width: 100%;"
            placeholder="vd: https://v*n**.v*n/?a=95916dbe8c8fe23b3dd08cff54037976&utm_campaign=seo&utm_source=mkt1seoh&utm_term=home&referrer_domain=slideonline.co.com" />
        <p class="description">
            <?php echo esc_html__('Nhập link đặt cược cho phần đặt cược được gắn ở list các trận đấu.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_dv2_priority_competition_id() {
        $options = get_option($this->option_name);
        $value = isset($options['dv2_priority_competition_id'])
            ? $options['dv2_priority_competition_id']
            : '';
        ?>
        <input type="text"
            id="dv2_priority_competition_id"
            name="<?php echo esc_attr($this->option_name); ?>[dv2_priority_competition_id]"
            value="<?php echo esc_attr($value); ?>"
            class="regular-text" style="width: 100%;"
            placeholder="vd: id1,id2" />
        <p class="description">
            <?php echo esc_html__('ID giải ưu tiên khi sort danh sách trận. Nhiều giải cách nhau bằng dấu phẩy (thứ tự = độ ưu tiên). Để trống thì không áp dụng sort theo giải ưu tiên.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_vb2_stream_chrome_header_ad() {
        $this->render_field_vb2_stream_chrome_ad('vb2_stream_chrome_header_ad', 'Header cuộn');
    }

    private function render_field_vb2_stream_chrome_ad($key, $label) {
        $defaults = self::get_vb2_stream_chrome_defaults();
        $options = get_option($this->option_name);
        $value = isset($options[$key]) ? $options[$key] : $defaults[$key];
        ?>
        <textarea id="<?php echo esc_attr($key); ?>"
                  name="<?php echo esc_attr($this->option_name); ?>[<?php echo esc_attr($key); ?>]"
                  rows="3"
                  class="large-text code"><?php echo esc_textarea($value); ?></textarea>
        <p class="description">
            <?php
            echo esc_html(
                sprintf(
                    /* translators: %s: field label */
                    __('HTML player (%s): thẻ &lt;img&gt;, &lt;a&gt; hoặc &lt;ins&gt; (Revive). Render trong template, không qua JS.', 'dv2-streaming'),
                    $label
                )
            );
            ?>
        </p>
        <?php
    }

    public function render_field_vb2_stream_chrome_ft_head_ad() {
        $this->render_field_vb2_stream_chrome_ad('vb2_stream_chrome_ft_head_ad', 'Head');
    }

    public function render_field_vb2_stream_chrome_ft_left_ad() {
        $this->render_field_vb2_stream_chrome_ad('vb2_stream_chrome_ft_left_ad', 'Trái');
    }

    public function render_field_vb2_stream_chrome_ft_right_ad() {
        $this->render_field_vb2_stream_chrome_ad('vb2_stream_chrome_ft_right_ad', 'Phải');
    }

    public function render_field_vb2_stream_chrome_right_ad() {
        $this->render_field_vb2_stream_chrome_ad('vb2_stream_chrome_right_ad', 'Góc phải');
    }

    public function render_field_vb2_stream_odds_panel_image() {
        $options = get_option($this->option_name);
        $attachment_id = isset($options['vb2_stream_odds_panel_image_id'])
            ? absint($options['vb2_stream_odds_panel_image_id'])
            : 0;
        $url = $attachment_id ? wp_get_attachment_url($attachment_id) : '';
        $has_image = !empty($url);
        ?>
        <div class="dv2-media-upload-field" data-dv2-media-key="vb2_stream_odds_panel_image_id">
            <input type="hidden"
                   name="<?php echo esc_attr($this->option_name); ?>[vb2_stream_odds_panel_image_id]"
                   value="<?php echo esc_attr($attachment_id); ?>" />
            <div class="dv2-media-preview"<?php echo $has_image ? '' : ' style="display:none;"'; ?>>
                <img src="<?php echo esc_url($url); ?>" alt="" />
            </div>
            <p>
                <button type="button" class="button dv2-media-upload-btn">
                    <?php echo esc_html($has_image ? __('Đổi ảnh', 'dv2-streaming') : __('Chọn ảnh', 'dv2-streaming')); ?>
                </button>
                <button type="button" class="button dv2-media-remove-btn"<?php echo $has_image ? '' : ' style="display:none;"'; ?>>
                    <?php echo esc_html__('Xóa ảnh', 'dv2-streaming'); ?>
                </button>
            </p>
            <p class="description">
                <?php echo esc_html__('Logo/ảnh hiển thị giữa bảng kèo trên khung stream (phần "Cược").', 'dv2-streaming'); ?>
            </p>
        </div>
        <?php
    }

    public function render_field_vb2_stream_odds_panel_link() {
        $options = get_option($this->option_name);
        $value = isset($options['vb2_stream_odds_panel_link']) ? $options['vb2_stream_odds_panel_link'] : '';
        ?>
        <input type="text"
               id="vb2_stream_odds_panel_link"
               name="<?php echo esc_attr($this->option_name); ?>[vb2_stream_odds_panel_link]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               style="width: 100%;"
               placeholder="vd: https://example.com/?utm_source=stream" />
        <p class="description">
            <?php echo esc_html__('Link khi click vào ảnh giữa bảng kèo trên khung stream.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_vb2_hot18_poster() {
        $options = get_option($this->option_name);
        $attachment_id = isset($options['vb2_hot18_poster_id'])
            ? absint($options['vb2_hot18_poster_id'])
            : 0;
        $url = $attachment_id ? wp_get_attachment_url($attachment_id) : '';
        $has_image = !empty($url);
        ?>
        <div class="dv2-media-upload-field">
            <input type="hidden"
                   name="<?php echo esc_attr($this->option_name); ?>[vb2_hot18_poster_id]"
                   value="<?php echo esc_attr($attachment_id); ?>" />
            <div class="dv2-media-preview"<?php echo $has_image ? '' : ' style="display:none;"'; ?>>
                <img src="<?php echo esc_url($url); ?>" alt="" />
            </div>
            <p>
                <button type="button" class="button dv2-media-upload-btn">
                    <?php echo esc_html($has_image ? __('Đổi ảnh', 'dv2-streaming') : __('Chọn ảnh', 'dv2-streaming')); ?>
                </button>
                <button type="button" class="button dv2-media-remove-btn"<?php echo $has_image ? '' : ' style="display:none;"'; ?>>
                    <?php echo esc_html__('Xóa ảnh', 'dv2-streaming'); ?>
                </button>
            </p>
            <p class="description">
                <?php echo esc_html__('Ảnh nền khi chọn BLV 18+ trên trang chi tiết livestream. Để trống sẽ dùng ảnh mặc định bg-18+.webp trong plugin.', 'dv2-streaming'); ?>
            </p>
        </div>
        <?php
    }

    public function render_field_tvc_upload_api_url() {
        $value = DV2_TVC_S3_Uploader::get_upload_api_url();
        ?>
        <input type="url"
               id="tvc_upload_api_url"
               name="<?php echo esc_attr($this->option_name); ?>[tvc_upload_api_url]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               style="width: 100%;"
               placeholder="<?php echo esc_attr(DV2_TVC_S3_Uploader::DEFAULT_UPLOAD_API_URL); ?>" />
        <p class="description">
            <?php echo esc_html__('Endpoint API dùng để upload video TVC.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_tvc_upload_api_token() {
        $has_token = DV2_TVC_S3_Uploader::get_stored_upload_api_token() !== '';
        $masked    = DV2_TVC_S3_Uploader::get_masked_upload_api_token();
        ?>
        <?php if ($has_token) : ?>
            <p style="margin:0 0 6px;font-size:13px;color:#1d2327;">
                <?php echo esc_html__('Token hiện tại:', 'dv2-streaming'); ?>
                <code><?php echo esc_html($masked); ?></code>
            </p>
        <?php endif; ?>
        <input type="password"
               id="tvc_upload_api_token"
               name="<?php echo esc_attr($this->option_name); ?>[tvc_upload_api_token]"
               value=""
               class="regular-text"
               style="width: 100%;"
               autocomplete="new-password"
               placeholder="<?php echo $has_token ? esc_attr__('Nhập token mới để thay thế (để trống giữ nguyên)', 'dv2-streaming') : esc_attr__('Nhập Bearer token', 'dv2-streaming'); ?>" />
        <p class="description">
            <?php echo esc_html__('Bearer token gửi kèm khi upload. Để trống nếu không muốn đổi token.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_tvc_videos() {
        $video_items = self::get_tvc_video_items();
        ?>
        <input type="hidden" name="<?php echo esc_attr($this->option_name); ?>[tvc_videos_present]" value="1" />
        <div class="dv2-tvc-videos-field" id="dv2-tvc-videos-field">
            <div class="dv2-tvc-videos-list">
                <?php if (!empty($video_items)) : ?>
                    <?php foreach ($video_items as $video_item) : ?>
                        <?php $this->render_tvc_video_row($video_item['id'], $video_item['redirect_url'], $video_item['s3_url'], $video_item['label']); ?>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
            <p>
                <button type="button" class="button button-secondary dv2-tvc-video-add">
                    <?php echo esc_html__('+ Thêm video', 'dv2-streaming'); ?>
                </button>
            </p>
            <p class="description">
                <?php if (DV2_TVC_S3_Uploader::uses_direct_upload()) : ?>
                    <?php echo esc_html__('Nhập Video URL trực tiếp nếu file đã có trên Storage, hoặc bấm Chọn file để upload mới. Mỗi lần vào trang detail sẽ phát ngẫu nhiên một video. Click URL (tùy chọn) mở tab mới khi người xem click vào video TVC.', 'dv2-streaming'); ?>
                <?php else : ?>
                    <?php echo esc_html__('Nhập Video URL hoặc chọn file video (MP4, MOV, WebM…). Mỗi lần vào trang detail sẽ phát ngẫu nhiên một video. Click URL (tùy chọn) mở tab mới khi người xem click vào video TVC.', 'dv2-streaming'); ?>
                <?php endif; ?>
            </p>
        </div>
        <script type="text/template" id="dv2-tvc-video-row-template">
            <?php $this->render_tvc_video_row(0); ?>
        </script>
        <?php
    }

    /**
     * @param int    $attachment_id
     * @param string $redirect_url
     * @param string $s3_url
     * @param string $label
     */
    private function render_tvc_video_row($attachment_id = 0, $redirect_url = '', $s3_url = '', $label = '') {
        $attachment_id = absint($attachment_id);
        $item = array(
            'id' => $attachment_id,
            's3_url' => $s3_url,
        );
        $url = self::get_tvc_video_playback_url($item);
        $title = $attachment_id ? get_the_title($attachment_id) : '';
        $filename = $url ? wp_basename($url) : '';
        $display_label = $label !== '' ? $label : ($title !== '' ? $title : $filename);
        ?>
        <div class="dv2-tvc-video-row"<?php echo $attachment_id || $s3_url ? '' : ' data-template="1"'; ?>>
            <input type="hidden"
                   class="dv2-tvc-video-id"
                   name="<?php echo esc_attr($this->option_name); ?>[tvc_videos][]"
                   value="<?php echo esc_attr($attachment_id); ?>" />
            <input type="hidden"
                   class="dv2-tvc-video-label-input"
                   name="<?php echo esc_attr($this->option_name); ?>[tvc_labels][]"
                   value="<?php echo esc_attr($display_label); ?>" />
            <input type="file"
                   class="dv2-tvc-video-file-input"
                   accept="video/*"
                   hidden />
            <div class="dv2-tvc-video-fields">
                <div class="dv2-tvc-video-url-group">
                    <label class="dv2-tvc-video-field-label"><?php echo esc_html__('Video URL', 'dv2-streaming'); ?></label>
                    <div class="dv2-tvc-video-url-row">
                        <input type="text"
                               class="regular-text dv2-tvc-video-url"
                               name="<?php echo esc_attr($this->option_name); ?>[tvc_s3_urls][]"
                               value="<?php echo esc_attr($s3_url); ?>"
                               placeholder="https://d3b2vtduv5mijg.cloudfront.net/..." />
                        <button type="button" class="button dv2-tvc-video-select">
                            <?php echo esc_html__('Chọn file', 'dv2-streaming'); ?>
                        </button>
                    </div>
                </div>
                <div class="dv2-tvc-video-redirect">
                    <label class="dv2-tvc-video-field-label"><?php echo esc_html__('Click URL', 'dv2-streaming'); ?></label>
                    <input type="text"
                           class="regular-text dv2-tvc-video-redirect-url"
                           name="<?php echo esc_attr($this->option_name); ?>[tvc_redirect_urls][]"
                           value="<?php echo esc_attr($redirect_url); ?>"
                           placeholder="https://example.com" />
                </div>
            </div>
            <div class="dv2-tvc-video-preview"<?php echo $url ? '' : ' style="display:none;"'; ?>>
                <?php if ($url) : ?>
                    <video src="<?php echo esc_url($url); ?>" muted playsinline preload="metadata"></video>
                <?php else : ?>
                    <video muted playsinline preload="metadata"></video>
                <?php endif; ?>
                <span class="dv2-tvc-video-label"><?php echo esc_html($display_label); ?></span>
            </div>
            <div class="dv2-tvc-video-actions">
                <button type="button" class="button dv2-tvc-video-remove" aria-label="<?php echo esc_attr__('Xóa video', 'dv2-streaming'); ?>">−</button>
            </div>
        </div>
        <?php
    }

    public function render_field_socolive_home_bet_button_list() {
        $options = get_option($this->option_name, array());
        $items = array();
        if (isset($options['socolive_home_bet_button_list']) && is_array($options['socolive_home_bet_button_list'])) {
            $items = $options['socolive_home_bet_button_list'];
        }
        ?>
        <input type="hidden" name="<?php echo esc_attr($this->option_name); ?>[socolive_home_bet_buttons_present]" value="1" />
        <div class="dv2-scl-bet-buttons-field" id="dv2-scl-bet-buttons-field">
            <div class="dv2-scl-bet-buttons-list">
                <?php foreach ($items as $html) : ?>
                    <?php $this->render_socolive_home_bet_button_row($html); ?>
                <?php endforeach; ?>
            </div>
            <p>
                <button type="button" class="button button-secondary dv2-scl-bet-btn-add">
                    <?php echo esc_html__('+ Thêm nút', 'dv2-streaming'); ?>
                </button>
            </p>
            <p class="description">
                <?php echo esc_html__('Mỗi dòng là HTML một nút cược (thường là thẻ <a> chứa <img>). Để trống sẽ không hiển thị.', 'dv2-streaming'); ?>
            </p>
        </div>
        <script type="text/template" id="dv2-scl-bet-btn-row-template">
            <?php $this->render_socolive_home_bet_button_row(''); ?>
        </script>
        <?php
    }

    /**
     * @param string $html
     */
    private function render_socolive_home_bet_button_row($html = '') {
        ?>
        <div class="dv2-scl-bet-btn-row"<?php echo $html === '' ? ' data-template="1"' : ''; ?>>
            <textarea rows="3"
                      class="large-text code dv2-scl-bet-btn-html"
                      name="<?php echo esc_attr($this->option_name); ?>[socolive_home_bet_button_list][]"
                      placeholder='<a href="https://..."><img src="..." alt="..." /></a>'><?php echo esc_textarea($html); ?></textarea>
            <div class="dv2-scl-bet-btn-actions">
                <button type="button" class="button dv2-scl-bet-btn-remove" aria-label="<?php echo esc_attr__('Xóa nút', 'dv2-streaming'); ?>">−</button>
            </div>
        </div>
        <?php
    }

    public function render_field_socolive_home_bet_button_header() {
        $options = get_option($this->option_name, array());
        $value = array_key_exists('socolive_home_bet_button_header', $options)
            ? (string) $options['socolive_home_bet_button_header']
            : '';
        ?>
        <textarea id="socolive_home_bet_button_header"
                  name="<?php echo esc_attr($this->option_name); ?>[socolive_home_bet_button_header]"
                  rows="4"
                  class="large-text code"><?php echo esc_textarea($value); ?></textarea>
        <p class="description">
            <?php echo esc_html__('HTML banner header bên phải khối featured stream (thường là thẻ <img>). Để trống sẽ không hiển thị.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_socolive_stream_bet_button_list() {
        $options = get_option($this->option_name, array());
        $items = array();
        if (isset($options['socolive_stream_bet_button_list']) && is_array($options['socolive_stream_bet_button_list'])) {
            $items = $options['socolive_stream_bet_button_list'];
        }
        ?>
        <input type="hidden" name="<?php echo esc_attr($this->option_name); ?>[socolive_stream_bet_buttons_present]" value="1" />
        <div class="dv2-scl-bet-buttons-field" id="dv2-scl-stream-bet-buttons-field">
            <div class="dv2-scl-bet-buttons-list">
                <?php foreach ($items as $html) : ?>
                    <?php $this->render_socolive_stream_bet_button_row($html); ?>
                <?php endforeach; ?>
            </div>
            <p>
                <button type="button" class="button button-secondary dv2-scl-bet-btn-add">
                    <?php echo esc_html__('+ Thêm nút', 'dv2-streaming'); ?>
                </button>
            </p>
            <p class="description">
                <?php echo esc_html__('Mỗi dòng là HTML một nút cược trong hàng stream links (thường là thẻ <ins> hoặc <a> chứa <img>). Để trống sẽ dùng mặc định.', 'dv2-streaming'); ?>
            </p>
        </div>
        <script type="text/template" id="dv2-scl-stream-bet-btn-row-template">
            <?php $this->render_socolive_stream_bet_button_row(''); ?>
        </script>
        <?php
    }

    /**
     * @param string $html
     */
    private function render_socolive_stream_bet_button_row($html = '') {
        ?>
        <div class="dv2-scl-bet-btn-row"<?php echo $html === '' ? ' data-template="1"' : ''; ?>>
            <textarea rows="3"
                      class="large-text code dv2-scl-bet-btn-html"
                      name="<?php echo esc_attr($this->option_name); ?>[socolive_stream_bet_button_list][]"
                      placeholder='<ins>...</ins> hoặc <a href="https://..."><img src="..." alt="..." /></a>'><?php echo esc_textarea($html); ?></textarea>
            <div class="dv2-scl-bet-btn-actions">
                <button type="button" class="button dv2-scl-bet-btn-remove" aria-label="<?php echo esc_attr__('Xóa nút', 'dv2-streaming'); ?>">−</button>
            </div>
        </div>
        <?php
    }

    public function render_field_socolive_match_list_ads_mobile_breakpoint() {
        $value = self::get_socolive_match_list_ads_mobile_breakpoint();
        ?>
        <input type="number"
               min="320"
               max="3840"
               step="1"
               class="small-text"
               name="<?php echo esc_attr($this->option_name); ?>[socolive_match_list_ads_mobile_breakpoint]"
               value="<?php echo esc_attr($value); ?>" />
        <span>px</span>
        <p class="description">
            <?php echo esc_html__('Chiều rộng tối đa (px) để xác định mobile cho Block ads item match list (số item render PC/mobile và hiển thị ads desktop/mobile).', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_socolive_match_schedule_list_ads_mobile_breakpoint() {
        $value = self::get_socolive_match_schedule_list_ads_mobile_breakpoint();
        ?>
        <input type="number"
               min="320"
               max="3840"
               step="1"
               class="small-text"
               name="<?php echo esc_attr($this->option_name); ?>[socolive_match_schedule_list_ads_mobile_breakpoint]"
               value="<?php echo esc_attr($value); ?>" />
        <span>px</span>
        <p class="description">
            <?php echo esc_html__('Chiều rộng tối đa (px) để xác định mobile cho Block ads item match schedule list (số item render PC/mobile và hiển thị ads desktop/mobile).', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_socolive_highlight_list_ads_mobile_breakpoint() {
        $value = self::get_socolive_highlight_list_ads_mobile_breakpoint();
        ?>
        <input type="number"
               min="320"
               max="3840"
               step="1"
               class="small-text"
               name="<?php echo esc_attr($this->option_name); ?>[socolive_highlight_list_ads_mobile_breakpoint]"
               value="<?php echo esc_attr($value); ?>" />
        <span>px</span>
        <p class="description">
            <?php echo esc_html__('Chiều rộng tối đa (px) để xác định mobile cho Block ads item highlight list (số item render PC/mobile và hiển thị ads desktop/mobile).', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_socolive_match_list_ads() {
        $items = self::get_option('socolive_match_list_ads', array());
        if (!is_array($items)) {
            $items = array();
        }
        ?>
        <input type="hidden" name="<?php echo esc_attr($this->option_name); ?>[socolive_match_list_ads_present]" value="1" />
        <div class="dv2-match-list-ads-field" id="dv2-match-list-ads-field">
            <div class="dv2-match-list-ads-list">
                <?php foreach ($items as $item) : ?>
                    <?php
                    $desktop_html = is_array($item) && isset($item['desktop_html']) ? (string) $item['desktop_html'] : '';
                    $mobile_html = is_array($item) && isset($item['mobile_html']) ? (string) $item['mobile_html'] : '';
                    $legacy_render_after = is_array($item) && isset($item['render_after']) ? absint($item['render_after']) : 0;
                    $render_after_desktop = is_array($item) && isset($item['render_after_desktop']) ? absint($item['render_after_desktop']) : $legacy_render_after;
                    $render_after_mobile = is_array($item) && isset($item['render_after_mobile']) ? absint($item['render_after_mobile']) : $legacy_render_after;
                    $this->render_socolive_match_list_ad_row($desktop_html, $mobile_html, $render_after_desktop, $render_after_mobile);
                    ?>
                <?php endforeach; ?>
            </div>
            <p>
                <button type="button" class="button button-secondary dv2-match-list-ads-add">
                    <?php echo esc_html__('+ Thêm block ads', 'dv2-streaming'); ?>
                </button>
            </p>
            <p class="description">
                <?php echo esc_html__('Mỗi block gồm HTML desktop, HTML mobile và số item render riêng cho desktop/mobile. Các block tính tuần tự: block 1 sau N item, block 2 sau thêm M item nữa, v.v. Mỗi block chỉ hiện một lần. Nếu không đủ item cho block tiếp theo, ads vẫn hiện ở cuối danh sách với số item còn lại, rồi dừng — không hiện các block phía sau. Để trống HTML thì block không hiển thị. Áp dụng cho shortcode: [danh_sach_video_hot], [de_xuat_video].', 'dv2-streaming'); ?>
            </p>
        </div>
        <script type="text/template" id="dv2-match-list-ad-row-template">
            <?php $this->render_socolive_match_list_ad_row('', '', 4, 4); ?>
        </script>
        <?php
    }

    public function render_field_socolive_match_list_ads_repeat() {
        $value = self::get_socolive_match_list_ads_repeat();
        ?>
        <label>
            <input type="checkbox"
                   name="<?php echo esc_attr($this->option_name); ?>[socolive_match_list_ads_repeat]"
                   value="1"
                   <?php checked($value); ?> />
            <?php echo esc_html__('Lặp lại block ads theo chu kỳ (1, 2, 3, 1, 2, 3...)', 'dv2-streaming'); ?>
        </label>
        <p class="description">
            <?php echo esc_html__('Bật: chèn lại cho đến khi hết item. Tắt: mỗi block chỉ chèn 1 lần.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    private function render_socolive_match_list_ad_row($desktop_html = '', $mobile_html = '', $render_after_desktop = 4, $render_after_mobile = 4) {
        ?>
        <div class="dv2-match-list-ad-row"<?php echo ($desktop_html === '' && $mobile_html === '') ? ' data-template="1"' : ''; ?>>
            <div class="dv2-match-list-ad-fields">
                <div class="dv2-match-list-ad-field">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Ads desktop', 'dv2-streaming'); ?></label>
                    <textarea rows="4"
                              class="large-text code"
                              name="<?php echo esc_attr($this->option_name); ?>[socolive_match_list_ads][desktop_html][]"
                              placeholder='<ins data-z="1149" data-revive-id="..."></ins>'><?php echo esc_textarea($desktop_html); ?></textarea>
                </div>
                <div class="dv2-match-list-ad-field">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Ads mobile', 'dv2-streaming'); ?></label>
                    <textarea rows="4"
                              class="large-text code"
                              name="<?php echo esc_attr($this->option_name); ?>[socolive_match_list_ads][mobile_html][]"
                              placeholder='<ins data-z="1152" data-revive-id="..."></ins>'><?php echo esc_textarea($mobile_html); ?></textarea>
                </div>
                <div class="dv2-match-list-ad-field dv2-match-list-ad-field--number">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Number item render PC', 'dv2-streaming'); ?></label>
                    <input type="number"
                           min="1"
                           step="1"
                           class="small-text"
                           name="<?php echo esc_attr($this->option_name); ?>[socolive_match_list_ads][render_after_desktop][]"
                           value="<?php echo esc_attr($render_after_desktop > 0 ? $render_after_desktop : 4); ?>" />
                </div>
                <div class="dv2-match-list-ad-field dv2-match-list-ad-field--number">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Number item render Mobile', 'dv2-streaming'); ?></label>
                    <input type="number"
                           min="1"
                           step="1"
                           class="small-text"
                           name="<?php echo esc_attr($this->option_name); ?>[socolive_match_list_ads][render_after_mobile][]"
                           value="<?php echo esc_attr($render_after_mobile > 0 ? $render_after_mobile : 4); ?>" />
                </div>
            </div>
            <div class="dv2-match-list-ad-actions">
                <button type="button" class="button dv2-match-list-ads-remove" aria-label="<?php echo esc_attr__('Xóa block ads', 'dv2-streaming'); ?>">−</button>
            </div>
        </div>
        <?php
    }

    public function render_field_socolive_match_schedule_list_ads() {
        $items = self::get_option('socolive_match_schedule_list_ads', array());
        if (!is_array($items)) {
            $items = array();
        }
        ?>
        <div class="dv2-match-list-ads-field" id="dv2-match-schedule-list-ads-field">
            <div class="dv2-match-list-ads-list">
                <?php foreach ($items as $item) : ?>
                    <?php
                    $desktop_html = is_array($item) && isset($item['desktop_html']) ? (string) $item['desktop_html'] : '';
                    $mobile_html = is_array($item) && isset($item['mobile_html']) ? (string) $item['mobile_html'] : '';
                    $legacy_render_after = is_array($item) && isset($item['render_after']) ? absint($item['render_after']) : 0;
                    $render_after_desktop = is_array($item) && isset($item['render_after_desktop']) ? absint($item['render_after_desktop']) : $legacy_render_after;
                    $render_after_mobile = is_array($item) && isset($item['render_after_mobile']) ? absint($item['render_after_mobile']) : $legacy_render_after;
                    $this->render_socolive_match_schedule_list_ad_row($desktop_html, $mobile_html, $render_after_desktop, $render_after_mobile);
                    ?>
                <?php endforeach; ?>
            </div>
            <p>
                <button type="button" class="button button-secondary dv2-match-schedule-list-ads-add">
                    <?php echo esc_html__('+ Thêm block ads', 'dv2-streaming'); ?>
                </button>
            </p>
            <p class="description">
                <?php echo esc_html__('Ads đan xen trong lịch thi đấu, tính riêng theo từng ngày. Mỗi block gồm HTML desktop, HTML mobile và số item render riêng cho desktop/mobile. Các block tính tuần tự: block 1 sau N item, block 2 sau thêm M item nữa, v.v. Nếu không đủ item cho block tiếp theo, ads vẫn hiện ở cuối danh sách ngày đó với số item còn lại, rồi dừng — không hiện các block phía sau. Để trống HTML thì block không hiển thị. Áp dụng cho shortcode: [lich_truc_tiep], [ket_qua_hom_nay].', 'dv2-streaming'); ?>
            </p>
        </div>
        <script type="text/template" id="dv2-match-schedule-list-ad-row-template">
            <?php $this->render_socolive_match_schedule_list_ad_row('', '', 4, 4); ?>
        </script>
        <?php
    }

    public function render_field_socolive_match_schedule_list_ads_repeat() {
        $value = self::get_socolive_match_schedule_list_ads_repeat();
        ?>
        <label>
            <input type="checkbox"
                   name="<?php echo esc_attr($this->option_name); ?>[socolive_match_schedule_list_ads_repeat]"
                   value="1"
                   <?php checked($value); ?> />
            <?php echo esc_html__('Lặp lại block ads theo chu kỳ (1, 2, 3, 1, 2, 3...)', 'dv2-streaming'); ?>
        </label>
        <p class="description">
            <?php echo esc_html__('Bật: chèn lại cho đến khi hết item trong từng ngày. Tắt: mỗi block chỉ chèn 1 lần.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    private function render_socolive_match_schedule_list_ad_row($desktop_html = '', $mobile_html = '', $render_after_desktop = 4, $render_after_mobile = 4) {
        ?>
        <div class="dv2-match-list-ad-row"<?php echo ($desktop_html === '' && $mobile_html === '') ? ' data-template="1"' : ''; ?>>
            <div class="dv2-match-list-ad-fields">
                <div class="dv2-match-list-ad-field">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Ads desktop', 'dv2-streaming'); ?></label>
                    <textarea rows="4"
                              class="large-text code"
                              name="<?php echo esc_attr($this->option_name); ?>[socolive_match_schedule_list_ads][desktop_html][]"
                              placeholder='<ins data-z="1149" data-revive-id="..."></ins>'><?php echo esc_textarea($desktop_html); ?></textarea>
                </div>
                <div class="dv2-match-list-ad-field">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Ads mobile', 'dv2-streaming'); ?></label>
                    <textarea rows="4"
                              class="large-text code"
                              name="<?php echo esc_attr($this->option_name); ?>[socolive_match_schedule_list_ads][mobile_html][]"
                              placeholder='<ins data-z="1152" data-revive-id="..."></ins>'><?php echo esc_textarea($mobile_html); ?></textarea>
                </div>
                <div class="dv2-match-list-ad-field dv2-match-list-ad-field--number">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Number item render PC', 'dv2-streaming'); ?></label>
                    <input type="number"
                           min="1"
                           step="1"
                           class="small-text"
                           name="<?php echo esc_attr($this->option_name); ?>[socolive_match_schedule_list_ads][render_after_desktop][]"
                           value="<?php echo esc_attr($render_after_desktop > 0 ? $render_after_desktop : 4); ?>" />
                </div>
                <div class="dv2-match-list-ad-field dv2-match-list-ad-field--number">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Number item render Mobile', 'dv2-streaming'); ?></label>
                    <input type="number"
                           min="1"
                           step="1"
                           class="small-text"
                           name="<?php echo esc_attr($this->option_name); ?>[socolive_match_schedule_list_ads][render_after_mobile][]"
                           value="<?php echo esc_attr($render_after_mobile > 0 ? $render_after_mobile : 4); ?>" />
                </div>
            </div>
            <div class="dv2-match-list-ad-actions">
                <button type="button" class="button dv2-match-schedule-list-ads-remove" aria-label="<?php echo esc_attr__('Xóa block ads', 'dv2-streaming'); ?>">−</button>
            </div>
        </div>
        <?php
    }

    public function render_field_socolive_highlight_list_ads_repeat() {
        $value = self::get_socolive_highlight_list_ads_repeat();
        ?>
        <label>
            <input type="checkbox"
                   name="<?php echo esc_attr($this->option_name); ?>[socolive_highlight_list_ads_repeat]"
                   value="1"
                   <?php checked($value); ?> />
            <?php echo esc_html__('Lặp lại block ads theo chu kỳ (1, 2, 3, 1, 2, 3...)', 'dv2-streaming'); ?>
        </label>
        <p class="description">
            <?php echo esc_html__('Bật: chèn lại cho đến khi hết item. Tắt: mỗi block chỉ chèn 1 lần.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    public function render_field_socolive_highlight_list_ads() {
        $items = self::get_option('socolive_highlight_list_ads', array());
        if (!is_array($items)) {
            $items = array();
        }
        ?>
        <div class="dv2-match-list-ads-field" id="dv2-highlight-list-ads-field">
            <div class="dv2-match-list-ads-list">
                <?php foreach ($items as $item) : ?>
                    <?php
                    $desktop_html = is_array($item) && isset($item['desktop_html']) ? (string) $item['desktop_html'] : '';
                    $mobile_html = is_array($item) && isset($item['mobile_html']) ? (string) $item['mobile_html'] : '';
                    $legacy_render_after = is_array($item) && isset($item['render_after']) ? absint($item['render_after']) : 0;
                    $render_after_desktop = is_array($item) && isset($item['render_after_desktop']) ? absint($item['render_after_desktop']) : $legacy_render_after;
                    $render_after_mobile = is_array($item) && isset($item['render_after_mobile']) ? absint($item['render_after_mobile']) : $legacy_render_after;
                    $this->render_socolive_highlight_list_ad_row($desktop_html, $mobile_html, $render_after_desktop, $render_after_mobile);
                    ?>
                <?php endforeach; ?>
            </div>
            <p>
                <button type="button" class="button button-secondary dv2-highlight-list-ads-add">
                    <?php echo esc_html__('+ Thêm block ads', 'dv2-streaming'); ?>
                </button>
            </p>
            <p class="description">
                <?php echo esc_html__('Ads đan xen trong danh sách highlights. Mỗi block gồm HTML desktop, HTML mobile và số item render riêng cho desktop/mobile. Các block tính tuần tự: block 1 sau N item, block 2 sau thêm M item nữa, v.v. Nếu không đủ item cho block tiếp theo, ads vẫn hiện ở cuối danh sách với số item còn lại, rồi dừng — không hiện các block phía sau. Để trống HTML thì block không hiển thị. Áp dụng cho shortcode: [highlights], [highlights_moi_nhat].', 'dv2-streaming'); ?>
            </p>
        </div>
        <script type="text/template" id="dv2-highlight-list-ad-row-template">
            <?php $this->render_socolive_highlight_list_ad_row('', '', 4, 4); ?>
        </script>
        <?php
    }

    private function render_socolive_highlight_list_ad_row($desktop_html = '', $mobile_html = '', $render_after_desktop = 4, $render_after_mobile = 4) {
        ?>
        <div class="dv2-match-list-ad-row"<?php echo ($desktop_html === '' && $mobile_html === '') ? ' data-template="1"' : ''; ?>>
            <div class="dv2-match-list-ad-fields">
                <div class="dv2-match-list-ad-field">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Ads desktop', 'dv2-streaming'); ?></label>
                    <textarea rows="4"
                              class="large-text code"
                              name="<?php echo esc_attr($this->option_name); ?>[socolive_highlight_list_ads][desktop_html][]"
                              placeholder='<ins data-z="1149" data-revive-id="..."></ins>'><?php echo esc_textarea($desktop_html); ?></textarea>
                </div>
                <div class="dv2-match-list-ad-field">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Ads mobile', 'dv2-streaming'); ?></label>
                    <textarea rows="4"
                              class="large-text code"
                              name="<?php echo esc_attr($this->option_name); ?>[socolive_highlight_list_ads][mobile_html][]"
                              placeholder='<ins data-z="1152" data-revive-id="..."></ins>'><?php echo esc_textarea($mobile_html); ?></textarea>
                </div>
                <div class="dv2-match-list-ad-field dv2-match-list-ad-field--number">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Number item render PC', 'dv2-streaming'); ?></label>
                    <input type="number"
                           min="1"
                           step="1"
                           class="small-text"
                           name="<?php echo esc_attr($this->option_name); ?>[socolive_highlight_list_ads][render_after_desktop][]"
                           value="<?php echo esc_attr($render_after_desktop > 0 ? $render_after_desktop : 4); ?>" />
                </div>
                <div class="dv2-match-list-ad-field dv2-match-list-ad-field--number">
                    <label class="dv2-match-list-ad-label"><?php echo esc_html__('Number item render Mobile', 'dv2-streaming'); ?></label>
                    <input type="number"
                           min="1"
                           step="1"
                           class="small-text"
                           name="<?php echo esc_attr($this->option_name); ?>[socolive_highlight_list_ads][render_after_mobile][]"
                           value="<?php echo esc_attr($render_after_mobile > 0 ? $render_after_mobile : 4); ?>" />
                </div>
            </div>
            <div class="dv2-match-list-ad-actions">
                <button type="button" class="button dv2-highlight-list-ads-remove" aria-label="<?php echo esc_attr__('Xóa block ads', 'dv2-streaming'); ?>">−</button>
            </div>
        </div>
        <?php
    }

    public function render_field_socolive_home_bet_button_footer() {
        $options = get_option($this->option_name, array());
        $value = array_key_exists('socolive_home_bet_button_footer', $options)
            ? (string) $options['socolive_home_bet_button_footer']
            : '';
        ?>
        <textarea id="socolive_home_bet_button_footer"
                  name="<?php echo esc_attr($this->option_name); ?>[socolive_home_bet_button_footer]"
                  rows="4"
                  class="large-text code"><?php echo esc_textarea($value); ?></textarea>
        <p class="description">
            <?php echo esc_html__('HTML banner footer trong khối BLV (thường là thẻ <a> chứa <img>). Để trống sẽ không hiển thị.', 'dv2-streaming'); ?>
        </p>
        <?php
    }

    /**
     * Sanitize and validate settings
     */
    public function sanitize_settings($input) {
        $existing = get_option($this->option_name, array());
        $sanitized = is_array($existing) ? $existing : array();
        
         // Sanitize link bet
        if (isset($input['dv2_link_bet'])) {
            $sanitized['dv2_link_bet'] = sanitize_text_field(
                trim($input['dv2_link_bet'])
            );
        }

        if (isset($input['dv2_priority_competition_id'])) {
            $sanitized['dv2_priority_competition_id'] = sanitize_text_field(
                trim($input['dv2_priority_competition_id'])
            );
        }

        if (isset($input['tvc_upload_api_url'])) {
            $url = trim((string) wp_unslash($input['tvc_upload_api_url']));
            if ($url === '') {
                $sanitized['tvc_upload_api_url'] = '';
            } elseif (filter_var($url, FILTER_VALIDATE_URL) && preg_match('/^https?:\/\//i', $url)) {
                $sanitized['tvc_upload_api_url'] = esc_url_raw($url);
            } else {
                add_settings_error(
                    $this->option_name,
                    'invalid_tvc_upload_api_url',
                    __('Upload API URL phải là URL hợp lệ (http:// hoặc https://).', 'dv2-streaming'),
                    'error'
                );
            }
        }

        if (isset($input['tvc_upload_api_token'])) {
            $submitted = trim((string) wp_unslash($input['tvc_upload_api_token']));
            $existing_stored_token = DV2_TVC_S3_Uploader::get_stored_upload_api_token();

            if ($submitted === '') {
                $sanitized['tvc_upload_api_token'] = $existing_stored_token;
            } else {
                $sanitized['tvc_upload_api_token'] = sanitize_text_field($submitted);
            }
        }

        $vb2_defaults = self::get_vb2_stream_chrome_defaults();
        $allowed_ad_html = self::get_vb2_stream_chrome_ad_allowed_html();

        foreach (
            array(
                'vb2_stream_chrome_header_ad',
                'vb2_stream_chrome_ft_head_ad',
                'vb2_stream_chrome_ft_left_ad',
                'vb2_stream_chrome_ft_right_ad',
                'vb2_stream_chrome_right_ad',
            ) as $ad_key
        ) {
            if (!isset($input[$ad_key])) {
                continue;
            }
            $ad_html = trim($input[$ad_key]);
            $sanitized[$ad_key] = $ad_html !== ''
                ? wp_kses($ad_html, $allowed_ad_html)
                : $vb2_defaults[$ad_key];
        }

        if (!empty($input['tvc_videos_present'])) {
            $sanitized['tvc_videos'] = array();
            $raw_ids = isset($input['tvc_videos']) && is_array($input['tvc_videos'])
                ? $input['tvc_videos']
                : array();
            $raw_redirects = isset($input['tvc_redirect_urls']) && is_array($input['tvc_redirect_urls'])
                ? $input['tvc_redirect_urls']
                : array();
            $raw_s3_urls = isset($input['tvc_s3_urls']) && is_array($input['tvc_s3_urls'])
                ? $input['tvc_s3_urls']
                : array();
            $raw_labels = isset($input['tvc_labels']) && is_array($input['tvc_labels'])
                ? $input['tvc_labels']
                : array();
            $existing_by_id = self::index_tvc_items_by_id($existing['tvc_videos'] ?? array());
            $seen_ids = array();
            $seen_s3_urls = array();

            foreach ($raw_ids as $index => $attachment_id) {
                $attachment_id = absint($attachment_id);
                $redirect_url = isset($raw_redirects[$index])
                    ? sanitize_text_field(wp_unslash($raw_redirects[$index]))
                    : '';
                $label = isset($raw_labels[$index])
                    ? sanitize_text_field(wp_unslash($raw_labels[$index]))
                    : '';
                $submitted_s3_url = isset($raw_s3_urls[$index])
                    ? esc_url_raw(wp_unslash($raw_s3_urls[$index]))
                    : '';

                if ($submitted_s3_url !== '' && self::is_valid_tvc_s3_url($submitted_s3_url)) {
                    if (isset($seen_s3_urls[$submitted_s3_url])) {
                        continue;
                    }

                    if ($label === '') {
                        $path = wp_parse_url($submitted_s3_url, PHP_URL_PATH);
                        $label = $path ? sanitize_file_name(wp_basename($path)) : '';
                    }

                    $sanitized['tvc_videos'][] = array(
                        'id' => 0,
                        'redirect_url' => $redirect_url,
                        's3_url' => $submitted_s3_url,
                        'label' => $label,
                    );
                    $seen_s3_urls[$submitted_s3_url] = true;
                    continue;
                }

                if (!$attachment_id || isset($seen_ids[$attachment_id])) {
                    continue;
                }

                $mime = get_post_mime_type($attachment_id);
                if (!$mime || strpos($mime, 'video/') !== 0) {
                    continue;
                }

                if (!get_post($attachment_id)) {
                    continue;
                }

                $s3_url = self::resolve_tvc_s3_url($attachment_id, $existing_by_id);
                if ($s3_url !== '') {
                    $attachment_id = 0;
                }

                $sanitized['tvc_videos'][] = array(
                    'id' => $attachment_id,
                    'redirect_url' => $redirect_url,
                    's3_url' => $s3_url,
                    'label' => $label,
                );
                if ($attachment_id) {
                    $seen_ids[$attachment_id] = true;
                } elseif ($s3_url !== '') {
                    $seen_s3_urls[$s3_url] = true;
                }
            }
        }

        if (isset($input['vb2_hot18_poster_id'])) {
            $attachment_id = absint($input['vb2_hot18_poster_id']);
            if ($attachment_id) {
                $mime = get_post_mime_type($attachment_id);
                if ($mime && strpos($mime, 'image/') === 0 && get_post($attachment_id)) {
                    $sanitized['vb2_hot18_poster_id'] = $attachment_id;
                } else {
                    $sanitized['vb2_hot18_poster_id'] = 0;
                }
            } else {
                $sanitized['vb2_hot18_poster_id'] = 0;
            }
        }

        if (isset($input['vb2_stream_odds_panel_image_id'])) {
            $attachment_id = absint($input['vb2_stream_odds_panel_image_id']);
            if ($attachment_id) {
                $mime = get_post_mime_type($attachment_id);
                if ($mime && strpos($mime, 'image/') === 0 && get_post($attachment_id)) {
                    $sanitized['vb2_stream_odds_panel_image_id'] = $attachment_id;
                } else {
                    $sanitized['vb2_stream_odds_panel_image_id'] = 0;
                }
            } else {
                $sanitized['vb2_stream_odds_panel_image_id'] = 0;
            }
        }

        if (isset($input['vb2_stream_odds_panel_link'])) {
            $sanitized['vb2_stream_odds_panel_link'] = sanitize_text_field(
                trim((string) $input['vb2_stream_odds_panel_link'])
            );
        }

        if (!empty($input['socolive_home_bet_buttons_present'])) {
            $sanitized['socolive_home_bet_button_list'] = array();
            $allowed_html = self::get_vb2_stream_chrome_ad_allowed_html();
            $raw_items = isset($input['socolive_home_bet_button_list']) && is_array($input['socolive_home_bet_button_list'])
                ? $input['socolive_home_bet_button_list']
                : array();

            foreach ($raw_items as $html) {
                $html = trim((string) wp_unslash($html));
                if ($html === '') {
                    continue;
                }
                $sanitized['socolive_home_bet_button_list'][] = wp_kses($html, $allowed_html);
            }
        }

        if (isset($input['socolive_home_bet_button_footer'])) {
            $footer_html = trim((string) wp_unslash($input['socolive_home_bet_button_footer']));
            $sanitized['socolive_home_bet_button_footer'] = $footer_html !== ''
                ? wp_kses($footer_html, self::get_vb2_stream_chrome_ad_allowed_html())
                : '';
        }

        if (isset($input['socolive_home_bet_button_header'])) {
            $header_html = trim((string) wp_unslash($input['socolive_home_bet_button_header']));
            $sanitized['socolive_home_bet_button_header'] = $header_html !== ''
                ? wp_kses($header_html, self::get_vb2_stream_chrome_ad_allowed_html())
                : '';
        }

        if (!empty($input['socolive_stream_bet_buttons_present'])) {
            $sanitized['socolive_stream_bet_button_list'] = array();
            $allowed_html = self::get_vb2_stream_chrome_ad_allowed_html();
            $raw_items = isset($input['socolive_stream_bet_button_list']) && is_array($input['socolive_stream_bet_button_list'])
                ? $input['socolive_stream_bet_button_list']
                : array();

            foreach ($raw_items as $html) {
                $html = trim((string) wp_unslash($html));
                if ($html === '') {
                    continue;
                }
                $sanitized['socolive_stream_bet_button_list'][] = wp_kses($html, $allowed_html);
            }
        }

        if (!empty($input['socolive_match_list_ads_present'])) {
            if (isset($input['socolive_match_list_ads_mobile_breakpoint'])) {
                $breakpoint = absint($input['socolive_match_list_ads_mobile_breakpoint']);
                $sanitized['socolive_match_list_ads_mobile_breakpoint'] = $breakpoint > 0
                    ? min($breakpoint, 3840)
                    : 768;
            }

            $sanitized['socolive_match_list_ads_repeat'] = !empty($input['socolive_match_list_ads_repeat']) ? 1 : 0;

            if (isset($input['socolive_match_schedule_list_ads_mobile_breakpoint'])) {
                $schedule_breakpoint = absint($input['socolive_match_schedule_list_ads_mobile_breakpoint']);
                $sanitized['socolive_match_schedule_list_ads_mobile_breakpoint'] = $schedule_breakpoint > 0
                    ? min($schedule_breakpoint, 3840)
                    : 768;
            }

            $sanitized['socolive_match_schedule_list_ads_repeat'] = !empty($input['socolive_match_schedule_list_ads_repeat']) ? 1 : 0;

            $sanitized['socolive_match_list_ads'] = array();
            $allowed_html = self::get_vb2_stream_chrome_ad_allowed_html();
            $raw_ads = isset($input['socolive_match_list_ads']) && is_array($input['socolive_match_list_ads'])
                ? $input['socolive_match_list_ads']
                : array();
            $desktop_items = isset($raw_ads['desktop_html']) && is_array($raw_ads['desktop_html'])
                ? $raw_ads['desktop_html']
                : array();
            $mobile_items = isset($raw_ads['mobile_html']) && is_array($raw_ads['mobile_html'])
                ? $raw_ads['mobile_html']
                : array();
            $legacy_render_after_items = isset($raw_ads['render_after']) && is_array($raw_ads['render_after'])
                ? $raw_ads['render_after']
                : array();
            $render_after_desktop_items = isset($raw_ads['render_after_desktop']) && is_array($raw_ads['render_after_desktop'])
                ? $raw_ads['render_after_desktop']
                : array();
            $render_after_mobile_items = isset($raw_ads['render_after_mobile']) && is_array($raw_ads['render_after_mobile'])
                ? $raw_ads['render_after_mobile']
                : array();

            $total_items = max(count($desktop_items), count($mobile_items), count($legacy_render_after_items), count($render_after_desktop_items), count($render_after_mobile_items));

            for ($index = 0; $index < $total_items; $index++) {
                $desktop_html = isset($desktop_items[$index]) ? trim((string) wp_unslash($desktop_items[$index])) : '';
                $mobile_html = isset($mobile_items[$index]) ? trim((string) wp_unslash($mobile_items[$index])) : '';
                $legacy_render_after = isset($legacy_render_after_items[$index]) ? absint($legacy_render_after_items[$index]) : 0;
                $render_after_desktop = isset($render_after_desktop_items[$index]) ? absint($render_after_desktop_items[$index]) : $legacy_render_after;
                $render_after_mobile = isset($render_after_mobile_items[$index]) ? absint($render_after_mobile_items[$index]) : $legacy_render_after;

                if ($desktop_html === '' && $mobile_html === '') {
                    continue;
                }

                if ($render_after_desktop <= 0 && $render_after_mobile <= 0) {
                    continue;
                }

                $sanitized['socolive_match_list_ads'][] = array(
                    'desktop_html' => $desktop_html !== '' ? wp_kses($desktop_html, $allowed_html) : '',
                    'mobile_html' => $mobile_html !== '' ? wp_kses($mobile_html, $allowed_html) : '',
                    'render_after_desktop' => $render_after_desktop > 0 ? $render_after_desktop : 4,
                    'render_after_mobile' => $render_after_mobile > 0 ? $render_after_mobile : 4,
                );
            }

            $sanitized['socolive_match_schedule_list_ads'] = array();
            $raw_schedule_ads = isset($input['socolive_match_schedule_list_ads']) && is_array($input['socolive_match_schedule_list_ads'])
                ? $input['socolive_match_schedule_list_ads']
                : array();
            $schedule_desktop_items = isset($raw_schedule_ads['desktop_html']) && is_array($raw_schedule_ads['desktop_html'])
                ? $raw_schedule_ads['desktop_html']
                : array();
            $schedule_mobile_items = isset($raw_schedule_ads['mobile_html']) && is_array($raw_schedule_ads['mobile_html'])
                ? $raw_schedule_ads['mobile_html']
                : array();
            $schedule_legacy_render_after_items = isset($raw_schedule_ads['render_after']) && is_array($raw_schedule_ads['render_after'])
                ? $raw_schedule_ads['render_after']
                : array();
            $schedule_render_after_desktop_items = isset($raw_schedule_ads['render_after_desktop']) && is_array($raw_schedule_ads['render_after_desktop'])
                ? $raw_schedule_ads['render_after_desktop']
                : array();
            $schedule_render_after_mobile_items = isset($raw_schedule_ads['render_after_mobile']) && is_array($raw_schedule_ads['render_after_mobile'])
                ? $raw_schedule_ads['render_after_mobile']
                : array();

            $schedule_total_items = max(
                count($schedule_desktop_items),
                count($schedule_mobile_items),
                count($schedule_legacy_render_after_items),
                count($schedule_render_after_desktop_items),
                count($schedule_render_after_mobile_items)
            );

            for ($schedule_index = 0; $schedule_index < $schedule_total_items; $schedule_index++) {
                $schedule_desktop_html = isset($schedule_desktop_items[$schedule_index]) ? trim((string) wp_unslash($schedule_desktop_items[$schedule_index])) : '';
                $schedule_mobile_html = isset($schedule_mobile_items[$schedule_index]) ? trim((string) wp_unslash($schedule_mobile_items[$schedule_index])) : '';
                $schedule_legacy_render_after = isset($schedule_legacy_render_after_items[$schedule_index]) ? absint($schedule_legacy_render_after_items[$schedule_index]) : 0;
                $schedule_render_after_desktop = isset($schedule_render_after_desktop_items[$schedule_index]) ? absint($schedule_render_after_desktop_items[$schedule_index]) : $schedule_legacy_render_after;
                $schedule_render_after_mobile = isset($schedule_render_after_mobile_items[$schedule_index]) ? absint($schedule_render_after_mobile_items[$schedule_index]) : $schedule_legacy_render_after;

                if ($schedule_desktop_html === '' && $schedule_mobile_html === '') {
                    continue;
                }

                if ($schedule_render_after_desktop <= 0 && $schedule_render_after_mobile <= 0) {
                    continue;
                }

                $sanitized['socolive_match_schedule_list_ads'][] = array(
                    'desktop_html' => $schedule_desktop_html !== '' ? wp_kses($schedule_desktop_html, $allowed_html) : '',
                    'mobile_html' => $schedule_mobile_html !== '' ? wp_kses($schedule_mobile_html, $allowed_html) : '',
                    'render_after_desktop' => $schedule_render_after_desktop > 0 ? $schedule_render_after_desktop : 4,
                    'render_after_mobile' => $schedule_render_after_mobile > 0 ? $schedule_render_after_mobile : 4,
                );
            }

            if (isset($input['socolive_highlight_list_ads_mobile_breakpoint'])) {
                $highlight_breakpoint = absint($input['socolive_highlight_list_ads_mobile_breakpoint']);
                $sanitized['socolive_highlight_list_ads_mobile_breakpoint'] = $highlight_breakpoint > 0
                    ? min($highlight_breakpoint, 3840)
                    : 768;
            }

            $sanitized['socolive_highlight_list_ads_repeat'] = !empty($input['socolive_highlight_list_ads_repeat']) ? 1 : 0;

            $sanitized['socolive_highlight_list_ads'] = array();
            $raw_highlight_ads = isset($input['socolive_highlight_list_ads']) && is_array($input['socolive_highlight_list_ads'])
                ? $input['socolive_highlight_list_ads']
                : array();
            $highlight_desktop_items = isset($raw_highlight_ads['desktop_html']) && is_array($raw_highlight_ads['desktop_html'])
                ? $raw_highlight_ads['desktop_html']
                : array();
            $highlight_mobile_items = isset($raw_highlight_ads['mobile_html']) && is_array($raw_highlight_ads['mobile_html'])
                ? $raw_highlight_ads['mobile_html']
                : array();
            $highlight_legacy_render_after_items = isset($raw_highlight_ads['render_after']) && is_array($raw_highlight_ads['render_after'])
                ? $raw_highlight_ads['render_after']
                : array();
            $highlight_render_after_desktop_items = isset($raw_highlight_ads['render_after_desktop']) && is_array($raw_highlight_ads['render_after_desktop'])
                ? $raw_highlight_ads['render_after_desktop']
                : array();
            $highlight_render_after_mobile_items = isset($raw_highlight_ads['render_after_mobile']) && is_array($raw_highlight_ads['render_after_mobile'])
                ? $raw_highlight_ads['render_after_mobile']
                : array();

            $highlight_total_items = max(
                count($highlight_desktop_items),
                count($highlight_mobile_items),
                count($highlight_legacy_render_after_items),
                count($highlight_render_after_desktop_items),
                count($highlight_render_after_mobile_items)
            );

            for ($highlight_index = 0; $highlight_index < $highlight_total_items; $highlight_index++) {
                $highlight_desktop_html = isset($highlight_desktop_items[$highlight_index]) ? trim((string) wp_unslash($highlight_desktop_items[$highlight_index])) : '';
                $highlight_mobile_html = isset($highlight_mobile_items[$highlight_index]) ? trim((string) wp_unslash($highlight_mobile_items[$highlight_index])) : '';
                $highlight_legacy_render_after = isset($highlight_legacy_render_after_items[$highlight_index]) ? absint($highlight_legacy_render_after_items[$highlight_index]) : 0;
                $highlight_render_after_desktop = isset($highlight_render_after_desktop_items[$highlight_index]) ? absint($highlight_render_after_desktop_items[$highlight_index]) : $highlight_legacy_render_after;
                $highlight_render_after_mobile = isset($highlight_render_after_mobile_items[$highlight_index]) ? absint($highlight_render_after_mobile_items[$highlight_index]) : $highlight_legacy_render_after;

                if ($highlight_desktop_html === '' && $highlight_mobile_html === '') {
                    continue;
                }

                if ($highlight_render_after_desktop <= 0 && $highlight_render_after_mobile <= 0) {
                    continue;
                }

                $sanitized['socolive_highlight_list_ads'][] = array(
                    'desktop_html' => $highlight_desktop_html !== '' ? wp_kses($highlight_desktop_html, $allowed_html) : '',
                    'mobile_html' => $highlight_mobile_html !== '' ? wp_kses($highlight_mobile_html, $allowed_html) : '',
                    'render_after_desktop' => $highlight_render_after_desktop > 0 ? $highlight_render_after_desktop : 4,
                    'render_after_mobile' => $highlight_render_after_mobile > 0 ? $highlight_render_after_mobile : 4,
                );
            }
        }
        
        // Add more field sanitization here later
        // Example:
        // if (isset($input['field_name'])) {
        //     $sanitized['field_name'] = sanitize_text_field($input['field_name']);
        // }
        
        return $sanitized;
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            wp_die(__('Bạn không có quyền truy cập trang này.', 'dv2-streaming'));
        }
        
        $options = get_option($this->option_name);
        ?>
        <div class="wrap dv2-settings-page">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <?php settings_errors(); ?>
            
            <div class="dv2-settings-container">
                <div class="dv2-settings-main">
                    <form method="post" action="options.php" class="dv2-settings-form">
                        <?php
                        settings_fields($this->option_group);
                        do_settings_sections('dv2-streaming');
                        submit_button(__('Lưu cài đặt', 'dv2-streaming'));
                        ?>
                    </form>
                </div>
                
                <div class="dv2-settings-sidebar">
                    <div class="dv2-settings-box">
                        <h3><?php echo esc_html__('Thông tin Plugin', 'dv2-streaming'); ?></h3>
                        <p>
                            <strong><?php echo esc_html__('Phiên bản:', 'dv2-streaming'); ?></strong> 
                            <?php echo esc_html(DV2_STREAMING_VERSION); ?>
                        </p>
                        <p>
                            <strong><?php echo esc_html__('Tác giả:', 'dv2-streaming'); ?></strong> 
                            A Luck
                        </p>
                    </div>
                    
                    <div class="dv2-settings-box">
                        <h3><?php echo esc_html__('Thao tác nhanh', 'dv2-streaming'); ?></h3>
                        <p>
                            <a href="<?php echo admin_url('admin.php?page=dv2-how-to-use'); ?>" class="button button-primary">
                                <span class="dashicons dashicons-welcome-learn-more"></span>
                                <?php echo esc_html__('Hướng dẫn sử dụng', 'dv2-streaming'); ?>
                            </a>
                        </p>
                    </div>
                    
                    <div class="dv2-settings-box">
                        <h3><?php echo esc_html__('Cài đặt hiện tại', 'dv2-streaming'); ?></h3>
                        <?php if (!empty($options['dv2_link_bet'])) : ?>
                            <p>
                                <strong><?php echo esc_html__('Link đặt cược:', 'dv2-streaming'); ?></strong><br>
                                <code><?php echo esc_html($options['dv2_link_bet']); ?></code>
                            </p>
                        <?php endif; ?>
                        <?php
                        $tvc_count = count(self::get_tvc_video_urls());
                        if ($tvc_count > 0) :
                        ?>
                            <p>
                                <strong><?php echo esc_html__('Video TVC:', 'dv2-streaming'); ?></strong><br>
                                <?php
                                echo esc_html(
                                    sprintf(
                                        /* translators: %d: number of TVC videos */
                                        _n('%d video', '%d videos', $tvc_count, 'dv2-streaming'),
                                        $tvc_count
                                    )
                                );
                                ?>
                            </p>
                        <?php endif; ?>
                        <?php if (empty($options['dv2_link_bet']) && $tvc_count === 0) : ?>
                            <p class="description">
                                <?php echo esc_html__('No settings configured yet.', 'dv2-streaming'); ?>
                            </p>
                        <?php endif; ?>
                    </div>
                    
                    <div class="dv2-settings-box dv2-help-box">
                        <h3><?php echo esc_html__('Need Help?', 'dv2-streaming'); ?></h3>
                        <ul>
                            <li>
                                <a href="<?php echo esc_url(DV2_STREAMING_PLUGIN_URL . 'README.md'); ?>" target="_blank">
                                    <?php echo esc_html__('Documentation', 'dv2-streaming'); ?>
                                </a>
                            </li>
                            <li>
                                <a href="<?php echo esc_url(DV2_STREAMING_PLUGIN_URL . 'SHORTCODES-REFERENCE.md'); ?>" target="_blank">
                                    <?php echo esc_html__('Shortcodes Reference', 'dv2-streaming'); ?>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    public function render_ads_match_list_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('Bạn không có quyền truy cập trang này.', 'dv2-streaming'));
        }
        ?>
        <div class="wrap dv2-settings-page">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <?php settings_errors(); ?>

            <div class="dv2-settings-container">
                <div class="dv2-settings-main">
                    <form method="post" action="options.php" class="dv2-settings-form">
                        <?php
                        settings_fields($this->option_group);
                        do_settings_sections('dv2-streaming-ads-match-list');
                        submit_button(__('Lưu cài đặt', 'dv2-streaming'));
                        ?>
                    </form>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Enqueue settings page assets
     */
    public function enqueue_settings_assets($hook) {
        // Only load on our settings page
        if (
            $hook !== 'toplevel_page_dv2-streaming'
            && $hook !== 'dv2-streaming_page_dv2-streaming'
            && $hook !== 'dv2-streaming_page_dv2-streaming-ads-match-list'
        ) {
            return;
        }
        
        // Add inline CSS for settings page
        wp_add_inline_style('wp-admin', $this->get_settings_css());
        
        wp_enqueue_media();

        wp_register_script('dv2-settings-tvc', false, array('jquery'), DV2_STREAMING_VERSION, true);
        wp_enqueue_script('dv2-settings-tvc');
        wp_localize_script('dv2-settings-tvc', 'dv2TvcUpload', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('dv2_tvc_s3_upload'),
            'storageEnabled' => DV2_TVC_S3_Uploader::uses_direct_upload(),
            'uploadingText' => __('Đang upload lên Storage…', 'dv2-streaming'),
            'uploadFailedText' => __('Upload Storage thất bại.', 'dv2-streaming'),
            'tooLargeText' => __('File quá lớn. Tăng upload_max_filesize và post_max_size trong PHP.', 'dv2-streaming'),
        ));
        wp_add_inline_script('dv2-settings-tvc', $this->get_settings_js());
    }
    
    /**
     * Get settings page CSS
     */
    private function get_settings_css() {
        return '
            .dv2-settings-container {
                display: flex;
                gap: 2rem;
                margin-top: 20px;
                flex-flow: column;
            }
            
            .dv2-settings-main {
                position: relative;
            }
            
            .dv2-settings-sidebar {
                position: relative;
            }
            
            .dv2-settings-box {
                background: #fff;
                border: 1px solid #ccd0d4;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                box-shadow: 0 1px 1px rgba(0,0,0,.04);
            }
            
            .dv2-settings-box h3 {
                margin-top: 0;
                margin-bottom: 1rem;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                color: #23282d;
            }
            
            .dv2-settings-box p {
                margin: 0.5rem 0;
            }
            
            .dv2-settings-box .button {
                width: 100%;
                text-align: center;
                margin-bottom: 0.5rem;
            }
            
            .dv2-settings-box ul {
                margin: 0;
                padding-left: 1.5rem;
            }
            
            .dv2-settings-box ul li {
                margin: 0.5rem 0;
            }
            
            .dv2-help-box {
                background: #f0f6fc;
                border-color: #c3dafe;
            }
            
            .dv2-url-field {
                width: 100%;
            }
            
            .dv2-url-validation {
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 13px;
            }
            
            .dv2-url-validation.success {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            
            .dv2-url-validation.error {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
            }
            
            .dv2-validation-message:before {
                font-family: dashicons;
                margin-right: 5px;
            }
            
            .dv2-url-validation.success .dv2-validation-message:before {
                content: "\\f147";
                color: #155724;
            }
            
            .dv2-url-validation.error .dv2-validation-message:before {
                content: "\\f534";
                color: #721c24;
            }
            
            .dv2-settings-form .form-table th {
                padding-left: 0;
            }

            .dv2-tvc-videos-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 12px;
            }

            .dv2-media-upload-field .dv2-media-preview {
                margin-bottom: 10px;
            }

            .dv2-media-upload-field .dv2-media-preview img {
                display: block;
                max-width: 320px;
                max-height: 180px;
                width: auto;
                height: auto;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                background: #fff;
            }

            .dv2-media-upload-field .dv2-media-remove-btn {
                margin-left: 8px;
            }

            .dv2-tvc-video-row {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px;
                background: #f6f7f7;
                border: 1px solid #dcdcde;
                border-radius: 4px;
            }

            .dv2-tvc-video-fields {
                display: flex;
                flex: 1;
                gap: 12px;
                min-width: 0;
            }

            .dv2-tvc-video-url-group,
            .dv2-tvc-video-redirect {
                flex: 1;
                min-width: 0;
            }

            .dv2-tvc-video-field-label {
                display: block;
                margin-bottom: 4px;
                font-size: 12px;
                color: #646970;
            }

            .dv2-tvc-video-url-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .dv2-tvc-video-url {
                flex: 1;
                min-width: 0;
                width: 100%;
            }

            .dv2-tvc-video-redirect-url {
                width: 100%;
            }

            .dv2-tvc-video-preview {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-shrink: 0;
                max-width: 220px;
            }

            .dv2-tvc-video-preview video {
                width: 120px;
                height: 68px;
                object-fit: cover;
                background: #000;
                border-radius: 4px;
            }

            .dv2-tvc-video-label {
                font-size: 13px;
                color: #1d2327;
                word-break: break-word;
            }

            .dv2-tvc-video-actions {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                flex-shrink: 0;
                padding-top: 22px;
            }

            .dv2-tvc-video-remove {
                min-width: 36px;
                padding-left: 0;
                padding-right: 0;
                font-size: 18px;
                line-height: 1;
            }

            .dv2-scl-bet-buttons-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 12px;
            }

            .dv2-scl-bet-btn-row {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px;
                background: #f6f7f7;
                border: 1px solid #dcdcde;
                border-radius: 4px;
            }

            .dv2-scl-bet-btn-row textarea {
                flex: 1;
                min-width: 0;
            }

            .dv2-scl-bet-btn-actions {
                flex-shrink: 0;
            }

            .dv2-scl-bet-btn-remove {
                min-width: 36px;
                padding-left: 0;
                padding-right: 0;
                font-size: 18px;
                line-height: 1;
            }

            .dv2-match-list-ads-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 12px;
            }

            #dv2-match-list-ads-field,
            #dv2-match-schedule-list-ads-field,
            #dv2-highlight-list-ads-field {
                padding: 14px;
                border: 1px solid #dcdcde;
                border-radius: 6px;
                background: #fff;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
            }

            #dv2-match-list-ads-field {
                border-left: 4px solid #2271b1;
                background: #f8fbff;
            }

            #dv2-match-schedule-list-ads-field {
                border-left: 4px solid #2a8f45;
                background: #f7fcf8;
            }

            #dv2-highlight-list-ads-field {
                border-left: 4px solid #d63638;
                background: #fff8f8;
            }

            #dv2-match-list-ads-field > .description,
            #dv2-match-schedule-list-ads-field > .description,
            #dv2-highlight-list-ads-field > .description {
                margin-top: 6px;
                margin-bottom: 0;
            }

            .dv2-match-list-ad-row {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px;
                background: #f6f7f7;
                border: 1px solid #dcdcde;
                border-radius: 4px;
            }

            .dv2-match-list-ad-fields {
                display: flex;
                flex: 1;
                gap: 12px;
                min-width: 0;
            }

            .dv2-match-list-ad-field {
                flex: 1;
                min-width: 0;
            }

            .dv2-match-list-ad-field--number {
                flex: 0 0 180px;
            }

            .dv2-match-list-ad-label {
                display: block;
                margin-bottom: 6px;
                font-size: 12px;
                color: #646970;
            }

            .dv2-match-list-ad-actions {
                flex-shrink: 0;
            }

            .dv2-match-list-ads-remove {
                min-width: 36px;
                padding-left: 0;
                padding-right: 0;
                font-size: 18px;
                line-height: 1;
            }
            
            @media (max-width: 782px) {
                .dv2-settings-container {
                    flex-direction: column;
                }
                
                .dv2-settings-sidebar {
                    flex: 1;
                }

                .dv2-match-list-ad-row,
                .dv2-match-list-ad-fields {
                    flex-direction: column;
                }

                .dv2-match-list-ad-field--number {
                    flex-basis: auto;
                }
            }
        ';
    }
    
    /**
     * Get settings page JavaScript
     */
    private function get_settings_js() {
        return '
            jQuery(document).ready(function($) {
                // Real-time URL validation
                $(".dv2-url-field").on("blur", function() {
                    var $field = $(this);
                    var $validation = $field.siblings(".dv2-url-validation");
                    var $message = $validation.find(".dv2-validation-message");
                    var url = $field.val().trim();
                    
                    if (url === "") {
                        $validation.hide();
                        return;
                    }
                    
                    // Validate URL format
                    var urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
                    
                    if (urlPattern.test(url)) {
                        $validation.removeClass("error").addClass("success");
                        $message.text("Valid URL format");
                        $validation.show();
                    } else {
                        $validation.removeClass("success").addClass("error");
                        $message.text("Invalid URL format. Must start with http:// or https://");
                        $validation.show();
                    }
                });
                
                // Clear validation on input
                $(".dv2-url-field").on("input", function() {
                    $(this).siblings(".dv2-url-validation").hide();
                });
                
                // Validate on page load
                $(".dv2-url-field").each(function() {
                    if ($(this).val().trim() !== "") {
                        $(this).trigger("blur");
                    }
                });

                $(".dv2-media-upload-field").each(function() {
                    var $field = $(this);
                    var $input = $field.find("input[type=hidden]");
                    var $preview = $field.find(".dv2-media-preview");
                    var $img = $preview.find("img");
                    var $removeBtn = $field.find(".dv2-media-remove-btn");
                    var frame;

                    $field.on("click", ".dv2-media-upload-btn", function(e) {
                        e.preventDefault();

                        if (frame) {
                            frame.open();
                            return;
                        }

                        frame = wp.media({
                            title: "Chọn ảnh",
                            button: { text: "Dùng ảnh này" },
                            library: { type: "image" },
                            multiple: false
                        });

                        frame.on("select", function() {
                            var attachment = frame.state().get("selection").first().toJSON();
                            $input.val(attachment.id);
                            $img.attr("src", attachment.url);
                            $preview.show();
                            $removeBtn.show();
                        });

                        frame.open();
                    });

                    $field.on("click", ".dv2-media-remove-btn", function(e) {
                        e.preventDefault();
                        $input.val("");
                        $img.attr("src", "");
                        $preview.hide();
                        $removeBtn.hide();
                    });
                });

                var $tvcField = $("#dv2-tvc-videos-field");
                if ($tvcField.length) {
                    var $tvcList = $tvcField.find(".dv2-tvc-videos-list");
                    var tvcRowTemplate = $("#dv2-tvc-video-row-template").html() || "";
                    var tvcFrame;
                    var storageEnabled = typeof dv2TvcUpload !== "undefined" && !!dv2TvcUpload.storageEnabled;

                    function createTvcRow() {
                        return $("<div>").html(tvcRowTemplate).find(".dv2-tvc-video-row").first().clone();
                    }

                    function setTvcRowVideo($row, data) {
                        var $input = $row.find(".dv2-tvc-video-id");
                        var $urlInput = $row.find(".dv2-tvc-video-url");
                        var $labelInput = $row.find(".dv2-tvc-video-label-input");
                        var $preview = $row.find(".dv2-tvc-video-preview");
                        var $video = $preview.find("video");
                        var $label = $preview.find(".dv2-tvc-video-label");
                        var videoUrl = data.s3Url || data.url || "";
                        var displayName = data.label || data.filename || videoUrl || "";

                        $input.val(data.id || "");
                        $urlInput.val(videoUrl);
                        $labelInput.val(displayName);
                        $video.attr("src", videoUrl);
                        $label.text(displayName);
                        if (videoUrl) {
                            $preview.show();
                        } else {
                            $preview.hide();
                        }
                    }

                    function clearTvcRowVideo($row) {
                        $row.find(".dv2-tvc-video-id").val("");
                        $row.find(".dv2-tvc-video-url").val("");
                        $row.find(".dv2-tvc-video-label-input").val("");
                        $row.find(".dv2-tvc-video-preview").hide();
                        $row.find("video").attr("src", "");
                        $row.find(".dv2-tvc-video-label").text("");
                        $row.find(".dv2-tvc-video-file-input").val("");
                    }

                    function updateTvcRowFromManualUrl($row, url) {
                        url = (url || "").trim();
                        $row.find(".dv2-tvc-video-id").val("");
                        if (!url) {
                            $row.find(".dv2-tvc-video-label-input").val("");
                            $row.find(".dv2-tvc-video-preview").hide();
                            $row.find("video").attr("src", "");
                            $row.find(".dv2-tvc-video-label").text("");
                            return;
                        }

                        var displayName = url.split("/").pop() || url;
                        $row.find(".dv2-tvc-video-label-input").val(displayName);
                        $row.find("video").attr("src", url);
                        $row.find(".dv2-tvc-video-label").text(displayName);
                        $row.find(".dv2-tvc-video-preview").show();
                    }

                    function uploadTvcViaServer(file, $row, $button) {
                        var originalText = $button.text();
                        $button.prop("disabled", true).text(dv2TvcUpload.uploadingText || "Đang upload lên Storage…");

                        var formData = new FormData();
                        formData.append("action", "dv2_tvc_s3_upload");
                        formData.append("nonce", dv2TvcUpload.nonce);
                        formData.append("video", file);

                        return $.ajax({
                            url: dv2TvcUpload.ajaxUrl,
                            method: "POST",
                            dataType: "json",
                            data: formData,
                            processData: false,
                            contentType: false,
                            timeout: 0
                        }).then(function(response) {
                            if (!response || !response.success || !response.data || !response.data.objectUrl) {
                                throw new Error((response && response.data && response.data.message) || "upload failed");
                            }

                            setTvcRowVideo($row, {
                                id: 0,
                                s3Url: response.data.objectUrl,
                                url: response.data.playbackUrl || response.data.objectUrl,
                                label: response.data.label || file.name
                            });
                        }).catch(function(err) {
                            var message = dv2TvcUpload.uploadFailedText || "Upload Storage thất bại.";
                            if (err && err.status === 413) {
                                message = dv2TvcUpload.tooLargeText || message;
                            } else if (err && err.responseJSON && err.responseJSON.data && err.responseJSON.data.message) {
                                message = err.responseJSON.data.message;
                            }
                            window.alert(message);
                            clearTvcRowVideo($row);
                        }).always(function() {
                            $button.prop("disabled", false).text(originalText);
                        });
                    }

                    function openTvcMediaFrame($row) {
                        if (storageEnabled) {
                            var $fileInput = $row.find(".dv2-tvc-video-file-input");
                            $fileInput.off("change.dv2TvcStorage").on("change.dv2TvcStorage", function() {
                                var file = this.files && this.files[0];
                                $fileInput.val("");
                                if (!file) {
                                    return;
                                }
                                uploadTvcViaServer(file, $row, $row.find(".dv2-tvc-video-select"));
                            });
                            $fileInput.trigger("click");
                            return;
                        }

                        if (tvcFrame) {
                            tvcFrame.off("select");
                        }

                        tvcFrame = wp.media({
                            title: "Chọn video TVC",
                            button: { text: "Dùng video này" },
                            library: { type: "video" },
                            multiple: false
                        });

                        tvcFrame.on("select", function() {
                            var attachment = tvcFrame.state().get("selection").first().toJSON();
                            setTvcRowVideo($row, {
                                id: attachment.id,
                                s3Url: "",
                                url: attachment.url,
                                label: attachment.title || attachment.filename || attachment.url
                            });
                        });

                        tvcFrame.open();
                    }

                    $tvcField.on("click", ".dv2-tvc-video-add", function(e) {
                        e.preventDefault();
                        var $row = createTvcRow();
                        $row.removeAttr("data-template");
                        clearTvcRowVideo($row);
                        $row.find(".dv2-tvc-video-redirect-url").val("");
                        $tvcList.append($row);
                    });

                    $tvcField.on("click", ".dv2-tvc-video-select", function(e) {
                        e.preventDefault();
                        openTvcMediaFrame($(this).closest(".dv2-tvc-video-row"));
                    });

                    $tvcField.on("input change", ".dv2-tvc-video-url", function() {
                        updateTvcRowFromManualUrl($(this).closest(".dv2-tvc-video-row"), $(this).val());
                    });

                    $tvcField.on("click", ".dv2-tvc-video-remove", function(e) {
                        e.preventDefault();
                        $(this).closest(".dv2-tvc-video-row").remove();
                    });
                }

                $(".dv2-scl-bet-buttons-field").each(function() {
                    var $sclBetField = $(this);
                    var $sclBetList = $sclBetField.find(".dv2-scl-bet-buttons-list");
                    var sclBetRowTemplate = $sclBetField.next(\'script[type="text/template"]\').html() || "";

                    function createSclBetRow() {
                        return $("<div>").html(sclBetRowTemplate).find(".dv2-scl-bet-btn-row").first().clone();
                    }

                    $sclBetField.on("click", ".dv2-scl-bet-btn-add", function(e) {
                        e.preventDefault();
                        var $row = createSclBetRow();
                        $row.removeAttr("data-template");
                        $row.find("textarea").val("");
                        $sclBetList.append($row);
                    });

                    $sclBetField.on("click", ".dv2-scl-bet-btn-remove", function(e) {
                        e.preventDefault();
                        $(this).closest(".dv2-scl-bet-btn-row").remove();
                    });
                });

                var $matchListAdsField = $("#dv2-match-list-ads-field");
                if ($matchListAdsField.length) {
                    var $matchListAdsList = $matchListAdsField.find(".dv2-match-list-ads-list");
                    var matchListAdsRowTemplate = $("#dv2-match-list-ad-row-template").html() || "";

                    function createMatchListAdsRow() {
                        return $("<div>").html(matchListAdsRowTemplate).find(".dv2-match-list-ad-row").first().clone();
                    }

                    $matchListAdsField.on("click", ".dv2-match-list-ads-add", function(e) {
                        e.preventDefault();
                        var $row = createMatchListAdsRow();
                        $row.removeAttr("data-template");
                        $row.find("textarea").val("");
                        $row.find(\'input[type="number"]\').val("4");
                        $matchListAdsList.append($row);
                    });

                    $matchListAdsField.on("click", ".dv2-match-list-ads-remove", function(e) {
                        e.preventDefault();
                        $(this).closest(".dv2-match-list-ad-row").remove();
                    });
                }

                var $matchScheduleListAdsField = $("#dv2-match-schedule-list-ads-field");
                if ($matchScheduleListAdsField.length) {
                    var $matchScheduleListAdsList = $matchScheduleListAdsField.find(".dv2-match-list-ads-list");
                    var matchScheduleListAdsRowTemplate = $("#dv2-match-schedule-list-ad-row-template").html() || "";

                    function createMatchScheduleListAdsRow() {
                        return $("<div>").html(matchScheduleListAdsRowTemplate).find(".dv2-match-list-ad-row").first().clone();
                    }

                    $matchScheduleListAdsField.on("click", ".dv2-match-schedule-list-ads-add", function(e) {
                        e.preventDefault();
                        var $row = createMatchScheduleListAdsRow();
                        $row.removeAttr("data-template");
                        $row.find("textarea").val("");
                        $row.find(\'input[type="number"]\').val("4");
                        $matchScheduleListAdsList.append($row);
                    });

                    $matchScheduleListAdsField.on("click", ".dv2-match-schedule-list-ads-remove", function(e) {
                        e.preventDefault();
                        $(this).closest(".dv2-match-list-ad-row").remove();
                    });
                }

                var $highlightListAdsField = $("#dv2-highlight-list-ads-field");
                if ($highlightListAdsField.length) {
                    var $highlightListAdsList = $highlightListAdsField.find(".dv2-match-list-ads-list");
                    var highlightListAdsRowTemplate = $("#dv2-highlight-list-ad-row-template").html() || "";

                    function createHighlightListAdsRow() {
                        return $("<div>").html(highlightListAdsRowTemplate).find(".dv2-match-list-ad-row").first().clone();
                    }

                    $highlightListAdsField.on("click", ".dv2-highlight-list-ads-add", function(e) {
                        e.preventDefault();
                        var $row = createHighlightListAdsRow();
                        $row.removeAttr("data-template");
                        $row.find("textarea").val("");
                        $row.find(\'input[type="number"]\').val("4");
                        $highlightListAdsList.append($row);
                    });

                    $highlightListAdsField.on("click", ".dv2-highlight-list-ads-remove", function(e) {
                        e.preventDefault();
                        $(this).closest(".dv2-match-list-ad-row").remove();
                    });
                }
            });
        ';
    }
    
    /**
     * Get option value
     * 
     * @param string $key Option key
     * @param mixed $default Default value
     * @return mixed
     */
    public static function get_option($key, $default = '') {
        $options = get_option('dv2_streaming_options', array());
        return isset($options[$key]) ? $options[$key] : $default;
    }
    
    /**
     * Update option value
     * 
     * @param string $key Option key
     * @param mixed $value Option value
     * @return bool
     */
    public static function update_option($key, $value) {
        $options = get_option('dv2_streaming_options', array());
        $options[$key] = $value;
        return update_option('dv2_streaming_options', $options);
    }
}

/**
 * Helper function to get DV2 setting
 * 
 * @param string $key Setting key
 * @param mixed $default Default value
 * @return mixed
 */
function dv2_get_setting($key, $default = '') {
    return DV2_Settings::get_option($key, $default);
}

/**
 * Helper function to update DV2 setting
 * 
 * @param string $key Setting key
 * @param mixed $value Setting value
 * @return bool
 */
function dv2_update_setting($key, $value) {
    return DV2_Settings::update_option($key, $value);
}

