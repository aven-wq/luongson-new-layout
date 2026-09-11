<?php
/**
 * LuongSon V2 match schedule — [lich_truc_tiep layout="luongson-v2"]
 *
 * Markup from html/luongson-v2/schedule.html;
 * CSS/JS bundled via html/luongson-v2/schedule.{css,js}.
 *
 * Optional: league_filter="1" syncs with competition URL + featured dropdown.
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

$league_filter = !empty($atts['league_filter']) && (string) $atts['league_filter'] !== '0';
?>
<div class="luongson-schedule"<?php echo $league_filter ? ' data-league-filter="1"' : ''; ?>>
    <div class="framer-6nzkg">
        <div class="ssr-variant">
            <div class="framer-y7mzqb ls-ltd-s8" data-framer-component-type="RichTextContainer">
                <p class="framer-text ls-ltd-s46 luongson-schedule__title" dir="auto"><?php echo esc_html__('Lịch thi đấu Bóng Đá hôm nay mới nhất 24h', 'dv2-streaming'); ?></p>
            </div>
        </div>
        <div class="framer-rtjghz">
            <button
                aria-label="<?php echo esc_attr__('Ngày trước', 'dv2-streaming'); ?>"
                class="framer-1j0wurm"
                data-border="true"
                data-framer-name="Previous Day"
                type="button"
            >
                <div class="framer-y4X00 framer-18697ez"></div>
            </button>
            <button
                aria-label="<?php echo esc_attr__('Chọn ngày', 'dv2-streaming'); ?>"
                class="framer-fxofsc"
                data-framer-name="Date Picker"
                type="button"
            >
                <div class="framer-deoUy framer-t5wzon"></div>
                <div class="framer-q65yhr ls-ltd-s8" data-framer-component-type="RichTextContainer">
                    <p class="framer-text ls-ltd-s47 luongson-schedule__date-label" dir="auto"><?php echo esc_html__('Hôm nay', 'dv2-streaming'); ?></p>
                </div>
            </button>
            <button
                aria-label="<?php echo esc_attr__('Ngày sau', 'dv2-streaming'); ?>"
                class="framer-1r6vwl8"
                data-border="true"
                data-framer-name="Next Day"
                type="button"
            >
                <div class="framer-Jde4M framer-e8q5vt"></div>
            </button>
        </div>
    </div>

    <div class="luongson-schedule__list" aria-live="polite"></div>

    <div class="luongson-schedule__footer">
        <button type="button" class="luongson-schedule__load-more" hidden>
            <?php echo esc_html__('Xem thêm', 'dv2-streaming'); ?>
            <svg class="luongson-schedule__load-more-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="currentColor" />
            </svg>
        </button>
    </div>
</div>
