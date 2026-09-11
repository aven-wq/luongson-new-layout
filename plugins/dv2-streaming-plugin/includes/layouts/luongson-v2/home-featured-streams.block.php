<?php
/**
 * LuongSon V2 featured / live matches — [danh_sach_featured_video layout="luongson-v2"]
 *
 * Markup from html/luongson-v2/list-matches.html;
 * CSS/JS bundled via html/luongson-v2/list-matches.{css,js}.
 *
 * Optional: league_filter="1" enables competition Select2 + URL sync.
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

$league_filter = !empty($atts['league_filter']) && (string) $atts['league_filter'] !== '0';
?>
<div class="luongson-list-matches"<?php echo $league_filter ? ' data-league-filter="1"' : ''; ?>>
    <div class="luongson-list-matches__header">
        <h2 class="luongson-list-matches__title"><span class="luongson-list-matches__live-dot" aria-hidden="true"></span><?php echo esc_html__('Đang phát sóng', 'dv2-streaming'); ?></h2>
        <?php if ($league_filter) : ?>
            <div class="luongson-list-matches__league-filter" hidden>
                <label class="screen-reader-text" for="luongson-list-matches-league-select"><?php echo esc_html__('Chọn giải đấu', 'dv2-streaming'); ?></label>
                <select
                    id="luongson-list-matches-league-select"
                    class="luongson-list-matches__league-select"
                    data-placeholder="<?php echo esc_attr__('Chọn giải', 'dv2-streaming'); ?>"
                    aria-label="<?php echo esc_attr__('Chọn giải đấu', 'dv2-streaming'); ?>"
                ></select>
            </div>
        <?php endif; ?>
    </div>

    <div class="luongson-live-grid"></div>

    <div class="luongson-list-matches__footer">
        <button type="button" class="luongson-list-matches__load-more" hidden>
            <?php echo esc_html__('Xem thêm', 'dv2-streaming'); ?>
            <svg class="luongson-list-matches__load-more-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="currentColor" />
            </svg>
        </button>
    </div>
</div>
