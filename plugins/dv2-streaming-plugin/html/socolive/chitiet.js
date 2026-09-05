// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

const POSTER_URL_SCL =
  "https://sta.vnres.co/file/common/20250410/000bfdfc22afe0f322140fabd2228aec.jpg";

const appState = {
  hotLeaguesRank: new Map(),
};
let detailScorePoll_SCL = null;
let currentActiveLink_SCL = null;
let currentMatchData_SCL = null;
let currentHls_SCL = null;
let sclPlaybackGeneration = 0;
let sclManifestTimeout = null;
let sclNativeTimeout = null;
let sclRetryTimeout = null;

function startDetailScorePoll_SCL(match) {
    if (!match) return;
    if (!detailScorePoll_SCL) {
        detailScorePoll_SCL = DV2MatchScorePoll.create({
            container: ".dv2-layout-scl",
        });
    }
    detailScorePoll_SCL.sync(match);
    detailScorePoll_SCL.start();
}

const LIVE_STATUS = [
  // "interrupt",
  //"cut in half",
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  "half-time",
  "half time",
  "halftime",
  "ht",
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  "extra time",
  "extratime",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

// Define constants
const baseApiUrl = 'https://vsc-apidev.helizones.com'
const NHADAI_COMMENTATOR_ID = 99999999999999999;

// ========================================
// Bet buttons for detail page (stream links row)
// ========================================
function renderStreamBetButtons_SCL() {
    const $container = $(".dv2-layout-scl.dv2-streaming-ctn .dv2-stream-list .dv2-bet-links");
    if (!$container.length) return;

    const html = window.DV2_SOCOLIVE_STREAM_BET_BUTTONS_HTML;
    if (typeof html === "string" && html.trim()) {
        $container.html(html);
    }

    if (!$container.children().length) return;
    window.DV2_StreamChrome?.refreshReviveAds?.($container);
}

function isNhaDaiLivestreamLink(link) {
    if (!link) return false;
    if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
    const name = String(link.commentator || "").trim().toLowerCase();
    return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
    return DV2StreamLinks.sort(links);
}

function bindDetailStreamLinks_SCL(data) {
    return DV2StreamLinks.prepareSpanLinks({
        rawLinks: data?.livestream?.links,
        $container: $(".dv2-layout-scl.dv2-streaming-ctn .dv2-stream-links"),
        onSelect(link, index) {
            currentActiveLink_SCL = link;
            const $videoWrapper = getStreamVideoWrapper_SCL();
            const $videoContainer = $videoWrapper.find(".dv2-video-container");
            const $video = $videoContainer.find("#liveVideo");
            DV2StreamKickoff.applyPosterForLink($video, link, POSTER_URL_SCL);
            renderMatchBoxInfo(data, "#matchCard", index);

            if (currentMatchData_SCL) {
                initStreamOddsPanel_SCL($videoWrapper, currentMatchData_SCL);
            }

            const kickoffTime = new Date(data?.matchInfo?.kickoff);
            const shouldShowPreMatch =
                !Number.isNaN(kickoffTime.getTime()) &&
                kickoffTime.getTime() - Date.now() > 15 * 60 * 1000;

            if (shouldShowPreMatch || !link?.url) {
                const chrome = getStreamChrome_SCL();
                if (chrome && $videoWrapper.length) {
                    chrome.clearFullChrome($videoWrapper);
                }
                stopStreamPlayback_SCL($video);
                hideStreamLoading_SCL($videoContainer);
                return;
            }

            clearStreamLoading_SCL($videoContainer);
            initHLSPlayer_SCL(link.url);
        },
    });
}

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
  copy: true,
});

function getPreferredLivestreamLink(match) {
    const links = match?.livestream?.links;
    if (!Array.isArray(links) || !links.length) return null;
    return DV2StreamLinks.getPreferredLink(links);
}
// const posterUrl = window.POSTER_URL
// const defaultLeagueLogo = window.DEFAULT_LEAGUE_LOGO
// const livingIcon = window.LIVING_ICON
// const hotWhiteIcon = window.HOT_WHITE_ICON

function getStreamVideoWrapper_SCL() {
    return $(".dv2-layout-scl.dv2-streaming-ctn .dv2-video-wrapper").first();
}

