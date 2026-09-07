<?php
/**
 * Plugin Name: DV2 Livechat Plugin
 * Description: Plugin tích hợp Livechat vào WordPress.
 * Version: 1.0.208
 * Author: DEV
 * License: GPLv2 or later
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'DV2_LIVECHAT_VERSION', '1.0.208' );
define( 'DV2_LIVECHAT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'DV2_LIVECHAT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
if ( ! defined( 'DV2_LIVECHAT_API_URL' ) ) {
    define( 'DV2_LIVECHAT_API_URL', 'https://live.chatcms.us' );
}

/**
 * 1. Add Admin Menu
 */
function dv2_livechat_add_admin_menu() {
    add_menu_page(
        'LiveChat Setting',
        'LiveChat Setting',
        'manage_options',
        'dv2-livechat',
        'dv2_livechat_options_page',
        'dashicons-format-chat',
        99
    );
}
add_action( 'admin_menu', 'dv2_livechat_add_admin_menu' );

/**
 * 2. Register Settings
 */
function dv2_livechat_settings_init() {
    register_setting( 'dv2Livechat', 'dv2_livechat_site_id' );
    register_setting( 'dv2Livechat', 'dv2_livechat_private_key' );
    register_setting( 'dv2Livechat', 'dv2_livechat_auto_embed' );
    register_setting( 'dv2Livechat', 'dv2_livechat_settings' );
    register_setting( 'dv2Livechat', 'dv2_livechat_settings_version' );
    register_setting( 'dv2Livechat', 'dv2_livechat_settings_history' );
}
add_action( 'admin_init', 'dv2_livechat_settings_init' );

function dv2_normalize_settings_for_hash( $settings ) {
    if ( ! is_array( $settings ) ) {
        return [];
    }
    $boolean_fields = [
        'sticky_enabled', 'hiddenChat', 'use_general_room',
        'share_general_room', 'allow_anonymous_chat',
        'banner_enabled', 'outside_enabled'
    ];
    $allowed_fields = [
        'primary_color', 'chat_background', 'sticky_message', 'sticky_enabled',
        'blocked_keywords', 'css_overrides', 'hiddenChat', 'allow_anonymous_chat',
        'use_general_room', 'share_general_room', 'shared_group_id', 'spam_config',
        'ads_config', 'theme_mode', 'theme_id', 'social_links', 'revive_instance_id',
        'revive_script_host', 'banner_zone_id', 'banner_enabled', 'outside_enabled'
    ];
    sort( $allowed_fields );
    $normalized = [];
    foreach ( $allowed_fields as $field ) {
        $val = isset( $settings[ $field ] ) ? $settings[ $field ] : null;
        if ( in_array( $field, $boolean_fields, true ) ) {
            $normalized[ $field ] = ( ! empty( $val ) && $val !== 'false' && $val !== '0' && $val !== 0 );
        } else if ( is_array( $val ) ) {
            ksort( $val );
            $normalized[ $field ] = $val;
        } else {
            $normalized[ $field ] = (string) ( $val ?? '' );
        }
    }
    ksort( $normalized );
    return $normalized;
}


/**
 * Auto-detect direct wp_options updates by third-party plugins/scripts
 */
function dv2_livechat_on_option_settings_updated( $old_value, $value, $option ) {
    static $is_handling = false;
    if ( $is_handling ) {
        return;
    }
    $is_handling = true;

    if ( is_array( $old_value ) && is_array( $value ) ) {
        $norm_old = dv2_normalize_settings_for_hash( $old_value );
        $norm_new = dv2_normalize_settings_for_hash( $value );
        if ( md5( json_encode( $norm_old ) ) !== md5( json_encode( $norm_new ) ) ) {
            $current_ver = (int) get_option( 'dv2_livechat_settings_version', 1 );
            update_option( 'dv2_livechat_settings_version', $current_ver + 1 );
        }
    }

    $is_handling = false;
}
add_action( 'updated_option_dv2_livechat_settings', 'dv2_livechat_on_option_settings_updated', 10, 3 );




/**
 * 3. Admin action: Verify auth
 */
function dv2_livechat_handle_verify() {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Unauthorized' );
    }

    $site_id     = sanitize_text_field( $_POST['dv2_livechat_site_id'] ?? '' );
    $private_key = sanitize_text_field( $_POST['dv2_livechat_private_key'] ?? '' );

    if ( empty( $site_id ) && empty( $private_key ) ) {
        set_transient( 'dv2_livechat_auth_error', 'Vui lòng nhập Site ID và Private Token.', 30 );
        wp_redirect( admin_url( 'admin.php?page=dv2-livechat' ) );
        exit;
    }

    update_option( 'dv2_livechat_site_id', $site_id );
    update_option( 'dv2_livechat_private_key', $private_key );
    $auto_embed = sanitize_text_field( $_POST['dv2_livechat_auto_embed'] ?? '' );
    update_option( 'dv2_livechat_auto_embed', $auto_embed === '1' ? '1' : '' );

    wp_redirect( admin_url( 'admin.php?page=dv2-livechat' ) );
    exit;
}
add_action( 'admin_post_dv2_verify_auth', 'dv2_livechat_handle_verify' );

/**
 * 4. Admin action: Disconnect
 */
function dv2_livechat_handle_disconnect() {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Unauthorized' );
    }
    check_admin_referer( 'dv2_disconnect_action', 'dv2_disconnect_nonce' );
    delete_option( 'dv2_livechat_site_id' );
    delete_option( 'dv2_livechat_private_key' );
    wp_redirect( admin_url( 'admin.php?page=dv2-livechat' ) );
    exit;
}
add_action( 'admin_post_dv2_disconnect', 'dv2_livechat_handle_disconnect' );

/**
 * 5. Options Page — Always show auth form; show settings UI when credentials /**
 * 5. Options Page — Show auth form when not connected; show settings UI when connected
 */
