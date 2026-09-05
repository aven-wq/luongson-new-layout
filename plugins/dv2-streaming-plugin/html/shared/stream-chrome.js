/**
 * Shared stream player chrome: ads overlay, custom controls, fullscreen.
 * Used by vebo-v2, cakhia-v2, and future stream-detail layouts.
 */
const DV2_STREAM_CONTROLS_HIDE_MS = 2600;
const DV2_ODDS_POLL_MS = 15000;
const DV2_ODDS_AUTO_SHOW_INTERVAL_MS = 180000; // 3 minutes
const DV2_ODDS_AUTO_SHOW_DURATION_MS = 10000; // 10 seconds
const DV2_FOOTER_HEAD_PEEK_INTERVAL_MS = 30000; // 30 seconds between peeks
const DV2_FOOTER_HEAD_PEEK_VISIBLE_MS = 10000; // 10 seconds visible each peek

const DV2_ODDS_SVG = {
    toggleClose:
        '<svg class="dv2-stream-odds-panel__toggle-icon--close" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#dv2_odds_filter_close)"><path d="M18.3063 41.9042L10.4543 53.8015C8.88006 56.1882 11.6954 58.9857 14.3331 57.6572L56.4611 36.4132C58.513 35.3784 58.513 32.6199 56.4611 31.5851L14.3331 10.3438C11.6954 9.01263 8.88006 11.8127 10.4543 14.1995L18.3063 26.0967C21.5021 30.9404 21.5021 37.0606 18.3063 41.9042Z" fill="#F7FF00"></path></g><defs><filter id="dv2_odds_filter_close" x="0" y="0" width="72" height="72" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix><feOffset dx="2" dy="2"></feOffset><feGaussianBlur stdDeviation="6"></feGaussianBlur><feComposite in2="hardAlpha" operator="out"></feComposite><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.933333 0 0 0 0 0 0 0 0 0.35 0"></feColorMatrix><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"></feBlend><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"></feBlend></filter></defs></svg>',
    toggleOpen:
        '<svg class="dv2-stream-odds-panel__toggle-icon--open" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g filter="url(#dv2_odds_filter_open)"><path d="M49.6937 41.9042L57.5457 53.8015C59.1199 56.1882 56.3046 58.9857 53.6669 57.6572L11.5389 36.4132C9.48704 35.3784 9.48704 32.6199 11.5389 31.5851L53.6669 10.3438C56.3046 9.01263 59.1199 11.8127 57.5457 14.1995L49.6937 26.0967C46.4979 30.9404 46.4979 37.0606 49.6937 41.9042Z" fill="#F7FF00"></path></g><defs><filter id="dv2_odds_filter_open" x="0" y="0" width="72" height="72" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix><feOffset dx="2" dy="2"></feOffset><feGaussianBlur stdDeviation="6"></feGaussianBlur><feComposite in2="hardAlpha" operator="out"></feComposite><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.933333 0 0 0 0 0 0 0 0 0.35 0"></feColorMatrix><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"></feBlend><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"></feBlend></filter></defs></svg>',
    trendUp:
        '<svg width="6" height="6" viewBox="0 0 9 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3.69976 0.258553L0.0659156 6.7166C-0.124386 7.0548 0.120008 7.47275 0.508076 7.47275H7.77577C8.16384 7.47275 8.40823 7.0548 8.21793 6.7166L4.58408 0.258553C4.3901 -0.0861874 3.89374 -0.0861869 3.69976 0.258553Z" fill="#469631"></path></svg>',
    trendDown:
        '<svg width="6" height="6" viewBox="0 0 9 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3.6984 7.21387L0.0658934 0.756087C-0.124346 0.417884 0.120053 0 0.508089 0H7.7731C8.16114 0 8.40553 0.417885 8.21529 0.756088L4.58279 7.21387C4.38883 7.5587 3.89236 7.5587 3.6984 7.21387Z" fill="#F94A4A"></path></svg>',
    corner:
        '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1.25762 14.4734L11.7539 7.51758M7.71808 10.0793C7.71808 10.0793 11.7548 11.1782 11.3506 14.4734M0.451172 14.4734H13.7735" stroke="#2DB10B" stroke-width="1.33224"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M1.49032 2.39258V14.5972H0.451172V2.39342H1.49032V2.39258Z" fill="#2DB10B"></path><path d="M0.451172 5.68755H9.33275L0.451172 0.5625V5.68755Z" fill="#2DB10B"></path></svg>',
    yellowCard:
        '<svg width="7" height="10" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="10" height="16" rx="2" fill="#F7FF00"></rect></svg>',
    redCard:
        '<svg width="7" height="10" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="10" height="16" rx="2" fill="#F94A4A"></rect></svg>',
};

const DV2_STREAM_CONTROLS_HTML = `<div class="dv2-stream-controls dv2-stream-controls--paused dv2-stream-controls--muted" role="toolbar" aria-label="Điều khiển phát video">
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
</div>`;

function dv2GetFullscreenElement() {
    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null
    );
}

function dv2RequestElementFullscreen(el) {
    if (!el) return Promise.reject();
    const req =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen;
    if (!req) return Promise.reject();
    return Promise.resolve(req.call(el));
}

function dv2ExitDocumentFullscreen() {
    const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
    if (!exit) return Promise.resolve();
    return Promise.resolve(exit.call(document));
}

function dv2GetStreamChromeEl($videoContainer) {
    if (!$videoContainer?.length) return $();
    const $direct = $videoContainer.children(".dv2-stream-chrome");
    if ($direct.length) return $direct;
    return $videoContainer
        .find("> .dv2-video-container > .dv2-stream-chrome, > .dv2-video-stage > .dv2-stream-chrome")
        .first();
}

function dv2ApplyStreamVideoControls($video) {
    if (!$video?.length) return;
    $video.prop("controls", false);
    $video.removeAttr("controlsList");
    $video.attr("playsinline", "");
    $video.attr("webkit-playsinline", "");
}

function dv2MarkStreamVolumeTouched(video) {
    if (video) {
        video.dataset.dv2VolumeTouched = "1";
    }
}

function dv2ApplyStreamAutoplayMuted($video) {
    if (!$video?.length) return;
    const video = $video[0];
    if (!video || video.dataset.dv2VolumeTouched === "1") return;
    video.muted = true;
}

function dv2IsStreamVideoMuted(video) {
    return !!(video && (video.muted || video.volume === 0));
}

function dv2GetVideoStageEl($videoContainer) {
    if (!$videoContainer?.length) return $();
    return $videoContainer.children(".dv2-video-container, .dv2-video-stage").first();
}

function dv2GetContainedVideoBounds(video, containerRect) {
    if (!video || !containerRect?.width || !containerRect?.height) return null;

    const intrinsicW = video.videoWidth;
    const intrinsicH = video.videoHeight;
    if (!intrinsicW || !intrinsicH) return null;

    const containerRatio = containerRect.width / containerRect.height;
    const videoRatio = intrinsicW / intrinsicH;
    let width;
    let height;
    let left;
    let top;

    if (videoRatio > containerRatio) {
        width = containerRect.width;
        height = containerRect.width / videoRatio;
        left = 0;
        top = (containerRect.height - height) / 2;
    } else {
        height = containerRect.height;
        width = containerRect.height * videoRatio;
        top = 0;
        left = (containerRect.width - width) / 2;
    }

    return { top, left, width, height };
}