function getStreamChrome_SCL() {
    return window.DV2_StreamChrome;
}

function initStreamPlayerUi_SCL($video) {
    const $wrapper = getStreamVideoWrapper_SCL();
    const chrome = getStreamChrome_SCL();
    if (!$wrapper.length || !chrome) return;
    chrome.initPlayerUi($wrapper, $video);
}

function initStreamOddsPanel_SCL($videoWrapper, matchData) {
    const chrome = getStreamChrome_SCL();
    if (!chrome || !$videoWrapper?.length || !matchData) return;
    chrome.rememberOddsMatchData?.($videoWrapper, matchData);
    chrome.initOddsPanel?.($videoWrapper, matchData);
}

function clearSclPlaybackTimers() {
    if (sclManifestTimeout) {
        clearTimeout(sclManifestTimeout);
        sclManifestTimeout = null;
    }
    if (sclNativeTimeout) {
        clearTimeout(sclNativeTimeout);
        sclNativeTimeout = null;
    }
    if (sclRetryTimeout) {
        clearTimeout(sclRetryTimeout);
        sclRetryTimeout = null;
    }
}

function showStreamLoading_SCL($videoContainer, message = "Đang tải video...") {
    if (!$videoContainer?.length) return $();
    hideStreamLoading_SCL($videoContainer);
    const safeMessage = String(message || "Đang tải video...")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const $overlay = $(`
        <div class="dv2-stream-loading-scl dv2-loading"
            style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:16px;background:rgba(0,0,0,0.6);padding:10px 20px;border-radius:6px;width:auto;">
            ${safeMessage}
        </div>
    `);
    $videoContainer.append($overlay);
    return $overlay;
}

function hideStreamLoading_SCL($videoContainer) {
    $videoContainer?.find(".dv2-stream-loading-scl").remove();
}

function clearStreamLoading_SCL($videoContainer) {
    hideStreamLoading_SCL($videoContainer);
}

function stopStreamPlayback_SCL($video) {
    sclPlaybackGeneration += 1;
    clearSclPlaybackTimers();
    if (currentHls_SCL) {
        try {
            currentHls_SCL.destroy();
        } catch (e) {
            console.warn(e);
        }
        currentHls_SCL = null;
    }
    if (!$video?.length) return;
    const el = $video[0];
    el.pause();
    el.removeAttribute("src");
    if (typeof el.load === "function") {
        el.load();
    }
}

function showStreamFallback_SCL($videoWrapper, $videoContainer, matchData) {
    const chrome = getStreamChrome_SCL();
    if (chrome && $videoWrapper.length) {
        chrome.clearFullChrome($videoWrapper);
    }
    hideStreamLoading_SCL($videoContainer);
    if (!matchData) return;
    $videoContainer.find(".dv2-match-overlay-scl").remove();
    const $overlay = createNotFoundMatchOverlay_SCL(matchData);
    $overlay.addClass("dv2-match-overlay-scl");
    $videoContainer.append($overlay);
    DV2StreamKickoff.startCountdown(matchData?.matchInfo?.kickoff);
}

