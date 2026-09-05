<?php
/**
 * Plugin Name: AI Match Prediction - Sports Widget
 * Plugin URI: https://prediction.thinkwithdev.com
 * Description: Widget AI Dự Đoán & Phân Tích Kèo Bóng Đá Realtime (Hỗ trợ 1-Click Auto Upgrade từ WP Admin)
 * Version: 1.1.2
 * Author: AI Match Prediction SaaS
 * Author URI: https://prediction.thinkwithdev.com
 * License: GPLv2 or later
 * Text Domain: ai-match-prediction
 */

if (!defined('ABSPATH')) {
    exit;
}

class AIMatchPredictionPlugin {
    private static $instance = null;
    private $version = '1.1.2';
    private $slug = 'ai-match-prediction';
    private $api_endpoint = 'https://prediction.thinkwithdev.com';

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        add_action('init', array($this, 'register_shortcodes'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_post_ai_prediction_check_updates', array($this, 'handle_force_check_updates'));
        add_filter('site_transient_update_plugins', array($this, 'check_for_plugin_update'));
        add_filter('plugins_api', array($this, 'plugin_info'), 20, 3);
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_action_links'));
        add_action('in_plugin_update_message-' . plugin_basename(__FILE__), array($this, 'render_update_notice'), 10, 2);
        add_filter('script_loader_tag', array($this, 'add_async_attribute'), 10, 2);
        add_filter('http_request_host_is_external', array($this, 'allow_local_http_requests'), 10, 3);
        add_filter('http_request_args', array($this, 'allow_unsafe_local_urls'), 10, 2);
    }

    public function allow_local_http_requests($allow, $host, $url) {
        $api_host = parse_url($this->api_endpoint, PHP_URL_HOST);
        if ($host === $api_host || $host === 'localhost' || $host === '127.0.0.1') {
            return true;
        }
        return $allow;
    }

    public function allow_unsafe_local_urls($args, $url) {
        $api_host = parse_url($this->api_endpoint, PHP_URL_HOST);
        $req_host = parse_url($url, PHP_URL_HOST);
        if ($req_host === $api_host || $req_host === 'localhost' || $req_host === '127.0.0.1') {
            $args['reject_unsafe_urls'] = false;
        }
        return $args;
    }

    public function add_action_links($links) {
        $settings_link = '<a href="' . esc_url(admin_url('admin.php?page=ai-match-prediction')) . '">⚙️ ' . esc_html__('Cài Đặt', 'ai-match-prediction') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    public function register_shortcodes() {
        add_shortcode('ai_prediction_widget', array($this, 'render_widget_shortcode'));
        add_shortcode('ai_match_prediction', array($this, 'render_widget_shortcode'));
    }

    public function add_async_attribute($tag, $handle) {
        if ('ai-prediction-widget-bundle' === $handle && false === strpos($tag, 'async')) {
            return str_replace(' src=', ' async src=', $tag);
        }
        return $tag;
    }

    public function render_widget_shortcode($atts) {
        $a = shortcode_atts(array(
            'pk' => get_option('ai_prediction_private_key', ''),
            'match_id' => '',
            'api_base' => $this->api_endpoint,
            'assets_base' => plugins_url('assets/', __FILE__)
        ), $atts);

        $local_bundle = plugin_dir_path(__FILE__) . 'assets/bundle.js';
        $script_url = file_exists($local_bundle)
            ? plugins_url('assets/bundle.js', __FILE__)
            : esc_url(rtrim($a['api_base'], '/') . '/bundle.js');

        wp_enqueue_script('ai-prediction-widget-bundle', $script_url, array(), $this->version, true);

        return sprintf(
            '<ai-prediction-widget private-key="%s" match-id="%s" api-base="%s" assets-base="%s"></ai-prediction-widget>',
            esc_attr($a['pk']), esc_attr($a['match_id']), esc_url($a['api_base']), esc_url($a['assets_base'])
        );
    }

    public function add_admin_menu() {
        add_menu_page(
            'AI Match Prediction Settings',
            'AI Prediction',
            'manage_options',
            'ai-match-prediction',
            array($this, 'render_settings_page'),
            'dashicons-chart-pie',
            30
        );
    }

    public function register_settings() {
        register_setting('ai_prediction_group', 'ai_prediction_private_key');
    }

    public function fetch_remote_version() {
        $api_url = rtrim($this->api_endpoint, '/') . '/api/v1/plugin/update-check';
        $response = wp_remote_get($api_url, array('timeout' => 10, 'reject_unsafe_urls' => false));
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return false;
        }
        return json_decode(wp_remote_retrieve_body($response));
    }

    public function handle_force_check_updates() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        check_admin_referer('ai_prediction_force_check');
        delete_site_transient('update_plugins');
        wp_safe_redirect(add_query_arg(array('page' => 'ai-match-prediction', 'checked' => '1'), admin_url('admin.php')));
        exit;
    }

