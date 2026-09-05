$ = jQuery.noConflict();
const POSTER_URL_VB2 = "https://img.freepik.com/premium-photo/close-up-soccer-player-who-kicks-ball_207634-4089.jpg";

function getDefaultHot18PosterUrl_VB2() {
    return DV2StreamKickoff.getDefaultHot18PosterUrl();
}

function resolvePosterUrl_VB2(link) {
    return DV2StreamKickoff.resolvePosterUrl(link, POSTER_URL_VB2);
}

function applyPosterForLink_VB2($video, link) {
    DV2StreamKickoff.applyPosterForLink($video, link, POSTER_URL_VB2);
}

function shouldShowPreMatchOverlay_VB2(matchData) {
    const kickoffTime = new Date(matchData?.matchInfo?.kickoff);
    return (
        !Number.isNaN(kickoffTime.getTime()) &&
        kickoffTime.getTime() - Date.now() > 15 * 60 * 1000
    );
}

// ========================================
// Ads Banner for detail page (stream links row)
// ========================================
function renderStreamBetButtons_VB2() {
    const $container = $(".dv2-layout-vb2.dv2-detail-livestream .dv2-stream-list .dv2-bet-links");
    if (!$container.length) return;

    const html = window.DV2_SOCOLIVE_STREAM_BET_BUTTONS_HTML;
    if (typeof html === "string" && html.trim()) {
        $container.html(html);
    }

    if (!$container.children().length) return;
    window.DV2_StreamChrome?.refreshReviveAds?.($container);
}
$(document).ready(function ($) {
    if ($(".dv2-layout-vb2.dv2-detail-livestream").length) {
        renderDetailMatch_VB2();
    } 
});

function applyStreamVideoLayout_VB2($video) {
    if (!$video?.length) return;
    $video.css({
        width: "100%",
        height: "auto",
        maxWidth: "100%",
        left: "",
        top: "",
        position: "",
    });
}

/* ===============================
 * MAIN RENDER
 * =============================== */
function renderDetailMatch_VB2() {
    const $container = $(".dv2-layout-vb2.dv2-detail-livestream");
    const $videoContainer = $container.find(".dv2-video-wrapper");
    const $headerContainer = $container.find(".dv2-layout-vb2-header");
    const $footerContainer = $container.find(".dv2-layout-vb2-footer");

    const matchId = getMatchId_VB2();
    const apiStream = `https://vsc-apidev.helizones.com/api/data/lives/${matchId}`;

    if (!matchId) {
        showErrorVideo($videoContainer, '❌ Trận đấu này không  tồn tại!');
        return;
    }

    console.log("[VSC LIVE] Match ID:", matchId);

    const $streamPlayer = $videoContainer.find("#stream-player");
    const $video = $("<video>", {
        id: "liveVideo",
        controls: false,
        autoplay: true,
        muted: true,
        playsinline: true,
        poster: POSTER_URL_VB2,
    });
    $streamPlayer.empty().append($video);
    applyStreamVideoLayout_VB2($video);
    DV2_StreamChrome.initPlayerUi($videoContainer, $video);
    applyStreamVideoLayout_VB2($video);

    const loadMatchData = () => {
        showStreamLoading_VB2($videoContainer, "Đang tải thông tin trận đấu...");

        $.ajax({
            url: apiStream,
            method: "GET",
            success: function (res) {
                const data = res?.data;
                if (!data) {
                    showErrorVideo($videoContainer, 'Trận đấu này không tồn tại!');
                    return;
                }

                startDetailScorePoll_VB2(data);

                $headerContainer.show()
                $footerContainer.show()
                renderHeader_VB2($headerContainer, data);
                renderFooterStats_VB2($footerContainer, data);
                initStreamOddsPanel_VB2($videoContainer, data);

                if (!data?.livestream) {
                    hideStreamLoading_VB2($videoContainer);
                    showMatchPosterOverlay_VB2($videoContainer, data);
                    return;
                }

                const links = DV2StreamLinks.sortForDetail(data.livestream.links);
                let activeLink = null;
                if (links.length > 0) {
                    const resolved = DV2StreamLinks.resolveActiveLink(links);
                    activeLink = resolved.activeLink;
                    currentActiveLinkVB2 = activeLink;
                    applyPosterForLink_VB2($video, activeLink);
                    initStreamLinks_VB2(links, resolved.activeIndex);
                    renderStreamBetButtons_VB2();
                    currentMatchDataVB2 = data;
                }

                if (shouldShowPreMatchOverlay_VB2(data)) {
                    const showPreMatchOverlay = () => {
                        DV2_StreamChrome.clearFullChrome($videoContainer);
                        hideStreamLoading_VB2($videoContainer);
                        showMatchPosterOverlay_VB2($videoContainer, data);
                    };

                    if (window.DV2StreamTvc?.playBeforeStream) {
                        window.DV2StreamTvc.playBeforeStream($videoContainer, showPreMatchOverlay);
                    } else {
                        showPreMatchOverlay();
                    }
                    return;
                }

                if (activeLink?.url) {
                    const startStream = () => initHLSPlayer_VB2(activeLink.url, $video, data);
                    if (window.DV2StreamTvc?.playBeforeStream) {
                        window.DV2StreamTvc.playBeforeStream($videoContainer, startStream);
                    } else {
                        startStream();
                    }
                }
            },
            error: function () {
                showErrorVideo($videoContainer, 'Có lỗi xảy ra!');
            }
        });
    };

    loadMatchData();
}