function dv2EnsureVideoStage($videoContainer) {
    if (!$videoContainer?.length) return $();

    const $chrome = dv2GetStreamChromeEl($videoContainer);
    const $media = $videoContainer.children("video, #stream-player").first();
    let $stage = dv2GetVideoStageEl($videoContainer);

    if (!$stage.length && $media.length) {
        $stage = $('<div class="dv2-video-stage"></div>');
        $media.before($stage);
        $stage.append($media);
    }

    if (!$stage.length) return $();

    if ($chrome.length && !$chrome.parent().is($stage)) {
        $stage.prepend($chrome);
    }

    $videoContainer.children(".dv2-stream-controls").each(function () {
        if (!$.contains($stage[0], this)) {
            $stage.append(this);
        }
    });

    $videoContainer
        .children(".dv2-stream-loading, .dv2-loading, .dv2-not-loaded")
        .each(function () {
            $(this).appendTo($stage);
        });

    return $stage;
}

function dv2SyncVideoStageLayout($videoContainer) {
    if (!$videoContainer?.length) return;

    const $stage = dv2EnsureVideoStage($videoContainer);
    if (!$stage.length) return;

    const $video = $stage.find("video").first();
    const video = $video[0];
    const container = $videoContainer[0];

    if (!video || !container) {
        $stage.removeClass("dv2-video-stage--bounded").css({
            top: "",
            left: "",
            width: "",
            height: "",
        });
        return;
    }

    const needsBounds = dv2IsStreamWrapperFullscreen($videoContainer);

    if (!needsBounds) {
        $stage.removeClass("dv2-video-stage--bounded").css({
            top: "",
            left: "",
            width: "",
            height: "",
        });
        return;
    }

    const containerRect = container.getBoundingClientRect();
    const bounds = dv2GetContainedVideoBounds(video, containerRect);

    if (!bounds?.width || !bounds?.height) {
        return;
    }

    $stage
        .addClass("dv2-video-stage--bounded")
        .css({
            top: bounds.top + "px",
            left: bounds.left + "px",
            width: bounds.width + "px",
            height: bounds.height + "px",
        });
}

function dv2ScheduleVideoStageLayoutSync($videoContainer) {
    if (!$videoContainer?.length) return;

    if ($videoContainer.data("dv2VideoStageSyncRaf")) return;

    const rafId = requestAnimationFrame(() => {
        $videoContainer.removeData("dv2VideoStageSyncRaf");
        dv2SyncVideoStageLayout($videoContainer);
    });

    $videoContainer.data("dv2VideoStageSyncRaf", rafId);
}

function dv2InitVideoStageSync($videoContainer) {
    if (!$videoContainer?.length || $videoContainer.data("dv2VideoStageSyncBound")) return;
    $videoContainer.data("dv2VideoStageSyncBound", true);

    const scheduleSync = () => dv2ScheduleVideoStageLayoutSync($videoContainer);

    scheduleSync();

    $videoContainer.on(
        "loadedmetadata.dv2StageSync loadeddata.dv2StageSync resize.dv2StageSync",
        "video",
        scheduleSync
    );

    if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(scheduleSync);
        observer.observe($videoContainer[0]);
        const video = $videoContainer.find("video").first()[0];
        if (video) observer.observe(video);
        $videoContainer.data("dv2VideoStageResizeObserver", observer);
    }

    $(window).on("resize.dv2StageSync orientationchange.dv2StageSync", scheduleSync);
    $videoContainer.on("dv2wrapperfschange.dv2StageSync", scheduleSync);
    $(document).on(
        "fullscreenchange.dv2StageSync webkitfullscreenchange.dv2StageSync",
        scheduleSync
    );
}

function dv2GetStreamControlsMount($videoContainer) {
    if (!$videoContainer?.length) return $videoContainer;
    const $stage = dv2EnsureVideoStage($videoContainer);
    if ($stage.length) return $stage;
    return $videoContainer;
}

function dv2GetOverlayMount($videoContainer) {
    const $stage = dv2EnsureVideoStage($videoContainer);
    return $stage.length ? $stage : $videoContainer;
}

function dv2EnsureStreamControlsBar($videoContainer) {
    if (!$videoContainer?.length) return;
    const $video = $videoContainer.find("video").first();
    if ($videoContainer.find(".dv2-stream-controls").length) {
        dv2SyncStreamControlsState($videoContainer, $video);
        return;
    }
    $videoContainer.children(".dv2-stream-fs-btn").remove();
    dv2GetStreamControlsMount($videoContainer).append(DV2_STREAM_CONTROLS_HTML);
    dv2SyncStreamControlsState($videoContainer, $video);
}

function dv2SyncStreamControlsState($videoContainer, $video) {
    if (!$videoContainer?.length) return;
    $video = $video || $videoContainer.find("video").first();
    const video = $video?.[0];
    const $bar = $videoContainer.find(".dv2-stream-controls");
    if (!video || !$bar.length) return;

    const isPaused = video.paused;
    const isMuted = dv2IsStreamVideoMuted(video);
    const displayVol = isMuted ? 0 : video.volume;

    $bar.toggleClass("dv2-stream-controls--paused", isPaused);
    $bar.toggleClass("dv2-stream-controls--muted", isMuted);

    const $playBtn = $bar.find(".dv2-stream-controls__play");
    const playLabel = isPaused ? "Phát" : "Tạm dừng";
    $playBtn.attr({ "aria-label": playLabel, title: playLabel });

    const $muteBtn = $bar.find(".dv2-stream-controls__mute");
    const muteLabel = isMuted ? "Bật tiếng" : "Tắt tiếng";
    $muteBtn.attr({ "aria-label": muteLabel, title: muteLabel });

    $bar.find(".dv2-stream-volume").val(displayVol);
}

function dv2IsNativeWrapperFullscreen($videoContainer) {
    const container = $videoContainer?.[0];
    if (!container) return false;
    return dv2GetFullscreenElement() === container;
}

function dv2IsCssWrapperFullscreen($videoContainer) {
    return !!$videoContainer?.data("cssWrapperFs");
}

function dv2IsStreamWrapperFullscreen($videoContainer) {
    return (
        dv2IsNativeWrapperFullscreen($videoContainer) ||
        dv2IsCssWrapperFullscreen($videoContainer)
    );
}

function dv2SupportsWrapperFullscreenApi() {
    const el = document.createElement("div");
    return !!(
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen
    );
}

