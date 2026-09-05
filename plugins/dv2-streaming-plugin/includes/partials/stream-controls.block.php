<?php
/**
 * Custom stream player controls (play, volume, fullscreen).
 * Shared by stream-detail layouts using .dv2-video-wrapper.
 */
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="dv2-stream-controls dv2-stream-controls--paused dv2-stream-controls--muted" role="toolbar" aria-label="Điều khiển phát video">
    <button type="button" class="dv2-stream-controls__play" aria-label="Phát" title="Phát">
        <svg class="dv2-stream-controls__icon-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5-9-5.5z"/></svg>
        <svg class="dv2-stream-controls__icon-pause" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2h3v12H4V2zm5 0h3v12H9V2z"/></svg>
    </button>
    <div class="dv2-stream-controls__volume">
        <button type="button" class="dv2-stream-controls__mute" aria-label="Bật tiếng" title="Âm lượng">
            <svg class="dv2-stream-controls__icon-vol-on" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7 2.5v11L3.5 11H1V5h2.5L7 2.5zm5.2 1.8a5 5 0 010 7.4M9.5 4.5a3.5 3.5 0 010 7"/></svg>
            <svg class="dv2-stream-controls__icon-vol-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7 2.5v11L3.5 11H1V5h2.5L7 2.5zm7.8 2.3l-1.1 1.1L11.6 6l2.1 2.1-1.1 1.1L10.5 7.1 8.4 9.2l-1.1-1.1L9.4 6 7.3 3.9l1.1-1.1L9.5 4.9l2.1-2.1 1.1 1.1L11.6 6l2.1-2.1z"/></svg>
        </button>
        <input type="range" class="dv2-stream-volume" min="0" max="1" step="0.05" value="0" aria-label="Mức âm lượng">
    </div>
    <button type="button" class="dv2-stream-fs-btn" aria-label="Toàn màn hình" title="Toàn màn hình">
        <svg class="dv2-stream-fs-btn__expand" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3 12h10V4H3v8zm2-6h6v4H5V6zM2 6H1V2.5l.5-.5H5v1H2v3zm13-3.5V6h-1V3h-3V2h3.5l.5.5zM14 10h1v3.5l-.5.5H11v-1h3v-3zM2 13h3v1H1.5l-.5-.5V10h1v3z"/></svg>
        <svg class="dv2-stream-fs-btn__shrink" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.5 4H1V3h2V1h1v2.5l-.5.5zM13 3V1h-1v2.5l.5.5H15V3h-2zm-1 9.5V15h1v-2h2v-1h-2.5l-.5.5zM1 12v1h2v2h1v-2.5l-.5-.5H1zm11-1.5l-.5.5h-7l-.5-.5v-5l.5-.5h7l.5.5v5zM10 7H6v2h4V7z"/></svg>
    </button>
</div>
