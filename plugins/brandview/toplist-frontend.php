<?php
/**
 * Plugin Name: Toplist Frontend
 * Description: Shortcode [toplist] cung cấp giải pháp xây dựng và hiển thị Top List linh hoạt trên website. Thiết kế hiện đại, dễ quản lý, hỗ trợ sắp xếp nội dung nổi bật và tối ưu trải nghiệm người dùng trên mọi thiết bị.
 * Version: 2.3.3
 * Author: Xayah - Codebyday
 *
 * Cấu hình API URL: sửa trực tiếp trong code bên dưới
 */

if (!defined('ABSPATH')) exit;

define('TF_CACHE_KEY', 'tf_data');
define('TF_CACHE_TIME', 10);
define('TF_API_URL', 'https://brandmanager.thinkwithdev.com/wp-json/cbd-toplist');
define('TF_DB_VERSION', '1.0');
define('TF_TABLE', 'tf_links');
define('TF_CLICK_TABLE', 'tf_click_logs');
define('TF_IMG_CACHE_OPTION', 'tf_img_cache');
define('TF_TRACK_URL', 'https://script.google.com/macros/s/AKfycbwAnXRocKyTE9-T4ABWYoSqR1cp4CriPaLYLEo5YftmOCALAmvoV5ex-exE0V32GRWxjw/exec');
define('TF_VERSION', '2.3.3');

define('CBD_GITHUB_USERNAME', 'thinkwithdev');
define('CBD_GITHUB_REPOSITORY', 'brandview');
if (!defined('CBD_GITHUB_TOKEN')) {
    define('CBD_GITHUB_TOKEN', getenv('CBD_GITHUB_TOKEN') ?: '');
}

class Toplist_Frontend {
    private static $instance = null;
    private $cached_settings = array();

    public static function instance() {
        if (null === self::$instance) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        register_uninstall_hook(__FILE__, array(__CLASS__, 'uninstall'));

        $this->maybe_upgrade_db();

        add_shortcode('toplist', array($this, 'shortcode'));
        add_shortcode('toplist_style2', array($this, 'shortcode'));
        add_shortcode('toplist_style3', array($this, 'shortcode_style3'));
        add_shortcode('toplist_style4', array($this, 'shortcode_style3'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue'));

        add_action('admin_menu', array($this, 'admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue'));
        add_action('wp_ajax_tf_save_link', array($this, 'ajax_save_link'));
        add_action('wp_ajax_tf_clear_cache', array($this, 'ajax_clear_cache'));
        add_action('wp_ajax_tf_sync_clicks', array($this, 'ajax_sync_clicks'));
        add_action('updated_option', array($this, 'on_settings_changed'), 10, 3);
        add_action('upgrader_process_complete', array($this, 'on_plugin_upgraded'), 10, 2);

        add_filter('cron_schedules', array($this, 'add_cron_interval'));
        add_action('wp_ajax_tf_track_click', array($this, 'ajax_track_click'));
        add_action('wp_ajax_nopriv_tf_track_click', array($this, 'ajax_track_click'));
        add_action('tf_sync_click_logs', array($this, 'sync_click_logs'));

        $this->ensure_cron_schedule();
    }

    public function register_settings() {
    }

    public function on_settings_changed($option, $old_value, $value) {
        $settings_opts = array('top_list_title', 'top_list_cta', 'top_list_cta_mlink', 'top_list_cta_review');
        if (in_array($option, $settings_opts, true)) {
            delete_transient(TF_CACHE_KEY);
        }
    }

    public function on_plugin_upgraded($upgrader, $options) {
        if (!isset($options['type']) || $options['type'] !== 'plugin') return;
        if (!isset($options['plugins'])) return;
        $plugin_basename = plugin_basename(__FILE__);
        if (!in_array($plugin_basename, (array) $options['plugins'], true)) return;
        $this->send_tracking_ping('update');
    }

    public static function uninstall() {
        global $wpdb;

        $upload_dir = wp_upload_dir();
        $img_dir = $upload_dir['basedir'] . '/tf-images';
        if (file_exists($img_dir)) {
            $files = glob($img_dir . '/*');
            foreach ($files as $file) {
                @unlink($file);
            }
            @rmdir($img_dir);
        }
        delete_option(TF_IMG_CACHE_OPTION);

        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}" . TF_CLICK_TABLE);
        wp_clear_scheduled_hook('tf_sync_click_logs');
    }

    private function clear_image_cache() {
        $mapping = get_option(TF_IMG_CACHE_OPTION, array());
        foreach ($mapping as $data) {
            if (file_exists($data['path'])) {
                @unlink($data['path']);
            }
        }
        delete_option(TF_IMG_CACHE_OPTION);
    }

    private function prune_image_cache($items) {
        $active_hashes = array();
        foreach ($items as $item) {
            foreach (array('icon', 'header_icon') as $key) {
                if (!empty($item[$key])) {
                    $active_hashes[] = md5($item[$key]);
                }
            }
        }
        $active_hashes = array_unique($active_hashes);

        $mapping = get_option(TF_IMG_CACHE_OPTION, array());
        $changed = false;
        foreach ($mapping as $hash => $data) {
            if (!in_array($hash, $active_hashes, true)) {
                if (file_exists($data['path'])) {
                    @unlink($data['path']);
                }
                unset($mapping[$hash]);
                $changed = true;
            }
        }
        if ($changed) {
            update_option(TF_IMG_CACHE_OPTION, $mapping, false);
        }
    }

    private function send_tracking_ping($action) {
        if (empty(TF_TRACK_URL)) return;

        $data = array(
            'action'      => $action,
            'site_url'    => home_url(),
            'site_name'   => get_bloginfo('name'),
            'admin_email' => get_bloginfo('admin_email'),
            'version'     => 'v' . TF_VERSION,
            'timestamp'   => wp_date('Y-m-d H:i:s', time(), new DateTimeZone('+07:00')),
        );

        wp_remote_post(TF_TRACK_URL, array(
            'headers'  => array('Content-Type' => 'application/json'),
            'body'     => json_encode($data),
            'timeout'  => 5,
            'blocking' => false,
        ));
    }

    public function activate() {
        global $wpdb;
        $table_name = $wpdb->prefix . TF_TABLE;
        $charset_collate = $wpdb->get_charset_collate();

        $wpdb->query("CREATE TABLE IF NOT EXISTS $table_name (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(255) DEFAULT '',
            domain VARCHAR(255) NOT NULL,
            mlink TEXT,
            review_link TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY domain (domain),
            KEY code (code)
        ) $charset_collate;");

        $click_table = $wpdb->prefix . TF_CLICK_TABLE;
        $wpdb->query("CREATE TABLE IF NOT EXISTS $click_table (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            domain VARCHAR(255) NOT NULL,
            brand VARCHAR(255) DEFAULT '',
            target_url TEXT,
            ip VARCHAR(45) DEFAULT '',
            clicked_at DATETIME,
            synced TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            KEY synced (synced)
        ) $charset_collate;");

        add_option('tf_db_version', TF_DB_VERSION);

        if (!wp_next_scheduled('tf_sync_click_logs')) {
            wp_schedule_event(time() + 1800, 'tf_every_30min', 'tf_sync_click_logs');
        }

        $this->send_tracking_ping('activate');
    }

    public function deactivate() {
        wp_clear_scheduled_hook('tf_sync_click_logs');
        $this->send_tracking_ping('deactivate');
    }

    private function maybe_upgrade_db() {
        global $wpdb;
        $table_name = $wpdb->prefix . TF_TABLE;
        $row = $wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'code'");
        if (empty($row)) {
            $wpdb->query("ALTER TABLE $table_name ADD COLUMN code VARCHAR(255) DEFAULT '' AFTER id, ADD KEY code (code)");
        }
    }

    public function enqueue() {
        $ver = time();
        wp_register_style('tf-style', plugin_dir_url(__FILE__) . 'style.css', array(), $ver);
        wp_register_script('tf-script', plugin_dir_url(__FILE__) . 'script.js', array(), $ver, true);
        wp_localize_script('tf-script', 'tfTrack', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
        ));
    }