    public function check_for_plugin_update($transient) {
        if (empty($transient->checked)) {
            return $transient;
        }

        $data = $this->fetch_remote_version();
        if ($data && !empty($data->version) && version_compare($this->version, $data->version, '<')) {
            $plugin_slug = plugin_basename(__FILE__);
            $obj = new stdClass();
            $obj->slug = $this->slug;
            $obj->plugin = $plugin_slug;
            $obj->new_version = $data->version;
            $obj->url = !empty($data->homepage) ? $data->homepage : $data->download_url;
            $obj->package = $data->package;
            $obj->requires = !empty($data->requires) ? $data->requires : '5.8';
            $obj->tested = !empty($data->tested) ? $data->tested : '6.6';
            $obj->requires_php = !empty($data->requires_php) ? $data->requires_php : '7.4';
            $obj->compatibility = new stdClass();
            $transient->response[$plugin_slug] = $obj;
        }
        return $transient;
    }

    public function plugin_info($res, $action, $args) {
        if ($action !== 'plugin_information' || !isset($args->slug) || $args->slug !== $this->slug) {
            return $res;
        }

        $data = $this->fetch_remote_version();
        if ($data) {
            $res = new stdClass();
            $res->name = !empty($data->name) ? $data->name : 'AI Match Prediction - Sports Widget';
            $res->slug = $this->slug;
            $res->version = $data->version;
            $res->author = !empty($data->author) ? $data->author : 'AI Match Prediction SaaS';
            $res->homepage = !empty($data->homepage) ? $data->homepage : $this->api_endpoint;
            $res->requires = !empty($data->requires) ? $data->requires : '5.8';
            $res->tested = !empty($data->tested) ? $data->tested : '6.6';
            $res->requires_php = !empty($data->requires_php) ? $data->requires_php : '7.4';
            $res->download_link = $data->download_url;
            $res->sections = array(
                'description' => !empty($data->sections->description) ? $data->sections->description : 'Widget AI Dự Đoán Kèo Bóng Đá Realtime.',
                'changelog' => !empty($data->changelog_html) ? $data->changelog_html : '<p>Cập nhật tính năng và sửa lỗi.</p>'
            );
        }
        return $res;
    }

    public function render_update_notice($plugin_data, $response) {
        if (!empty($response->new_version)) {
            echo '<br/><strong style="color: #2563eb;">🚀 Bản cập nhật v' . esc_html($response->new_version) . ' đã sẵn sàng!</strong> Hãy bấm "Update Now" để hệ thống tự động tải và nâng cấp an toàn.';
        }
    }

