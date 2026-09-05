<?php
/**
 * Cakhia V2 suggested streams — [de_xuat_video layout="cakhia-v2" view_more="0|1"]
 *
 * @var int $dv2_suggested_view_more 1 = hiện nút Xem thêm (phân trang 12/lần)
 */
$dv2_suggested_view_more = isset($dv2_suggested_view_more) ? (int) $dv2_suggested_view_more : 0;
?>
<div class="ck2-suggested-streams" data-view-more="<?php echo esc_attr($dv2_suggested_view_more); ?>">
    <div id="match_list_ck2_container"
        class="main-container w-full grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-3 py-7">
    </div>
    <?php if ($dv2_suggested_view_more) : ?>
    <div class="ck2-suggested-streams-footer" hidden>
        <button type="button" id="ck2SuggestedLoadMore" class="ck2-suggested-load-more" hidden>
            <?php echo esc_html__('Xem thêm', 'dv2-streaming'); ?>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="currentColor" />
            </svg>
        </button>
    </div>
    <?php endif; ?>
</div>