/* ===============================
 * HEADER
 * =============================== */
function renderHeader_VB2($container, data) {
    const home = data?.teams?.home || {};
    const away = data?.teams?.away || {};
    const league = data?.league || {};
    const kickoff = data?.matchInfo?.kickoff;
    const status = data?.matchInfo?.status || "-";
    const homeScore = data?.score?.fulltime?.home ?? 0;
    const awayScore = data?.score?.fulltime?.away ?? 0;
    const pen = data?.score?.pen;
    const hasPen = pen && (pen.home != null || pen.away != null);

    const timeMatch = `<strong>${formatTime_VB2(kickoff)}</strong> ngày ${getDateLabel_VB2(kickoff)}`;

    const html = `
    <h1>${home.name || '-'} vs ${away.name || '-'} - ${timeMatch}</h1>
    <div class="dv2-layout-vb2-header-content">
        <p class="dv2-layout-vb2-header-content-league">
            <img src="${league.logo || ''}" alt="${league.name || '-'}"
                onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
            > ${league.name || '-'}
        </p>
        <div class="dv2-layout-vb2-header-content-info">
            <div class="dv2-layout-vb2-header-content-info-home">
            
                ${home.name || '-'} <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" src="${home.logo || ''}" alt="${home.name || '-'}">
            </div>
            <div class="dv2-layout-vb2-header-content-info-detail">
                <span>${statusMatchRender(status)}</span>
                <p><span data-dv2-score-home>${homeScore}</span> <span>-</span> <span data-dv2-score-away>${awayScore}</span></p>
                ${hasPen ? `
                <div class="dv2-layout-vb2-header-content-info-detail-pen">
                    <span class="dv2-pen-value"><span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span></span>
                    <span class="dv2-pen-label">(Penalty)</span>
                </div>
                ` : ''}
                <div class="dv2-layout-vb2-header-content-info-detail-time">${timeMatch}</div>
            </div>
            <div class="dv2-layout-vb2-header-content-info-away">
                <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" src="${away.logo || ''}" alt="${away.name || '-'}"> ${away.name || '-'}
            </div>
        </div>
    </div>
    `;

    $container.html(html);
}


/* ===============================
 * FOOTER STATS
 * =============================== */