function dv2_livechat_options_page() {
    $site_id     = get_option( 'dv2_livechat_site_id' );
    $private_key = get_option( 'dv2_livechat_private_key' );

    echo '<div class="dv2-admin-page-container" style="max-width: 1200px; margin: 20px auto; padding: 0 20px; font-family: \'Inter\', system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;">';

    if ( empty( $site_id ) || empty( $private_key ) ) {
        // Chưa kết nối: Chỉ hiển thị Form kết nối
        dv2_livechat_render_screen1();
    } else {
        // Đã kết nối: Hiển thị thanh trạng thái và Vue settings UI
        dv2_livechat_render_header_status( $site_id );
        dv2_livechat_render_settings_ui( $site_id, $private_key );
    }

    echo '</div>';
}

function dv2_livechat_render_header_status( $site_id ) {
    $version = (int) get_option( 'dv2_livechat_settings_version', 1 );
    ?>
    <div class="dv2-header-status-card" style="background: #fff; border: 1px solid var(--dv2-border); border-radius: 8px; padding: 16px 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        <div style="display: flex; align-items: center; gap: 16px;">
            <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--dv2-text-primary);">DV2 Livechat Settings</h1>
            <div style="display: flex; align-items: center; gap: 8px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 9999px; padding: 4px 12px;">
                <span class="dv2-status-dot-live" style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; display: inline-block;"></span>
                <span style="font-size: 12px; font-weight: 600; color: #047857;">Đã kết nối: <strong id="site-name"><?php echo esc_html( $site_id ); ?></strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 9999px; padding: 4px 12px;">
                <span style="font-size: 12px; font-weight: 700; color: #1D4ED8;">Phiên bản: <strong id="dv2-version-badge">V<?php echo esc_html( $version ); ?></strong></span>
            </div>
        </div>
        <div>
            <form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" style="margin: 0;">
                <input type="hidden" name="action" value="dv2_disconnect">
                <?php wp_nonce_field( 'dv2_disconnect_action', 'dv2_disconnect_nonce' ); ?>
                <button type="submit" class="button dv2-btn-disconnect" style="height: 36px; display: inline-flex; align-items: center; justify-content: center; font-weight: 600;">Ngắt kết nối</button>
            </form>
        </div>
    </div>
    <?php
}


function dv2_livechat_render_screen1() {
    $site_id     = get_option( 'dv2_livechat_site_id' );
    $private_key = get_option( 'dv2_livechat_private_key' );
    $auth_error  = get_transient( 'dv2_livechat_auth_error' );
    if ( $auth_error ) {
        delete_transient( 'dv2_livechat_auth_error' );
    }
    ?>
    <div class="wrap" style="max-width: 600px; margin: 40px auto; padding: 0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 28px; font-weight: 800; color: var(--dv2-text-primary); margin-bottom: 8px;">DV2 Livechat Integration</h1>
            <p style="color: var(--dv2-text-secondary); margin: 0;">Kết nối trang web của bạn với hệ thống Livechat trong vài giây</p>
        </div>

        <?php if ( $auth_error ) : ?>
            <div class="notice notice-error is-dismissible" style="margin-bottom: 20px;"><p><?php echo esc_html( $auth_error ); ?></p></div>
        <?php endif; ?>

        <form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" style="margin: 0;">
            <input type="hidden" name="action" value="dv2_verify_auth">
            <?php wp_nonce_field( 'dv2_verify_auth_action', 'dv2_verify_auth_nonce' ); ?>

            <div class="dv2-card dv2-card-verify" style="border-radius: 12px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05); padding: 32px;">
                <div class="dv2-field" style="margin-bottom: 20px;">
                    <label for="dv2_livechat_site_id" style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">Site Token</label>
                    <input type="text" id="dv2_livechat_site_id" name="dv2_livechat_site_id"
                           value="<?php echo esc_attr( $site_id ); ?>" placeholder="Nhập Site Token...">
                    <p class="dv2-desc">Nhập Site ID của Live Chat Setting (chuỗi ID do hệ thống cung cấp).</p>
                </div>
                <div class="dv2-field" style="margin-bottom: 20px;">
                    <label for="dv2_livechat_private_key" style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">Private Token</label>
                    <input type="password" id="dv2_livechat_private_key" name="dv2_livechat_private_key"
                           value="<?php echo esc_attr( $private_key ); ?>" placeholder="Nhập Private Token...">
                    <p class="dv2-desc">Nhập Private Token để xác thực kết nối bảo mật.</p>
                </div>
                <div style="margin-bottom: 24px;">
                    <label class="dv2-checkbox-row">
                        <input type="checkbox" name="dv2_livechat_auto_embed" value="1" <?php checked( get_option( 'dv2_livechat_auto_embed' ), '1' ); ?>>
                        <span>Tự động hiển thị ở Footer (Nếu bỏ chọn, hãy dùng shortcode <code>[dv2_livechat]</code>)</span>
                    </label>
                </div>
                <div>
                    <button type="submit" class="button button-primary" style="width: 100%; height: 44px; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; border-radius: 6px;">Kết nối hệ thống</button>
                </div>
            </div>
        </form>
    </div>
    <?php
}