function initHLSPlayer_SCL(streamUrl) {
    const $videoWrapper = getStreamVideoWrapper_SCL();
    const $videoContainer = $videoWrapper.find(".dv2-video-container");
    const $video = $videoContainer.find("#liveVideo");
    const fallbackMatchData = currentMatchData_SCL;

    sclPlaybackGeneration += 1;
    const playbackGen = sclPlaybackGeneration;
    const isStalePlayback = () => playbackGen !== sclPlaybackGeneration;

    clearSclPlaybackTimers();
    $videoContainer.find(".dv2-match-overlay-scl").remove();

    if (!streamUrl || !$video.length) {
        hideStreamLoading_SCL($videoContainer);
        if (fallbackMatchData) {
            showStreamFallback_SCL($videoWrapper, $videoContainer, fallbackMatchData);
        }
        return;
    }

    if (currentHls_SCL) {
        try {
            currentHls_SCL.destroy();
        } catch (e) {
            console.warn(e);
        }
        currentHls_SCL = null;
    }

    showStreamLoading_SCL($videoContainer, "Đang tải video...");

    let retryCount = 0;
    const maxRetries = 3;
    let hasFallback = false;

    const showFallback = () => {
        if (isStalePlayback() || hasFallback) return;
        hasFallback = true;
        clearSclPlaybackTimers();
        showStreamFallback_SCL($videoWrapper, $videoContainer, fallbackMatchData);
    };

    function setupPlayer() {
        if (isStalePlayback()) return;

        if (Hls.isSupported()) {
            sclManifestTimeout = setTimeout(() => {
                if (isStalePlayback()) return;
                console.warn("[VSC LIVE] Manifest load timeout");
                retry();
            }, 15000);

            const hls = new Hls({
                maxBufferLength: 10,
                liveSyncDuration: 3,
                enableWorker: true,
                xhrSetup: function (xhr) {
                    xhr.withCredentials = false;
                    xhr.referrerPolicy = "no-referrer-when-downgrade";
                },
            });
            currentHls_SCL = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia($video[0]);

            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                if (isStalePlayback()) return;
                clearSclPlaybackTimers();
                hideStreamLoading_SCL($videoContainer);
                $video[0].muted = true;
                $video[0].play().catch(() => console.warn("Autoplay bị chặn"));
                getStreamChrome_SCL()?.syncControlsState?.($videoWrapper, $video);
                onHlsStreamReady_SCL();
            });

            hls.on(Hls.Events.ERROR, function (event, data) {
                if (isStalePlayback()) return;
                if (!data.fatal) return;
                clearSclPlaybackTimers();
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        hls.recoverMediaError();
                        break;
                    default:
                        try {
                            hls.destroy();
                        } catch (e) {}
                        if (currentHls_SCL === hls) {
                            currentHls_SCL = null;
                        }
                        retry();
                        break;
                }
            });
        } else if ($video[0].canPlayType("application/vnd.apple.mpegurl")) {
            sclNativeTimeout = setTimeout(() => {
                if (isStalePlayback()) return;
                console.warn("[VSC LIVE] Native HLS load timeout");
                retry();
            }, 15000);

            $video.attr("src", streamUrl);
            $video.one("loadedmetadata", function () {
                if (isStalePlayback()) return;
                clearSclPlaybackTimers();
                hideStreamLoading_SCL($videoContainer);
                $video[0].muted = true;
                $video[0].play().catch(() => console.warn("Autoplay bị chặn"));
                getStreamChrome_SCL()?.syncControlsState?.($videoWrapper, $video);
                onHlsStreamReady_SCL();
            });
            $video.one("error", function () {
                if (isStalePlayback()) return;
                clearSclPlaybackTimers();
                retry();
            });
        } else {
            $videoContainer.html(`
                <div style="color:#fff;text-align:center;padding:100px;">
                    🚫 Trình duyệt không hỗ trợ phát livestream
                </div>
            `);
        }
    }

    function retry() {
        if (isStalePlayback()) return;
        if (retryCount < maxRetries) {
            retryCount += 1;
            console.warn(`[VSC LIVE] Retry lần ${retryCount}/${maxRetries}...`);
            showStreamLoading_SCL(
                $videoContainer,
                `Đang thử lại... (${retryCount}/${maxRetries})`
            );
            sclRetryTimeout = setTimeout(() => {
                if (isStalePlayback()) return;
                setupPlayer();
            }, 3000);
        } else {
            console.error("[VSC LIVE] Hết số lần retry, dừng phát.");
            showFallback();
        }
    }

    setupPlayer();
}

function onHlsStreamReady_SCL() {
    const chrome = getStreamChrome_SCL();
    const $wrapper = getStreamVideoWrapper_SCL();
    if (chrome && $wrapper.length) {
        if (currentMatchData_SCL) {
            chrome.rememberOddsMatchData?.($wrapper, currentMatchData_SCL);
        }
        chrome.onHlsReady($wrapper);
    }
}

$(document).ready(function () {
    if ($(".dv2-layout-scl.dv2-streaming-ctn .dv2-video-wrapper").length) {
        renderDetailMatch_SCL();
    }
    // if ($('.dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container').length) {
    //     renderSliderAppointmentsBlock();
    // }
    // if ($('.dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content').length) {
    //     renderHotLiveBlock();
    // }
});