function renderFooterStats_VB2($container, data) {
    const homeName = data?.teams?.home?.name || '-';
    const awayName = data?.teams?.away?.name || '-';
    const stats = data?.stats || {};
    const kickoff = data?.matchInfo?.kickoff;
    const timeDisplay = DV2StreamKickoff.renderTimeDisplay(kickoff, { useFooterTitle: true });
    const league = data?.league || {};

    const html = `
    <p>${timeDisplay}</p>
    <p><strong class="dv2-layout-vb2-footer-title">Giải đấu:</strong> <img src="${league.logo || ''}" alt="${league.name || '-'}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"> ${league.name || '-'}</p> 
    <div class="dv2-layout-vb2-footer-info">
        <div class="vb2-table">
            ${renderStatRow('Thông số', homeName, awayName, true)}
            ${renderStatRow('Kiểm soát bóng', `${stats.possession?.home ?? 0}%`, `${stats.possession?.away ?? 0}%`)}
            ${renderStatRow('Tổng cú sút', stats.shots?.home ?? 0, stats.shots?.away ?? 0)}
            ${renderStatRow('Cú sút trúng đích', stats.shotsOnTarget?.home ?? 0, stats.shotsOnTarget?.away ?? 0)}
            ${renderStatRow('Phạt góc', stats.corners?.home ?? 0, stats.corners?.away ?? 0)}
            ${renderStatRow('Đá phạt trực tiếp', stats.freeKick?.home ?? 0, stats.freeKick?.away ?? 0)}
            ${renderStatRow('Thẻ vàng', stats.yellowCard?.home ?? 0, stats.yellowCard?.away ?? 0)}
            ${renderStatRow('Thẻ đỏ', stats.redCard?.home ?? 0, stats.redCard?.away ?? 0)}
            ${renderStatRow('Việt vị', stats.offside?.home ?? 0, stats.offside?.away ?? 0)}
            ${renderStatRow('Tổng đường chuyền', stats.pass?.home ?? 0, stats.pass?.away ?? 0)}
            ${renderStatRow('Đường chuyền thành công', stats.passSuccess?.home ?? 0, stats.passSuccess?.away ?? 0)}
            ${renderStatRow('Chuyền dài', stats.longPass?.home ?? 0, stats.longPass?.away ?? 0)}
            ${renderStatRow('Chuyền dài thành công', stats.longPassSuccess?.home ?? 0, stats.longPassSuccess?.away ?? 0)}
            ${renderStatRow('Phá bóng', stats.tackles?.home ?? 0, stats.tackles?.away ?? 0)}
            ${renderStatRow('Cứu thua', stats.save?.home ?? 0, stats.save?.away ?? 0)}
            ${renderStatRow('Phạm lỗi', stats.fouls?.home ?? 0, stats.fouls?.away ?? 0)}
        </div>
    </div>`;
    $container.html(html);
    DV2StreamKickoff.startCountdown(kickoff);
}

function renderStatRow(label, home, away, isHead = false) {
    return `
    <div class="vb2-row ${isHead ? 'vb2-head' : ''}">
        <div class="vb2-col">${label}</div>
        <div class="vb2-col">${home}</div>
        <div class="vb2-col">${away}</div>
    </div>`;
}

/* ===============================
 * STREAM LINKS
 * =============================== */
function initStreamLinks_VB2(links = [], activeIndex = 0) {
    DV2StreamLinks.bindSpanLinks({
        $container: $(".dv2-layout-vb2.dv2-detail-livestream .dv2-stream-links"),
        links,
        activeIndex,
        streamAttr: "data-stream",
        onSelect(link) {
            const $video = $("#liveVideo");
            const $videoContainer = $video.closest(".dv2-video-wrapper");
            currentActiveLinkVB2 = link;
            applyPosterForLink_VB2($video, link);

            if (currentMatchDataVB2) {
                initStreamOddsPanel_VB2($videoContainer, currentMatchDataVB2);
            }

            if (shouldShowPreMatchOverlay_VB2(currentMatchDataVB2) || !link?.url) {
                DV2_StreamChrome.clearFullChrome($videoContainer);
                stopStreamPlayback_VB2($video);
                hideStreamLoading_VB2($videoContainer);
                showMatchPosterOverlay_VB2($videoContainer, currentMatchDataVB2);
                return;
            }

            clearMatchOverlays_VB2($videoContainer);
            initHLSPlayer_VB2(link.url, $video, currentMatchDataVB2);
        },
    });
}