function dv2_livechat_render_settings_ui( $site_id, $private_key ) {
    ?>
    <div id="dv2-loading"><p>Đang tải...</p></div>
    <div class="wrap" id="dv2-livechat-app" v-cloak>

        <div v-if="authenticated">
        <nav class="nav-tab-wrapper">
            <a @click="activeTab='config'" :class="['nav-tab', { 'nav-tab-active': activeTab==='config' }]">Cấu hình</a>
            <a @click="activeTab='social'" :class="['nav-tab', { 'nav-tab-active': activeTab==='social' }]">Mạng xã hội</a>
            <a @click="activeTab='ads'" :class="['nav-tab', { 'nav-tab-active': activeTab==='ads' }]">Quảng cáo</a>
            <a @click="activeTab='history'" :class="['nav-tab', { 'nav-tab-active': activeTab==='history' }]">📜 Lịch sử phiên bản</a>
            <a @click="activeTab='guide'" :class="['nav-tab', { 'nav-tab-active': activeTab==='guide' }]">Hướng dẫn</a>
        </nav>


        <!-- Tab: Cấu hình -->
        <div v-show="activeTab==='config'" class="dv2-tab-panel">
            <div class="dv2-config-content">
                <div class="dv2-group-col-2" style="gap: 32px;">
                    <div class="dv2-config-setting">
                        <div class="dv2-theme-layout-settings" style="display: flex; gap: 24px; align-items: start; margin-bottom: 20px;">
                            <!-- Div chứa cài đặt (Theme, Màu chủ đạo, Chế độ hiển thị) - chiếm 70% -->
                            <div style="flex: 7; display: flex; flex-direction: column; gap: 14px;">
                                <div class="dv2-field">
                                    <label>Theme widget</label>
                                    <select v-model="config.theme_id" class="dv2-input-full">
                                        <option v-for="theme in themeOptions" :key="theme.value" :value="theme.value">{{ theme.label }}</option>
                                    </select>
                                </div>

                                <div style="display: flex; gap: 24px; align-items: center;">
                                    <div class="dv2-field" style="flex: 1;">
                                        <label>Màu chủ đạo</label>
                                        <input type="color" v-model="config.primary_color" class="dv2-color-input">
                                    </div>
                                    <div class="dv2-field" style="flex: 2;">
                                        <span class="dv2-field-label">Chế độ hiển thị</span>
                                        <div class="dv2-radio-group" style="margin-top: 6px;">
                                            <label><input type="radio" v-model="config.theme_mode" value="light"> Sáng</label>
                                            <label><input type="radio" v-model="config.theme_mode" value="dark"> Tối</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Div chứa thumbnail - chiếm 30% -->
                            <div style="flex: 3; display: flex; flex-direction: column; align-items: center; justify-content: center;" v-if="config.theme_id">
                                <img :src="getThemePreviewUrl(config.theme_id)"
                                     @click="openThemePreviewLightbox(config.theme_id)"
                                     class="dv2-theme-thumbnail"
                                     loading="lazy"
                                     style="width: 150px; height: 200px; object-fit: cover; border-radius: 6px; border: 1px solid var(--dv2-border); cursor: zoom-in; transition: transform 0.2s;"
                                     @error="handlePreviewError" />
                                <span style="font-size: 10px; color: var(--dv2-text-secondary); margin-top: 4px;">Click phóng lớn</span>
                            </div>
                        </div>

                        <div class="dv2-field" style="margin-top: 14px">
                            <label>Tin nhắn hệ thống</label>
                            <div class="dv2-quill-wrapper">
                                <div id="quill-sticky"></div>
                            </div>
                        </div>
                        <div class="dv2-group-col-2" style="margin: 14px 0;">
                            <label class="dv2-checkbox-row">
                                <input type="checkbox" v-model="config.sticky_enabled"> Hiển thị tin nhắn hệ thống
                            </label>
                            <label class="dv2-checkbox-row">
                                <input type="checkbox" v-model="config.hiddenChat"> Ẩn giao diện chat
                            </label>
                            <label class="dv2-checkbox-row">
                                <input type="checkbox" v-model="config.use_general_room"> Sử dụng phòng chung
                            </label>
                            <label class="dv2-checkbox-row">
                                <input type="checkbox" v-model="config.allow_anonymous_chat"> Cho phép chat ẩn danh
                            </label>
                            <label class="dv2-checkbox-row">
                                <input type="checkbox" v-model="config.share_general_room"> Chia sẻ phòng chung
                            </label>
                        </div>
                        <div class="dv2-field" style="margin-bottom: 14px" v-if="config.share_general_room">
                            <label>Mã nhóm chia sẻ phòng chung</label>
                            <input type="text" v-model="config.shared_group_id" placeholder="Ví dụ: group_vietnam (Bỏ trống mặc định là 'global')" style="width: 100%; height: 36px; padding: 0 10px; border-radius: 4px; border: 1px solid var(--dv2-border);">
                        </div>
                        <div class="dv2-spam-config">
                            <label class="dv2-checkbox-row">
                                <input type="checkbox" v-model="config.spam_config.enabled"> Kích hoạt chặn Spam
                            </label>
                            <div class="dv2-spam-grid">
                                <div class="dv2-field">
                                    <label>Số tin nhắn tối đa</label>
                                    <input type="number" v-model.number="config.spam_config.max_messages" min="1" :disabled="!config.spam_config.enabled">
                                </div>
                                <div class="dv2-field">
                                    <label>Khoảng thời gian (giây)</label>
                                    <input type="number" v-model.number="config.spam_config.interval_seconds" min="1" :disabled="!config.spam_config.enabled">
                                </div>
                                <div class="dv2-field">
                                    <label>Thời gian chặn (phút)</label>
                                    <input type="number" v-model.number="config.spam_config.block_duration_minutes" min="1" :disabled="!config.spam_config.enabled">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="dv2-field">
                        <label>CSS Overrides</label>
                        <textarea id="cm-css" class="dv2-css-editor">{{ config.css_overrides }}</textarea>
                    </div>
                </div>
            </div>
            <p style="margin-top: 20px;">
                <button @click="saveConfig" :disabled="configSaving" class="button button-primary">
                    {{ configSaving ? 'Đang lưu...' : 'Lưu cài đặt' }}
                </button>
                <span v-if="configSaved" class="dv2-saved-indicator">✓ Đã lưu</span>
            </p>
        </div>

        <!-- Tab: Mạng xã hội -->
        <div v-show="activeTab==='social'" class="dv2-tab-panel">
            <div class="dv2-config-content">
                <div class="dv2-card" style="padding: 24px; border: 1px solid var(--dv2-border); border-radius: 8px;">
                    <div class="dv2-field">
                        <div class="dv2-field-row" style="justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <label style="font-weight: 600; font-size: 14px;">Liên kết mạng xã hội (Tối đa 3 liên kết)</label>
                            <button type="button" @click="addSocialLink" class="button button-primary" :disabled="config.social_links && config.social_links.length >= 3">+ Thêm liên kết</button>
                        </div>
                        <p class="dv2-desc" style="margin-bottom: 16px;">* Các liên kết mạng xã hội sẽ hiển thị dạng nút bấm trên widget chat để người dùng click liên hệ.</p>
                        
                        <div v-if="!config.social_links || !config.social_links.length" class="dv2-empty-state" style="padding: 32px; border: 1px dashed var(--dv2-border); border-radius: 6px; margin-bottom: 16px; background: #FAF9F9;">Chưa có liên kết mạng xã hội</div>
                        
                        <div v-for="(item, index) in config.social_links" :key="index" class="dv2-field-row" style="gap: 12px; margin-top: 12px; align-items: center; background: #F8F9FA; padding: 16px; border-radius: 6px; border: 1px solid var(--dv2-border);">
                            <select v-model="item.icon" style="width: 140px; height: 36px;">
                                <option v-for="icon in socialIconOptions" :key="icon.value" :value="icon.value">{{ icon.label }}</option>
                            </select>
                            <input type="text" v-model="item.label" placeholder="Nhãn nút CTA (ví dụ: Chat Zalo)" style="width: 200px; height: 36px; padding: 0 10px; border-radius: 4px; border: 1px solid var(--dv2-border);">
                            <input type="url" v-model="item.link" placeholder="URL link (ví dụ: https://zalo.me/...)" class="dv2-input-full" style="height: 36px; padding: 0 10px; border-radius: 4px; border: 1px solid var(--dv2-border);">
                            <button type="button" @click="removeSocialLink(index)" class="button button-small button-outline dv2-btn-delete" title="Xoá">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
            <p style="margin-top: 20px;">
                <button @click="saveConfig" :disabled="configSaving" class="button button-primary">
                    {{ configSaving ? 'Đang lưu...' : 'Lưu cài đặt' }}
                </button>
                <span v-if="configSaved" class="dv2-saved-indicator">✓ Đã lưu</span>
            </p>
        </div>

        <!-- Tab: Quảng cáo -->
        <div v-show="activeTab==='ads'" class="dv2-tab-panel">
            <nav class="nav-tab-wrapper" style="margin-bottom: 20px;">
                <a @click="adsSubTab='banner'" :class="['nav-tab', { 'nav-tab-active': adsSubTab==='banner' }]">Banner Ad</a>
                <a @click="adsSubTab='text'" :class="['nav-tab', { 'nav-tab-active': adsSubTab==='text' }]">Text Ad</a>
            </nav>

            <!-- Sub-tab: Banner Ad -->
            <div v-show="adsSubTab==='banner'">
                <div class="dv2-card" style="padding: 24px; border: 1px solid var(--dv2-border); border-radius: 8px; margin-bottom: 20px;">
                    <h3 class="dv2-section-title">Setting Ads</h3>
                    <p style="font-size: 12px; color: var(--dv2-text-secondary); margin-bottom: 16px;">Cấu hình chung cho banner ad</p>
                    <div style="display: flex; gap: 32px;">
                        <label class="dv2-checkbox-row"><input type="checkbox" v-model="config.banner_enabled"> Bật banner trong widget</label>
                        <label class="dv2-checkbox-row"><input type="checkbox" v-model="config.outside_enabled"> Bật banner ngoài widget</label>
                    </div>
                </div>

                <div class="dv2-card" style="padding: 24px; border: 1px solid var(--dv2-border); border-radius: 8px;">
                    <h3 class="dv2-section-title">Banner Ads</h3>
                    <p style="font-size: 12px; color: var(--dv2-text-secondary); margin-bottom: 16px;">Cấu hình banner quảng cáo từ Revive Adserver</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <p><label>Revive Instance ID:<br><input type="text" v-model="config.revive_instance_id" class="dv2-input-full"></label></p>
                        <p><label>Revive Script Host:<br><input type="text" v-model="config.revive_script_host" class="dv2-input-full"></label></p>
                    </div>
                    <div style="border-top: 1px solid var(--dv2-border); padding-top: 16px; margin-top: 8px;">
                        <p style="font-weight: 600; font-size: 13px; margin-bottom: 12px;">Zone ID</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <p><label>728x90 (trong widget):<br><input type="text" v-model="config.banner_zone_id['72890']" class="dv2-input-full"></label></p>
                            <p><label>250x250 (khi tắt chat):<br><input type="text" v-model="config.banner_zone_id['250250']" class="dv2-input-full"></label></p>
                            <p><label>Top Outside (phía trên widget):<br><input type="text" v-model="config.banner_zone_id['topoutside']" class="dv2-input-full"></label></p>
                            <p><label>Bottom Outside (phía dưới widget):<br><input type="text" v-model="config.banner_zone_id['bottomoutside']" class="dv2-input-full"></label></p>
                        </div>
                    </div>
                    <p style="margin-top: 16px;">
                        <button @click="saveReviveConfig" :disabled="configSaving" class="button button-primary">
                            {{ configSaving ? 'Đang lưu...' : 'Lưu cài đặt' }}
                        </button>
                        <span v-if="configSaved" class="dv2-saved-indicator">✓ Đã lưu</span>
                    </p>
                </div>
            </div>

            <!-- Sub-tab: Text Ad -->
            <div v-show="adsSubTab==='text'">
                <div class="dv2-card" style="padding: 24px; border: 1px solid var(--dv2-border); border-radius: 8px; margin-bottom: 20px;">
                    <h3 class="dv2-section-title">Thời gian hiển thị</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <p><label>Thời gian chờ hiện quảng cáo đầu tiên (phút):<br><input type="number" v-model.number="config.ads_config.start_time_minutes" min="0" class="dv2-input-full"></label></p>
                        <p><label>Tần suất xoay vòng quảng cáo (phút):<br><input type="number" v-model.number="config.ads_config.run_time_minutes" min="1" class="dv2-input-full"></label></p>
                    </div>
                    <p>
                        <button @click="saveTextAdConfig" :disabled="configSaving" class="button button-primary">
                            {{ configSaving ? 'Đang lưu...' : 'Lưu cài đặt' }}
                        </button>
                        <span v-if="configSaved" class="dv2-saved-indicator">✓ Đã lưu</span>
                    </p>
                </div>

                <div class="dv2-card" style="padding: 24px; border: 1px solid var(--dv2-border); border-radius: 8px;">
                    <div class="dv2-ads-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="margin: 0;">Text Ads</h3>
                        <button @click="openCreateAd" class="button button-primary">+ Thêm quảng cáo</button>
                    </div>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th>Tiêu đề</th>
                                <th style="text-align: center">Ưu tiên</th>
                                <th>Ngày hết hạn</th>
                                <th width="100px">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="ad in ads" :key="ad._id">
                                <td>{{ ad.title }}</td>
                                <td style="text-align: center">{{ ad.priority }}</td>
                                <td>{{ ad.end_date ? formatDate(ad.end_date) : '—' }}</td>
                                <td>
                                    <button @click="openEditAd(ad)" class="button button-small button-outline dv2-btn-edit" title="Sửa">✏️</button>
                                    <button @click="confirmDeleteAd(ad)" class="button button-small button-outline dv2-btn-delete" title="Xoá">🗑️</button>
                                </td>
                            </tr>
                            <tr v-if="!ads.length">
                                <td colspan="4" class="dv2-empty-state">Chưa có quảng cáo nào</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-if="adsPagination.total > 0" class="dv2-pagination">
                        <span>Tổng: {{ adsPagination.total }} quảng cáo</span>
                        <div class="dv2-pagination-bar">
                            <button @click="loadAdsPage(adsPagination.page - 1)" :disabled="adsPagination.page <= 1" class="button button-small">← Trước</button>
                            <span class="dv2-page-text">Trang {{ adsPagination.page }} / {{ adsPagination.totalPages }}</span>
                            <button @click="loadAdsPage(adsPagination.page + 1)" :disabled="adsPagination.page >= adsPagination.totalPages" class="button button-small">Sau →</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab: Lịch sử phiên bản -->
        <div v-show="activeTab==='history'" class="dv2-tab-panel">
            <div class="dv2-card" style="padding: 24px; border: 1px solid var(--dv2-border); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <h3 class="dv2-section-title" style="margin: 0;">Quản lý Phiên bản (Version History)</h3>
                        <p style="font-size: 12px; color: var(--dv2-text-secondary); margin: 4px 0 0 0;">Lưu trữ tối đa 10 phiên bản cấu hình gần nhất. Cho phép khôi phục về phiên bản cũ bất kỳ.</p>
                    </div>
                    <span class="dv2-badge-current" style="background: #DBEAFE; color: #1E40AF; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px;">Phiên bản đang dùng: V{{ currentVersion }}</span>
                </div>

                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width: 100px;">Phiên bản</th>
                            <th>Thời gian khởi tạo</th>
                            <th>Nguồn tạo</th>
                            <th style="width: 140px; text-align: center;">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in historyList" :key="item.version" :style="{ background: item.version === currentVersion ? '#F0F9FF' : '' }">
                            <td>
                                <strong style="font-size: 14px; color: var(--dv2-primary);">V{{ item.version }}</strong>
                                <span v-if="item.version === currentVersion" style="margin-left: 6px; font-size: 10px; background: #10B981; color: #fff; padding: 2px 6px; border-radius: 4px;">Hiện tại</span>
                            </td>
                            <td>{{ formatDate(item.created_at) }}</td>
                            <td><code>{{ item.created_by || 'system' }}</code></td>
                            <td style="text-align: center;">
                                <button v-if="item.version !== currentVersion" @click="confirmRollback(item)" :disabled="rollbackLoading" class="button button-small button-primary">
                                    ↩ Khôi phục
                                </button>
                                <span v-else style="font-size: 12px; color: #059669; font-weight: 600;">✓ Đang áp dụng</span>
                            </td>
                        </tr>
                        <tr v-if="!historyList.length">
                            <td colspan="4" class="dv2-empty-state">Chưa có lịch sử phiên bản nào được ghi nhận</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tab: Hướng dẫn -->
        <div v-show="activeTab==='guide'" class="dv2-tab-panel">
            <div v-for="(section, idx) in guideSections" :key="idx" class="dv2-guide-item">
                <div @click="section.open = !section.open" class="dv2-guide-header">
                    <span>{{ section.title }}</span>
                    <span v-html="section.open ? '&#9660;' : '&#9654;'"></span>
                </div>
                <div v-show="section.open" class="dv2-guide-body">
                    <div v-for="(line, li) in section.body" :key="li">
                        <p v-if="typeof line === 'string'">{{ line }}</p>
                        <ul v-else><li v-for="item in line" :key="item">{{ item }}</li></ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Popup xác nhận Rollback -->
        <div v-if="showRollbackModal" @click.self="showRollbackModal = false" class="dv2-popup-overlay">
            <div class="dv2-popup-card">
                <h3 class="dv2-section-title">Khôi phục cấu hình V{{ selectedRollbackVersion?.version }}?</h3>
                <p>Bạn có chắc muốn khôi phục về phiên bản <strong>V{{ selectedRollbackVersion?.version }}</strong> không?</p>
                <p style="font-size: 12px; color: var(--dv2-text-secondary);">Hệ thống sẽ tạo ra phiên bản mới <strong>V{{ currentVersion + 1 }}</strong> với nội dung được sao chép từ V{{ selectedRollbackVersion?.version }}.</p>
                <div class="dv2-modal-actions" style="margin-top: 20px;">
                    <button @click="showRollbackModal = false" class="button" :disabled="rollbackLoading">Huỷ</button>
                    <button @click="executeRollback" class="button button-primary" :disabled="rollbackLoading">
                        {{ rollbackLoading ? 'Đang khôi phục...' : 'Khôi phục ngay' }}
                    </button>
                </div>
            </div>
        </div>


        <!-- Modal thêm/sửa quảng cáo -->
        <div v-if="showAdModal" @click.self="closeAdModal" class="dv2-modal-overlay">
            <div class="dv2-modal-card">
                <h2 class="dv2-section-title">{{ editingAd ? 'Sửa' : 'Thêm' }} quảng cáo text</h2>
                <p><label>Tiêu đề<br><input type="text" v-model="adForm.title" class="dv2-input-full"></label></p>
                <p>
                    <label>Nội dung<br>
                        <div class="dv2-quill-wrapper">
                            <div id="quill-ad-modal"></div>
                        </div>
                    </label>
                </p>
                <div class="dv2-modal-field-row">
                    <p><label>Ưu tiên<br><input type="number" v-model.number="adForm.priority" class="dv2-input-small"></label></p>
                    <p><label>Ngày hết hạn<br><input type="date" v-model="adForm.end_date"></label></p>
                </div>
                <div class="dv2-modal-actions">
                    <button @click="closeAdModal" class="button">Huỷ</button>
                    <button @click="submitAd" class="button button-primary">{{ editingAd ? 'Cập nhật' : 'Thêm' }}</button>
                </div>
            </div>
        </div>

        <!-- Popup xác nhận xoá -->
        <div v-if="showDeletePopup" @click.self="closeDeletePopup" class="dv2-popup-overlay">
            <div class="dv2-popup-card">
                <h3 class="dv2-section-title">Xoá quảng cáo?</h3>
                <p>Bạn có chắc muốn xoá quảng cáo <strong>{{ deletingAd?.title }}</strong>?</p>
                <div class="dv2-modal-actions">
                    <button @click="closeDeletePopup" class="button">Huỷ</button>
                    <button @click="deleteAd" class="button dv2-btn-delete-confirm">Xoá</button>
                </div>
            </div>
        </div>

        <!-- Modal Lightbox phóng to ảnh Theme -->
        <div v-if="showThemeLightbox" @click.self="showThemeLightbox = false" class="dv2-modal-overlay">
            <div class="dv2-modal-card dv2-lightbox-card" style="background: transparent; box-shadow: none; border: none; max-width: 90vw; width: auto; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
                <div style="position: absolute; top: -40px; right: 0; color: #fff; font-size: 14px; font-weight: 600; display: flex; gap: 16px; align-items: center; width: 100%; justify-content: space-between; padding: 0 8px;">
                    <span>Xem trước: {{ getThemeLabel(lightboxThemeId) }}</span>
                    <button type="button" @click="showThemeLightbox = false" style="background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">Đóng</button>
                </div>
                <img :src="getThemePreviewUrl(lightboxThemeId)" class="dv2-lightbox-img" style="max-width: 100%; max-height: 80vh; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); object-fit: contain;" @error="handlePreviewError" />
            </div>
        </div>
    </div>
    <div v-else class="dv2-auth-placeholder" style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 20px; background: #fff; border: 1px solid var(--dv2-border); border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        <p style="color: var(--dv2-danger); font-weight: 700; font-size: 16px; margin: 0;">Lỗi kết nối hoặc Xác thực thất bại</p>
        <p style="margin: 0; color: var(--dv2-text-secondary); text-align: center; max-width: 400px; line-height: 1.5;">Private Token hiện tại không hợp lệ hoặc không thể kết nối tới server livechat. Vui lòng ngắt kết nối để cấu hình lại.</p>
        <form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" style="margin: 0;">
            <input type="hidden" name="action" value="dv2_disconnect">
            <?php wp_nonce_field( 'dv2_disconnect_action', 'dv2_disconnect_nonce' ); ?>
            <button type="submit" class="button" style="font-weight: 600; color: var(--dv2-danger); border-color: var(--dv2-danger);">Ngắt kết nối để thử lại</button>
        </form>
    </div>
    </div>
    <?php
}

