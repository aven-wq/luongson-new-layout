<?php

/**
 * Plugin Name: GWD marquee banner
 * Description: Plugins hiển thị marquee ở đầu trang [gwd_banner_marquee_toro zone_id=""]
 * Version: 1.0.5
 * Author: GWD Team
 */
if ( ! defined('ABSPATH') ) exit;
include_once ABSPATH . 'wp-admin/includes/plugin.php';
function gwd_banner_checker_admin_notice() {
    if ( ! current_user_can('activate_plugins') ) {
        return;
    }
    if ( ! is_plugin_active('gwd-config-banner/gwd-config-banner.php') ) {

        echo '<div class="notice notice-error">
                <p>
                    Plugin <strong>GWD Banner Marquee</strong> yêu cầu bạn cài và kích hoạt 
                    <strong>GWD Config Banner</strong>.
                </p>
              </div>';
    }
}

// add_action('admin_notices', 'gwd_banner_checker_admin_notice');

function gwd_banner_marquee_toro_shortcode($atts = []) {

    $atts = shortcode_atts([
        'zone_id' => ''
    ], $atts);

    $fallback_zone_id = $atts['zone_id'];

    $zone_marquee = get_option('gwd_api');

    $data = is_string($zone_marquee) && $zone_marquee !== ''
    ? (json_decode($zone_marquee, true) ?: [])
    : [];

    $zone_id = $data['data']['data']['Notice banner'] ?? '';

    $zone_id = $zone_id ?: $fallback_zone_id;

    if (!$zone_id) {
        return '';
    }
    ob_start();
    ;?>
<div class="gwd_notification" id="notification-banner-696ce25bbecf8">
    <div class="gwd-dynamic-html-container">
        <img width="20" height="20" src="data:image/png;base64,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" alt="noti-banner">
        <div class="gwd-dynamic-html-wrapper">
            <ins data-z="<?php echo esc_attr($zone_id); ?>" data-revive-id="1718ffff6aff14155bf9e84ffb3a29ee"></ins>
            <ins data-z="<?php echo esc_attr($zone_id); ?>" data-revive-id="1718ffff6aff14155bf9e84ffb3a29ee"></ins>
        </div>
        <button type="button" class="notification-banner-close" onclick="dismissNotificationBanner('notification-banner-696ce25bbecf8', 'notification_banner_dismissed')" aria-label="Đóng thông báo">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.75 0.75004L0.75 10.75M0.749958 0.75L10.7499 10.75" stroke="#6B6B6B" stroke-width="1.5" stroke-linecap="round"></path>
            </svg>
        </button>
    </div>
</div>
<script>
(function() {
    // Config
    var storageKey = 'notification_banner_dismissed';
    var bannerId = 'notification-banner-696ce25bbecf8';
    var messageId = 'message-notification-banner-696ce25bbecf8';
    var expireMinutes = 30; // Thời hạn 30 phút
    var expireTime = expireMinutes * 60 * 1000; // Chuyển sang milliseconds
    // Kiểm tra localStorage với thời hạn
    var dismissedData = localStorage.getItem(storageKey);
    if (dismissedData) {
        try {
            var data = JSON.parse(dismissedData);
            var now = new Date().getTime();
            var dismissedTime = data.timestamp || 0;

            // Kiểm tra nếu chưa quá 30 phút
            if (now - dismissedTime < expireTime) {
                var banner = document.getElementById(bannerId);
                if (banner) {
                    banner.style.display = 'none';
                }
            } else {
                // Đã quá 30 phút, xóa localStorage
                localStorage.removeItem(storageKey);
            }
        } catch (e) {
            // Nếu không parse được (format cũ), xóa và bắt đầu lại
            localStorage.removeItem(storageKey);
        }
    }

    // Bật scroll text luôn (không cần kiểm tra overflow)
    function checkAndEnableScroll() {
        var messageEl = document.getElementById(messageId);
        if (!messageEl) return;

        var wrapper = messageEl.querySelector('.notification-banner-message-wrapper');
        if (!wrapper) return;

        // Luôn bật scrolling
        messageEl.classList.add('scrolling');

        // Tính toán thời gian animation dựa trên độ dài tất cả messages
        var totalWidth = 0;
        var items = wrapper.querySelectorAll('.notification-banner-message-item');
        items.forEach(function(item) {
            totalWidth += item.offsetWidth;
        });

        // Tính scroll distance (tổng width của tất cả items trừ item cuối cùng - là duplicate của item đầu)
        var scrollDistance = totalWidth - (items[items.length - 1] ? items[items.length - 1].offsetWidth : 0);

        // Tính duration: tốc độ 80px/s
        var duration = Math.max(15, (scrollDistance / 55));

        // Set CSS variables
        messageEl.style.setProperty('--scroll-distance', '-' + scrollDistance + 'px');
        messageEl.style.setProperty('--animation-duration', duration + 's');
    }

    // Pause animation khi hover vào message hoặc các link
    function setupHoverPause() {
        var messageEl = document.getElementById(messageId);
        if (messageEl) {
            messageEl.addEventListener('mouseenter', function() {
                messageEl.classList.add('paused');
            });

            messageEl.addEventListener('mouseleave', function() {
                messageEl.classList.remove('paused');
            });
        }
    }

    // Chạy sau khi DOM load xong
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                checkAndEnableScroll();
                setupHoverPause();
            }, 100);
        });
    } else {
        setTimeout(function() {
            checkAndEnableScroll();
            setupHoverPause();
        }, 100);
    }

    // Kiểm tra lại khi resize
    window.addEventListener('resize', function() {
        var messageEl = document.getElementById(messageId);
        if (messageEl) {
            messageEl.classList.remove('scrolling');
            setTimeout(checkAndEnableScroll, 100);
        }
    });
})();