function onHlsStreamReady_VB2($videoContainer) {
    clearMatchOverlays_VB2($videoContainer);
    applyStreamVideoLayout_VB2($videoContainer.find("video").first());
    if (currentMatchDataVB2) {
        DV2_StreamChrome.rememberOddsMatchData?.($videoContainer, currentMatchDataVB2);
    }
    DV2_StreamChrome.onHlsReady($videoContainer);
    applyStreamVideoLayout_VB2($videoContainer.find("video").first());
}

function initStreamOddsPanel_VB2($videoContainer, matchData) {
    if (!$videoContainer?.length || !matchData) return;
    DV2_StreamChrome.rememberOddsMatchData?.($videoContainer, matchData);
    DV2_StreamChrome.initOddsPanel?.($videoContainer, matchData);
}

/* ===============================
 * STREAM LOADING OVERLAY
 * =============================== */
const VB2_STREAM_LOADING_PLAYING_MS = 12000;

function showStreamLoading_VB2($videoContainer, message = "Đang tải luồng phát...") {
    if (!$videoContainer?.length) return $();
    hideStreamLoading_VB2($videoContainer);
    const safeMessage = String(message || "Đang tải luồng phát...")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const $overlay = $(`
        <div class="dv2-stream-loading" role="status" aria-live="polite" aria-busy="true">
            <div class="dv2-stream-loading__panel">
                <div class="dv2-stream-loading__spinner" aria-hidden="true"></div>
                <p class="dv2-stream-loading__text">${safeMessage}</p>
            </div>
        </div>
    `);
    DV2_StreamChrome.getOverlayMount($videoContainer).append($overlay);
    DV2_StreamChrome.syncVideoStageLayout($videoContainer);
    return $overlay;
}

function hideStreamLoading_VB2($videoContainer) {
    $videoContainer?.find(".dv2-stream-loading").remove();
}

function bindStreamLoadingUntilPlaying_VB2($videoContainer, video, onReady) {
    if (!$videoContainer?.length || !video) {
        onReady?.();
        return;
    }

    let settled = false;
    const finish = () => {
        if (settled) return;
        settled = true;
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("canplay", onCanPlay);
        clearTimeout(fallbackTimer);
        hideStreamLoading_VB2($videoContainer);
        onReady?.();
    };

    const onPlaying = () => finish();
    const onCanPlay = () => {
        if (!video.paused) {
            finish();
        }
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);

    const fallbackTimer = setTimeout(finish, VB2_STREAM_LOADING_PLAYING_MS);
}

/* ===============================
 * HLS PLAYER
 * =============================== */
let currentHls = null;
let currentMatchDataVB2 = null;
let currentActiveLinkVB2 = null;
let detailScorePoll_VB2 = null;
let vb2PlaybackGeneration = 0;
let vb2ManifestTimeout = null;
let vb2NativeTimeout = null;

function startDetailScorePoll_VB2(match) {
    if (!match) return;
    if (!detailScorePoll_VB2) {
        detailScorePoll_VB2 = DV2MatchScorePoll.create({
            container: ".dv2-layout-vb2.dv2-detail-livestream",
        });
    }
    detailScorePoll_VB2.sync(match);
    detailScorePoll_VB2.start();
}

function startLiveStream_VB2(url, $video, matchData = null) {
    initHLSPlayer_VB2(url, $video, matchData);
}

function clearVb2PlaybackTimers() {
    if (vb2ManifestTimeout) {
        clearTimeout(vb2ManifestTimeout);
        vb2ManifestTimeout = null;
    }
    if (vb2NativeTimeout) {
        clearTimeout(vb2NativeTimeout);
        vb2NativeTimeout = null;
    }
}