/**
 * Helper: Sync settings between WP options and Server (1-Endpoint API call)
 */
function dv2_livechat_sync_settings_with_server() {
    $site_id     = get_option( 'dv2_livechat_site_id' );
    $private_key = get_option( 'dv2_livechat_private_key' );
    if ( empty( $site_id ) || empty( $private_key ) ) {
        return false;
    }

    $wp_version  = (int) get_option( 'dv2_livechat_settings_version', 1 );
    if ( $wp_version < 1 ) {
        $wp_version = 1;
    }
    $wp_settings = get_option( 'dv2_livechat_settings', [] );

    $api_url  = defined( 'DV2_LIVECHAT_API_URL' ) ? DV2_LIVECHAT_API_URL : '';
    $sync_url = rtrim( $api_url, '/' ) . '/api/site/private/sync';

    $headers = [
        'Authorization' => 'Bearer ' . $private_key,
        'Content-Type'  => 'application/json',
    ];
    if ( defined( 'DV2_LIVECHAT_API_KEY' ) && DV2_LIVECHAT_API_KEY ) {
        $headers['X-API-Key'] = DV2_LIVECHAT_API_KEY;
    }

    $response = wp_remote_post( $sync_url, [
        'headers' => $headers,
        'body'    => json_encode( [
            'site_id'     => $site_id,
            'wp_version'  => $wp_version,
            'wp_settings' => $wp_settings,
        ] ),
        'timeout' => 15,
    ] );

    if ( is_wp_error( $response ) ) {
        return false;
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    if ( ! empty( $body['success'] ) ) {
        // Unhook action hook during server sync write to prevent self-triggering loop
        remove_action( 'updated_option_dv2_livechat_settings', 'dv2_livechat_on_option_settings_updated', 10 );

        $active_version = isset( $body['active_version'] ) ? (int) $body['active_version'] : $wp_version;
        if ( $active_version < 1 ) {
            $active_version = 1;
        }
        update_option( 'dv2_livechat_settings_version', $active_version );

        if ( ! empty( $body['settings'] ) && is_array( $body['settings'] ) ) {
            update_option( 'dv2_livechat_settings', $body['settings'] );
        }

        if ( isset( $body['history'] ) && is_array( $body['history'] ) ) {
            update_option( 'dv2_livechat_settings_history', $body['history'] );
        }

        add_action( 'updated_option_dv2_livechat_settings', 'dv2_livechat_on_option_settings_updated', 10, 3 );

        return $body;
    }

    return false;
}

/**
 * WP AJAX: Save settings and increment version (only if data changed)
 */
function dv2_livechat_ajax_save_settings() {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( [ 'message' => 'Unauthorized' ], 403 );
    }

    $new_settings = isset( $_POST['settings'] ) ? json_decode( wp_unslash( $_POST['settings'] ), true ) : null;
    if ( ! is_array( $new_settings ) ) {
        wp_send_json_error( [ 'message' => 'Invalid settings payload' ], 400 );
    }

    $old_settings    = get_option( 'dv2_livechat_settings', [] );
    $current_version = (int) get_option( 'dv2_livechat_settings_version', 1 );
    if ( $current_version < 1 ) {
        $current_version = 1;
    }

    // Compare MD5 Hash of normalized old settings vs new settings
    $norm_old    = dv2_normalize_settings_for_hash( $old_settings );
    $norm_new    = dv2_normalize_settings_for_hash( $new_settings );
    $has_changed = ( md5( json_encode( $norm_old ) ) !== md5( json_encode( $norm_new ) ) );
    $new_version = $has_changed ? ( $current_version + 1 ) : $current_version;

    if ( $has_changed ) {
        remove_action( 'updated_option_dv2_livechat_settings', 'dv2_livechat_on_option_settings_updated', 10 );
        update_option( 'dv2_livechat_settings', $new_settings );
        update_option( 'dv2_livechat_settings_version', $new_version );
        add_action( 'updated_option_dv2_livechat_settings', 'dv2_livechat_on_option_settings_updated', 10, 3 );
    }

    $sync_result = dv2_livechat_sync_settings_with_server();

    $updated_version  = (int) get_option( 'dv2_livechat_settings_version', $new_version );
    if ( $updated_version < 1 ) {
        $updated_version = $new_version;
    }
    $updated_settings = get_option( 'dv2_livechat_settings', $new_settings );
    $updated_history  = get_option( 'dv2_livechat_settings_history', [] );

    wp_send_json_success( [
        'active_version' => $updated_version,
        'settings'       => $updated_settings,
        'history'        => $updated_history,
        'sync_result'    => $sync_result,
        'has_changed'    => $has_changed,
    ] );
}