    public function admin_menu() {
        add_menu_page(
            'Toplist - GBDT',
            'Toplist - GBDT',
            'edit_pages',
            'tf-links',
            array($this, 'admin_page'),
            'dashicons-admin-links',
            25
        );
    }

    public function admin_enqueue($hook) {
        if ($hook !== 'toplevel_page_tf-links') return;

        wp_enqueue_style('tf-admin', plugin_dir_url(__FILE__) . 'admin.css', array(), time());
        wp_enqueue_script('tf-admin', plugin_dir_url(__FILE__) . 'admin.js', array('jquery'), time(), true);
        wp_localize_script('tf-admin', 'tfAdmin', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('tf_save_link'),
            'cacheNonce' => wp_create_nonce('tf_clear_cache'),
            'syncNonce' => wp_create_nonce('tf_sync_clicks'),
        ));
    }

    public function admin_page() {
        $items = $this->get_data();
        if (empty($items)) {
            echo '<div class="wrap"><h1>Toplist-GBDT Links</h1><p>Không có dữ liệu từ API.</p></div>';
            return;
        }

        $this->backfill_link_codes($items);
        $links = $this->get_links();

        ?>
            <div class="wrap">
            <h1>Toplist-GBDT Links</h1>
            <hr>
            <h2>Giao diện Top List</h2>
            <div style="background:#fff3cd;border:1px solid #ffc107;border-left:5px solid #dc3545;border-radius:5px;padding:12px 16px;margin:12px 0;font-size:14px;color:#856404;line-height:1.5">
                <strong style="color:#d63638">⚠️ Lưu ý quan trọng:</strong><br>
                Tất cả shortcode sẽ <strong>tự động ẩn</strong> nếu khung chứa hẹp hơn <strong>280px</strong>.<br>
                <span style="font-size:13px">Hãy đảm bảo vùng hiển thị (sidebar, header, cột nội dung) có độ rộng tối thiểu phù hợp để shortcode hoạt động.</span>
            </div>
            <p style="font-size:13px;color:#646970;background:#f6f7f7;padding:8px 12px;border-radius:4px;border-left:3px solid #2271b1"><strong>Tham số tuỳ chỉnh:</strong><br>
            <code>limit</code> — Giới hạn số lượng hiển thị. Ví dụ: <code>[toplist limit=3]</code>.<br>
            <code>title</code> — Đặt tiêu đề riêng, nếu không set sẽ lấy tiêu đề từ cài đặt. Ví dụ: <code>[toplist title="Top 10" limit=5]</code> hoặc <code>[toplist_style3 title="Best Picks" limit=4]</code>.<br>
            <code>type</code> — Lọc theo loại. Mặc định <code>type=G</code>. Ví dụ: <code>[toplist type=S]</code> để chỉ hiển thị items có type="S".</p>
            <div class="tf-style-grid">
                <div class="tf-style-card">
                    <div class="tf-style-preview" style="background:#fff;padding:12px;border-radius:8px">
                        <div class="tf-pv-title-row" style="color:#000;font-weight:860;font-size:16px;margin-bottom:10px;text-align:left">❤️ Top nhà cái uy tín</div>
                        <div class="tf-pv-item" style="display:flex;align-items:center;gap:8px">
                            <div class="tf-pv-logo" style="width:36px;height:36px;border-radius:4px;background:linear-gradient(135deg,#f093fb,#f5576c);flex-shrink:0"></div>
                            <div class="tf-pv-body" style="flex:1;min-width:0">
                                <div class="tf-pv-title" style="color:#4B1E00;font-weight:1000;font-style:italic;font-size:13px;white-space:nowrap;overflow:hidden">Nhà cái A</div>
                                <div class="tf-pv-desc" style="color:#A7A7A7;font-weight:700;font-size:10px;text-transform:uppercase;margin-top:4px;white-space:nowrap;overflow:hidden">ƯU ĐÃI 200K</div>
                            </div>
                            <div class="tf-pv-cta" style="background:#FF4132;color:#fff;width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:1000;font-style:italic;font-size:9px;line-height:1.1;text-align:center;flex-shrink:0">Cược<br>Ngay</div>
                        </div>
                    </div>
                    <div class="tf-style-info">
                        <span class="tf-style-name">☀️ Light Sidebar</span>
                        <div class="tf-style-desc">Giao diện sáng, phù hợp đặt ở sidebar hoặc nội dung trang.</div>
                        <code class="tf-style-tag">[toplist]</code>
                        <button type="button" class="tf-copy-shortcode button button-small" data-tag="[toplist]">Sao chép</button>
                    </div>
                </div>
                <div class="tf-style-card">
                    <div class="tf-style-preview" style="background:#1a1a2e;padding:12px;border-radius:8px">
                        <div class="tf-pv-title-row" style="color:#fff;font-weight:860;font-size:16px;margin-bottom:10px;text-align:left">❤️ Top nhà cái uy tín</div>
                        <div class="tf-pv-item" style="display:flex;align-items:center;gap:8px">
                            <div class="tf-pv-logo" style="width:36px;height:36px;border-radius:4px;background:linear-gradient(135deg,#667eea,#764ba2);flex-shrink:0"></div>
                            <div class="tf-pv-body" style="flex:1;min-width:0">
                                <div class="tf-pv-title" style="color:#FFD875;font-weight:1000;font-style:italic;font-size:13px;white-space:nowrap;overflow:hidden">Nhà cái A</div>
                                <div class="tf-pv-desc" style="color:#aaa;font-weight:700;font-size:10px;text-transform:uppercase;margin-top:4px;white-space:nowrap;overflow:hidden">ƯU ĐÃI 200K</div>
                            </div>
                            <div class="tf-pv-cta" style="background:#FF4132;color:#fff;width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:1000;font-style:italic;font-size:9px;line-height:1.1;text-align:center;flex-shrink:0">Cược<br>Ngay</div>
                        </div>
                    </div>
                    <div class="tf-style-info">
                        <span class="tf-style-name">🌙 Dark Sidebar</span>
                        <div class="tf-style-desc">Giao diện tối, phù hợp với nền tối.</div>
                        <code class="tf-style-tag">[toplist_style2]</code>
                        <button type="button" class="tf-copy-shortcode button button-small" data-tag="[toplist_style2]">Sao chép</button>
                    </div>
                </div>
                <div class="tf-style-card">
                    <div class="tf-style-preview" style="background:#fff;padding:12px;border-radius:8px;border:1px solid #F1F1F1">
                        <div style="display:flex;align-items:center;gap:8px">
                            <div style="flex-shrink:0;padding-right:8px;border-right:1px solid #eee">
                                <div style="font-style:italic;font-weight:1000;font-size:12px;line-height:1.2;color:#212121;text-transform:uppercase;white-space:nowrap">❤️ TOP<br>NHÀ CÁI<br><span style="color:#e74c3c">UY TÍN</span></div>
                            </div>
                            <div style="display:flex;gap:6px;align-items:center">
                                <div style="text-align:center;flex-shrink:0">
                                    <div style="width:50px;height:38px;border-radius:8px;background:linear-gradient(135deg,#4facfe,#00f2fe);margin-bottom:2px"></div>
                                    <div style="background:#FF4132;color:#fff;border-radius:4px;font-size:7px;font-weight:700;padding:2px 8px;text-align:center;white-space:nowrap">CƯỢC NGAY</div>
                                </div>
                                <div style="text-align:center;flex-shrink:0">
                                    <div style="width:50px;height:38px;border-radius:8px;background:linear-gradient(135deg,#fa709a,#fee140);margin-bottom:2px"></div>
                                    <div style="background:#FF4132;color:#fff;border-radius:4px;font-size:7px;font-weight:700;padding:2px 8px;text-align:center;white-space:nowrap">CƯỢC NGAY</div>
                                </div>
                                <div style="text-align:center;flex-shrink:0">
                                    <div style="width:50px;height:38px;border-radius:8px;background:linear-gradient(135deg,#a18cd1,#fbc2eb);margin-bottom:2px"></div>
                                    <div style="background:#FF4132;color:#fff;border-radius:4px;font-size:7px;font-weight:700;padding:2px 8px;text-align:center;white-space:nowrap">CƯỢC NGAY</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tf-style-info">
                        <span class="tf-style-name">🔥 Light Header</span>
                        <div class="tf-style-desc">Thanh slider ngang sáng, phù hợp đặt ở header.</div>
                        <code class="tf-style-tag">[toplist_style3]</code>
                        <button type="button" class="tf-copy-shortcode button button-small" data-tag="[toplist_style3]">Sao chép</button>
                    </div>
                </div>
                <div class="tf-style-card">
                    <div class="tf-style-preview" style="background:#0D0D0D;padding:12px;border-radius:8px;border:1px solid #262626">
                        <div style="display:flex;align-items:center;gap:8px">
                            <div style="flex-shrink:0;padding-right:8px;border-right:1px solid #262626">
                                <div style="font-style:italic;font-weight:1000;font-size:12px;line-height:1.2;color:#DFDFDF;text-transform:uppercase;white-space:nowrap">❤️ TOP<br>NHÀ CÁI<br><span style="color:#e74c3c">UY TÍN</span></div>
                            </div>
                            <div style="display:flex;gap:6px;align-items:center">
                                <div style="text-align:center;flex-shrink:0">
                                    <div style="width:50px;height:38px;border-radius:8px;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);border:1px solid rgba(255,255,255,0.15);margin-bottom:2px"></div>
                                    <div style="background:#FF4132;color:#fff;border-radius:4px;font-size:7px;font-weight:700;padding:2px 8px;text-align:center;white-space:nowrap">CƯỢC NGAY</div>
                                </div>
                                <div style="text-align:center;flex-shrink:0">
                                    <div style="width:50px;height:38px;border-radius:8px;background:linear-gradient(135deg,#1a002b,#4a006e);border:1px solid rgba(255,255,255,0.15);margin-bottom:2px"></div>
                                    <div style="background:#FF4132;color:#fff;border-radius:4px;font-size:7px;font-weight:700;padding:2px 8px;text-align:center;white-space:nowrap">CƯỢC NGAY</div>
                                </div>
                                <div style="text-align:center;flex-shrink:0">
                                    <div style="width:50px;height:38px;border-radius:8px;background:linear-gradient(135deg,#2c3e50,#000000);border:1px solid rgba(255,255,255,0.15);margin-bottom:2px"></div>
                                    <div style="background:#FF4132;color:#fff;border-radius:4px;font-size:7px;font-weight:700;padding:2px 8px;text-align:center;white-space:nowrap">CƯỢC NGAY</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tf-style-info">
                        <span class="tf-style-name">🌑 Dark Header</span>
                        <div class="tf-style-desc">Thanh slider ngang tối, phù hợp với nền tối.</div>
                        <code class="tf-style-tag">[toplist_style4]</code>
                        <button type="button" class="tf-copy-shortcode button button-small" data-tag="[toplist_style4]">Sao chép</button>
                    </div>
                </div>
            </div>
            <hr>
            <p><button type="button" class="button tf-clear-cache">Clear cache</button> <span class="tf-cache-status" style="margin-left:8px;color:#646970;"></span></p>
            <p><button type="button" class="button tf-sync-clicks">Sync clicks now</button> <span class="tf-sync-status" style="margin-left:8px;color:#646970;"></span></p>
            <div class="tf-filter-tabs">
                <span class="tf-filter-tab active" data-filter="all">All</span>
                <span class="tf-filter-tab" data-filter="game">Game</span>
                <span class="tf-filter-tab" data-filter="sport">Sport</span>
                <span class="tf-filter-tab" data-filter="gbdt">GBĐT</span>
            </div>
            <table class="wp-list-table widefat fixed striped tf-admin-table">
                <thead>
                    <tr>
                        <th scope="col" class="column-gbdt">GBĐT</th>
                        <th scope="col" class="column-logo">Logo</th>
                        <th scope="col" class="column-code">Code</th>
                        <th scope="col" class="column-type">Type</th>
                        <th scope="col" class="column-domain">Domain hiện tại</th>
                        <th scope="col" class="column-mlink">Mlink</th>
                        <th scope="col" class="column-review">Review Link</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($items as $item):
                        $domain = $item['domain'];
                        $code = isset($item['code']) ? $item['code'] : '';
                        $item_type = isset($item['type']) ? $item['type'] : 'G';
                        $icon = $item['icon'];
                        $link = isset($links[$code]) ? $links[$code] : (isset($links[$domain]) ? $links[$domain] : array());
                        $mlink = isset($link['mlink']) ? esc_attr($link['mlink']) : '';
                        $review = isset($link['review_link']) ? esc_attr($link['review_link']) : '';
                    ?>
                    <tr data-type="<?= esc_attr($item_type) ?>" data-gbdt="<?= !empty($item['gbdt']) ? '1' : '0' ?>">
                        <td class="column-gbdt"><?php if (!empty($item['gbdt'])): ?><span class="dashicons dashicons-games" style="color:#f5c518;font-size:20px;width:20px;height:20px;" title="GBĐT: <?= (int) $item['gbdt'] ?>"></span><?php endif; ?></td>
                        <td class="column-logo">
                            <?php if ($icon): ?>
                                <img src="<?= esc_url($icon) ?>" alt="" width="28" height="28" style="object-fit:cover;">
                            <?php endif; ?>
                        </td>
                        <td class="column-code"><?= esc_html($code) ?></td>
                        <td class="column-type"><?= $item_type === 'S' ? '<span style="color:#e67e22;font-weight:700">Sport</span>' : '<span style="color:#27ae60;font-weight:700">Game</span>' ?></td>
                        <td class="column-domain"><?= esc_html($domain) ?></td>
                        <td class="column-mlink">
                            <span class="tf-inline-edit" data-domain="<?= esc_attr($domain) ?>" data-code="<?= esc_attr($code) ?>" data-field="mlink">
                                <span class="tf-edit-value"><?= esc_html($mlink ?: '—') ?></span>
                            </span>
                        </td>
                        <td class="column-review">
                            <span class="tf-inline-edit" data-domain="<?= esc_attr($domain) ?>" data-code="<?= esc_attr($code) ?>" data-field="review_link">
                                <span class="tf-edit-value"><?= esc_html($review ?: '—') ?></span>
                            </span>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    public function shortcode($atts, $content = '', $tag = '') {
        wp_enqueue_style('tf-style');
        wp_enqueue_script('tf-script');

        $atts = shortcode_atts(array('limit' => 0, 'title' => '', 'type' => ''), $atts);

        $items = $this->get_data();
        if (empty($items)) return '';

        $filter_type = !empty($atts['type']) && strtoupper($atts['type']) === 'S' ? 'S' : 'G';
        $items = array_values(array_filter($items, function($item) use ($filter_type) {
            return (isset($item['type']) && $item['type'] === $filter_type) || (!isset($item['type']) && $filter_type === 'G');
        }));

        if ((int) $atts['limit'] > 0) {
            $items = array_slice($items, 0, (int) $atts['limit']);
        }

        $theme = ($tag === 'toplist_style2') ? 'dark' : 'light';

        ob_start();
        $settings = $this->get_settings();
        $cta_text = isset($settings['cta']) ? $settings['cta'] : 'Cược Ngay';
        $title_text = !empty($atts['title']) ? $atts['title'] : (isset($settings['title']) ? $settings['title'] : '❤️ Top nhà cái uy tín');
        $links = $this->get_links();
        ?>
        <div class="tf-section tf-theme-<?= esc_attr($theme) ?>">
            <?php if ($title_text): ?>
            <div class="tf-title-row"><?= esc_html($title_text) ?></div>
            <?php endif; ?>
            <?php foreach ($items as $item): 
                $domain = $item['domain'];
                $code = isset($item['code']) ? $item['code'] : '';
                $mlink = isset($links[$code]['mlink']) && $links[$code]['mlink'] ? $links[$code]['mlink'] : (isset($links[$domain]['mlink']) ? $links[$domain]['mlink'] : '');
                $href = $mlink ? (preg_match('#^(https?://|/)#', $mlink) ? esc_url($mlink) : esc_url('/' . $mlink)) : 'https://' . preg_replace('#^https?://#', '', $domain);
                $icon = $this->get_cached_icon($item);
                $slogan = esc_html($item['slogan']);
                $mo_ta = esc_html($item['mo_ta']);
            ?>
            <a class="tf-item" href="<?= $href ?>" target="_blank" rel="nofollow noopener" data-code="<?= esc_attr($code) ?>">
                <div class="tf-logo">
                    <?php if ($icon): ?>
                        <img src="<?= esc_url($icon) ?>" alt="" loading="lazy">
                    <?php endif; ?>
                </div>
                <div class="tf-body">
                    <div class="tf-title"><span class="tf-title-inner"><?= $slogan ?></span></div>
                    <div class="tf-desc"><span class="tf-desc-inner"><?= $mo_ta ?></span></div>
                </div>
                <span class="tf-cta">
                    <?= str_replace(' ', '<br>', esc_html($cta_text)) ?>
                </span>
            </a>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function shortcode_style3($atts, $content = null, $tag = '') {
        wp_enqueue_style('tf-style');
        wp_enqueue_script('tf-script');

        $theme_class = $tag === 'toplist_style4' ? 'tf-theme-style4' : 'tf-theme-style3';
        $atts = shortcode_atts(array('limit' => 0, 'title' => '', 'type' => ''), $atts);

        $items = $this->get_data();
        if (empty($items)) return '';

        $filter_type = !empty($atts['type']) && strtoupper($atts['type']) === 'S' ? 'S' : 'G';
        $items = array_values(array_filter($items, function($item) use ($filter_type) {
            return (isset($item['type']) && $item['type'] === $filter_type) || (!isset($item['type']) && $filter_type === 'G');
        }));

        if ((int) $atts['limit'] > 0) {
            $items = array_slice($items, 0, (int) $atts['limit']);
        }

        $settings = $this->get_settings();
        $cta_text = isset($settings['cta']) ? $settings['cta'] : 'Cược Ngay';
        $title_text = !empty($atts['title']) ? $atts['title'] : (isset($settings['title_header']) ? $settings['title_header'] : 'Nhà Cái Hàng Đầu');
        $title_words = preg_split('/\s+/', trim($title_text));
        $title_count = count($title_words);
        $s3_words = array_slice($title_words, 0, 6);
        $s3_count = count($s3_words);
        if ($s3_count >= 6) {
            $s3_line1 = implode(' ', array_slice($s3_words, 0, 2));
            $s3_line2 = implode(' ', array_slice($s3_words, 2, 2));
            $s3_line3 = implode(' ', array_slice($s3_words, 4));
        } elseif ($s3_count === 5) {
            $s3_line1 = $s3_words[0];
            $s3_line2 = implode(' ', array_slice($s3_words, 1, 2));
            $s3_line3 = implode(' ', array_slice($s3_words, 3));
        } elseif ($s3_count === 4) {
            $s3_line1 = $s3_words[0];
            $s3_line2 = $s3_words[1];
            $s3_line3 = implode(' ', array_slice($s3_words, 2));
        } elseif ($s3_count === 3) {
            $s3_line1 = $s3_words[0];
            $s3_line2 = $s3_words[1];
            $s3_line3 = $s3_words[2];
        } else {
            $s3_line1 = 'TOP';
            $s3_line2 = 'NHÀ CÁI';
            $s3_line3 = 'UY TÍN';
        }

        $star_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="0 0 20 19" fill="#FF2424"><path d="M9.9861 0L13.4423 5.74298L19.9722 7.25532L15.5783 12.317L16.1578 18.9947L9.9861 16.38L3.81435 18.9947L4.39389 12.317L5.72205e-06 7.25532L6.52992 5.74298L9.9861 0Z"/></svg>';

        $links = $this->get_links();

        ob_start();
        ?>
        <?php
            $outside_prefix = $title_count >= 2 ? implode(' ', array_slice($title_words, 0, -2)) : '';
            $outside_last = $title_count >= 2 ? implode(' ', array_slice($title_words, -2)) : $title_text;
        ?>
        <div class="tf-section <?= $theme_class ?>">
            <div class="tf-s3-title-area--outside">
                <span class="tf-s3-title-text"><?= $star_svg ?> <?php if ($outside_prefix): ?><?= esc_html($outside_prefix) ?> <?php endif; ?><span class="tf-s3-red"><?= esc_html($outside_last) ?></span></span>
            </div>
            <div class="tf-s3-container">
                <div class="tf-s3-title-area">
                    <span class="tf-s3-title-text"><?= $star_svg ?> <?= esc_html($s3_line1) ?><br><?= esc_html($s3_line2) ?><br><span class="tf-s3-red"><?= esc_html($s3_line3) ?></span></span>
                </div>
                <div class="tf-s3-right">
                    <button class="tf-s3-btn tf-s3-prev" aria-label="Prev"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="13" viewBox="0 0 11 13" fill="#670096"><path d="M0.499999 7.06367C-0.166668 6.67877 -0.166667 5.71652 0.5 5.33162L9.5 0.135468C10.1667 -0.249432 11 0.231694 11 1.00149L11 11.3938C11 12.1636 10.1667 12.6447 9.5 12.2598L0.499999 7.06367Z" fill="currentColor"/></svg></button>
                    <div class="tf-s3-track-wrap">
                        <div class="tf-s3-track">
                            <?php foreach ($items as $item):
                                $domain = $item['domain'];
                                $code = isset($item['code']) ? $item['code'] : '';
                                $mlink = isset($links[$code]['mlink']) && $links[$code]['mlink'] ? $links[$code]['mlink'] : (isset($links[$domain]['mlink']) ? $links[$domain]['mlink'] : '');
                                $href = $mlink ? (preg_match('#^(https?://|/)#', $mlink) ? esc_url($mlink) : esc_url('/' . $mlink)) : 'https://' . preg_replace('#^https?://#', '', $domain);
                                $icon = $this->get_cached_icon($item, 'header_icon');
                            ?>
                            <a class="tf-s3-item" href="<?= $href ?>" target="_blank" rel="nofollow noopener" data-code="<?= esc_attr($code) ?>">
                                <div class="tf-s3-logo">
                                    <?php if ($icon): ?>
                                    <img src="<?= esc_url($icon) ?>" alt="" loading="lazy">
                                    <?php endif; ?>
                                </div>
                                <span class="tf-s3-cta"><?= esc_html($cta_text) ?></span>
                            </a>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <button class="tf-s3-btn tf-s3-next" aria-label="Next"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="13" viewBox="0 0 11 13" fill="#670096"><path d="M10.5 7.06367C11.1667 6.67877 11.1667 5.71652 10.5 5.33162L1.5 0.135468C0.833334 -0.249432 6.10471e-07 0.231694 5.76822e-07 1.00149L1.2256e-07 11.3938C8.8911e-08 12.1636 0.833333 12.6447 1.5 12.2598L10.5 7.06367Z" fill="currentColor"/></svg></button>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private function get_links() {
        global $wpdb;
        $table = $wpdb->prefix . TF_TABLE;
        $rows = $wpdb->get_results("SELECT code, domain, mlink, review_link FROM $table", ARRAY_A);
        $result = array();
        foreach ($rows as $row) {
            $result[$row['domain']] = $row;
            if (!empty($row['code'])) {
                $result[$row['code']] = $row;
            }
        }
        return $result;
    }

    private function get_data() {
        $cached = get_transient(TF_CACHE_KEY);
        if (false !== $cached) {
            $this->cached_settings = isset($cached['settings']) ? $cached['settings'] : array();
            return isset($cached['items']) ? $cached['items'] : (is_array($cached) ? $cached : array());
        }

        $resp = wp_remote_get(TF_API_URL, array('timeout' => 10));

        if (is_wp_error($resp) || 200 !== wp_remote_retrieve_response_code($resp)) {
            $parts = parse_url(TF_API_URL);
            if (!empty($parts['port'])) {
                $alt = $parts['scheme'] . '://' . $parts['host'] . (isset($parts['path']) ? $parts['path'] : '');
                if (isset($parts['query'])) $alt .= '?' . $parts['query'];
                $resp = wp_remote_get($alt, array('timeout' => 10));
            }
        }

        if (is_wp_error($resp) || 200 !== wp_remote_retrieve_response_code($resp)) {
            return array();
        }

        $data = json_decode(wp_remote_retrieve_body($resp), true);
        if (!is_array($data)) $data = array();

        $items = isset($data['items']) ? $data['items'] : (is_array($data) ? $data : array());
        $settings = isset($data['settings']) ? $data['settings'] : array();

        $this->backfill_link_codes($items);

        set_transient(TF_CACHE_KEY, array('items' => $items, 'settings' => $settings), TF_CACHE_TIME);
        $this->cached_settings = $settings;

        $this->prune_image_cache($items);

        return $items;
    }

    private function backfill_link_codes($items) {
        global $wpdb;
        $table = $wpdb->prefix . TF_TABLE;
        foreach ($items as $item) {
            if (empty($item['code']) || empty($item['domain'])) continue;
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET code = %s WHERE domain = %s AND (code = '' OR code IS NULL)",
                $item['code'], $item['domain']
            ));
        }
    }

    private function get_settings() {
        if (!isset($this->cached_settings)) {
            $this->get_data();
        }
        return $this->cached_settings ?: array();
    }

    private function cache_image_locally($url) {
        if (empty($url)) return '';
        if (!filter_var($url, FILTER_VALIDATE_URL)) return $url;

        $mapping = get_option(TF_IMG_CACHE_OPTION, array());
        $hash = md5($url);

        if (isset($mapping[$hash]) && file_exists($mapping[$hash]['path'])) {
            return $mapping[$hash]['url'];
        }

        $resp = wp_remote_get($url, array('timeout' => 5));
        if (is_wp_error($resp) || 200 !== wp_remote_retrieve_response_code($resp)) {
            return $url;
        }

        $content_type = wp_remote_retrieve_header($resp, 'content-type');
        $ext_map = array(
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/avif' => 'avif',
            'image/svg+xml' => 'svg',
        );

        $path = parse_url($url, PHP_URL_PATH);
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if (!in_array($ext, array('jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'), true)) {
            $ext = isset($ext_map[$content_type]) ? $ext_map[$content_type] : 'webp';
        }
        if ($ext === 'jpeg') $ext = 'jpg';

        $upload_dir = wp_upload_dir();
        $img_dir = $upload_dir['basedir'] . '/tf-images';
        $img_url_base = $upload_dir['baseurl'] . '/tf-images';

        if (!file_exists($img_dir)) {
            wp_mkdir_p($img_dir);
        }

        $filename = $hash . '.' . $ext;
        $filepath = $img_dir . '/' . $filename;
        $fileurl = $img_url_base . '/' . $filename;

        $body = wp_remote_retrieve_body($resp);
        if (empty($body)) return $url;

        file_put_contents($filepath, $body);

        if (!file_exists($filepath)) return $url;

        $mapping[$hash] = array('path' => $filepath, 'url' => $fileurl);
        update_option(TF_IMG_CACHE_OPTION, $mapping, false);

        return $fileurl;
    }

    private function get_cached_icon($item, $prefer = 'icon') {
        $url = '';
        if ($prefer === 'header_icon') {
            if (!empty($item['header_icon'])) {
                $url = $item['header_icon'];
            } elseif (!empty($item['icon'])) {
                $url = $item['icon'];
            }
        } else {
            if (!empty($item['icon'])) {
                $url = $item['icon'];
            } elseif (!empty($item['header_icon'])) {
                $url = $item['header_icon'];
            }
        }
        return $this->cache_image_locally($url);
    }

    public function ajax_save_link() {
        check_ajax_referer('tf_save_link', 'nonce');

        if (!current_user_can('edit_pages')) {
            wp_die('Forbidden');
        }

        $domain = sanitize_text_field($_POST['domain']);
        $code   = isset($_POST['code']) ? sanitize_text_field($_POST['code']) : '';
        $field  = sanitize_text_field($_POST['field']);
        $value  = sanitize_text_field($_POST['value']);

        if (!in_array($field, array('mlink', 'review_link'), true)) {
            wp_die('Invalid field');
        }

        global $wpdb;
        $table = $wpdb->prefix . TF_TABLE;

        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table WHERE code = %s", $code
        ));

        if ($existing) {
            $wpdb->update($table, array($field => $value, 'domain' => $domain), array('id' => $existing));
        } else {
            $wpdb->insert($table, array(
                'code' => $code,
                'domain' => $domain,
                $field => $value,
            ));
        }

        wp_send_json($value ?: '—');
    }

    public function ajax_clear_cache() {
        check_ajax_referer('tf_clear_cache', 'nonce');

        if (!current_user_can('edit_pages')) {
            wp_die('Forbidden');
        }

        delete_transient(TF_CACHE_KEY);
        $this->clear_image_cache();
        wp_send_json_success();
    }


    public function ajax_sync_clicks() {
        check_ajax_referer('tf_sync_clicks', 'nonce');

        if (!current_user_can('edit_pages')) {
            wp_die('Forbidden');
        }

        $this->sync_click_logs();

        global $wpdb;
        $table = $wpdb->prefix . TF_CLICK_TABLE;
        $remaining = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE synced = 0");

        if ($remaining > 0) {
            wp_send_json_error(array('message' => "Còn $remaining dòng chưa sync."));
        } else {
            wp_send_json_success(array('message' => 'Đã sync toàn bộ clicks lên Google Sheet.'));
        }
    }

    public function add_cron_interval($schedules) {
        $schedules['tf_every_30min'] = array(
            'interval' => 1800,
            'display'  => __('Every 30 minutes'),
        );
        return $schedules;
    }

    private function ensure_cron_schedule() {
        $hook = 'tf_sync_click_logs';
        if (wp_next_scheduled($hook)) {
            $schedule = wp_get_schedule($hook);
            if ($schedule !== 'tf_every_30min') {
                wp_clear_scheduled_hook($hook);
                wp_schedule_event(time() + 1800, 'tf_every_30min', $hook);
            }
        } else {
            wp_schedule_event(time() + 1800, 'tf_every_30min', $hook);
        }
    }

    private function get_user_ip() {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    }

    public function ajax_track_click() {
        $domain    = isset($_POST['domain']) ? sanitize_text_field($_POST['domain']) : '';
        $target_url = isset($_POST['target_url']) ? esc_url_raw($_POST['target_url']) : '';
        $ip        = $this->get_user_ip();

        if (empty($domain) && empty($target_url)) return;

        if (empty($domain)) $domain = parse_url($target_url, PHP_URL_HOST);

        $brand = '';
        if (!empty($domain)) {
            $cached = get_transient(TF_CACHE_KEY);
            if (is_array($cached) && isset($cached['items'])) {
                foreach ($cached['items'] as $item) {
                    $d = isset($item['domain']) ? $item['domain'] : '';
                    if ($d === $domain) {
                        $brand = isset($item['code']) ? $item['code'] : '';
                        break;
                    }
                }
            }
        }
        if (empty($brand)) $brand = isset($_POST['brand']) ? sanitize_text_field($_POST['brand']) : '';

        global $wpdb;
        $table = $wpdb->prefix . TF_CLICK_TABLE;
        $wpdb->insert($table, array(
            'domain'     => $domain,
            'brand'      => $brand,
            'target_url' => $target_url,
            'ip'         => $ip,
            'clicked_at' => wp_date('Y-m-d H:i:s', time(), new DateTimeZone('+07:00')),
        ));
    }

    public function sync_click_logs() {
        if (empty(TF_TRACK_URL)) return;

        global $wpdb;
        $table = $wpdb->prefix . TF_CLICK_TABLE;
        $rows = $wpdb->get_results(
            "SELECT id, domain, brand, target_url, ip, clicked_at FROM $table WHERE synced = 0 ORDER BY id ASC LIMIT 200",
            ARRAY_A
        );
        if (empty($rows)) return;

        $data = array(
            'type'      => 'click_batch',
            'site_url'  => home_url(),
            'site_name' => get_bloginfo('name'),
            'clicks'    => $rows,
        );

        $resp = wp_remote_post(TF_TRACK_URL, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body'    => json_encode($data),
            'timeout' => 60,
            'blocking' => true,
        ));

        $ids = wp_list_pluck($rows, 'id');
        $ids_placeholder = implode(',', array_fill(0, count($ids), '%d'));

        if (is_wp_error($resp)) return;

        $code = wp_remote_retrieve_response_code($resp);

        if ($code >= 200 && $code < 300) {
            $wpdb->query($wpdb->prepare(
                "DELETE FROM $table WHERE id IN ($ids_placeholder)", $ids
            ));
        } else {
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET synced = 1 WHERE id IN ($ids_placeholder)", $ids
            ));
        }
    }

}

Toplist_Frontend::instance();

if (file_exists(__DIR__ . '/plugin-update-checker/plugin-update-checker.php')) {
    require_once __DIR__ . '/plugin-update-checker/plugin-update-checker.php';

    $updateChecker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://github.com/' . CBD_GITHUB_USERNAME . '/' . CBD_GITHUB_REPOSITORY,
        __FILE__,
        'brandview'
    );

    if (!empty(CBD_GITHUB_TOKEN)) {
        $updateChecker->getVcsApi()->setAuthentication(CBD_GITHUB_TOKEN);
    }
    $updateChecker->setBranch('main');
}