    public function render_settings_page() {
        $plugin_file = plugin_basename(__FILE__);
        $upgrade_url = wp_nonce_url(self_admin_url('update.php?action=upgrade-plugin&plugin=' . $plugin_file), 'upgrade-plugin_' . $plugin_file);
        $remote_data = $this->fetch_remote_version();
        $has_update = $remote_data && version_compare($this->version, $remote_data->version, '<');
        ?>
        <div class="wrap" style="max-width: 900px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h1 style="display: flex; align-items: center; gap: 10px;">
                <span>⚽ AI Match Prediction Settings</span>
                <span style="font-size: 13px; background: #e0f2fe; color: #0284c7; padding: 3px 10px; border-radius: 9999px; font-weight: 600;">v<?php echo esc_html($this->version); ?></span>
            </h1>

            <?php if (isset($_GET['checked'])): ?>
                <div class="notice notice-success is-dismissible"><p>✅ Đã làm mới dữ liệu kiểm tra cập nhật thành công!</p></div>
            <?php endif; ?>

            <!-- Update Management Bento Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h2 style="margin-top: 0; font-size: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">📦 Quản Lý Cập Nhật Phiên Bản</h2>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <p style="margin: 4px 0;"><strong>Phiên bản đang cài đặt:</strong> <code>v<?php echo esc_html($this->version); ?></code></p>
                        <p style="margin: 4px 0;"><strong>Phiên bản phát hành trên Server:</strong> 
                            <?php if ($remote_data): ?>
                                <code style="color: <?php echo $has_update ? '#16a34a' : '#475569'; ?>; font-weight: 700;">v<?php echo esc_html($remote_data->version); ?></code>
                            <?php else: ?>
                                <span style="color: #94a3b8;">Không thể kết nối đến Server</span>
                            <?php endif; ?>
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                            <?php wp_nonce_field('ai_prediction_force_check'); ?>
                            <input type="hidden" name="action" value="ai_prediction_check_updates" />
                            <button type="submit" class="button button-secondary">🔄 Kiểm Tra Cập Nhật Ngay</button>
                        </form>
                        <?php if ($has_update): ?>
                            <a href="<?php echo esc_url($upgrade_url); ?>" class="button button-primary" style="background: #16a34a; border-color: #15803d;">🚀 Nâng Cấp Ngay Lên v<?php echo esc_html($remote_data->version); ?></a>
                        <?php endif; ?>
                    </div>
                </div>

                <?php if ($has_update && !empty($remote_data->changelog_html)): ?>
                    <div style="margin-top: 15px; padding: 12px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
                        <strong>Nhật ký thay đổi v<?php echo esc_html($remote_data->version); ?>:</strong>
                        <div style="font-size: 13px; color: #334155; margin-top: 5px;"><?php echo wp_kses_post($remote_data->changelog_html); ?></div>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Settings Form -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h2 style="margin-top: 0; font-size: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">⚙️ Cấu Hình Khóa Kích Hoạt (Private Key)</h2>
                <form method="post" action="options.php">
                    <?php settings_fields('ai_prediction_group'); ?>
                    <?php do_settings_sections('ai_prediction_group'); ?>
                    <table class="form-table" style="margin-top: 0;">
                        <tr>
                            <th scope="row" style="width: 220px;">Khóa Kích Hoạt (Private Key):</th>
                            <td>
                                <input type="text" name="ai_prediction_private_key" value="<?php echo esc_attr(get_option('ai_prediction_private_key', '')); ?>" placeholder="pk_live_..." class="regular-text" style="width: 100%; max-width: 480px;" />
                                <p class="description">Sao chép mã Private Key từ bảng Quản lý Chiến dịch trong Bento CMS để kích hoạt Widget.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">API Endpoint Server:</th>
                            <td>
                                <code style="background: #f1f5f9; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; color: #0f172a; border: 1px solid #e2e8f0; display: inline-block;">
                                    <?php echo esc_html($this->api_endpoint); ?>
                                </code>
                                <p class="description">Được cấu hình cố định tự động theo môi trường build của gói plugin.</p>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button('💾 Lưu Cấu Hình', 'primary'); ?>
                </form>
            </div>

            <!-- Quick Start & Usage Guide Bento Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h2 style="margin-top: 0; font-size: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">📖 Hướng Dẫn Sử Dụng & Nhúng Widget</h2>
                <div style="margin-bottom: 14px;">
                    <h3 style="font-size: 14px; color: #0f172a; margin: 4px 0;">1. Nhúng Shortcode:</h3>
                    <div style="background: #0f172a; color: #f8fafc; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 13px;">[ai_prediction_widget]</div>
                </div>
                <div style="margin-bottom: 14px;">
                    <h3 style="font-size: 14px; color: #0f172a; margin: 4px 0;">2. Nhúng theo Match ID:</h3>
                    <div style="background: #0f172a; color: #f8fafc; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 13px;">[ai_prediction_widget match_id="123456"]</div>
                </div>
                <div>
                    <h3 style="font-size: 14px; color: #0f172a; margin: 4px 0;">3. Nhúng Theme PHP:</h3>
                    <div style="background: #0f172a; color: #f8fafc; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 13px;">&lt;?php echo do_shortcode('[ai_prediction_widget]'); ?&gt;</div>
                </div>
            </div>
        </div>
        <?php
    }
}

AIMatchPredictionPlugin::get_instance();