function initHLSPlayer_VB2(url, $video, matchData = null) {
    const fallbackMatchData = matchData || currentMatchDataVB2;
    const $videoContainer = $video?.closest(".dv2-video-wrapper");

    vb2PlaybackGeneration += 1;
    const playbackGen = vb2PlaybackGeneration;
    const isStalePlayback = () => playbackGen !== vb2PlaybackGeneration;

    clearMatchOverlays_VB2($videoContainer);
    clearVb2PlaybackTimers();

    if (!url || !$video?.length) {
        hideStreamLoading_VB2($videoContainer);
        if (fallbackMatchData && $videoContainer?.length) {
            showMatchPosterOverlay_VB2($videoContainer, fallbackMatchData);
        }
        return;
    }

    showStreamLoading_VB2($videoContainer, "Đang tải luồng phát...");

    let hasFallback = false;

    const showFallbackOverlay = () => {
        if (isStalePlayback() || hasFallback || !fallbackMatchData || !$videoContainer.length) return;
        hasFallback = true;
        DV2_StreamChrome.clearFullChrome($videoContainer);
        hideStreamLoading_VB2($videoContainer);
        showMatchPosterOverlay_VB2($videoContainer, fallbackMatchData);
    };

    if (currentHls) {
        try { currentHls.destroy(); } catch (e) {}
        currentHls = null;
    }

    const video = $video[0];

    if (Hls.isSupported()) {
        vb2ManifestTimeout = setTimeout(() => {
            if (isStalePlayback()) return;
            console.warn("[VSC LIVE] Manifest load timeout");
            showFallbackOverlay();
        }, 15000);

        currentHls = new Hls({
                    maxBufferLength: 10,
                    liveSyncDuration: 3,
                    enableWorker: true,
                    xhrSetup: function (xhr, url) {
                        // Add any necessary headers or credentials here
                        xhr.withCredentials = false;
                        // Add referrer policy to handle CORS
                        xhr.referrerPolicy = "no-referrer-when-downgrade";
                    },
                });
        currentHls.loadSource(url);
        currentHls.attachMedia(video);

        currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isStalePlayback()) return;
            clearVb2PlaybackTimers();
            bindStreamLoadingUntilPlaying_VB2($videoContainer, video, () => {
                if (isStalePlayback()) return;
                onHlsStreamReady_VB2($videoContainer);
            });
            setTimeout(() => tryAutoPlay(video), 100);
        });

        currentHls.on(Hls.Events.ERROR, (event, data) => {
            if (isStalePlayback()) return;
            if (data?.fatal) {
                clearVb2PlaybackTimers();
                showFallbackOverlay();
            }
        });
        video.addEventListener("error", () => {
            if (isStalePlayback()) return;
            clearVb2PlaybackTimers();
            showFallbackOverlay();
        }, { once: true });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        vb2NativeTimeout = setTimeout(() => {
            if (isStalePlayback()) return;
            console.warn("[VSC LIVE] Native HLS load timeout");
            showFallbackOverlay();
        }, 15000);
        video.src = url;
        video.addEventListener("loadedmetadata", () => {
            if (isStalePlayback()) return;
            clearVb2PlaybackTimers();
            bindStreamLoadingUntilPlaying_VB2($videoContainer, video, () => {
                if (isStalePlayback()) return;
                onHlsStreamReady_VB2($videoContainer);
            });
            setTimeout(() => tryAutoPlay(video), 100);
        });
        video.addEventListener("error", () => {
            if (isStalePlayback()) return;
            clearVb2PlaybackTimers();
            showFallbackOverlay();
        }, { once: true });
    }

    DV2_StreamChrome.initPlayerUi($videoContainer, $video);
}

function tryAutoPlay(video) {
    video.muted = true;
    const $videoContainer = $(video).closest(".dv2-video-wrapper");
    if ($videoContainer.length) {
        DV2_StreamChrome.syncControlsState($videoContainer, $(video));
    }
    video.play().catch(() => console.warn("Autoplay bị chặn"));
}

