<div class="dv2-layout-ck2 dv2-container">
    <div class="xl:flex xl:flex-row items-stretch justify-evenly match-stream mb-10 gap-2">
        <div class="w-full xl:w-3/4 flex flex-col player-container">
            <div class="dv2-stream-list wrap-link flex items-start justify-between gap-2 mb-4 xl:ps-0">
                <div class="dv2-stream-links-ck2 flex flex-wrap gap-4 flex-1">
                    <button type="button"
                        class="match_link--button hidden py-1 px-3 font-semibold text-sm capitalize !text-[11px] lg:!text-sm border border-neutral-2 bg-btnlink text-neutral-4 flex items-center gap-1 flex-row-reverse !px-2 lg:!px-3 transition-all duration-150 bg-primary-1 text-white border-primary-1 hover:bg-primary-1 hover:text-white hover:border-primary-1 rounded-3xl">
                        <!-- <i class="icon-play-circle flex leading-[20px]"></i> -->
                        <span class="inline-block">Link 1</span>
                    </button>
                </div>
                <div class="dv2-bet-links"></div>
            </div>
            <div class="dv2-video-wrapper" id="videoWrapper">
                <?php require DV2_STREAMING_PLUGIN_DIR . 'includes/partials/stream-chrome.block.php'; ?>
                <div id="stream-player" class="relative flex-1">
                    <!-- Render HLS Player -->
                </div>
                <?php require DV2_STREAMING_PLUGIN_DIR . 'includes/partials/stream-controls.block.php'; ?>
            </div>
        </div>

        <div class="w-full xl:w-1/4 bg-chat flex flex-col chat-container">
            <!-- Chat container -->
                <?php echo do_shortcode('[' . $atts['shortcode_stream'] . ']'); ?>
        </div>
    </div>
</div>