add_action( 'wp_ajax_dv2_save_settings', 'dv2_livechat_ajax_save_settings' );

/**
 * WP AJAX: Rollback to historical version
 */
function dv2_livechat_ajax_rollback_version() {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( [ 'message' => 'Unauthorized' ], 403 );
    }

    $target_version = isset( $_POST['target_version'] ) ? (int) $_POST['target_version'] : 0;
    if ( ! $target_version ) {
        wp_send_json_error( [ 'message' => 'Invalid target version' ], 400 );
    }

    $site_id     = get_option( 'dv2_livechat_site_id' );
    $private_key = get_option( 'dv2_livechat_private_key' );
    $api_url     = defined( 'DV2_LIVECHAT_API_URL' ) ? DV2_LIVECHAT_API_URL : '';
    $rollback_url = rtrim( $api_url, '/' ) . '/api/site/private/rollback';

    $headers = [
        'Authorization' => 'Bearer ' . $private_key,
        'Content-Type'  => 'application/json',
    ];
    if ( defined( 'DV2_LIVECHAT_API_KEY' ) && DV2_LIVECHAT_API_KEY ) {
        $headers['X-API-Key'] = DV2_LIVECHAT_API_KEY;
    }

    $response = wp_remote_post( $rollback_url, [
        'headers' => $headers,
        'body'    => json_encode( [
            'site_id'        => $site_id,
            'target_version' => $target_version,
        ] ),
        'timeout' => 15,
    ] );

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( [ 'message' => $response->get_error_message() ], 500 );
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    if ( ! empty( $body['success'] ) ) {
        $active_version = (int) $body['active_version'];
        update_option( 'dv2_livechat_settings_version', $active_version );

        if ( ! empty( $body['settings'] ) && is_array( $body['settings'] ) ) {
            update_option( 'dv2_livechat_settings', $body['settings'] );
        }

        if ( isset( $body['history'] ) && is_array( $body['history'] ) ) {
            update_option( 'dv2_livechat_settings_history', $body['history'] );
        }

        wp_send_json_success( [
            'active_version' => $active_version,
            'settings'       => $body['settings'],
            'history'        => $body['history'],
        ] );
    } else {
        wp_send_json_error( [ 'message' => $body['message'] ?? 'Rollback failed' ], 400 );
    }
}
add_action( 'wp_ajax_dv2_rollback_setting_version', 'dv2_livechat_ajax_rollback_version' );