/* ===============================
 * UTILITIES
 * =============================== */
function getMatchId_VB2() {
    const params = new URLSearchParams(window.location.search);
    let matchId = params.get("match");
    if (!matchId) {
        if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
            matchId = DV2_MATCH_ID;
        } else {
            matchId = "2y8m4zh54p4zql0";
        }
    }

    return matchId;
}

function stopStreamPlayback_VB2($video) {
    vb2PlaybackGeneration += 1;
    clearVb2PlaybackTimers();
    if (currentHls) {
        try {
            currentHls.destroy();
        } catch (e) {}
        currentHls = null;
    }
    if (!$video?.length) return;
    const el = $video[0];
    el.pause();
    el.removeAttribute("src");
    if (typeof el.load === "function") {
        el.load();
    }
}

function ensurePosterVideo_VB2($videoContainer) {
    if (!$videoContainer?.length) return $();

    const $streamPlayer = $videoContainer.find("#stream-player");
    let $video = $streamPlayer.find("#liveVideo");
    if (!$video.length) {
        $video = $videoContainer.find("#liveVideo");
    }
    if ($video.length) {
        stopStreamPlayback_VB2($video);
        $video.attr({
            poster: resolvePosterUrl_VB2(currentActiveLinkVB2),
            muted: true,
            playsinline: true,
        });
        $video.prop({ autoplay: false, controls: false });
    } else {
        $video = $("<video>", {
            id: "liveVideo",
            controls: false,
            autoplay: false,
            muted: true,
            playsinline: true,
            poster: resolvePosterUrl_VB2(currentActiveLinkVB2),
        });
        if ($streamPlayer.length) {
            $streamPlayer.empty().append($video);
        } else {
            $videoContainer.append($video);
        }
    }

    DV2_StreamChrome.applyVideoControls($video);
    DV2_StreamChrome.ensureControlsBar($videoContainer);
    applyStreamVideoLayout_VB2($video);
    return $video;
}

function clearMatchOverlays_VB2($videoContainer) {
    $videoContainer
        .find(".dv2-loading.dv2-match-overlay, .dv2-not-loaded.dv2-match-overlay")
        .remove();
}

function showMatchPosterOverlay_VB2($videoContainer, matchData) {
    if (!$videoContainer?.length) return;

    hideStreamLoading_VB2($videoContainer);
    $videoContainer.find(".dv2-loading").not(".dv2-match-overlay").remove();
    clearMatchOverlays_VB2($videoContainer);
    ensurePosterVideo_VB2($videoContainer);

    if (matchData) {
        const $overlay = createNotFoundMatchOverlay_VB2(matchData);
        $overlay.addClass("dv2-match-overlay");
        DV2_StreamChrome.getOverlayMount($videoContainer).append($overlay);
    }

    DV2_StreamChrome.bindEvents($videoContainer);
    DV2_StreamChrome.syncVideoStageLayout($videoContainer);
    DV2StreamKickoff.startCountdown(matchData?.matchInfo?.kickoff);
}

function showErrorVideo($container, msg = "") {
    const $wrapper = $container.hasClass("dv2-video-wrapper")
        ? $container
        : $container.find(".dv2-video-wrapper").first();

    if (!$wrapper.length) {
        $container.html(
            `<div class="dv2-not-loaded"><div class="dv2-no-stream-title">${msg}</div></div>`
        );
        return;
    }

    hideStreamLoading_VB2($wrapper);
    $wrapper.find(".dv2-loading").not(".dv2-match-overlay").remove();
    clearMatchOverlays_VB2($wrapper);
    ensurePosterVideo_VB2($wrapper);

    const $error = $(`
        <div class="dv2-not-loaded dv2-match-overlay">
            <div class="dv2-no-stream" id="noStreamMessage">
                <div class="dv2-no-stream-icon">🚫</div>
                <div class="dv2-no-stream-title">${msg}</div>
                <div class="dv2-no-stream-subtitle">
                    Trận đấu này hiện chưa có luồng phát trực tiếp hoặc bị lỗi.<br>
                    Vui lòng quay lại sau hoặc xem các trận đấu khác.
                </div>
            </div>
        </div>
    `);
    DV2_StreamChrome.getOverlayMount($wrapper).append($error);
    DV2_StreamChrome.bindEvents($wrapper);
    DV2_StreamChrome.syncVideoStageLayout($wrapper);
}