function dv2ShouldPreferCssWrapperFullscreen() {
    return (
        /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
}

function dv2SyncStreamWrapperFullscreenUi($videoContainer) {
    if (!$videoContainer?.length) return;
    const isFs = dv2IsStreamWrapperFullscreen($videoContainer);

    $videoContainer.toggleClass("dv2-stream-wrapper-fs", isFs);

    const $fsBtn = $videoContainer.find(".dv2-stream-fs-btn");
    if ($fsBtn.length) {
        const fsLabel = isFs ? "Thu nhỏ" : "Toàn màn hình";
        $fsBtn.attr({ "aria-label": fsLabel, title: fsLabel });
    }
}

function dv2MountCssFullscreenPortal($videoContainer) {
    if (!$videoContainer?.length || $videoContainer.hasClass("dv2-fs-portal")) return;

    const $placeholder = $('<div class="dv2-fs-placeholder" aria-hidden="true"></div>');
    const height = $videoContainer.outerHeight();
    if (height > 0) {
        $placeholder.height(height);
    }

    $videoContainer.data("dv2FsPortalParent", $videoContainer.parent());
    $placeholder.insertBefore($videoContainer);
    $videoContainer.data("dv2FsPortalPlaceholder", $placeholder);
    $videoContainer.addClass("dv2-fs-portal");
    $("body").append($videoContainer);
}

function dv2RestoreCssFullscreenPortal($videoContainer) {
    if (!$videoContainer?.length || !$videoContainer.hasClass("dv2-fs-portal")) return;

    const $placeholder = $videoContainer.data("dv2FsPortalPlaceholder");
    const $originalParent = $videoContainer.data("dv2FsPortalParent");

    $videoContainer.removeClass("dv2-fs-portal");
    if ($placeholder?.length) {
        $videoContainer.insertBefore($placeholder);
        $placeholder.remove();
    } else if ($originalParent?.length) {
        $originalParent.append($videoContainer);
    }

    $videoContainer.removeData("dv2FsPortalPlaceholder");
    $videoContainer.removeData("dv2FsPortalParent");
}

function dv2SyncCssFullscreenPortal($videoContainer) {
    if (!$videoContainer?.length) return;
    if (dv2IsCssWrapperFullscreen($videoContainer)) {
        dv2MountCssFullscreenPortal($videoContainer);
        return;
    }
    dv2RestoreCssFullscreenPortal($videoContainer);
}

function dv2InitCssFullscreenPortal($videoContainer) {
    if (!$videoContainer?.length || $videoContainer.data("dv2FsPortalBound")) return;
    $videoContainer.data("dv2FsPortalBound", true);

    $videoContainer.on("dv2wrapperfschange.dv2FsPortal", function () {
        dv2SyncCssFullscreenPortal($videoContainer);
    });

    $(document).on(
        "fullscreenchange.dv2FsPortal webkitfullscreenchange.dv2FsPortal",
        function () {
            dv2SyncCssFullscreenPortal($videoContainer);
        }
    );

    $(window).on("pagehide.dv2FsPortal", function () {
        dv2RestoreCssFullscreenPortal($videoContainer);
    });
}

function dv2EnterCssWrapperFullscreen($videoContainer) {
    $videoContainer.data("cssWrapperFs", true);
    $("body").addClass("dv2-stream-body-fs");
    dv2SyncStreamWrapperFullscreenUi($videoContainer);
    $videoContainer.trigger("dv2wrapperfschange");
}

function dv2ExitCssWrapperFullscreen($videoContainer) {
    $videoContainer.data("cssWrapperFs", false);
    dv2RestoreCssFullscreenPortal($videoContainer);
    const hasOtherCssFs = $(".dv2-video-wrapper")
        .toArray()
        .some((el) => $(el).data("cssWrapperFs"));
    if (!hasOtherCssFs) {
        $("body").removeClass("dv2-stream-body-fs");
    }
    dv2SyncStreamWrapperFullscreenUi($videoContainer);
    $videoContainer.trigger("dv2wrapperfschange");
}

function dv2ExitStreamWrapperFullscreen($videoContainer) {
    if (dv2IsNativeWrapperFullscreen($videoContainer)) {
        dv2ExitDocumentFullscreen();
    }
    if (dv2IsCssWrapperFullscreen($videoContainer)) {
        dv2ExitCssWrapperFullscreen($videoContainer);
    }
}

function dv2ToggleWrapperFullscreen($videoContainer) {
    const container = $videoContainer[0];
    if (!container) return;

    if (dv2IsStreamWrapperFullscreen($videoContainer)) {
        dv2ExitStreamWrapperFullscreen($videoContainer);
        return;
    }

    if (dv2ShouldPreferCssWrapperFullscreen()) {
        dv2EnterCssWrapperFullscreen($videoContainer);
        return;
    }

    if (!dv2SupportsWrapperFullscreenApi()) {
        dv2EnterCssWrapperFullscreen($videoContainer);
        return;
    }

    dv2RequestElementFullscreen(container)
        .then(() => {
            if (dv2GetFullscreenElement() !== container) {
                dv2EnterCssWrapperFullscreen($videoContainer);
                return;
            }
            dv2SyncStreamWrapperFullscreenUi($videoContainer);
            $videoContainer.trigger("dv2wrapperfschange");
        })
        .catch(() => {
            dv2EnterCssWrapperFullscreen($videoContainer);
        });
}

function dv2RefreshStreamChromeReviveAds($root) {
    const $scope =
        $root && typeof $root.find === "function" && $root.length
            ? $root
            : typeof $root === "string"
              ? $($root)
              : $(document);

    const reviveIds = new Set();
    $scope.find("ins[data-revive-id]").each(function () {
        const reviveId = this.getAttribute("data-revive-id");
        if (!reviveId) return;

        const zone =
            this.getAttribute("data-z") ||
            this.getAttribute("data-revive-zoneid") ||
            this.getAttribute("data-ad-slot");
        const fresh = document.createElement("ins");
        fresh.setAttribute("data-revive-id", reviveId);
        if (zone) {
            fresh.setAttribute("data-z", zone);
        }
        fresh.style.textDecoration = "none";
        this.replaceWith(fresh);
        reviveIds.add(reviveId);
    });

    if (!reviveIds.size) return;

    const runRefresh = () => {
        const reviveAsync = window.reviveAsync;
        if (!reviveAsync) return false;

        let applied = false;
        reviveIds.forEach((reviveId) => {
            const client = reviveAsync[reviveId];
            if (!client) return;
            if (typeof client.apply === "function" && typeof client.detect === "function") {
                client.apply(client.detect());
                applied = true;
                return;
            }
            if (typeof client.refresh === "function") {
                client.refresh();
                applied = true;
            }
        });
        return applied;
    };

    if (runRefresh()) return;

    let attempts = 0;
    const timer = setInterval(() => {
        attempts += 1;
        if (runRefresh() || attempts >= 20) {
            clearInterval(timer);
        }
    }, 250);
}

function dv2UpdateStreamChromeVisibility($videoContainer) {
    if (!$videoContainer?.length) return;

    const isActive = $videoContainer.hasClass("dv2-full-stream-active");
    const $chrome = dv2GetStreamChromeEl($videoContainer);

    $chrome.attr("aria-hidden", isActive ? "false" : "true");
}

function dv2SetFullStreamChromeVisible($videoContainer, visible) {
    if (!$videoContainer?.length) return;
    $videoContainer.toggleClass("dv2-full-stream-active", !!visible);
    if (visible) {
        dv2RefreshStreamChromeReviveAds();
    }
    dv2UpdateStreamChromeVisibility($videoContainer);
}

function dv2SyncStreamChromeVisibility($videoContainer) {
    if (!$videoContainer?.length) return;
    const hlsReady = !!$videoContainer.data("hlsReady");
    dv2SetFullStreamChromeVisible($videoContainer, hlsReady);
}

function dv2OnHlsStreamReady($videoContainer) {
    if (!$videoContainer?.length) return;
    $videoContainer.data("hlsReady", true);
    dv2SyncStreamChromeVisibility($videoContainer);
    dv2InitStreamOddsPanel($videoContainer, $videoContainer.data("dv2OddsMatchData"));
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state?.$panel?.length) return;
    if (!state.hasShownFirstAuto) {
        dv2MaybeShowFirstStreamOddsAuto($videoContainer);
    } else if (!state.$panel.hasClass("dv2-stream-odds-panel--open")) {
        dv2ShowStreamOddsAuto($videoContainer);
    }
}