// Function để đóng banner và lưu vào localStorage với timestamp
function dismissNotificationBanner(bannerId, storageKey) {
    var banner = document.getElementById(bannerId);
    if (banner) {
        banner.style.display = 'none';
        // Lưu timestamp thay vì chỉ 'true'
        var data = {
            timestamp: new Date().getTime(),
            dismissed: true
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
    }
}
(function () {
  function addReferrerDomainToNotificationLinks() {
    var domain = window.location.hostname;
    var links = document.querySelectorAll('.gwd_notification a');

    links.forEach(function (link) {
      try {
        var url = new URL(link.href, window.location.href);
        url.searchParams.set('referrer_domain', domain);
        link.href = url.toString();
      } catch (e) {}
    });
  }

  addReferrerDomainToNotificationLinks();

  var observer = new MutationObserver(addReferrerDomainToNotificationLinks);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
</script>
<style>
.gwd_notification{
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    background-color: #fdf2f2;
    border: 1px solid #ffcccc;
    border-radius: 4px;
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    font-size: 14px;
    color: #333;
    overflow: hidden;
    position: relative;
    height: 50px;
}

.gwd-fixed-img{
    flex-shrink: 0;
    margin-right: 10px;
    z-index: 2;
    background-color: #fdf2f2;
}

.gwd-dynamic-html-container{
	display:flex;
    gap: 3px;
    align-items: center;
}

.gwd-dynamic-html-wrapper{
    overflow: hidden;
    flex-grow: 1;
    position: relative;
    line-height: 1;
    
}

.gwd-dynamic-html-wrapper ins{
    display: inline-block;
    white-space: nowrap;
    animation: scroll-left 40s linear infinite;
    padding-right: 20px;
    margin-right: 15px;
    border-right: 1px solid #000;
}
.notification-banner-message-separator{
	margin-left: 15px;
    margin-right: 15px;
}
.gwd-dynamic-html-wrapper a {
    color: #FB2B1C;
    font-weight: 600;
    text-decoration: none;
}
.gwd-dynamic-html-wrapper .label {
    font-weight: 600;
}
.gwd-dynamic-html-wrapper ins:nth-child(2){
    position: absolute;
    left: 100%;
    top: 0;
    padding-left: 30px;
    margin-left: 15px;
}
@keyframes scroll-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
}
.gwd-dynamic-html-wrapper:hover ins{
    animation-play-state: paused;
}
.notification-banner-close{
	position: absolute;
    right: 0;
    top: 50%;
    width: 40px;
    border: none;
    background: #fdf2f2;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s ease;
    transform: translate(0%, -50%);
    height: 100%;
    margin-right: 0;
    margin-bottom: 0;
}
</style>
<?php 
    return ob_get_clean();
}
add_shortcode('gwd_banner_marquee_toro','gwd_banner_marquee_toro_shortcode');