// Hiển thị overlay khi trận đấu chưa diễn ra
function createNotFoundMatchOverlay_VB2(match) {
    const kickoff = match?.matchInfo?.kickoff;
    const league = match?.league;
    const homeName = match?.teams?.home?.name || "Home";
    const awayName = match?.teams?.away?.name || "Away";
    const statusMatch = match?.matchInfo?.status;
    return $(`
            <div class="dv2-loading">
                <span class="dv2-loading-status">${statusMatchRender(statusMatch)}</span>
                Trận đấu: <strong>${homeName} - ${awayName}</strong>
                <div class="dv2-load-league">
                    <span>Giải đấu: <strong> <img src="${league.logo || ''}" alt="${league.name || '-'}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"> ${league.name || '-'}</strong></span>
                </div>
                <div class="dv2-load-time">
                    <span>${DV2StreamKickoff.renderTimeDisplay(kickoff)}</span>
                </div>
            </div>
        `);
}

// Format date theo dạng Hôm nay, 01/11
function getDateLabel_VB2(matchDate) {
    const match = new Date(matchDate);
    const day = String(match.getDate()).padStart(2, '0');
    const month = String(match.getMonth() + 1).padStart(2, '0');

    return `${day}/${month}/${match.getFullYear()}`;
}

// Format time theo dạng 00:00
function formatTime_VB2(datetime) {
    return DV2StreamKickoff.formatTime(datetime);
}

function statusMatchRender($status) {
    const MATCH_STATUS_VI = {
    // Trước trận
    "not started": "Sắp diễn ra",
    "to be determined": "Chưa xác định",
    // Hoãn / huỷ / sự cố
    "delay": "Trì hoãn",
    "interrupt": "Tạm dừng",
    "cut in half": "Bị cắt hiệp",
    "postponed": "Hoãn trận",
    "suspended": "Tạm hoãn",
    "abandoned": "Bỏ dở",
    "cancel": "Hủy trận",
    "abnormal(suggest hiding)": "Trạng thái bất thường",
    // Hiệp 1
    "first half": "Đang thi đấu",
    "firsthalf": "Đang thi đấu",
    "first-half": "Đang thi đấu",
    "fh": "Đang thi đấu",
    // Nghỉ giữa hiệp
    "half-time": "Nghỉ giữa hiệp",
    "half time": "Nghỉ giữa hiệp",
    "halftime": "Nghỉ giữa hiệp",
    "ht": "Nghỉ giữa hiệp",
    // Hiệp 2
    "second half": "Đang thi đấu",
    "secondhalf": "Đang thi đấu",
    "second-half": "Đang thi đấu",
    "sh": "Đang thi đấu",
    // Hiệp phụ
    "extra time": "Hiệp phụ",
    "extratime": "Hiệp phụ",
    "et": "Hiệp phụ",
    "overtime": "Hiệp phụ",
    "overtime(deprecated)": "Hiệp phụ",
    "ot": "Hiệp phụ",
    // Luân lưu
    "penalty": "Luân lưu",
    "penalties": "Luân lưu",
    "penalty shoot-out": "Luân lưu",
    "penalty shootout": "Luân lưu",
    // Kết thúc
    "finished": "Đã kết thúc",
    "ft": "Đã kết thúc",
    "end": "Đã kết thúc",
    "walkover": "Thắng xử thua"
    };

    const key = $status ? $status.toLowerCase() : "";

    return MATCH_STATUS_VI[key] || "Không xác định";
}