function dv2ClearFullStreamChrome($videoContainer) {
    if (!$videoContainer?.length) return;
    dv2StopFooterHeadPeek($videoContainer);
    $videoContainer.data("hlsReady", false);
    dv2SetFullStreamChromeVisible($videoContainer, false);
    const oddsState = $videoContainer.data("dv2OddsPanelState");
    if (oddsState?.$panel?.length) {
        if (oddsState.autoHideTimer) {
            clearTimeout(oddsState.autoHideTimer);
            oddsState.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen(oddsState.$panel, false);
    }
    dv2ExitStreamWrapperFullscreen($videoContainer);
}

function dv2InitStreamPlayerUi($videoContainer, $video) {
    if (!$videoContainer?.length) return;
    $video = $video || $videoContainer.find("video").first();
    if ($video?.length) {
        dv2ApplyStreamVideoControls($video);
        dv2ApplyStreamAutoplayMuted($video);
    }
    dv2EnsureVideoStage($videoContainer);
    dv2EnsureStreamControlsBar($videoContainer);
    dv2BindStreamChromeEvents($videoContainer);
    dv2InitVideoStageSync($videoContainer);
    dv2SyncStreamControlsState($videoContainer, $video);
    dv2SyncVideoStageLayout($videoContainer);
}

function dv2EnsureFooterHeadPeekEl($videoContainer) {
    const $chrome = dv2GetStreamChromeEl($videoContainer);
    let $peek = $chrome.children(".dv2-stream-chrome-ft-head-peek");
    if ($peek.length) return $peek;

    const $head = $chrome.find(".dv2-stream-chrome-footer .dv2-stream-chrome-ft-head").first();
    if (!$head.length) return null;

    $peek = $('<div class="dv2-stream-chrome-ft-head-peek" aria-hidden="true"></div>');
    $peek.append($head.clone(false));
    $peek.find("[id]").removeAttr("id");
    $chrome.append($peek);
    return $peek;
}

function dv2StopFooterHeadPeek($videoContainer) {
    const state = $videoContainer.data("dv2FooterHeadPeekState");
    if (!state) return;

    if (state.intervalTimer) {
        clearTimeout(state.intervalTimer);
    }
    if (state.hideTimer) {
        clearTimeout(state.hideTimer);
    }

    state.$peek?.removeClass("dv2-stream-chrome-ft-head-peek--visible").attr("aria-hidden", "true");
    $videoContainer.removeData("dv2FooterHeadPeekState");
}

function dv2HideFooterHeadPeek($videoContainer) {
    const state = $videoContainer.data("dv2FooterHeadPeekState");
    if (!state?.$peek?.length) return;
    state.$peek.removeClass("dv2-stream-chrome-ft-head-peek--visible").attr("aria-hidden", "true");
}

function dv2ScheduleFooterHeadPeek($videoContainer) {
    const state = $videoContainer.data("dv2FooterHeadPeekState");
    if (!state) return;

    if (state.intervalTimer) {
        clearTimeout(state.intervalTimer);
    }

    state.intervalTimer = setTimeout(() => {
        dv2ShowFooterHeadPeek($videoContainer);
    }, DV2_FOOTER_HEAD_PEEK_INTERVAL_MS);
}

function dv2ShowFooterHeadPeek($videoContainer) {
    const state = $videoContainer.data("dv2FooterHeadPeekState");
    if (!state?.$peek?.length) return;
    if (!$videoContainer.hasClass("dv2-stream-chrome-footer-closed")) return;
    if (!$videoContainer.hasClass("dv2-full-stream-active")) return;

    state.$peek.addClass("dv2-stream-chrome-ft-head-peek--visible").attr("aria-hidden", "false");

    if (state.hideTimer) {
        clearTimeout(state.hideTimer);
    }

    state.hideTimer = setTimeout(() => {
        dv2HideFooterHeadPeek($videoContainer);
        dv2ScheduleFooterHeadPeek($videoContainer);
    }, DV2_FOOTER_HEAD_PEEK_VISIBLE_MS);
}

function dv2StartFooterHeadPeek($videoContainer) {
    dv2StopFooterHeadPeek($videoContainer);

    const $peek = dv2EnsureFooterHeadPeekEl($videoContainer);
    if (!$peek?.length) return;

    $videoContainer.data("dv2FooterHeadPeekState", {
        $peek,
        intervalTimer: null,
        hideTimer: null,
    });

    dv2ScheduleFooterHeadPeek($videoContainer);
}

function dv2BindStreamChromeEvents($videoContainer) {
    if ($videoContainer.data("streamChromeBound")) return;
    $videoContainer.data("streamChromeBound", true);
    dv2InitCssFullscreenPortal($videoContainer);

    const closeStreamChromeFooter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        $videoContainer.addClass("dv2-stream-chrome-footer-closed");
        dv2GetStreamChromeEl($videoContainer).addClass("dv2-stream-chrome-footer-closed");
        dv2UpdateStreamChromeVisibility($videoContainer);
        dv2StartFooterHeadPeek($videoContainer);
    };

    const closeStreamChromeRight = (e) => {
        e.preventDefault();
        e.stopPropagation();
        $videoContainer.addClass("dv2-stream-chrome-right-closed");
        dv2GetStreamChromeEl($videoContainer).addClass("dv2-stream-chrome-right-closed");
        dv2UpdateStreamChromeVisibility($videoContainer);
    };

    $videoContainer.on("click", ".dv2-stream-chrome-footer .dv2-stream-chrome-close", closeStreamChromeFooter);
    $videoContainer.on("click", ".dv2-stream-chrome-right .dv2-stream-chrome-close", closeStreamChromeRight);

    $videoContainer.on("click", ".dv2-stream-fs-btn", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dv2ToggleWrapperFullscreen($videoContainer);
    });

    $videoContainer.on("click", ".dv2-stream-controls__play", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const $video = $videoContainer.find("video").first();
        dv2ToggleStreamVideoPlayPause($video);
        dv2SyncStreamControlsState($videoContainer, $video);
        dv2PulseStreamControlsVisible($videoContainer);
    });

    $videoContainer.on("click", ".dv2-stream-controls__mute", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const video = $videoContainer.find("video")[0];
        if (!video) return;
        if (dv2IsStreamVideoMuted(video)) {
            video.muted = false;
            if (video.volume === 0) {
                video.volume = 0.7;
            }
        } else {
            video.muted = true;
        }
        dv2MarkStreamVolumeTouched(video);
        dv2SyncStreamControlsState($videoContainer);
        dv2PulseStreamControlsVisible($videoContainer);
    });

    $videoContainer.on("input change", ".dv2-stream-volume", function (e) {
        e.stopPropagation();
        const video = $videoContainer.find("video")[0];
        if (!video) return;
        const vol = parseFloat(this.value);
        if (Number.isNaN(vol)) return;
        video.volume = vol;
        video.muted = vol === 0;
        dv2MarkStreamVolumeTouched(video);
        dv2SyncStreamControlsState($videoContainer);
        dv2PulseStreamControlsVisible($videoContainer);
    });

    let streamVideoClickTimer = null;
    let streamControlsHideTimer = null;

    const isStreamChromeUiClick = (target) =>
        $(target).closest(
            ".dv2-stream-controls, .dv2-stream-chrome-close, .dv2-stream-chrome-header, .dv2-stream-chrome-right, .dv2-stream-chrome-footer, .dv2-stream-chrome-ft-head-peek, .dv2-stream-odds-slot, .dv2-stream-odds-panel, button, a, input, label"
        ).length > 0;

    const toggleStreamVideoPlayPause = ($video) => {
        const video = $video?.[0];
        if (!video) return;
        if (video.paused) {
            video.play().catch(() => console.warn("[VSC LIVE] Không thể phát video"));
        } else {
            video.pause();
        }
    };

    const clearStreamControlsHideTimer = () => {
        if (streamControlsHideTimer) {
            clearTimeout(streamControlsHideTimer);
            streamControlsHideTimer = null;
        }
    };

    const setStreamControlsVisible = (visible) => {
        $videoContainer.toggleClass("dv2-stream-ui-active", !!visible);
    };

    const pulseStreamControlsVisible = () => {
        setStreamControlsVisible(true);
        clearStreamControlsHideTimer();
        streamControlsHideTimer = setTimeout(() => {
            setStreamControlsVisible(false);
            streamControlsHideTimer = null;
        }, DV2_STREAM_CONTROLS_HIDE_MS);
    };

    $videoContainer.data("dv2PulseStreamControlsVisible", pulseStreamControlsVisible);

    $videoContainer.on("click", "video", function (e) {
        if (isStreamChromeUiClick(e.target)) return;

        pulseStreamControlsVisible();

        const $video = $(this);

        clearTimeout(streamVideoClickTimer);
        streamVideoClickTimer = setTimeout(() => {
            streamVideoClickTimer = null;
            toggleStreamVideoPlayPause($video);
        }, 220);
    });

    $videoContainer.on("dblclick", "video", function (e) {
        if (isStreamChromeUiClick(e.target)) return;
        clearTimeout(streamVideoClickTimer);
        streamVideoClickTimer = null;
        e.preventDefault();
        dv2ToggleWrapperFullscreen($videoContainer);
    });

    $videoContainer.on(
        "mousemove.dv2StreamUi pointerenter.dv2StreamUi pointerdown.dv2StreamUi touchstart.dv2StreamUi",
        function () {
            pulseStreamControlsVisible();
        }
    );

    $videoContainer.on("playing.dv2StreamUi", "video", function () {
        pulseStreamControlsVisible();
    });

    $videoContainer.on(
        "play.dv2StreamControls pause.dv2StreamControls volumechange.dv2StreamControls loadedmetadata.dv2StreamControls",
        "video",
        function () {
            dv2SyncStreamControlsState($videoContainer, $(this));
        }
    );

    $videoContainer.on("mouseleave.dv2StreamUi", function () {
        clearStreamControlsHideTimer();
        setStreamControlsVisible(false);
    });

    const syncFullscreenChrome = () => {
        if (
            !dv2IsNativeWrapperFullscreen($videoContainer) &&
            dv2IsCssWrapperFullscreen($videoContainer)
        ) {
            // Giữ CSS fullscreen khi native API không dùng được (iOS).
        } else if (!dv2IsNativeWrapperFullscreen($videoContainer)) {
            $videoContainer.data("cssWrapperFs", false);
            dv2RestoreCssFullscreenPortal($videoContainer);
            if (
                !$(".dv2-video-wrapper")
                    .toArray()
                    .some((el) => $(el).data("cssWrapperFs"))
            ) {
                $("body").removeClass("dv2-stream-body-fs");
            }
        }

        const isContainerFs = dv2IsStreamWrapperFullscreen($videoContainer);
        dv2SyncCssFullscreenPortal($videoContainer);
        dv2SyncStreamWrapperFullscreenUi($videoContainer);

        if (!isContainerFs) {
            clearStreamControlsHideTimer();
            setStreamControlsVisible(false);
        } else {
            pulseStreamControlsVisible();
        }
        dv2SyncStreamChromeVisibility($videoContainer);
        dv2SyncVideoStageLayout($videoContainer);
    };

    $(document).on(
        "fullscreenchange.dv2StreamChrome webkitfullscreenchange.dv2StreamChrome mozfullscreenchange.dv2StreamChrome MSFullscreenChange.dv2StreamChrome",
        syncFullscreenChrome
    );

    $videoContainer.on("dv2wrapperfschange.dv2StreamChrome", syncFullscreenChrome);
    $(window).on("resize.dv2StreamChrome orientationchange.dv2StreamChrome", function () {
        syncFullscreenChrome();
        dv2SyncVideoStageLayout($videoContainer);
    });
}