// ========================================
// Hiển thị chi tiết trận đấu
// ========================================
function renderDetailMatch_SCL() {
    const $videoWrapper = getStreamVideoWrapper_SCL();
    const $videoContainer = $videoWrapper.find(".dv2-video-container");

    hideAppointmentBlock_SCL();

    DV2HotLeagues.load({
        url: `${baseApiUrl}/api/data/lives/competitions/hot`,
        ajax: $.ajax,
        setHotLeaguesRank: (rankMap) => {
            appState.hotLeaguesRank = rankMap;
        },
    }).always(() => {
        initHotLiveBlock_SCL();
    });

    // Lấy ID livestream từ URL
    const params = new URLSearchParams(window.location.search);
    let matchId = params.get("match");
    if (!matchId) {
        if (typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID) {
            matchId = DV2_MATCH_ID;
        } else {
            matchId = "2y8m4zh54p4zql0";
        }
    }
    if (!matchId) {
        $videoContainer.html('<div class="dv2-notfound-video">❌ Không có ID livestream hợp lệ</div>');
        return;
    }

    const marqueeBox = document.querySelector(
        '.dv2-layout-scl.dv2-streaming-ctn .dv2-living-room .dv2-video-inner .dv2-marquee-container .dv2-marquee-box'
    );

    marqueeBox.addEventListener('mouseenter', () => {
        marqueeBox.style.animationPlayState = 'paused';
    });

    marqueeBox.addEventListener('mouseleave', () => {
        marqueeBox.style.animationPlayState = 'running';
    });

    // Tạo thẻ video
    const $video = $("<video>", {
        id: "liveVideo",
        controls: false,
        autoplay: true,
        muted: true,
        playsinline: true,
        poster: DV2StreamKickoff.resolvePosterUrl(currentActiveLink_SCL, POSTER_URL_SCL),
    });
    $videoContainer.append($video);
    initStreamPlayerUi_SCL($video);
    showStreamLoading_SCL($videoContainer, "Đang tải video...");

    const loadMatchData = () => {
        $.ajax({
            url: `${baseApiUrl}/api/data/lives/${matchId}`,
            method: "GET",
            success: function (res) {

                const data = res?.data;
                if (!data || !data.livestream) {
                    $videoContainer.html('<div class="dv2-notfound-video-livestream">🚫 Không có luồng livestream</div>');
                    $videoContainer.append($video);
                    hideAppointmentBlock_SCL();
                    return;
                }

                startDetailScorePoll_SCL(data);
                currentMatchData_SCL = data;

                const linkState = bindDetailStreamLinks_SCL(data);
                currentActiveLink_SCL = linkState?.activeLink ?? null;

                renderStreamBetButtons_SCL();
                DV2StreamKickoff.applyPosterForLink(
                    $video,
                    currentActiveLink_SCL,
                    POSTER_URL_SCL
                );
                const activeIndex = linkState?.activeIndex ?? 0;
                if (linkState?.links?.length) {
                    renderMatchBoxInfo(data, "#matchCard", activeIndex);
                }

                const chrome = getStreamChrome_SCL();
                if (chrome && $videoWrapper.length) {
                    chrome.rememberOddsMatchData?.($videoWrapper, data);
                    chrome.initOddsPanel?.($videoWrapper, data);
                }

                const kickoffTime = new Date(data?.matchInfo?.kickoff);
                const shouldShowPreMatchOverlay =
                    !Number.isNaN(kickoffTime.getTime()) &&
                    (kickoffTime.getTime() - Date.now()) > 15 * 60 * 1000;

                if (shouldShowPreMatchOverlay) {
                    const showPreMatchOverlay = () => {
                        const chrome = getStreamChrome_SCL();
                        if (chrome && $videoWrapper.length) {
                            chrome.clearFullChrome($videoWrapper);
                        }
                        $videoContainer.empty();
                        const $overlay = createNotFoundMatchOverlay_SCL(data);
                        $videoContainer.append($overlay);
                        DV2StreamKickoff.startCountdown(data?.matchInfo?.kickoff);
                        const $video = $("<video>", {
                            id: "liveVideo",
                            controls: false,
                            autoplay: false,
                            muted: true,
                            playsinline: true,
                            poster: DV2StreamKickoff.resolvePosterUrl(currentActiveLink_SCL, POSTER_URL_SCL),
                        });
                        $videoContainer.append($video);
                        initStreamPlayerUi_SCL($video);
                        loadCommentatorAppointments_SCL(data);
                    };

                    if (window.DV2StreamTvc?.playBeforeStream) {
                        window.DV2StreamTvc.playBeforeStream($videoWrapper, showPreMatchOverlay);
                    } else {
                        showPreMatchOverlay();
                    }
                    return;
                }

                const streamUrl = linkState?.activeLink?.url || "";

                if (!streamUrl) {
                    $videoContainer.html('<div class="dv2-notfound">Không tìm thấy video livestream</div>');
                    loadCommentatorAppointments_SCL(data);
                    return;
                }

                const startStream = () => {
                    initHLSPlayer_SCL(streamUrl);
                    loadCommentatorAppointments_SCL(data);
                };

                if (window.DV2StreamTvc?.playBeforeStream) {
                    window.DV2StreamTvc.playBeforeStream($videoWrapper, startStream);
                } else {
                    startStream();
                }
            },
            error: function (err) {
                console.error("[VSC LIVE] Lỗi khi gọi API:", err);
                $videoContainer.html('<div class="dv2-notfound">Không thể tải dữ liệu livestream</div>');
            }
        });
    };

    loadMatchData();
}