/**
 * 6. Enqueue Admin Scripts (Screen 2)
 */
function dv2_livechat_admin_enqueue( $hook ) {
    if ( $hook !== 'toplevel_page_dv2-livechat' ) {
        return;
    }

    $site_id     = get_option( 'dv2_livechat_site_id' );
    $private_key = get_option( 'dv2_livechat_private_key' );
    $api_url     = defined( 'DV2_LIVECHAT_API_URL' ) ? DV2_LIVECHAT_API_URL : '';

    // Auto sync on admin page load
    dv2_livechat_sync_settings_with_server();

    $wp_settings     = get_option( 'dv2_livechat_settings', [] );
    $current_version = (int) get_option( 'dv2_livechat_settings_version', 1 );
    if ( $current_version < 1 ) {
        $current_version = 1;
    }
    $history_list    = get_option( 'dv2_livechat_settings_history', [] );

    wp_enqueue_style( 'google-font-inter', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap', [], null );
    wp_enqueue_style( 'dv2-plugin-setting-css', DV2_LIVECHAT_PLUGIN_URL . 'assets/dv2-livechat.css', [], DV2_LIVECHAT_VERSION );

    wp_enqueue_script( 'dv2-vue', 'https://unpkg.com/vue@3/dist/vue.global.js', [], null, true );
    wp_enqueue_script( 'dv2-quill', 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.min.js', [], null, true );
    wp_enqueue_style( 'dv2-quill', 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css', [], null );
    wp_enqueue_script( 'dv2-codemirror', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js', [], null, true );
    wp_enqueue_script( 'dv2-codemirror-css', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/css/css.min.js', [ 'dv2-codemirror' ], null, true );
    wp_enqueue_style( 'dv2-codemirror-theme', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css', [], null );

    wp_enqueue_script(
        'dv2-livechat-settings',
        DV2_LIVECHAT_PLUGIN_URL . 'assets/dv2-livechat.js',
        [ 'dv2-vue', 'dv2-quill', 'dv2-codemirror' ],
        DV2_LIVECHAT_VERSION,
        true
    );

    if ( ! defined( 'DV2_LIVECHAT_API_KEY' ) ) {
        $env_path = dirname( DV2_LIVECHAT_PLUGIN_DIR, 2 ) . '/live_chat/.env';
        if ( file_exists( $env_path ) ) {
            $env_lines = @file( $env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES );
            if ( is_array( $env_lines ) ) {
                foreach ( $env_lines as $line ) {
                    if ( strpos( $line, 'API_KEY=' ) === 0 ) {
                        define( 'DV2_LIVECHAT_API_KEY', substr( $line, 8 ) );
                        break;
                    }
                }
            }
        }
    }
    $api_key = defined( 'DV2_LIVECHAT_API_KEY' ) ? DV2_LIVECHAT_API_KEY : '';

    wp_localize_script( 'dv2-livechat-settings', 'DV2Livechat', [
        'apiUrl'          => $api_url,
        'apiKey'          => $api_key,
        'siteId'          => $site_id,
        'privateKey'      => $private_key,
        'ajaxUrl'         => admin_url( 'admin-ajax.php' ),
        'pluginUrl'       => DV2_LIVECHAT_PLUGIN_URL,
        'initialConfig'   => $wp_settings,
        'currentVersion'  => $current_version,
        'historyVersions' => $history_list,
    ] );
}

add_action( 'admin_enqueue_scripts', 'dv2_livechat_admin_enqueue' );

/**
 * 7. Enqueue Frontend Scripts & Inject Config
 */
function dv2_livechat_enqueue_scripts() {
    $site_id = get_option( 'dv2_livechat_site_id' );
    if ( empty( $site_id ) ) {
        return;
    }

    $assets_url = DV2_LIVECHAT_PLUGIN_URL . 'assets/';

    wp_enqueue_style( 'dv2-livechat-frontend-css', $assets_url . 'livechat_plugin.css', [], DV2_LIVECHAT_VERSION );

    wp_register_script( 'dv2-livechat-config', '', [], DV2_LIVECHAT_VERSION, false );
    wp_enqueue_script( 'dv2-livechat-config' );
    wp_add_inline_script( 'dv2-livechat-config', 'window.VITE_SITE_ID = "' . esc_js( $site_id ) . '";' );

    wp_enqueue_script( 'dv2-livechat-script', $assets_url . 'livechat_plugin.js', [], DV2_LIVECHAT_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'dv2_livechat_enqueue_scripts' );

add_filter( 'script_loader_tag', function ( $tag, $handle, $src ) {
    if ( $handle === 'dv2-livechat-script' ) {
        $tag = str_replace( '<script ', '<script async defer type="module" ', $tag );
    }
    return $tag;
}, 10, 3 );

/**
 * 8. Inject Container (Footer Hook)
 */
function dv2_livechat_inject_footer() {
    $site_id   = get_option( 'dv2_livechat_site_id' );
    $auto_embed = get_option( 'dv2_livechat_auto_embed' );

    if ( empty( $site_id ) || $auto_embed !== '1' ) {
        return;
    }

    echo '<div id="livechat_app"></div>';
}
add_action( 'wp_footer', 'dv2_livechat_inject_footer' );

/**
 * 9. Shortcode
 */
function dv2_livechat_shortcode() {
    $site_id = get_option( 'dv2_livechat_site_id' );
    $auto_embed = get_option( 'dv2_livechat_auto_embed' );
    if ( empty( $site_id ) ||  $auto_embed === '1') {
        return '';
    }
    return '<div id="livechat_app"></div>';
}
add_shortcode( 'dv2_livechat', 'dv2_livechat_shortcode' );