function dv2PulseStreamControlsVisible($videoContainer) {
    const pulse = $videoContainer?.data("dv2PulseStreamControlsVisible");
    if (typeof pulse === "function") {
        pulse();
    }
}

function dv2ToggleStreamVideoPlayPause($video) {
    const video = $video?.[0];
    if (!video) return;
    if (video.paused) {
        video.play().catch(() => console.warn("[VSC LIVE] Không thể phát video"));
    } else {
        video.pause();
    }
}

function dv2GetStreamOddsPanelConfig() {
    const config = window.DV2_STREAM_ODDS_PANEL || {};
    return {
        imageUrl: config.imageUrl || "",
        linkUrl: config.linkUrl || "",
    };
}

function dv2GetStreamOddsApiBase() {
    if (typeof API_URL !== "undefined") {
        return String(API_URL).replace(/\/?$/, "/");
    }
    if (typeof BASE_API_URL !== "undefined") {
        const base = String(BASE_API_URL);
        return base.endsWith("/api/data/") || base.endsWith("/api/data")
            ? base.replace(/\/?$/, "/")
            : `${base.replace(/\/?$/, "")}/api/data/`;
    }
    return "https://vsc-apidev.helizones.com/api/data/";
}

function dv2GetStreamMatchId() {
    if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
        return String(DV2_MATCH_ID);
    }
    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get("match");
        if (fromQuery) return fromQuery;
    } catch (e) {}
    const pathMatch = window.location.pathname.match(/\/streams\/([^/?#]+)/i);
    return pathMatch ? pathMatch[1] : "";
}

function dv2NormalizeOddsTrend(trend) {
    const value = String(trend || "same").toLowerCase();
    if (value === "up" || value === "down") return value;
    return "same";
}

function dv2FormatOddsValue(value) {
    if (value == null || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    const rounded = Math.round(num * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
}

function dv2FormatOddsRate(value) {
    if (value == null || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    if (num > 0) return `+${dv2FormatOddsValue(num)}`;
    return dv2FormatOddsValue(num);
}

function dv2CountMatchEvents(events, type, team) {
    if (!Array.isArray(events)) return 0;
    const needle = String(type).toLowerCase();
    return events.filter((event) => {
        const eventType = String(event?.type || "").toLowerCase();
        return event?.team === team && eventType.includes(needle);
    }).length;
}

function dv2ExtractOddsSnapshot(data) {
    const hdp = data?.hdp;
    const ou = data?.ou;
    const stats = data?.stats || {};
    const corner = data?.corner || stats?.corner || stats?.corners || {};
    const yellowCard = data?.yellowCard || stats?.yellowCard || {};
    const redCard = data?.redCard || stats?.redCard || {};
    const events = data?.events;

    return {
        hdp: {
            home: hdp?.home,
            away: hdp?.away,
            rate: hdp?.rate,
            homeTrend: dv2NormalizeOddsTrend(hdp?.homeTrend),
            awayTrend: dv2NormalizeOddsTrend(hdp?.awayTrend),
            rateTrend: dv2NormalizeOddsTrend(hdp?.rateTrend),
        },
        ou: {
            over: ou?.over,
            under: ou?.under,
            rate: ou?.rate,
            overTrend: dv2NormalizeOddsTrend(ou?.overTrend),
            underTrend: dv2NormalizeOddsTrend(ou?.underTrend),
            rateTrend: dv2NormalizeOddsTrend(ou?.rateTrend),
        },
        corners: {
            home: corner.home ?? dv2CountMatchEvents(events, "corner", "home"),
            away: corner.away ?? dv2CountMatchEvents(events, "corner", "away"),
        },
        yellowCard: {
            home: yellowCard.home ?? dv2CountMatchEvents(events, "yellow card", "home"),
            away: yellowCard.away ?? dv2CountMatchEvents(events, "yellow card", "away"),
        },
        redCard: {
            home: redCard.home ?? dv2CountMatchEvents(events, "red card", "home"),
            away: redCard.away ?? dv2CountMatchEvents(events, "red card", "away"),
        },
    };
}

function dv2SerializeOddsSnapshot(snapshot) {
    return JSON.stringify(snapshot || {});
}

function dv2OddsValueHasData(value) {
    return value != null && value !== "";
}

function dv2OddsSectionHasData(section) {
    if (section == null) return false;
    return (
        dv2OddsValueHasData(section.home) ||
        dv2OddsValueHasData(section.away) ||
        dv2OddsValueHasData(section.rate) ||
        dv2OddsValueHasData(section.over) ||
        dv2OddsValueHasData(section.under)
    );
}

function dv2SnapshotHasOddsData(snapshot) {
    if (!snapshot) return false;
    return dv2OddsSectionHasData(snapshot.hdp) || dv2OddsSectionHasData(snapshot.ou);
}

function dv2HasStreamOddsData(matchData) {
    if (!matchData) return false;
    return dv2OddsSectionHasData(matchData.hdp) || dv2OddsSectionHasData(matchData.ou);
}

function dv2UpdateOddsPill($panel, selector, value, trend, variant, options) {
    const $pill = $panel.find(selector);
    if (!$pill.length) return;

    const trendClass = dv2NormalizeOddsTrend(trend);
    const signedRate = !!(options && options.signedRate);
    const display =
        variant === "rate" && signedRate ? dv2FormatOddsRate(value) : dv2FormatOddsValue(value);
    const arrow =
        variant !== "rate" && trendClass === "up"
            ? DV2_ODDS_SVG.trendUp
            : variant !== "rate" && trendClass === "down"
              ? DV2_ODDS_SVG.trendDown
              : "";
    const trendClassName =
        variant !== "rate" && trendClass !== "same"
            ? ` dv2-stream-odds-panel__pill--${trendClass}`
            : "";

    $pill
        .attr("class", `dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--${variant}${trendClassName}`)
        .html(`${display}${arrow}`);
}

function dv2RenderStreamOddsPanel($panel, snapshot) {
    if (!$panel?.length || !snapshot) return;

    dv2UpdateOddsPill($panel, "[data-dv2-odds-hdp-home]", snapshot.hdp.home, snapshot.hdp.homeTrend, "side");
    dv2UpdateOddsPill($panel, "[data-dv2-odds-hdp-rate]", snapshot.hdp.rate, snapshot.hdp.rateTrend, "rate", {
        signedRate: true,
    });
    dv2UpdateOddsPill($panel, "[data-dv2-odds-hdp-away]", snapshot.hdp.away, snapshot.hdp.awayTrend, "side");

    dv2UpdateOddsPill($panel, "[data-dv2-odds-ou-over]", snapshot.ou.over, snapshot.ou.overTrend, "side");
    dv2UpdateOddsPill($panel, "[data-dv2-odds-ou-rate]", snapshot.ou.rate, snapshot.ou.rateTrend, "rate");
    dv2UpdateOddsPill($panel, "[data-dv2-odds-ou-under]", snapshot.ou.under, snapshot.ou.underTrend, "side");

    $panel.find("[data-dv2-odds-corners-home]").text(snapshot.corners.home ?? 0);
    $panel.find("[data-dv2-odds-corners-away]").text(snapshot.corners.away ?? 0);
    $panel.find("[data-dv2-odds-yc-home]").text(snapshot.yellowCard.home ?? 0);
    $panel.find("[data-dv2-odds-yc-away]").text(snapshot.yellowCard.away ?? 0);
    $panel.find("[data-dv2-odds-rc-home]").text(snapshot.redCard.home ?? 0);
    $panel.find("[data-dv2-odds-rc-away]").text(snapshot.redCard.away ?? 0);
}

function dv2ForceApplyStreamOddsData($videoContainer, matchData) {
    const state = $videoContainer.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length || !matchData) return;

    const snapshot = dv2ExtractOddsSnapshot(matchData);
    state.snapshotSerialized = dv2SerializeOddsSnapshot(snapshot);
    dv2RenderStreamOddsPanel($panel, snapshot);

    if (!dv2HasStreamOddsData(matchData)) {
        if (state.autoHideTimer) {
            clearTimeout(state.autoHideTimer);
            state.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen($panel, false);
    }
}

function dv2RememberStreamOddsMatchData($videoContainer, matchData) {
    if ($videoContainer?.length && matchData) {
        $videoContainer.data("dv2OddsMatchData", matchData);
    }
}

function dv2BuildStreamOddsPanelHtml(config) {
    const imageUrl = config?.imageUrl || "";
    const linkUrl = config?.linkUrl || "";
    const brandInner = imageUrl
        ? `<img src="${imageUrl}" alt="Cược" loading="lazy" decoding="async">`
        : "";
    const brandTag = linkUrl ? "a" : "div";
    const brandAttrs = linkUrl
        ? ` class="dv2-stream-odds-panel__brand" href="${linkUrl}" target="_blank" rel="noopener noreferrer"`
        : ` class="dv2-stream-odds-panel__brand"`;

    return `
<div class="dv2-stream-odds-panel dv2-stream-odds-panel--collapsed" data-dv2-odds-panel-root aria-hidden="true">
    <div class="dv2-stream-odds-panel__viewport">
        <div class="dv2-stream-odds-panel__slide">
            <div class="dv2-stream-odds-panel__body">
            <${brandTag}${brandAttrs}>
                <span class="dv2-stream-odds-panel__brand-label">Cược</span>
                ${brandInner}
            </${brandTag}>
            <div class="dv2-stream-odds-panel__rows">
                <div class="dv2-stream-odds-panel__row dv2-stream-odds-panel__row--hdp">
                    <span class="dv2-stream-odds-panel__row-label">HDP</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--side" data-dv2-odds-hdp-home>-</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--rate" data-dv2-odds-hdp-rate>-</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--side" data-dv2-odds-hdp-away>-</span>
                </div>
                <div class="dv2-stream-odds-panel__row dv2-stream-odds-panel__row--ou">
                    <span class="dv2-stream-odds-panel__row-label">O/U</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--side" data-dv2-odds-ou-over>-</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--rate" data-dv2-odds-ou-rate>-</span>
                    <span class="dv2-stream-odds-panel__pill dv2-stream-odds-panel__pill--side" data-dv2-odds-ou-under>-</span>
                </div>
            </div>
            <div class="dv2-stream-odds-panel__stats">
                <span data-dv2-odds-corners-home>0</span>
                <span class="dv2-stream-odds-panel__stat-icon">${DV2_ODDS_SVG.corner}</span>
                <span data-dv2-odds-corners-away>0</span>
                <span class="dv2-stream-odds-panel__stat-sep" aria-hidden="true">|</span>
                <span data-dv2-odds-yc-home>0</span>
                <span class="dv2-stream-odds-panel__stat-icon">${DV2_ODDS_SVG.yellowCard}</span>
                <span data-dv2-odds-yc-away>0</span>
                <span class="dv2-stream-odds-panel__stat-sep" aria-hidden="true">|</span>
                <span data-dv2-odds-rc-home>0</span>
                <span class="dv2-stream-odds-panel__stat-icon">${DV2_ODDS_SVG.redCard}</span>
                <span data-dv2-odds-rc-away>0</span>
            </div>
            </div>
            <button type="button" class="dv2-stream-odds-panel__toggle-close" aria-label="Thu gọn" aria-expanded="false">
                ${DV2_ODDS_SVG.toggleClose}
            </button>
        </div>
    </div>
</div>
<button type="button" class="dv2-stream-odds-panel__toggle-open" aria-label="Mở rộng" aria-expanded="false">
    ${DV2_ODDS_SVG.toggleOpen}
</button>`;
}

function dv2SetStreamOddsPanelOpen($panel, open, options) {
    if (!$panel?.length) return;
    const isOpen = !!open;
    const isAuto = !!(options && options.auto);
    const $slot = $panel.closest("[data-dv2-odds-panel]");

    $panel
        .toggleClass("dv2-stream-odds-panel--open", isOpen)
        .toggleClass("dv2-stream-odds-panel--collapsed", !isOpen)
        .attr("aria-hidden", isOpen ? "false" : "true");

    $slot
        .toggleClass("dv2-stream-odds-slot--open", isOpen)
        .attr("aria-hidden", isOpen ? "false" : "true");

    $panel.find(".dv2-stream-odds-panel__toggle-close").attr("aria-expanded", isOpen ? "true" : "false");
    $slot.find(".dv2-stream-odds-panel__toggle-open").attr("aria-expanded", isOpen ? "true" : "false");
    $panel.data("dv2OddsAutoVisible", isAuto);
}

function dv2ToggleStreamOddsPanel($videoContainer) {
    const state = $videoContainer?.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length) return;

    const isOpen = $panel.hasClass("dv2-stream-odds-panel--open");
    if (isOpen) {
        if (state.autoHideTimer) {
            clearTimeout(state.autoHideTimer);
            state.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen($panel, false);
        return;
    }

    dv2SetStreamOddsPanelOpen($panel, true, { auto: false });
}

function dv2BindStreamOddsPanelToggle($videoContainer) {
    const state = $videoContainer?.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length) return;

    const $slot = $panel.closest("[data-dv2-odds-panel]");

    $videoContainer.off("click.dv2OddsPanel", ".dv2-stream-odds-panel__toggle-close, .dv2-stream-odds-panel__toggle-open");
    $slot.off("click.dv2OddsPanel");

    $slot.on("click.dv2OddsPanel", ".dv2-stream-odds-panel__toggle-close", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (state.autoHideTimer) {
            clearTimeout(state.autoHideTimer);
            state.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen($panel, false);
    });

    $slot.on("click.dv2OddsPanel", ".dv2-stream-odds-panel__toggle-open", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dv2SetStreamOddsPanelOpen($panel, true, { auto: false });
    });
}

function dv2ClearStreamOddsTimers($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state) return;

    if (state.pollTimer) {
        clearInterval(state.pollTimer);
        state.pollTimer = null;
    }
    if (state.autoShowTimer) {
        clearInterval(state.autoShowTimer);
        state.autoShowTimer = null;
    }
    if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
        state.autoHideTimer = null;
    }
}

function dv2DestroyStreamOddsPanel($videoContainer) {
    if (!$videoContainer?.length) return;
    dv2ClearStreamOddsTimers($videoContainer);
    $videoContainer.removeData("dv2OddsPanelState");
    $videoContainer.off(".dv2OddsPanel");
    dv2GetStreamChromeEl($videoContainer).find("[data-dv2-odds-panel]").empty();
}

function dv2PollStreamOddsPanel($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state?.matchId || !$.ajax) return;

    $.ajax({
        url: `${state.apiBase}lives/${state.matchId}`,
        method: "GET",
        success(res) {
            if (!res?.data) return;
            dv2ApplyStreamOddsData($videoContainer, res.data);
        },
    });
}