// ========================================
// Lịch trình bình luận viên
// ========================================
function hideAppointmentBlock_SCL() {
    $(".dv2-layout-scl.dv2-appoinment-list-ctn").hide();
}

function loadCommentatorAppointments_SCL(matchData) {
    const sortedLinks = sortLivestreamLinksPreferRealBlv(
        matchData?.livestream?.links || [],
    );
    const commentatorId = sortedLinks[0]?.commentatorId;

    if (!commentatorId) {
        hideAppointmentBlock_SCL();
        return;
    }

    $.ajax({
        url: `${baseApiUrl}/api/data/lives/commentators/${commentatorId}`,
        method: "GET",
        success(res) {
            const rawMatches = res?.matches;
            if (!Array.isArray(rawMatches) || !rawMatches.length) {
                hideAppointmentBlock_SCL();
                return;
            }

            renderSliderAppointmentsBlock(sortedMatchesFunction(rawMatches));
        },
        error(err) {
            console.error("[VSC LIVE] Lỗi khi gọi API lịch BLV:", err);
            hideAppointmentBlock_SCL();
        },
    });
}

// ========================================
// Hiển thị slide lịch trình trận đấu
// ========================================
function renderSliderAppointmentsBlock(matches) {
    const $appointmentSection = $(".dv2-layout-scl.dv2-appoinment-list-ctn");
    const $scheduleContainer = $appointmentSection.find(
        ".dv2-appoinment-swiper-container",
    );
    const $wrapper = $scheduleContainer.find(".dv2-swiper-wrapper");

    $wrapper.empty();

    if (!Array.isArray(matches) || !matches.length) {
        hideAppointmentBlock_SCL();
        return;
    }

    function formatTime_SCL(datetime) {
        if (!datetime) return '';
        const date = new Date(datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    function getDateLabel_SCL(matchDate) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const match = new Date(matchDate);

        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        match.setHours(0, 0, 0, 0);

        if (match.getTime() === today.getTime()) {
            return 'Hôm nay';
        } else if (match.getTime() === tomorrow.getTime()) {
            return 'Ngày mai';
        } else {
            const day = String(match.getDate()).padStart(2, '0');
            const month = String(match.getMonth() + 1).padStart(2, '0');
            return `${day}/${month}`;
        }
    }
    // Render từng match slide
    matches.forEach(function (match, index) {
        // Extract match data
        const matchId = match?.match_id || match?.matchId|| match?.id || match?.slug || index;
        // League/Tournament info
        const leagueName = match?.league?.name || 'N/A';
        const leagueLogo = match?.league?.logo || 'https://sta.vnres.co/file/common/20210503/fca5954ec22137ad05325506d6645592';

        // Match time info
        const matchDateTime = match?.matchInfo?.kickoff ?? match?.kickoff ?? "";
        const dateLabel = getDateLabel_SCL(matchDateTime);
        const timeLabel = formatTime_SCL(matchDateTime);

        // Home team info
        const homeName = match?.teams?.home?.name || 'Home Team';
        const homeLogo = match?.teams?.home?.logo || 'Logo';

        // Away team info
        const awayName = match?.teams?.away?.name || 'Away Team';
        const awayLogo = match?.teams?.away?.logo || 'Logo';

        const slideHtml = `
			<div class="dv2-swiper-slide swiper-slide" style="cursor:pointer;" data-id="${matchId}" onclick="goToMatchDetail('${matchId}')">
				<div class="dv2-title">
					<div class="dv2-fl">
						<img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" src="${leagueLogo}" class="icon" draggable="false">
						<span>${leagueName}</span>
					</div>
					<div class="dv2-fr dv2-match-time">
						<span style="padding-right:5px;">${dateLabel}</span>
						${timeLabel}
					</div>
				</div>
				<div class="dv2-box" style="display: flex;">
					<div class="dv2-battle-team">
						<p>
							<img 
                                onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                                class="dv2-logo" 
								 src="${homeLogo}" 
								 data-src="${homeLogo}" 
								 draggable="false">
							<span class="dv2-ellipsis">${homeName}</span>
						</p>
						<p>
							<img 
                                onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                                class="dv2-logo" 
								 src="${awayLogo}" 
								 data-src="${awayLogo}" 
								 alt="" 
								 draggable="false">
							<span class="dv2-ellipsis">${awayName}</span>
						</p>
					</div>
                    <a href="${window.DV2_LINK_BET}" 
                        target="_blank" rel="nofollow"
						data-id="${matchId}" 
						data-slug="${match.slug || ''}"
						class="dv2-appoinment" 
                        onclick="event.stopPropagation();"
						draggable="false">
						<span class="no-appoinment">Đặt cược</span>
					</a>
				</div>
			</div>
		`;

        $wrapper.append(slideHtml);
    });

    $appointmentSection.show();
    $scheduleContainer.show();

    // Initialize Swiper
    initSwiperInstance('.dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container', '.dv2-appoinment-next', '.dv2-appoinment-prev');
}

// ========================================
// Hiển thị list Hot Live (live + upcoming, sort priority-competition-first)
// ========================================
function getHotLiveRenderOptions_SCL() {
    return {
        baseApiUrl,
        ajax: $.ajax,
        sortedMatchesFunction,
        liveStatuses: LIVE_STATUS,
        hotLeaguesRank: appState.hotLeaguesRank,
        getPreferredLivestreamLink,
    };
}

function renderHotLiveBlock(matches = []) {
    DV2SocoliveHotLive.render(matches, getHotLiveRenderOptions_SCL());
}

function initHotLiveBlock_SCL() {
    if (!$('.dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content').length) {
        return;
    }
    DV2SocoliveHotLive.init(getHotLiveRenderOptions_SCL());
}

// Hiển thị overlay khi trận đấu chưa diễn ra
function createNotFoundMatchOverlay_SCL(match) {
    const kickoff = match?.matchInfo?.kickoff;
    const league = match?.league?.name;
    const homeName = match?.teams?.home?.name || "Home";
    const awayName = match?.teams?.away?.name || "Away";
    const statusMatch = renderStatusMatch_SCL(kickoff);
    return $(`
            <div class="dv2-loading">
                Trận đấu ${statusMatch}: <strong>${homeName} - ${awayName}</strong>
                <div class="dv2-load-league">
                    <span>Giải đấu: <strong>${league}</strong></span>
                </div>
                <div class="dv2-load-time">
                    <span>${DV2StreamKickoff.renderTimeDisplay(kickoff)}</span>
                </div>
            </div>
        `);
}

// Hiển thị trạng thái trận đấu đã/đang/sẽ diễn ra
function renderStatusMatch_SCL(kickoff) {
    // hiển thị thông tin trận đã/đang/sẽ diễn ra
    const now = new Date();
    // Giới hạn khoảng thời gian trong hôm nay
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // kickoff có thể là string → ép về Date
    const kickoffDate = kickoff instanceof Date ? kickoff : new Date(kickoff);

    // Xác định trạng thái trận đấu
    let matchStatus = '';
    if (kickoffDate > now) {
        // Sắp diễn ra
        const diffMinutes = Math.round((kickoffDate - now) / 60000);
        if (diffMinutes <= 30) {
            matchStatus = 'sắp bắt đầu'; // trong vòng 30 phút
        } else {
            matchStatus = 'chưa diễn ra';
        }
    } else {
        // kickoff <= now → trận đã hoặc đang diễn ra
        const matchEnd = new Date(kickoffDate);
        matchEnd.setHours(matchEnd.getHours() + 2); // giả sử 1 trận ~2h

        if (now <= matchEnd) {
            matchStatus = 'đang diễn ra';
        } else {
            matchStatus = 'đã kết thúc';
        }
    }
    return matchStatus;
}

// Format time theo dạng 00:00
function formatTime_SCL(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Format date theo dạng Hôm nay, 01/11
function getDateLabel_SCL(matchDate) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const match = new Date(matchDate);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    match.setHours(0, 0, 0, 0);

    if (match.getTime() === today.getTime()) {
        return 'Hôm nay';
    } else if (match.getTime() === tomorrow.getTime()) {
        return 'Ngày mai';
    } else {
        const day = String(match.getDate()).padStart(2, '0');
        const month = String(match.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }
}

// Handle click redirect to detail page when click item hotlive
$(document).on('click', '.dv2-layout-scl .dv2-game', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const matchId = $btn.data('id') || '';
    // redirect to livestream page
    window.location.href = `/streams/${matchId}`;
});

// Khởi tạo Swiper slider
function initSwiperInstance(containerSelector, nextBtnSelector, prevBtnSelector) {
    if (!$(containerSelector).length) {
        return null;
    }

    swiper = new Swiper(containerSelector, {
        slidesPerView: 1.5,
        navigation: {
            nextEl: nextBtnSelector,
            prevEl: prevBtnSelector,
        },
        breakpoints: {
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
        },
        loop: false,
        watchSlidesProgress: true,
        roundLengths: true,
    });
}

// render box thông tin trận đấu dưới stream
function renderMatchBoxInfo(match, target = "#matchCard", indexLink = 0) {
    if (!match) return;
    const kickoff = match?.matchInfo?.kickoff;

    const sortedLinks = DV2StreamLinks.sortForDetail(
        match.livestream?.links || []
    );
    const commentator = sortedLinks[indexLink];

    const html = `
        <div class="dv2-match-header">
            <img class="dv2-league-logo" src="${match.league.logo}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
            <div class="dv2-league-name">${match.league.name}</div>
            <div class="dv2-status">${match.matchInfo.status}</div>
        </div>

        <div class="dv2-match-body">
            <div class="dv2-team">
                <img src="${match.teams.home.logo}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                <div>${match.teams.home.name}</div>
            </div>

            <div class="dv2-score">
                <div class="dv2-score-ft">
                    <span data-dv2-score-home>${match.score.fulltime.home}</span> - <span data-dv2-score-away>${match.score.fulltime.away}</span>
                </div>
                ${match.score?.pen && (match.score.pen.home != null || match.score.pen.away != null) ? `
                <div class="dv2-score-pen">
                    <div class="dv2-score-pen-value">
                        <span data-dv2-score-pen-home>${match.score.pen.home}</span> - <span data-dv2-score-pen-away>${match.score.pen.away}</span>
                    </div>
                    <div class="dv2-score-pen-label">(Penalty)</div>
                </div>
                ` : ""}
            </div>

            <div class="dv2-team" style="justify-content:flex-end">
                <div>${match.teams.away.name}</div>
                <img src="${match.teams.away.logo}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
            </div>
        </div>

        <div class="dv2-match-footer">
            ${DV2StreamKickoff.renderTimeDisplay(kickoff)}
        </div>
        ${commentator ? `
        <div class="dv2-commentator">
            <span class="dv2-commentator-name">Bình Luận Viên: </span>
            <img class="dv2-commentator-avatar" src="${commentator.avatar}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
            <span class="dv2-commentator-name">${commentator.commentator}</span>
        </div>
        ` : ""}
    `;

    $(target).html(html);
    DV2StreamKickoff.startCountdown(kickoff);
}
