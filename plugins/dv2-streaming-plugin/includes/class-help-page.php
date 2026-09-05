<?php
/**
 * Help Page Handler
 * Provides user-friendly guide for using shortcodes
 */

if (!defined('ABSPATH')) {
    exit;
}

class DV2_Help_Page {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', array($this, 'add_help_page'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_help_assets'));
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
     * Render screenshot grid dynamically for all available layouts
     * 
     * @param string $shortcode_name Shortcode name for screenshot filename
     */
    private function render_screenshots_grid($shortcode_name) {
        $layouts = $this->get_available_layouts();
        ?>
        <div class="dv2-screenshots-grid">
            <?php foreach ($layouts as $layout) : 
                $screenshot_path = DV2_STREAMING_PLUGIN_DIR . 'assets/images/screenshots/' . $shortcode_name . '-' . $layout . '.jpg';
                $screenshot_url = DV2_STREAMING_PLUGIN_URL . 'assets/images/screenshots/' . $shortcode_name . '-' . $layout . '.jpg';
                ?>
                <?php if (file_exists($screenshot_path)) : ?>
                    <div class="dv2-screenshot">
                        <img src="<?php echo esc_url($screenshot_url); ?>" 
                             alt="<?php echo esc_attr(ucfirst($layout)); ?> Layout"
                             loading="lazy">
                        <p><?php echo esc_html(ucfirst($layout)); ?> Layout</p>
                    </div>
                <?php else : ?>
                    <div class="dv2-screenshot-placeholder">
                        <span class="dashicons dashicons-format-image"></span>
                        <p><?php echo esc_html(ucfirst($layout)); ?> Layout<br><small>Thêm ảnh chụp màn hình tại đây</small></p>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
        <?php
    }
    
    /**
     * Get layout list as string for display
     * 
     * @return string Comma-separated list of layouts
     */
    private function get_layouts_list() {
        $layouts = $this->get_available_layouts();
        return implode(', ', $layouts);
    }
    
    /**
     * Add help page to admin menu
     */
    public function add_help_page() {
        // Add as submenu under DV2 Streaming
        add_submenu_page(
            'dv2-streaming',
            __('Hướng dẫn sử dụng', 'dv2-streaming'),
            __('Hướng dẫn sử dụng', 'dv2-streaming'),
            'edit_posts',
            'dv2-how-to-use',
            array($this, 'render_help_page')
        );
    }
    
    /**
     * Render help page
     */
    public function render_help_page() {
        ?>
        <div class="wrap dv2-help-page">
            <h1><?php echo esc_html__('Hướng dẫn sử dụng Plugin DV2 Streaming', 'dv2-streaming'); ?></h1>
            
            <div class="dv2-help-intro">
                <p class="description">
                    <?php echo esc_html__('Hướng dẫn dùng shortcode để hiển thị lịch trực tiếp, danh sách trận, BLV, highlights và trang chi tiết stream. Sao chép shortcode rồi dán vào trang WordPress. Dữ liệu lấy từ Live API — không dùng Custom Post Type.', 'dv2-streaming'); ?>
                </p>
                <p class="description">
                    <?php echo esc_html__('URL chi tiết trận: /streams/{id} (ví dụ /streams/n54qllhn487dqvy/). Trang /streams cần shortcode [stream_detail].', 'dv2-streaming'); ?>
                </p>
                <p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=dv2-streaming')); ?>" class="button">
                        <span class="dashicons dashicons-admin-settings"></span>
                        <?php echo esc_html__('Đi đến Cài đặt', 'dv2-streaming'); ?>
                    </a>
                </p>
            </div>
            
            <div class="dv2-help-tabs">
                <nav class="nav-tab-wrapper">
                    <a href="#tab-shortcodes" class="nav-tab nav-tab-active"><?php echo esc_html__('Shortcode', 'dv2-streaming'); ?></a>
                    <a href="#tab-layouts" class="nav-tab"><?php echo esc_html__('Layout', 'dv2-streaming'); ?></a>
                    <a href="#tab-examples" class="nav-tab"><?php echo esc_html__('Ví dụ', 'dv2-streaming'); ?></a>
                    <a href="#tab-faq" class="nav-tab"><?php echo esc_html__('Câu hỏi thường gặp', 'dv2-streaming'); ?></a>
                </nav>
                
                <!-- Tab 1: Shortcodes -->
                <div id="tab-shortcodes" class="dv2-tab-content active">
                    <?php $this->render_shortcodes_tab(); ?>
                </div>
                
                <!-- Tab 2: Layouts -->
                <div id="tab-layouts" class="dv2-tab-content">
                    <?php $this->render_layouts_tab(); ?>
                </div>
                
                <!-- Tab 3: Examples -->
                <div id="tab-examples" class="dv2-tab-content">
                    <?php $this->render_examples_tab(); ?>
                </div>
                
                <!-- Tab 4: FAQ -->
                <div id="tab-faq" class="dv2-tab-content">
                    <?php $this->render_faq_tab(); ?>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render Shortcodes Tab
     */
    private function render_shortcodes_tab() {
        $layouts_list = $this->get_layouts_list();
        ?>
        <div class="dv2-help-section">
            <h2><?php echo esc_html__('Các Shortcode có sẵn', 'dv2-streaming'); ?></h2>
            <p><?php echo esc_html__('Nhấp "Sao chép" để sao chép shortcode, sau đó dán vào trình chỉnh sửa trang của bạn.', 'dv2-streaming'); ?></p>
            <p class="description">
                <?php
                echo esc_html(
                    sprintf(
                        /* translators: %s: comma-separated layout names */
                        __('Layout đang có trên máy: %s. Nếu layout không có template tương ứng, plugin sẽ fallback về layout mặc định.', 'dv2-streaming'),
                        $layouts_list
                    )
                );
                ?>
            </p>

            <div class="dv2-help-tip" style="margin-bottom: 24px;">
                <h4><?php echo esc_html__('Danh sách đầy đủ 9 shortcode', 'dv2-streaming'); ?></h4>
                <ol style="margin: 0; padding-left: 1.25em;">
                    <li><code>[danh_sach_featured_video]</code> — <?php echo esc_html__('Video/stream nổi bật', 'dv2-streaming'); ?></li>
                    <li><code>[danh_sach_blv_hot]</code> — <?php echo esc_html__('Danh sách BLV hot', 'dv2-streaming'); ?></li>
                    <li><code>[danh_sach_video_hot]</code> — <?php echo esc_html__('Live stream hot', 'dv2-streaming'); ?></li>
                    <li><code>[lich_truc_tiep]</code> — <?php echo esc_html__('Lịch trực tiếp', 'dv2-streaming'); ?></li>
                    <li><code>[highlights_moi_nhat]</code> — <?php echo esc_html__('Highlights mới nhất', 'dv2-streaming'); ?></li>
                    <li><code>[highlights]</code> — <?php echo esc_html__('Khối highlights (mặc định cakhia-v2)', 'dv2-streaming'); ?></li>
                    <li><code>[de_xuat_video]</code> — <?php echo esc_html__('Video đề xuất', 'dv2-streaming'); ?></li>
                    <li><code>[stream_detail]</code> — <?php echo esc_html__('Chi tiết stream (/streams/{id})', 'dv2-streaming'); ?></li>
                    <li><code>[ket_qua_hom_nay]</code> — <?php echo esc_html__('Kết quả hôm nay', 'dv2-streaming'); ?></li>
                </ol>
                <p style="margin: 12px 0 0;">
                    <?php echo esc_html__('Chi tiết tham số của từng shortcode nằm ngay bên dưới.', 'dv2-streaming'); ?>
                </p>
            </div>
            
            <!-- Shortcode 1 -->
            <div class="dv2-shortcode-card">
                <div class="dv2-shortcode-header">
                    <h3>1. <?php echo esc_html__('Danh sách Video Nổi bật', 'dv2-streaming'); ?></h3>
                    <span class="dv2-badge dv2-badge-featured">Nổi bật</span>
                </div>
                
                <div class="dv2-shortcode-body">
                    <div class="dv2-shortcode-code">
                        <code class="dv2-code-block">[danh_sach_featured_video count="5" layout="socolive" banner_zone_id="2724"]</code>
                        <button class="button dv2-copy-btn" data-shortcode='[danh_sach_featured_video count="5" layout="socolive" banner_zone_id="2724"]'>
                            <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                        </button>
                    </div>
                    
                    <div class="dv2-shortcode-description">
                        <p><?php echo esc_html__('Hiển thị video/stream nổi bật (template: home-featured-streams.block.php).', 'dv2-streaming'); ?></p>
                        <strong><?php echo esc_html__('Tham số:', 'dv2-streaming'); ?></strong>
                        <ul>
                            <li><code>count</code> — <?php echo esc_html__('Số lượng (mặc định: 3)', 'dv2-streaming'); ?></li>
                            <li><code>layout</code> — <?php echo esc_html__('Layout (mặc định: socolive)', 'dv2-streaming'); ?></li>
                            <li><code>ads-block-id</code> — <?php echo esc_html__('ID UX Block quảng cáo (tùy chọn)', 'dv2-streaming'); ?></li>
                            <li><code>banner_zone_id</code> — <?php echo esc_html__('Zone ID banner (mặc định: 2724)', 'dv2-streaming'); ?></li>
                        </ul>
                    </div>
                    
                    <div class="dv2-shortcode-screenshots">
                        <h4><?php echo esc_html__('Ảnh chụp màn hình', 'dv2-streaming'); ?></h4>
                        <?php $this->render_screenshots_grid('featured-video'); ?>
                    </div>
                </div>
            </div>
            
            <!-- Shortcode 2 -->
            <div class="dv2-shortcode-card">
                <div class="dv2-shortcode-header">
                    <h3>2. <?php echo esc_html__('Danh sách BLV Hot', 'dv2-streaming'); ?></h3>
                    <span class="dv2-badge dv2-badge-blv">BLV</span>
                </div>
                
                <div class="dv2-shortcode-body">
                    <div class="dv2-shortcode-code">
                        <code class="dv2-code-block">[danh_sach_blv_hot count="10" layout="socolive"]</code>
                        <button class="button dv2-copy-btn" data-shortcode='[danh_sach_blv_hot count="10" layout="socolive"]'>
                            <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                        </button>
                    </div>
                    
                    <div class="dv2-shortcode-description">
                        <p><?php echo esc_html__('Hiển thị danh sách BLV hot (template: hot-blv-list.block.php).', 'dv2-streaming'); ?></p>
                        <strong><?php echo esc_html__('Tham số:', 'dv2-streaming'); ?></strong>
                        <ul>
                            <li><code>count</code> — <?php echo esc_html__('Số lượng BLV (mặc định: 10)', 'dv2-streaming'); ?></li>
                            <li><code>category</code> — <?php echo esc_html__('Lọc theo danh mục (tùy chọn)', 'dv2-streaming'); ?></li>
                            <li><code>orderby</code> — <?php echo esc_html__('Sắp xếp theo (mặc định: date)', 'dv2-streaming'); ?></li>
                            <li><code>order</code> — <?php echo esc_html__('ASC hoặc DESC (mặc định: DESC)', 'dv2-streaming'); ?></li>
                            <li><code>layout</code> — <?php echo esc_html__('Layout (mặc định: socolive)', 'dv2-streaming'); ?></li>
                        </ul>
                    </div>
                    
                    <div class="dv2-shortcode-screenshots">
                        <h4><?php echo esc_html__('Ảnh chụp màn hình', 'dv2-streaming'); ?></h4>
                        <?php $this->render_screenshots_grid('blv-hot'); ?>
                    </div>
                </div>
            </div>
            
            <!-- Shortcode 3 -->
            <div class="dv2-shortcode-card">
                <div class="dv2-shortcode-header">
                    <h3>3. <?php echo esc_html__('Danh sách Video Hot', 'dv2-streaming'); ?></h3>
                    <span class="dv2-badge dv2-badge-hot">Hot</span>
                </div>
                
                <div class="dv2-shortcode-body">
                    <div class="dv2-shortcode-code">
                        <code class="dv2-code-block">[danh_sach_video_hot count="8" layout="socolive"]</code>
                        <button class="button dv2-copy-btn" data-shortcode='[danh_sach_video_hot count="8" layout="socolive"]'>
                            <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                        </button>
                    </div>
                    
                    <div class="dv2-shortcode-description">
                        <p><?php echo esc_html__('Hiển thị live stream đang hot (template: hot-live-streams.block.php).', 'dv2-streaming'); ?></p>
                        <strong><?php echo esc_html__('Tham số:', 'dv2-streaming'); ?></strong>
                        <ul>
                            <li><code>count</code> — <?php echo esc_html__('Số lượng video (mặc định: 3)', 'dv2-streaming'); ?></li>
                            <li><code>layout</code> — <?php echo esc_html__('Layout (mặc định: socolive)', 'dv2-streaming'); ?></li>
                        </ul>
                    </div>
                    
                    <div class="dv2-shortcode-screenshots">
                        <h4><?php echo esc_html__('Ảnh chụp màn hình', 'dv2-streaming'); ?></h4>
                        <?php $this->render_screenshots_grid('video-hot'); ?>
                    </div>
                </div>
            </div>
            
            <!-- Shortcode 4 -->
            <div class="dv2-shortcode-card">
                <div class="dv2-shortcode-header">
                    <h3>4. <?php echo esc_html__('Lịch trực tiếp', 'dv2-streaming'); ?></h3>
                    <span class="dv2-badge dv2-badge-schedule">Lịch</span>
                </div>
                
                <div class="dv2-shortcode-body">
                    <div class="dv2-shortcode-code">
                        <code class="dv2-code-block">[lich_truc_tiep count="3" layout="socolive"]</code>
                        <button class="button dv2-copy-btn" data-shortcode='[lich_truc_tiep count="3" layout="socolive"]'>
                            <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                        </button>
                    </div>
                    
                    <div class="dv2-shortcode-description">
                        <p><?php echo esc_html__('Hiển thị lịch thi đấu / lịch trực tiếp (template: stream-calander.block.php).', 'dv2-streaming'); ?></p>
                        <strong><?php echo esc_html__('Tham số:', 'dv2-streaming'); ?></strong>
                        <ul>
                            <li><code>count</code> — <?php echo esc_html__('Số lượng (mặc định: 3)', 'dv2-streaming'); ?></li>
                            <li><code>layout</code> — <?php echo esc_html__('Layout (mặc định: socolive)', 'dv2-streaming'); ?></li>
                        </ul>
                    </div>
                    
                    <div class="dv2-shortcode-screenshots">
                        <h4><?php echo esc_html__('Ảnh chụp màn hình', 'dv2-streaming'); ?></h4>
                        <?php $this->render_screenshots_grid('schedule'); ?>
                    </div>
                </div>
            </div>
            
            <!-- Shortcode 5 -->
            <div class="dv2-shortcode-card">
                <div class="dv2-shortcode-header">
                    <h3>5. <?php echo esc_html__('Highlights mới nhất', 'dv2-streaming'); ?></h3>
                    <span class="dv2-badge dv2-badge-highlights">Highlights</span>
                </div>
                
                <div class="dv2-shortcode-body">
                    <div class="dv2-shortcode-code">
                        <code class="dv2-code-block">[highlights_moi_nhat count="20" layout="socolive"]</code>
                        <button class="button dv2-copy-btn" data-shortcode='[highlights_moi_nhat count="20" layout="socolive"]'>
                            <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                        </button>
                    </div>
                    
                    <div class="dv2-shortcode-description">
                        <p><?php echo esc_html__('Hiển thị highlights mới nhất (template: latest-highlights.block.php). Dùng trên trang /highlights mặc định.', 'dv2-streaming'); ?></p>
                        <strong><?php echo esc_html__('Tham số:', 'dv2-streaming'); ?></strong>
                        <ul>
                            <li><code>count</code> — <?php echo esc_html__('Số lượng (mặc định: 3)', 'dv2-streaming'); ?></li>
                            <li><code>layout</code> — <?php echo esc_html__('Layout (mặc định: socolive)', 'dv2-streaming'); ?></li>
                        </ul>
                    </div>
                    
                    <div class="dv2-shortcode-screenshots">
                        <h4><?php echo esc_html__('Ảnh chụp màn hình', 'dv2-streaming'); ?></h4>
                        <?php $this->render_screenshots_grid('highlights'); ?>
                    </div>
                </div>
            </div>

            <!-- Shortcode 6 -->
            <div class="dv2-shortcode-card">
                <div class="dv2-shortcode-header">
                    <h3>6. <?php echo esc_html__('Highlights (khối riêng)', 'dv2-streaming'); ?></h3>
                    <span class="dv2-badge dv2-badge-highlights">Highlights</span>
                </div>
                
                <div class="dv2-shortcode-body">
                    <div class="dv2-shortcode-code">
                        <code class="dv2-code-block">[highlights layout="cakhia-v2" title="HIGHLIGHTS BÓNG ĐÁ MỚI NHẤT" size="12"]</code>
                        <button class="button dv2-copy-btn" data-shortcode='[highlights layout="cakhia-v2" title="HIGHLIGHTS BÓNG ĐÁ MỚI NHẤT" size="12"]'>
                            <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                        </button>
                    </div>

                    <div class="dv2-shortcode-description">
                        <p><?php echo esc_html__('Khối highlights theo layout riêng (template: highlights.block.php). Mặc định layout cakhia-v2; nếu thiếu file sẽ fallback cakhia-v2.', 'dv2-streaming'); ?></p>
                        <strong><?php echo esc_html__('Tham số:', 'dv2-streaming'); ?></strong>
                        <ul>
                            <li><code>layout</code> — <?php echo esc_html__('Layout (mặc định: cakhia-v2)', 'dv2-streaming'); ?></li>
                            <li><code>title</code> — <?php echo esc_html__('Tiêu đề khối (tùy chọn)', 'dv2-streaming'); ?></li>
                            <li><code>size</code> — <?php echo esc_html__('Số item mỗi lần tải / page size API (mặc định: 12, tối đa: 100)', 'dv2-streaming'); ?></li>
                        </ul>
                    </div>
                    
                    <div class="dv2-shortcode-screenshots">
                        <h4><?php echo esc_html__('Ảnh chụp màn hình', 'dv2-streaming'); ?></h4>
                        <?php $this->render_screenshots_grid('highlights-block'); ?>
                    </div>
                </div>
            </div>
            
            <!-- Shortcode 7 -->
            <div class="dv2-shortcode-card">
                <div class="dv2-shortcode-header">
                    <h3>7. <?php echo esc_html__('Đề xuất Video', 'dv2-streaming'); ?></h3>
                    <span class="dv2-badge dv2-badge-suggested">Đề xuất</span>
                </div>
                
                <div class="dv2-shortcode-body">
                    <div class="dv2-shortcode-code">
                        <code class="dv2-code-block">[de_xuat_video count="12" layout="socolive" view_more="0"]</code>
                        <button class="button dv2-copy-btn" data-shortcode='[de_xuat_video count="12" layout="socolive" view_more="0"]'>
                            <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                        </button>
                    </div>
                    
                    <div class="dv2-shortcode-description">
                        <p><?php echo esc_html__('Hiển thị video đề xuất (template: suggested-streams.block.php).', 'dv2-streaming'); ?></p>
                        <strong><?php echo esc_html__('Tham số:', 'dv2-streaming'); ?></strong>
                        <ul>
                            <li><code>count</code> — <?php echo esc_html__('Số lượng (mặc định: 3)', 'dv2-streaming'); ?></li>
                            <li><code>layout</code> — <?php echo esc_html__('Layout (mặc định: socolive)', 'dv2-streaming'); ?></li>
                            <li><code>view_more</code> — <?php echo esc_html__('0 = tối đa ~12 trận, không nút Xem thêm; 1 = phân trang + nút Xem thêm (mặc định: 0)', 'dv2-streaming'); ?></li>
                        </ul>
                    </div>
                    
                    <div class="dv2-shortcode-screenshots">
                        <h4><?php echo esc_html__('Ảnh chụp màn hình', 'dv2-streaming'); ?></h4>
                        <?php $this->render_screenshots_grid('suggested'); ?>
                    </div>
                </div>
            </div>
            
            <!-- Shortcode 8 -->
            <div class="dv2-shortcode-card">
                <div class="dv2-shortcode-header">
                    <h3>8. <?php echo esc_html__('Chi tiết Stream', 'dv2-streaming'); ?></h3>
                    <span class="dv2-badge dv2-badge-detail">Chi tiết</span>
                </div>
                
                <div class="dv2-shortcode-body">
                    <div class="dv2-shortcode-code">
                        <code class="dv2-code-block">[stream_detail layout="socolive" shortcode_stream="dv2_livechat" banner_zone_id="2724"]</code>
                        <button class="button dv2-copy-btn" data-shortcode='[stream_detail layout="socolive" shortcode_stream="dv2_livechat" banner_zone_id="2724"]'>
                            <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                        </button>
                    </div>
                    
                    <div class="dv2-shortcode-description">
                        <p><?php echo esc_html__('Trang chi tiết livestream. Tự đọc stream ID từ rewrite /streams/{id} (query var stream_id).', 'dv2-streaming'); ?></p>
                        <strong><?php echo esc_html__('Tham số:', 'dv2-streaming'); ?></strong>
                        <ul>
                            <li><code>layout</code> — <?php echo esc_html__('Layout (mặc định: socolive)', 'dv2-streaming'); ?></li>
                            <li><code>shortcode_stream</code> — <?php echo esc_html__('Shortcode chat nhúng (mặc định: dv2_livechat)', 'dv2-streaming'); ?></li>
                            <li><code>banner_zone_id</code> — <?php echo esc_html__('Zone ID banner (mặc định: 2724)', 'dv2-streaming'); ?></li>
                            <li><code>ads-block-id</code> — <?php echo esc_html__('ID UX Block quảng cáo (tùy chọn)', 'dv2-streaming'); ?></li>
                            <li><code>block-id</code> — <?php echo esc_html__('ID UX Block UI đặc biệt (vd. một số layout vebo-v2)', 'dv2-streaming'); ?></li>
                        </ul>
                        <div class="notice notice-info inline">
                            <p><?php echo esc_html__('Shortcode này nên đặt trên trang /streams (được tạo khi kích hoạt plugin). Không cần thêm vào trang khác trừ khi bạn tự cấu hình rewrite tương tự.', 'dv2-streaming'); ?></p>
                        </div>
                    </div>
                    
                    <div class="dv2-shortcode-screenshots">
                        <h4><?php echo esc_html__('Ảnh chụp màn hình', 'dv2-streaming'); ?></h4>
                        <?php $this->render_screenshots_grid('stream-detail'); ?>
                    </div>
                </div>
            </div>
            
            <!-- Shortcode 9 -->
            <div class="dv2-shortcode-card">
                <div class="dv2-shortcode-header">
                    <h3>9. <?php echo esc_html__('Kết quả hôm nay', 'dv2-streaming'); ?></h3>
                    <span class="dv2-badge dv2-badge-results">Kết quả</span>
                </div>
                
                <div class="dv2-shortcode-body">
                    <div class="dv2-shortcode-code">
                        <code class="dv2-code-block">[ket_qua_hom_nay count="10" layout="cakhia"]</code>
                        <button class="button dv2-copy-btn" data-shortcode='[ket_qua_hom_nay count="10" layout="cakhia"]'>
                            <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                        </button>
                    </div>
                    
                    <div class="dv2-shortcode-description">
                        <p><?php echo esc_html__('Hiển thị kết quả trận đấu hôm nay (template: today-results.block.php). Có sẵn template cakhia, vebo, vebo-v2.', 'dv2-streaming'); ?></p>
                        <strong><?php echo esc_html__('Tham số:', 'dv2-streaming'); ?></strong>
                        <ul>
                            <li><code>count</code> — <?php echo esc_html__('Số lượng (mặc định: 10)', 'dv2-streaming'); ?></li>
                            <li><code>layout</code> — <?php echo esc_html__('Layout (mặc định: cakhia)', 'dv2-streaming'); ?></li>
                            <li><code>arg</code> — <?php echo esc_html__('Để trống = trang kết quả; giá trị lich-thi-dau-bong-da = chế độ lịch (nếu template hỗ trợ)', 'dv2-streaming'); ?></li>
                        </ul>
                        <div class="notice notice-info inline">
                            <p><?php echo esc_html__('Trang /ket-qua-hom-nay được tạo tự động khi kích hoạt plugin.', 'dv2-streaming'); ?></p>
                        </div>
                    </div>
                    
                    <div class="dv2-shortcode-screenshots">
                        <h4><?php echo esc_html__('Ảnh chụp màn hình', 'dv2-streaming'); ?></h4>
                        <?php $this->render_screenshots_grid('today-results'); ?>
                    </div>
                </div>
            </div>
            
        </div>
        <?php
    }
    
    /**
     * Render Layouts Tab
     */
    private function render_layouts_tab() {
        $layouts = $this->get_available_layouts();
        ?>
        <div class="dv2-help-section">
            <h2><?php echo esc_html__('Các Layout có sẵn', 'dv2-streaming'); ?></h2>
            <p>
                <?php
                echo esc_html(
                    sprintf(
                        /* translators: %d: number of layouts */
                        __('Có %d layout được phát hiện từ thư mục includes/layouts/. Mỗi shortcode chỉ render được nếu layout đó có file template tương ứng.', 'dv2-streaming'),
                        count($layouts)
                    )
                );
                ?>
            </p>
            
            <div class="dv2-layouts-grid">
                <?php foreach ($layouts as $index => $layout) : 
                    $screenshot_path = DV2_STREAMING_PLUGIN_DIR . 'assets/images/screenshots/layout-' . $layout . '-preview.jpg';
                    $screenshot_url = DV2_STREAMING_PLUGIN_URL . 'assets/images/screenshots/layout-' . $layout . '-preview.jpg';
                    $is_default = ($layout === 'socolive');
                    ?>
                    <div class="dv2-layout-card">
                        <div class="dv2-layout-preview">
                            <?php if (file_exists($screenshot_path)) : ?>
                                <img src="<?php echo esc_url($screenshot_url); ?>" 
                                     alt="<?php echo esc_attr(ucfirst($layout)); ?> Preview"
                                     loading="lazy"
                                     style="width: 100%; border-radius: 6px; border: 1px solid #ddd;">
                            <?php else : ?>
                                <div class="dv2-screenshot-placeholder large">
                                    <span class="dashicons dashicons-format-image"></span>
                                    <p><?php echo esc_html(ucfirst($layout)); ?> Preview<br><small>Thêm ảnh chụp màn hình tại đây</small></p>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="dv2-layout-info">
                            <h3><?php echo esc_html(ucfirst($layout)); ?></h3>
                            <?php if ($is_default) : ?>
                                <span class="dv2-badge dv2-badge-default"><?php echo esc_html__('Mặc định', 'dv2-streaming'); ?></span>
                            <?php endif; ?>
                            <p><?php 
                                if ($is_default) {
                                    echo esc_html__('Thiết kế hiện đại và sạch sẽ với trọng tâm vào nội dung và khả năng đọc.', 'dv2-streaming');
                                } else {
                                    echo esc_html__('Layout với phong cách thiết kế độc đáo.', 'dv2-streaming');
                                }
                            ?></p>
                            <code>layout="<?php echo esc_html($layout); ?>"</code>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <div class="dv2-help-tip">
                <h4><span class="dashicons dashicons-lightbulb"></span> <?php echo esc_html__('Mẹo:', 'dv2-streaming'); ?></h4>
                <p><?php echo esc_html__('Bạn có thể sử dụng các layout khác nhau trên cùng một trang hoặc sử dụng một layout nhất quán trên toàn bộ trang web của bạn.', 'dv2-streaming'); ?></p>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render Examples Tab
     */
    private function render_examples_tab() {
        ?>
        <div class="dv2-help-section">
            <h2><?php echo esc_html__('Ví dụ thường dùng', 'dv2-streaming'); ?></h2>
            
            <div class="dv2-example-card">
                <h3><?php echo esc_html__('Ví dụ 1: Trang chủ (tạo khi kích hoạt)', 'dv2-streaming'); ?></h3>
                <p><?php echo esc_html__('Nội dung mặc định của /dv2-trang-chu.', 'dv2-streaming'); ?></p>
                
                <div class="dv2-example-code">
                    <pre><code>[danh_sach_featured_video count="5" layout="socolive"]

[danh_sach_blv_hot count="10" layout="socolive"]

[danh_sach_video_hot count="8" layout="socolive"]</code></pre>
                    <button class="button button-primary dv2-copy-btn" data-shortcode='[danh_sach_featured_video count="5" layout="socolive"]

[danh_sach_blv_hot count="10" layout="socolive"]

[danh_sach_video_hot count="8" layout="socolive"]'>
                        <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép tất cả', 'dv2-streaming'); ?>
                    </button>
                </div>
            </div>
            
            <div class="dv2-example-card">
                <h3><?php echo esc_html__('Ví dụ 2: Lịch thi đấu', 'dv2-streaming'); ?></h3>
                <p><?php echo esc_html__('Trang /lich-thi-dau.', 'dv2-streaming'); ?></p>
                
                <div class="dv2-example-code">
                    <pre><code>[lich_truc_tiep layout="socolive"]</code></pre>
                    <button class="button button-primary dv2-copy-btn" data-shortcode='[lich_truc_tiep layout="socolive"]'>
                        <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                    </button>
                </div>
            </div>
            
            <div class="dv2-example-card">
                <h3><?php echo esc_html__('Ví dụ 3: Chi tiết stream', 'dv2-streaming'); ?></h3>
                <p><?php echo esc_html__('Đặt trên trang /streams. Người dùng vào /streams/{id} hoặc /streams/{id}/?liveId=... để xem trận.', 'dv2-streaming'); ?></p>
                
                <div class="dv2-example-code">
                    <pre><code>[stream_detail layout="socolive" shortcode_stream="dv2_livechat"]</code></pre>
                    <button class="button button-primary dv2-copy-btn" data-shortcode='[stream_detail layout="socolive" shortcode_stream="dv2_livechat"]'>
                        <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                    </button>
                </div>
            </div>
            
            <div class="dv2-example-card">
                <h3><?php echo esc_html__('Ví dụ 4: Highlights', 'dv2-streaming'); ?></h3>
                <p><?php echo esc_html__('Trang /highlights dùng highlights_moi_nhat; hoặc dùng shortcode highlights riêng (layout cakhia-v2).', 'dv2-streaming'); ?></p>
                
                <div class="dv2-example-code">
                    <pre><code>[highlights_moi_nhat count="20" layout="socolive"]

[highlights layout="cakhia-v2"]

[de_xuat_video count="12" layout="socolive" view_more="0"]</code></pre>
                    <button class="button button-primary dv2-copy-btn" data-shortcode='[highlights_moi_nhat count="20" layout="socolive"]

[highlights layout="cakhia-v2"]

[de_xuat_video count="12" layout="socolive" view_more="0"]'>
                        <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép tất cả', 'dv2-streaming'); ?>
                    </button>
                </div>
            </div>
            
            <div class="dv2-example-card">
                <h3><?php echo esc_html__('Ví dụ 5: Kết quả hôm nay', 'dv2-streaming'); ?></h3>
                <p><?php echo esc_html__('Trang /ket-qua-hom-nay.', 'dv2-streaming'); ?></p>
                
                <div class="dv2-example-code">
                    <pre><code>[ket_qua_hom_nay count="10" layout="cakhia"]</code></pre>
                    <button class="button button-primary dv2-copy-btn" data-shortcode='[ket_qua_hom_nay count="10" layout="cakhia"]'>
                        <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép', 'dv2-streaming'); ?>
                    </button>
                </div>
            </div>

            <div class="dv2-example-card">
                <h3><?php echo esc_html__('Ví dụ 6: Trộn layout', 'dv2-streaming'); ?></h3>
                <p><?php echo esc_html__('Chỉ dùng layout đã có thư mục trong includes/layouts/.', 'dv2-streaming'); ?></p>
                
                <div class="dv2-example-code">
                    <pre><code>[danh_sach_featured_video count="5" layout="socolive"]

[danh_sach_blv_hot count="10" layout="vebo"]

[danh_sach_video_hot count="8" layout="thapcam"]</code></pre>
                    <button class="button button-primary dv2-copy-btn" data-shortcode='[danh_sach_featured_video count="5" layout="socolive"]

[danh_sach_blv_hot count="10" layout="vebo"]

[danh_sach_video_hot count="8" layout="thapcam"]'>
                        <span class="dashicons dashicons-clipboard"></span> <?php echo esc_html__('Sao chép tất cả', 'dv2-streaming'); ?>
                    </button>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render FAQ Tab
     */
    private function render_faq_tab() {
        ?>
        <div class="dv2-help-section">
            <h2><?php echo esc_html__('Câu hỏi thường gặp', 'dv2-streaming'); ?></h2>
            
            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('Làm thế nào để thêm shortcode vào trang?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <ol>
                        <li><?php echo esc_html__('Vào Trang → Chỉnh sửa trang', 'dv2-streaming'); ?></li>
                        <li><?php echo esc_html__('Sao chép shortcode từ tab Shortcode', 'dv2-streaming'); ?></li>
                        <li><?php echo esc_html__('Dán vào nội dung trang rồi Cập nhật', 'dv2-streaming'); ?></li>
                    </ol>
                </div>
            </div>
            
            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('Plugin còn dùng Custom Post Type BLV/Stream không?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <p><?php echo esc_html__('Không. CPT và API sync WordPress đã được gỡ. Nội dung live lấy từ Live API qua JavaScript/layout templates.', 'dv2-streaming'); ?></p>
                </div>
            </div>
            
            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('URL /streams/{id} hoạt động thế nào?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <p><?php echo esc_html__('Rewrite map /streams/{id} → trang pagename=streams với query var stream_id. Shortcode [stream_detail] đọc ID đó để render player.', 'dv2-streaming'); ?></p>
                    <p><code>/streams/n54qllhn487dqvy/?liveId=148101</code></p>
                </div>
            </div>

            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('Link /tructiephotlink dùng để làm gì?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <p><?php echo esc_html__('Không phải shortcode. Đây là URL redirect HOT18: vào /tructiephotlink → plugin gọi API eighteen-plus → chuyển hướng tới /streams/{matchId}/?liveId=... (giữ query tracking nếu có).', 'dv2-streaming'); ?></p>
                    <p><code><?php echo esc_html(home_url('/tructiephotlink/')); ?></code></p>
                </div>
            </div>
            
            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('Layout là gì?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <p><?php echo esc_html__('Mỗi layout là một thư mục trong includes/layouts/ (ví dụ socolive, vebo, thapcam, cakhia, cakhia-v2, vebo-v2, luongson).', 'dv2-streaming'); ?></p>
                    <ul>
                        <?php foreach ($this->get_available_layouts() as $layout) : ?>
                            <li><strong><?php echo esc_html($layout); ?></strong><?php echo ($layout === 'socolive') ? ' — ' . esc_html__('mặc định cho hầu hết shortcode', 'dv2-streaming') : ''; ?></li>
                        <?php endforeach; ?>
                    </ul>
                    <p><?php echo esc_html__('Thiếu template cho layout đó → plugin fallback về socolive (hoặc cakhia-v2 với shortcode [highlights]).', 'dv2-streaming'); ?></p>
                </div>
            </div>
            
            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('Những trang nào được tạo khi kích hoạt?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <ul>
                        <li><strong>Trang chủ</strong> — <code>/dv2-trang-chu</code></li>
                        <li><strong>Lịch thi đấu</strong> — <code>/lich-thi-dau</code></li>
                        <li><strong>Streams</strong> — <code>/streams</code> (+ rewrite <code>/streams/{id}</code>)</li>
                        <li><strong>Highlights</strong> — <code>/highlights</code></li>
                        <li><strong>Kết quả hôm nay</strong> — <code>/ket-qua-hom-nay</code></li>
                    </ul>
                </div>
            </div>

            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('Cài đặt plugin gồm những gì?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <p><?php echo esc_html__('Vào DV2 Streaming → Settings để cấu hình link đặt cược, quảng cáo Vebo V2 (header/footer/góc), bảng kèo, pre-roll TVC, và các nút cược Socolive (home/detail).', 'dv2-streaming'); ?></p>
                    <p><a href="<?php echo esc_url(admin_url('admin.php?page=dv2-streaming')); ?>"><?php echo esc_html__('Mở Cài đặt DV2', 'dv2-streaming'); ?></a></p>
                </div>
            </div>

            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('CSS/JS có load trên mọi trang không?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <p><?php echo esc_html__('Không. Asset chỉ enqueue khi trang có shortcode DV2, là trang plugin đã tạo, hoặc URL /streams/{id}. HLS.js chỉ load ở trang chi tiết stream. Có thể ép load bằng filter dv2_should_enqueue_assets.', 'dv2-streaming'); ?></p>
                </div>
            </div>
            
            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('Làm sao đổi số lượng mục?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <p><?php echo esc_html__('Sửa tham số count trên shortcode, ví dụ count="5" → count="10".', 'dv2-streaming'); ?></p>
                </div>
            </div>
            
            <div class="dv2-faq-item">
                <h3><?php echo esc_html__('Tôi có thể nhận thêm trợ giúp ở đâu?', 'dv2-streaming'); ?></h3>
                <div class="dv2-faq-answer">
                    <ul>
                        <li><a href="<?php echo esc_url(admin_url('admin.php?page=dv2-streaming')); ?>"><?php echo esc_html__('Cài đặt DV2', 'dv2-streaming'); ?></a></li>
                    </ul>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Enqueue help page assets
     */
    public function enqueue_help_assets($hook) {
        // Only load on help page
        if ($hook !== 'dv2-streaming_page_dv2-how-to-use') {
            return;
        }
        
        wp_add_inline_style('wp-admin', $this->get_help_css());
        wp_add_inline_script('jquery', $this->get_help_js());
    }
    
    /**
     * Get help page CSS
     */
    private function get_help_css() {
        return '
            .dv2-help-page {
                max-width: 1400px;
            }
            
            .dv2-help-intro {
                background: #fff;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #2271b1;
                box-shadow: 0 1px 1px rgba(0,0,0,.04);
            }
            
            .dv2-help-intro .description {
                font-size: 16px;
                margin: 0;
            }
            
            .dv2-help-tabs {
                background: #fff;
                margin: 20px 0;
                box-shadow: 0 1px 1px rgba(0,0,0,.04);
            }
            
            .dv2-tab-content {
                display: none;
                padding: 30px;
            }
            
            .dv2-tab-content.active {
                display: block;
            }
            
            .dv2-shortcode-card {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 24px;
                box-shadow: 0 2px 4px rgba(0,0,0,.04);
            }
            
            .dv2-shortcode-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
                padding-bottom: 16px;
                border-bottom: 2px solid #f0f0f0;
            }
            
            .dv2-shortcode-header h3 {
                margin: 0;
                font-size: 18px;
                color: #1d2327;
            }
            
            .dv2-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .dv2-badge-featured { background: #f0f6fc; color: #0c5d9d; }
            .dv2-badge-blv { background: #fef7f0; color: #b45309; }
            .dv2-badge-hot { background: #fef2f2; color: #b91c1c; }
            .dv2-badge-schedule { background: #f0fdf4; color: #15803d; }
            .dv2-badge-highlights { background: #faf5ff; color: #7c3aed; }
            .dv2-badge-suggested { background: #fffbeb; color: #b45309; }
            .dv2-badge-detail { background: #f0f9ff; color: #0369a1; }
            .dv2-badge-results { background: #fef3c7; color: #92400e; }
            .dv2-badge-default { background: #2271b1; color: #fff; }
            
            .dv2-shortcode-code {
                display: flex;
                align-items: center;
                gap: 12px;
                background: #f6f7f7;
                padding: 16px;
                border-radius: 6px;
                margin-bottom: 20px;
            }
            
            .dv2-code-block {
                flex: 1;
                font-family: Consolas, Monaco, monospace;
                font-size: 14px;
                color: #d63384;
                background: #fff;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid #ddd;
            }
            
            .dv2-copy-btn {
                flex-shrink: 0;
                cursor: pointer;
            }
            
            .dv2-copy-btn.copied {
                background: #00a32a;
                border-color: #00a32a;
                color: #fff;
            }
            
            .dv2-shortcode-description {
                margin-bottom: 20px;
            }
            
            .dv2-shortcode-description ul {
                margin: 8px 0;
                padding-left: 24px;
            }
            
            .dv2-shortcode-description li {
                margin: 4px 0;
            }
            
            .dv2-shortcode-description code {
                background: #f6f7f7;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: Consolas, Monaco, monospace;
            }
            
            .dv2-shortcode-screenshots h4 {
                margin-top: 0;
                margin-bottom: 12px;
                font-size: 14px;
                text-transform: uppercase;
                color: #646970;
            }
            
            .dv2-screenshots-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
            }
            
            .dv2-screenshot-placeholder {
                background: #f0f0f1;
                border: 2px dashed #c3c4c7;
                border-radius: 6px;
                padding: 40px 20px;
                text-align: center;
                color: #646970;
            }
            
            .dv2-screenshot-placeholder .dashicons {
                font-size: 48px;
                width: 48px;
                height: 48px;
                opacity: 0.5;
            }
            
            .dv2-screenshot-placeholder p {
                margin: 8px 0 0 0;
                font-size: 13px;
            }
            
            .dv2-screenshot-placeholder.large {
                padding: 80px 20px;
            }
            
            .dv2-screenshot-placeholder.large .dashicons {
                font-size: 64px;
                width: 64px;
                height: 64px;
            }
            
            /* When you add actual screenshots, use this structure:
            .dv2-screenshot img {
                width: 100%;
                height: auto;
                border-radius: 6px;
                border: 1px solid #ddd;
            }
            */
            
            .dv2-layouts-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
                margin: 24px 0;
            }
            
            .dv2-layout-card {
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                background: #fff;
            }
            
            .dv2-layout-preview {
                background: #f0f0f1;
                padding: 0;
            }
            
            .dv2-layout-info {
                padding: 20px;
            }
            
            .dv2-layout-info h3 {
                margin: 0 0 8px 0;
                font-size: 18px;
            }
            
            .dv2-layout-info code {
                display: block;
                background: #f6f7f7;
                padding: 8px 12px;
                border-radius: 4px;
                margin-top: 12px;
                font-family: Consolas, Monaco, monospace;
            }
            
            .dv2-example-card {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 24px;
            }
            
            .dv2-example-card h3 {
                margin-top: 0;
                color: #1d2327;
            }
            
            .dv2-example-code {
                background: #f6f7f7;
                padding: 20px;
                border-radius: 6px;
                margin-top: 16px;
            }
            
            .dv2-example-code h4 {
                margin-top: 0;
                margin-bottom: 12px;
                font-size: 14px;
            }
            
            .dv2-example-code pre {
                background: #fff;
                padding: 16px;
                border-radius: 4px;
                border: 1px solid #ddd;
                margin: 12px 0;
                overflow-x: auto;
            }
            
            .dv2-example-code code {
                font-family: Consolas, Monaco, monospace;
                font-size: 13px;
                color: #d63384;
                line-height: 1.8;
            }
            
            .dv2-faq-item {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 16px;
            }
            
            .dv2-faq-item h3 {
                margin-top: 0;
                color: #2271b1;
                font-size: 16px;
            }
            
            .dv2-faq-answer {
                color: #50575e;
            }
            
            .dv2-faq-answer ol,
            .dv2-faq-answer ul {
                padding-left: 24px;
            }
            
            .dv2-help-tip {
                background: #fffbea;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 20px;
                margin: 24px 0;
            }
            
            .dv2-help-tip h4 {
                margin-top: 0;
                color: #92400e;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .dv2-help-tip .dashicons {
                color: #f59e0b;
            }
            
            @media (max-width: 782px) {
                .dv2-screenshots-grid,
                .dv2-layouts-grid {
                    grid-template-columns: 1fr;
                }
            }
        ';
    }
    
    /**
     * Get help page JavaScript
     */
    private function get_help_js() {
        return '
            jQuery(document).ready(function($) {
                // Tab switching
                $(".nav-tab").on("click", function(e) {
                    e.preventDefault();
                    var targetTab = $(this).attr("href");
                    
                    // Update active tab
                    $(".nav-tab").removeClass("nav-tab-active");
                    $(this).addClass("nav-tab-active");
                    
                    // Show target content
                    $(".dv2-tab-content").removeClass("active");
                    $(targetTab).addClass("active");
                });
                
                // Copy to clipboard functionality
                $(".dv2-copy-btn").on("click", function(e) {
                    e.preventDefault();
                    var $btn = $(this);
                    var shortcode = $btn.data("shortcode");
                    
                    // Create temporary textarea
                    var $temp = $("<textarea>");
                    $("body").append($temp);
                    $temp.val(shortcode).select();
                    
                    try {
                        // Copy to clipboard
                        document.execCommand("copy");
                        
                        // Update button
                        var originalHtml = $btn.html();
                        $btn.addClass("copied");
                        $btn.html(\'<span class="dashicons dashicons-yes"></span> Đã sao chép!\');
                        
                        // Reset after 2 seconds
                        setTimeout(function() {
                            $btn.removeClass("copied");
                            $btn.html(originalHtml);
                        }, 2000);
                    } catch (err) {
                        alert("Failed to copy. Please copy manually.");
                    }
                    
                    $temp.remove();
                });
            });
        ';
    }
}