function dv2ApplyStreamOddsData($videoContainer, matchData) {
    const state = $videoContainer.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length || !matchData) return;

    const snapshot = dv2ExtractOddsSnapshot(matchData);
    const serialized = dv2SerializeOddsSnapshot(snapshot);
    if (state.snapshotSerialized === serialized) return;

    state.snapshotSerialized = serialized;
    dv2RenderStreamOddsPanel($panel, snapshot);
    dv2RememberStreamOddsMatchData($videoContainer, matchData);

    if (!dv2HasStreamOddsData(matchData)) {
        if (state.autoHideTimer) {
            clearTimeout(state.autoHideTimer);
            state.autoHideTimer = null;
        }
        dv2SetStreamOddsPanelOpen($panel, false);
        return;
    }

    if (
        $videoContainer.data("hlsReady") &&
        !state.hasShownFirstAuto &&
        dv2SnapshotHasOddsData(snapshot)
    ) {
        dv2MaybeShowFirstStreamOddsAuto($videoContainer);
    }
}

function dv2ScheduleStreamOddsAutoHide($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state?.$panel?.length) return;

    if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
        state.autoHideTimer = null;
    }

    state.autoHideTimer = setTimeout(() => {
        state.autoHideTimer = null;
        if (state.$panel.data("dv2OddsAutoVisible")) {
            dv2SetStreamOddsPanelOpen(state.$panel, false);
        }
    }, DV2_ODDS_AUTO_SHOW_DURATION_MS);
}

