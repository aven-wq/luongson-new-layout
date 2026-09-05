<?php
/**
 * Cakhia V2 highlights markup for [highlights layout="cakhia-v2"] (default layout).
 *
 * @package DV2_Streaming
 */

if (!defined('ABSPATH')) {
    exit;
}

if (! isset($dv2_highlights_title) || trim((string) $dv2_highlights_title) === '') {
    $dv2_highlights_title = __('HIGHLIGHTS BÓNG ĐÁ MỚI NHẤT', 'dv2-streaming');
}

if (! isset($dv2_highlights_page_size)) {
    $dv2_highlights_page_size = 12;
}
$dv2_highlights_page_size = absint($dv2_highlights_page_size);
if ($dv2_highlights_page_size < 1) {
    $dv2_highlights_page_size = 12;
} elseif ($dv2_highlights_page_size > 100) {
    $dv2_highlights_page_size = 100;
}
?>
<div class="ck2-highlight-page">
    <div class="ck2-highlight-header">
        <p class="ck2-highlight-title"><?php echo esc_html($dv2_highlights_title); ?></p>
        <div class="ck2-highlight-search-wrap">
            <input type="search" id="ck2HighlightSearch" class="ck2-highlight-search" name="highlight-search"
                placeholder="<?php echo esc_attr__('Tìm kiếm trận đấu, đội…', 'dv2-streaming'); ?>" value=""
                autocomplete="off"
                aria-label="<?php echo esc_attr__('Tìm kiếm highlights', 'dv2-streaming'); ?>">
        </div>
    </div>
    <div id="ck2HighlightError" class="ck2-highlight-error" hidden></div>
    <div id="ck2HighlightGrid" class="ck2-highlight-grid" role="list"
         data-page-size="<?php echo esc_attr((string) $dv2_highlights_page_size); ?>"></div>
    <p id="ck2HighlightEmpty" class="ck2-highlight-empty" hidden><?php echo esc_html__('Tạm thời chưa có highlights.', 'dv2-streaming'); ?></p>
    <div class="ck2-highlight-footer">
        <button type="button" id="ck2LoadMore" class="ck2-btn-load-more" hidden>
            <?php echo esc_html__('Xem Thêm', 'dv2-streaming'); ?>
            <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#000000" />
            </svg>
        </button>
        <div id="ck2Loading" class="ck2-loading" hidden><?php echo esc_html__('Đang tải…', 'dv2-streaming'); ?></div>
    </div>
</div>

<div id="ck2VideoModal" class="ck2-modal" hidden aria-hidden="true">
    <div class="ck2-modal-backdrop" data-close-modal></div>
    <div class="ck2-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="ck2ModalTitle">
        <button type="button" class="ck2-modal-close" data-close-modal aria-label="<?php echo esc_attr__('Đóng', 'dv2-streaming'); ?>">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#fff"></path> </g></svg>
        </button>
        <div class="ck2-modal-video-wrap">
            <video id="ck2ModalVideo" class="ck2-modal-video" controls playsinline></video>
        </div>
        <h2 id="ck2ModalTitle" class="ck2-modal-title"></h2>
    </div>
</div>