function dv2ShowStreamOddsAuto($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    const $panel = state?.$panel;
    if (!state || !$panel?.length) return;

    const matchData = $videoContainer.data("dv2OddsMatchData");
    if (!dv2HasStreamOddsData(matchData)) return;

    dv2SetStreamOddsPanelOpen($panel, true, { auto: true });
    dv2ScheduleStreamOddsAutoHide($videoContainer);
}

function dv2MaybeShowFirstStreamOddsAuto($videoContainer) {
    const state = $videoContainer.data("dv2OddsPanelState");
    if (!state?.$panel?.length || state.hasShownFirstAuto) return;

    const matchData = $videoContainer.data("dv2OddsMatchData");
    if (!dv2HasStreamOddsData(matchData)) return;

    state.hasShownFirstAuto = true;
    dv2SetStreamOddsPanelOpen(state.$panel, true, { auto: false });
}

function dv2EnsureStreamOddsPanelShell($videoContainer) {
    if (!$videoContainer?.length) return $();

    let $chrome = dv2GetStreamChromeEl($videoContainer);
    if (!$chrome.length) {
        $chrome = $('<div class="dv2-stream-chrome" aria-hidden="true"></div>');
        const $stage = dv2GetVideoStageEl($videoContainer);
        if ($stage.length) {
            $stage.prepend($chrome);
        } else {
            $videoContainer.prepend($chrome);
        }
    }

    let $slot = $chrome.find("[data-dv2-odds-panel]").first();
    if (!$slot.length) {
        $slot = $chrome.children("[data-dv2-odds-panel]").first();
    }
    if (!$slot.length) {
        $slot = $videoContainer.children("[data-dv2-odds-panel]").first();
    }
    if (!$slot.length) {
        $slot = $('<div class="dv2-stream-odds-slot" data-dv2-odds-panel aria-hidden="true"></div>');
        $chrome.prepend($slot);
    }

    let $panel = $slot.find("[data-dv2-odds-panel-root]");
    if (!$panel.length) {
        $slot.html(dv2BuildStreamOddsPanelHtml(dv2GetStreamOddsPanelConfig()));
        $panel = $slot.find("[data-dv2-odds-panel-root]");
    }

    return $panel;
}

function dv2InitStreamOddsPanel($videoContainer, initialMatchData) {
    if (!$videoContainer?.length) return;

    if (initialMatchData) {
        dv2RememberStreamOddsMatchData($videoContainer, initialMatchData);
    } else {
        initialMatchData = $videoContainer.data("dv2OddsMatchData");
    }

    const matchId =
        initialMatchData?.matchId ||
        initialMatchData?.match_id ||
        initialMatchData?.id ||
        dv2GetStreamMatchId();

    if (!matchId) return;

    const $panel = dv2EnsureStreamOddsPanelShell($videoContainer);
    if (!$panel.length) return;

    if ($videoContainer.data("dv2OddsPanelState")?.matchId === matchId) {
        const existingState = $videoContainer.data("dv2OddsPanelState");
        existingState.$panel = dv2EnsureStreamOddsPanelShell($videoContainer);
        if (initialMatchData) {
            dv2RememberStreamOddsMatchData($videoContainer, initialMatchData);
            dv2ForceApplyStreamOddsData($videoContainer, initialMatchData);
            if ($videoContainer.data("hlsReady")) {
                dv2MaybeShowFirstStreamOddsAuto($videoContainer);
            }
        }
        dv2BindStreamOddsPanelToggle($videoContainer);
        return;
    }

    dv2DestroyStreamOddsPanel($videoContainer);

    const state = {
        matchId,
        apiBase: dv2GetStreamOddsApiBase(),
        $panel,
        snapshotSerialized: "",
        pollTimer: null,
        autoShowTimer: null,
        autoHideTimer: null,
        hasShownFirstAuto: false,
    };

    $videoContainer.data("dv2OddsPanelState", state);
    dv2SetStreamOddsPanelOpen($panel, false);

    if (initialMatchData) {
        dv2ForceApplyStreamOddsData($videoContainer, initialMatchData);
    } else {
        dv2PollStreamOddsPanel($videoContainer);
    }

    state.pollTimer = setInterval(() => {
        dv2PollStreamOddsPanel($videoContainer);
    }, DV2_ODDS_POLL_MS);

    state.autoShowTimer = setInterval(() => {
        if ($panel.hasClass("dv2-stream-odds-panel--open")) return;
        dv2ShowStreamOddsAuto($videoContainer);
    }, DV2_ODDS_AUTO_SHOW_INTERVAL_MS);

    dv2BindStreamOddsPanelToggle($videoContainer);

    if ($videoContainer.data("hlsReady")) {
        dv2MaybeShowFirstStreamOddsAuto($videoContainer);
    }
}

window.DV2_StreamChrome = {
    getChromeEl: dv2GetStreamChromeEl,
    getOverlayMount: dv2GetOverlayMount,
    ensureVideoStage: dv2EnsureVideoStage,
    syncVideoStageLayout: dv2SyncVideoStageLayout,
    applyVideoControls: dv2ApplyStreamVideoControls,
    ensureControlsBar: dv2EnsureStreamControlsBar,
    syncControlsState: dv2SyncStreamControlsState,
    bindEvents: dv2BindStreamChromeEvents,
    initPlayerUi: dv2InitStreamPlayerUi,
    refreshReviveAds: dv2RefreshStreamChromeReviveAds,
    setFullChromeVisible: dv2SetFullStreamChromeVisible,
    syncVisibility: dv2SyncStreamChromeVisibility,
    updateVisibility: dv2UpdateStreamChromeVisibility,
    onHlsReady: dv2OnHlsStreamReady,
    clearFullChrome: dv2ClearFullStreamChrome,
    initOddsPanel: dv2InitStreamOddsPanel,
    rememberOddsMatchData: dv2RememberStreamOddsMatchData,
    destroyOddsPanel: dv2DestroyStreamOddsPanel,
    exitWrapperFullscreen: dv2ExitStreamWrapperFullscreen,
    toggleWrapperFullscreen: dv2ToggleWrapperFullscreen,
    pulseControlsVisible: dv2PulseStreamControlsVisible,
    togglePlayPause: dv2ToggleStreamVideoPlayPause,
    getWrapperFrom: ($el) => $el.closest(".dv2-video-wrapper"),
};
