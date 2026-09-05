// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

const POSTER_URL_SCL =
  "https://sta.vnres.co/file/common/20250410/000bfdfc22afe0f322140fabd2228aec.jpg";

const appState = {
  hotLeaguesRank: new Map(),
};

const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  // "interrupt",
  // "cut in half",
  // Hiệp 1
  "first half",
  "firsthalf",
  "first-half",
  "fh",
  // Nghỉ giữa hiệp
  "half-time",
  "half time",
  "halftime",
  "ht",
  // Hiệp 2
  "second half",
  "secondhalf",
  "second-half",
  "sh",
  // Hiệp phụ
  "extra time",
  "extratime",
  "extra time",
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
];

// Define constants
const baseApiUrl = 'https://vsc-apidev.helizones.com'
const NHADAI_COMMENTATOR_ID = 99999999999999999;

/** BLV mặc định hệ thống — ưu tiên thấp khi có BLV thật */
function isNhaDaiLivestreamLink(link) {
    if (!link) return false;
    if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
    const name = String(link.commentator || "").trim().toLowerCase();
    return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

/** Đưa link Nhà Đài xuống cuối; trả về cùng mảng (sort in-place) */
function sortLivestreamLinksPreferRealBlv(links) {
    if (!Array.isArray(links)) return [];
    const activeLinks = links.filter((link) => link?.isStreaming !== false);
    activeLinks.sort((a, b) => {
        const aIsNhaDai = isNhaDaiLivestreamLink(a);
        const bIsNhaDai = isNhaDaiLivestreamLink(b);
        if (aIsNhaDai && !bIsNhaDai) return 1;
        if (!aIsNhaDai && bIsNhaDai) return -1;
        return 0;
    });
    return activeLinks;
}

/** Link stream/BLV ưu tiên: BLV thật trước, Nhà Đài chỉ khi không còn lựa chọn */
function getPreferredLivestreamLink(match) {
    const links = match?.livestream?.links;
    if (!Array.isArray(links) || !links.length) return null;
    return DV2StreamLinks.getPreferredLink(links);
}

function getStreamVideoWrapperHome_SCL() {
    return $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-wrapper").first();
}

function getStreamChromeHome_SCL() {
    return window.DV2_StreamChrome;
}

function initStreamPlayerUiHome_SCL($video) {
    const $wrapper = getStreamVideoWrapperHome_SCL();
    const chrome = getStreamChromeHome_SCL();
    if (!$wrapper.length || !chrome) return;
    chrome.initPlayerUi($wrapper, $video);
}

function onHlsStreamReadyHome_SCL() {
    const chrome = getStreamChromeHome_SCL();
    const $wrapper = getStreamVideoWrapperHome_SCL();
    if (chrome && $wrapper.length) {
        chrome.onHlsReady($wrapper);
    }
}

function clearStreamChromeHome_SCL() {
    const chrome = getStreamChromeHome_SCL();
    const $wrapper = getStreamVideoWrapperHome_SCL();
    if (chrome && $wrapper.length) {
        chrome.clearFullChrome($wrapper);
    }
}
// const posterUrl = window.POSTER_URL
// const defaultLeagueLogo = window.DEFAULT_LEAGUE_LOGO
// const livingIcon = window.LIVING_ICON
// const hotWhiteIcon = window.HOT_WHITE_ICON

// Gọi các hàm khi DOM load xong
$(document).ready(function () {
    if ($(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-wrapper").length) {
        renderFeaturedStreamBlock_SCL();
    }
    if ($('.dv2-layout-scl.dv2-blv-list-ctn .dv2-anchor-swiper-container').length) {
        renderSlideBlvBlock_SCL();
    }
    if ($('.dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content').length) {
        initHotLiveBlock_SCL();
    }
});
const PRIORITY_COMPETITION_SOON_MINUTES_SCL = 10;

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-when-live-or-soon",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
  priorityCompetitionSoonMinutes: PRIORITY_COMPETITION_SOON_MINUTES_SCL,
  copy: true,
});

const hotLiveSortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
  copy: true,
});

function isMatchLive_SCL(match) {
  return LIVE_STATUS.includes(String(match?.status ?? "").toLowerCase());
}

function isPriorityCompetitionStartingSoon_SCL(match) {
  return DV2MatchSort.isPriorityCompetitionStartingSoon(
    match,
    LIVE_STATUS,
    PRIORITY_COMPETITION_SOON_MINUTES_SCL
  );
}

function buildFeaturedStreamMatches_SCL(sortedMatches, now, todayStart, todayEnd, tomorrowStart, tomorrowEnd) {
  const liveMatch = sortedMatches.filter(isMatchLive_SCL);
  const upcomingMatch = sortedMatches.filter((match) => {
    const kickoff = new Date(match?.kickoff);
    return (
      kickoff > now &&
      (
        (kickoff >= todayStart && kickoff <= todayEnd) ||
        (kickoff >= tomorrowStart && kickoff <= tomorrowEnd)
      )
    );
  });
  const priorityCompetitionSoonMatch = sortedMatches.find(isPriorityCompetitionStartingSoon_SCL) || null;

  const seen = new Set();
  const streamMatches = [];
  const pushMatch = (match) => {
    const id = match?.match_id ?? match?.id;
    if (!match || (id && seen.has(id))) return;
    if (id) seen.add(id);
    streamMatches.push(match);
  };

  if (priorityCompetitionSoonMatch) pushMatch(priorityCompetitionSoonMatch);
  liveMatch.forEach(pushMatch);
  upcomingMatch.forEach(pushMatch);

  return { streamMatches, liveMatch, upcomingMatch, priorityCompetitionSoonMatch };
}
// ========================================
// Hiển thị video livestream trận đấu
// ========================================
function renderFeaturedStreamBlock_SCL() {
    const $videoInner = $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-inner");
    const $roomList = $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-room-list");
    const $videoWrapper = getStreamVideoWrapperHome_SCL();
    const $videoContainer = $videoWrapper.find(".dv2-video-container");
    const $dv2StreamLinks  = $(".dv2-stream-links");

    const $playOverlay = $(`
        <div id="dv2-play-overlay">
            <div class="dv2-play-icon"></div>
        </div>
    `);

    // Payload hôm nay -> ngày mai
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const payload = {
        fromDate: today.toISOString().split("T")[0],
        toDate: tomorrow.toISOString().split("T")[0]
    };

    const $videoNotFound = $("<video>", {
        id: "liveVideo",
        controls: false,
        autoplay: false,
        muted: true,
        playsinline: true,
        poster: POSTER_URL_SCL,
    });

    const $loading = $(`
        <div class="dv2-loading"
      style="position:absolute;top:50%;left:50%;
             transform:translate(-50%,-50%);
             color:#fff;font-size:16px;
             background:rgba(0,0,0,0.6);
             padding:10px 20px;border-radius:6px;width: auto;">
      Đang tải video...
    </div>
    `);

    const $notMatch = $(`
        <div class="dv2-loading-nomatch">
            <div class="no-match-text">Hiện không có trận nào đang diễn ra 🔥</div>
            <div class="subtitle">Vui lòng quay lại sau...</div>
        </div>
    `);

    const marqueeBox = document.querySelector(
        '.dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-living-room .dv2-video-inner .dv2-marquee-container .dv2-marquee-box'
    );

    marqueeBox.addEventListener('mouseenter', () => {
        marqueeBox.style.animationPlayState = 'paused';
    });

    marqueeBox.addEventListener('mouseleave', () => {
        marqueeBox.style.animationPlayState = 'running';
    });

    function createNotFoundMatchOverlay_SCL(match) {
        const kickoff = match?.kickoff;
        const league = match?.league?.name;
        const homeName = match?.teams?.home?.name || "Home";
        const awayName = match?.teams?.away?.name || "Away";

        const matchStatus = renderStatusMatch_SCL(kickoff);
        return $(`
            <div class="dv2-loading">
                Trận đấu ${matchStatus}: <strong>${homeName} - ${awayName}</strong>
                <div class="dv2-load-league">
                    <span>Giải đấu: <strong>${league}</strong></span>
                </div>
                <div class="dv2-load-time">
                    <span>${DV2StreamKickoff.renderTimeDisplay(kickoff)}</span>
                </div>
            </div>
        `);
    }

    let currentHls = null;
    let currentVideo = null;
    let currentMatchIndex = null;
    let currentLinkIndex = null;

    function clearVideoContainerMedia_SCL() {
        $videoContainer.children().not(".dv2-stream-controls, .dv2-stream-chrome").remove();
    }

    function beginHlsPlayback_SCL(match, index, index_links, streamUrl, links) {
        const dv2StreamLinksHtml = Array.isArray(links)
            ? links.map((item, indexS) => {
                const blvName =
                    String(item?.commentator || "").trim() ||
                    `Link ${indexS + 1}`;
                return `<span data-index="${index}" data-index-links="${indexS}">${blvName}</span>`;
            })
            : null;

        let retryCount = 0;
        const maxRetries = 3;

        function initHLSPlayer() {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    maxBufferLength: 10,
                    liveSyncDuration: 3,
                    enableWorker: true,
                    xhrSetup: function (xhr, url) {
                        xhr.withCredentials = false;
                        xhr.referrerPolicy = "no-referrer-when-downgrade";
                    },
                });

                currentHls = hls;

                hls.loadSource(streamUrl);
                hls.attachMedia(currentVideo);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    $loading.remove();
                    currentVideo.muted = true;
                    currentVideo.play().catch(() => { });
                    getStreamChromeHome_SCL()?.syncControlsState?.(
                        getStreamVideoWrapperHome_SCL(),
                        $(currentVideo)
                    );
                    onHlsStreamReadyHome_SCL();
                });

                hls.on(Hls.Events.ERROR, function (event, data) {
                    if (data.fatal) {
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
                        else handleRetry();
                    }
                });
                if (dv2StreamLinksHtml) {
                    $dv2StreamLinks.html(dv2StreamLinksHtml);
                }
                $dv2StreamLinks.find(`span[data-index-links="${index_links}"]`).addClass("active");
            } else if (currentVideo.canPlayType("application/vnd.apple.mpegurl")) {
                currentVideo.src = streamUrl;
                currentVideo.addEventListener("loadedmetadata", () => {
                    $loading.remove();
                    currentVideo.muted = true;
                    currentVideo.play().catch(() => { });
                    getStreamChromeHome_SCL()?.syncControlsState?.(
                        getStreamVideoWrapperHome_SCL(),
                        $(currentVideo)
                    );
                    onHlsStreamReadyHome_SCL();
                });
                currentVideo.addEventListener("error", handleRetry);
                if (dv2StreamLinksHtml) {
                    $dv2StreamLinks.html(dv2StreamLinksHtml);
                }
                $dv2StreamLinks.find(`span[data-index-links="${index_links}"]`).addClass("active");
            } else {
                clearVideoContainerMedia_SCL();
                $videoContainer.append(`
                    <div style="color:#fff;text-align:center;padding:100px;">
                        🚫 Trình duyệt không hỗ trợ phát livestream này
                    </div>
                `);
            }
        }

        function handleRetry() {
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(initHLSPlayer, 3000);
            } else {
                $loading.text("Không thể tải video, vui lòng thử lại sau.");
            }
        }

        initHLSPlayer();
    }

    // Load video
    function loadVideo(match, index, index_links = 0) {
        const links = sortLivestreamLinksPreferRealBlv(
            match?.livestream?.links || []
        );
        const activeLink = links?.[index_links] ?? null;
        const streamUrl =
            activeLink?.url ||
            match?.videoUrl ||
            match?.url ||
            "";

        const isLinkOnlySwitch =
            currentVideo &&
            currentMatchIndex === index &&
            currentLinkIndex !== index_links &&
            !!streamUrl;

        if (isLinkOnlySwitch) {
            currentLinkIndex = index_links;
            DV2StreamKickoff.applyPosterForVideo(currentVideo, activeLink, POSTER_URL_SCL);
            if (currentHls) {
                try { currentHls.destroy(); } catch (e) { }
                currentHls = null;
            }
            $dv2StreamLinks.find("span").removeClass("active");
            $videoContainer.find(".dv2-loading").remove();
            $videoContainer.append($loading);
            beginHlsPlayback_SCL(match, index, index_links, streamUrl, links);
            return;
        }

        currentMatchIndex = index;
        currentLinkIndex = index_links;

        if (currentHls) {
            try { currentHls.destroy(); } catch (e) { }
            currentHls = null;
        }

        if (currentVideo) {
            try {
                currentVideo.pause();
                currentVideo.src = "";
                currentVideo.load();
            } catch (e) { }
            currentVideo = null;
        }

        clearStreamChromeHome_SCL();
        clearVideoContainerMedia_SCL();

        $roomList.find("a").removeClass("dv2-active");
        $roomList.find("li").eq(index).find("a").addClass("dv2-active");

        if (match && !match?.livestream?.available) {
            const $overlay = createNotFoundMatchOverlay_SCL(match);
            $videoContainer.append($overlay);
            DV2StreamKickoff.startCountdown(match?.kickoff);
            const $clonedVideo = $videoNotFound.clone();
            DV2StreamKickoff.applyPosterForVideo(
                $clonedVideo[0],
                activeLink,
                POSTER_URL_SCL
            );
            $videoContainer.append($clonedVideo);
            initStreamPlayerUiHome_SCL($videoContainer.find("video").first());
            return;
        }

        $videoContainer.append($loading);

        const $video = $("<video>", {
            id: "liveVideo",
            controls: false,
            autoplay: true,
            muted: true,
            playsinline: true,
            poster: DV2StreamKickoff.resolvePosterUrl(activeLink, POSTER_URL_SCL),
        });

        $videoContainer.append($video);
        currentVideo = $video[0];
        initStreamPlayerUiHome_SCL($video);

        $dv2StreamLinks.find("span").removeClass("active");
        if (!streamUrl) {
            clearStreamChromeHome_SCL();
            $roomList.html('<span class="dv2-list-empty">Không có trận đấu nào</span>');
            clearVideoContainerMedia_SCL();
            $videoContainer.append('<div class="dv2-loading">Không có trận đấu nào</div>');
            $videoContainer.append($video);
            initStreamPlayerUiHome_SCL($video);
            return;
        }

        beginHlsPlayback_SCL(match, index, index_links, streamUrl, links);
    }
    // Fetch API
    DV2HotLeagues.load({
        url: `${baseApiUrl}/api/data/lives/competitions/hot`,
        ajax: $.ajax,
        setHotLeaguesRank: (rankMap) => {
            appState.hotLeaguesRank = rankMap;
        },
    });
    $.ajax({
        url: `${baseApiUrl}/api/data/lives/range-date`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
        dataType: "json",

        success: function (res) {
            if (!res || res.status !== "success" || !res.matches_by_date) {
                $roomList.html('<li>Không có dữ liệu hợp lệ</li>');
                return;
            }

            const matches = [];
            Object.keys(res.matches_by_date).forEach(date => {
                matches.push(...res.matches_by_date[date]);
            });

            if (!matches.length) {
                $roomList.html('<span>Không có trận đấu nào</span>');
                return;
            }

            // --- LỌC LIVE + UPCOMING (hôm nay + ngày mai) ---
            const now = new Date();

            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);

            const todayEnd = new Date(now);
            todayEnd.setHours(23, 59, 59, 999);

            const tomorrowStart = new Date(todayStart);
            tomorrowStart.setDate(todayStart.getDate() + 1);

            const tomorrowEnd = new Date(todayEnd);
            tomorrowEnd.setDate(todayEnd.getDate() + 1);

            const sortedMatches = sortedMatchesFunction(matches);
            const {
                streamMatches,
                liveMatch,
                upcomingMatch,
                priorityCompetitionSoonMatch,
            } = buildFeaturedStreamMatches_SCL(
                sortedMatches,
                now,
                todayStart,
                todayEnd,
                tomorrowStart,
                tomorrowEnd
            );

            // Không có live và không có sắp đá
            if (!liveMatch.length && !upcomingMatch.length) {
                clearStreamChromeHome_SCL();
                $videoInner.append($notMatch);
                $videoContainer.append($videoNotFound.clone());
                initStreamPlayerUiHome_SCL($videoContainer.find("video").first());
                $('.dv2-layout-scl.dv2-appoinment-list-ctn').hide();
                return;
            }

            // Có live và không có sắp đá
            if (liveMatch.length && !upcomingMatch.length) {
                $('.dv2-layout-scl.dv2-appoinment-list-ctn').hide();
            }

            // --- Không có live / WC sắp đá → hiển thị sắp đá ---
            if (!liveMatch.length && !priorityCompetitionSoonMatch && upcomingMatch.length > 0) {
                clearStreamChromeHome_SCL();
                const $overlay = createNotFoundMatchOverlay_SCL(upcomingMatch[0]);
                $videoContainer.append($overlay);
                $videoContainer.append($videoNotFound.clone());
                initStreamPlayerUiHome_SCL($videoContainer.find("video").first());

                renderListLiveMatch_SCL(upcomingMatch);

                $roomList.on("click", "li.dv2-item-match", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = $(this).data("index");
                    loadVideo(upcomingMatch[index], index);
                });
            }

            // --- Có live hoặc WC sắp đá (<=10 phút) → ưu tiên khung phát ---
            if (liveMatch.length > 0 || priorityCompetitionSoonMatch) {
                renderListLiveMatch_SCL(streamMatches);

                $roomList.on("click", "li.dv2-item-match", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = $(this).data("index");
                    loadVideo(streamMatches[index], index);
                });

                $dv2StreamLinks.on("click", "span", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = $(this).data("index");
                    const index_links = $(this).data("index-links");
                    const match = streamMatches[index];
                    const links = sortLivestreamLinksPreferRealBlv(match?.livestream?.links || []);
                    const link = links[index_links];
                    if (DV2StreamLinks.navigateForLink(link)) {
                        return;
                    }
                    loadVideo(match, index, index_links);
                });

                $videoWrapper.append($playOverlay);
                $playOverlay.on("click", function () {
                    $(this).remove();
                    loadVideo(streamMatches[0], 0);
                });
            }

            // Slider lịch đấu hôm nay + ngày mai
            renderSliderAppointmentsBlock_SCL(upcomingMatch);

            // Hotlive: live + upcoming, WC luôn ưu tiên đầu danh sách
            renderHotLiveBlock_SCL(
                DV2SocoliveHotLive.prepareMatches(matches, hotLiveSortedMatchesFunction),
            );
        },

        error: function () {
            clearStreamChromeHome_SCL();
            $roomList.html('<li class="dv2-list-empty">Danh sách phát trống</li>');
            $videoContainer.append($loading);
            $videoContainer.append($videoNotFound.clone());
            initStreamPlayerUiHome_SCL($videoContainer.find("video").first());
            $('.dv2-layout-scl.dv2-appoinment-list-ctn').hide();
        }
    });
}


// ========================================
// Hiển thị slide lịch trình trận đấu
// ========================================
function renderSliderAppointmentsBlock_SCL(matches) {
    const $scheduleContainer = $('.dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container');
    const $wrapper = $scheduleContainer.find('.dv2-swiper-wrapper');

    // Xóa nội dung cũ
    $wrapper.empty();
   
    // Render từng match slide
    matches.forEach(function (match, index) {
        const matchId = match?.match_id || match?.id || match?.slug || index;

        const leagueName = match?.league?.name || 'N/A';
        const leagueLogo = match?.league?.logo || 'https://sta.vnres.co/file/common/20210503/fca5954ec22137ad05325506d6645592';

        const matchDateTime = match?.kickoff || '';
        const dateLabel = getDateLabel_SCL(matchDateTime);
        const timeLabel = formatTime_SCL(matchDateTime);

        const homeName = match?.teams?.home?.name || 'Home Team';
        const homeLogo = match?.teams?.home?.logo || 'Logo';

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

    // Show container
    $scheduleContainer.show();

    // Initialize Swiper
    initSwiperInstance('.dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container', '.dv2-appoinment-next', '.dv2-appoinment-prev');
}

// ========================================
// Hiển thị slide bình luận viên
// ========================================
function renderSlideBlvBlock_SCL() {
    const $scheduleContainer = $('.dv2-layout-scl.dv2-blv-list-ctn .dv2-anchor-swiper-container');
    const $wrapper = $scheduleContainer.find('.dv2-swiper-wrapper');

    // Xóa nội dung cũ
    $wrapper.empty();

    // Skeleton loading
    $wrapper.html(`
        <div class="dv2-loading-blv" 
            style="color:#000;text-align:center;padding:40px 0;">
            Đang tải danh sách bình luận viên...
        </div>
    `);

    // Gọi API danh sách BLV (bạn thay URL thật vào đây)
    $.ajax({
        url: `${baseApiUrl}/api/admin/streams/commentators`,
        method: "GET",
        dataType: "json",
        success: function (res) {
            // Giả định API trả về: { status: "success", data: [ ... ] }
            if (!res || res.message !== "success" || !Array.isArray(res.commentators)) {
                $wrapper.html(`<div style="color:#fff;text-align:center;padding:40px 0;">
                    Không có dữ liệu bình luận viên
                </div>`);
                return;
            }

            const commentators = res?.commentators;
            if (commentators.length === 0) {
                $wrapper.html(`<div style="color:#fff;text-align:center;padding:40px 0;">
                    Không có bình luận viên nào
                </div>`);
                return;
            }

            // Xóa loading
            $wrapper.empty();

            // Render danh sách BLV
            commentators.forEach((blv) => {
                const name = blv?.name || "Bình luận viên";
                const avatar = blv?.avatar || "https://sta.vnres.co/file/common/20250410/000bfdfc22afe0f322140fabd2228aec.jpg";

                const $slide = $(`
                    <div class="dv2-swiper-slide swiper-slide dv2-person-blv" data-id=${blv?.id}>
                        <a href="javascript:void(0)">
                            <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" class="dv2-blv-avatar" src="${avatar}" alt="${name}">
                            <p class="dv2-blv-name ellipsis">${name}</p>
                        </a>
                    </div>
                `);
                $wrapper.append($slide);
            });
            initSwiperInstanceCom('.dv2-layout-scl.dv2-blv-list-ctn .dv2-anchor-swiper-container', '.dv2-anchor-next', '.dv2-anchor-prev');
        },
        error: function (err) {
            $wrapper.html(`
                <div style="color:#fff;text-align:center;padding:40px 0;">
                    Lỗi khi tải danh sách bình luận viên
                </div>
            `);
        }
    });
}

// ========================================
// Hiển thị list Hot Live (WC luôn ưu tiên đầu, kể cả chưa live)
// ========================================
function getHotLiveRenderOptions_SCL() {
    return {
        baseApiUrl,
        ajax: $.ajax,
        sortedMatchesFunction: hotLiveSortedMatchesFunction,
        liveStatuses: LIVE_STATUS,
        hotLeaguesRank: appState.hotLeaguesRank,
        getPreferredLivestreamLink,
    };
}

function renderHotLiveBlock_SCL(matches = []) {
    DV2SocoliveHotLive.render(matches, getHotLiveRenderOptions_SCL());
}

function initHotLiveBlock_SCL() {
    if (!$('.dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content').length) {
        return;
    }

    const start = () => DV2SocoliveHotLive.init(getHotLiveRenderOptions_SCL());
    const hotLeaguesRequest = DV2HotLeagues.load({
        url: `${baseApiUrl}/api/data/lives/competitions/hot`,
        ajax: $.ajax,
        setHotLeaguesRank: (rankMap) => {
            appState.hotLeaguesRank = rankMap;
        },
    });

    if (hotLeaguesRequest && typeof hotLeaguesRequest.always === "function") {
        hotLeaguesRequest.always(start);
        return;
    }

    start();
}

// ========================================
// Hiển thị list not Live (5 item)
// ========================================
function renderListLiveMatch_SCL(liveMatch) {
    const $roomList = $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-room-list");
    const limit = 10;
    const slicedMatches = liveMatch?.slice(0, limit).map(match => {
        const title = (match?.title || match?.slug || "Trận đấu").replace(/vuasanco/gi, "").trim();
        const slug = match?.slug || title.toLowerCase().replace(/\s+/g, "-");
        const url = window.location.origin + "/detail/?match=" + match.match_id;
        const homeLogo = match?.teams?.home?.logo || "";
        const awayLogo = match?.teams?.away?.logo || "";
        const homeName = match?.teams?.home?.name || "Đội nhà";
        const awayName = match?.teams?.away?.name || "Đội khách";
        const videoUrl = getPreferredLivestreamLink(match)?.url || "#";

        return {
            id: match?.match_id || slug,
            title,
            slug,
            url,
            videoUrl,
            homeLogo: homeLogo,
            awayLogo: awayLogo,
            homeName,
            awayName,
            rawMatch: match
        };
    });

    // --- Render danh sách UI ---
    $roomList.empty();

    slicedMatches.forEach((match, index) => {
        const $li = $(`
                        <li class="dv2-item-match" data-id="${match.id}" data-index="${index}">
                            <a href="javascript:void(0)" class="${index === 0 ? "dv2-active" : ""}">
                                <div class="dv2-match-card">
                                    <div class="dv2-team dv2-team-home">
                                        <img class="dv2-team-logo" src="${match.homeLogo}" alt="${match.homeName}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                                        <span class="dv2-team-name">${match.homeName}</span>
                                    </div>
                                    <div class="vs">VS</div>
                                    <div class="dv2-team dv2-team-away">
                                        <img class="dv2-team-logo" src="${match.awayLogo}" alt="${match.awayName}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                                        <span class="dv2-team-name">${match.awayName}</span>
                                    </div>
                                </div>
                            </a>
                        </li>
                    `);
        $roomList.append($li);
    });
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

// Lấy các trận gần nhất sắp diễn ra
function getListMatchsNextTime_SCL(matchs) {
    // --- Lọc các trận đấu hôm nay và chưa diễn ra ---
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todaysNotMatches = matchs
        .filter(match => {
            const kickoff = new Date(match?.kickoff);
            // chỉ trận diễn ra hôm nay và chưa diễn ra
            return kickoff >= now && kickoff >= todayStart && kickoff <= todayEnd;
        })
        // Sắp xếp theo thời gian từ gần nhất
        .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    return todaysNotMatches;
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
        loop: true,
        watchSlidesProgress: true,
        roundLengths: true,
        autoplay: {
            delay: 3000,   
            disableOnInteraction: false,
        },
    });
}
function initSwiperInstanceCom(containerSelector, nextBtnSelector, prevBtnSelector) {
    if (!$(containerSelector).length) {
        return null;
    }

    swiper = new Swiper(containerSelector, {
        slidesPerView: 8,
        navigation: {
            nextEl: nextBtnSelector,
            prevEl: prevBtnSelector,
        },
        breakpoints: {
            640: { slidesPerView: 3 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 5 },
            1280: { slidesPerView: 8 },
        },
        loop: false,
        watchSlidesProgress: true,
        roundLengths: true,
        autoplay: {
            delay: 3000,   
            disableOnInteraction: false,
        },
    });
}

// Handle click redirect to detail page when click item hotlive
$(document).on('click', '.dv2-layout-scl.dv2-hotlive-ctn .dv2-game', function (e) {
    if ($(e.target).closest('.dv2-blv-dropdown').length) {
        return;
    }
    const $btn = $(this);
    const href = $btn.attr('href');
    if (href && href !== '#') {
        return;
    }
    e.preventDefault();
    const matchId = $btn.data('id') || '';
    window.location.href = `/streams/${matchId}`;
});

// Handle click redirect to detail page when click blv
// $(document).on('click', '.dv2-layout-scl.dv2-blv-list-ctn .dv2-person-blv', function (e) {
//     e.preventDefault();
//     const $btn = $(this);
//     const blvId = $btn.data('id') || '';
//     // redirect to livestream page
//     window.location.href = `/streams/${blvId}`;
// });

// =============================
// XỬ LÝ TẠM DỪNG / TIẾP TỤC KHI CHUYỂN TAB
// =============================
document.addEventListener("visibilitychange", function () {
    // Nếu không có video/hls thì bỏ qua
    const hasVideo = typeof currentVideo !== "undefined" && currentVideo instanceof HTMLVideoElement;
    const hasHls = typeof currentHls !== "undefined" && currentHls && typeof currentHls.stopLoad === "function";

    if (!hasVideo && !hasHls) return; // Không có gì để xử lý

    if (document.hidden) {
        // Khi người dùng chuyển tab khác
        if (hasVideo && !currentVideo.paused) {
            try {
                currentVideo.pause();
            } catch (err) {
                console.warn("[VSC LIVE] Error pausing video:", err);
            }
        }

        if (hasHls) {
            try {
                currentHls.stopLoad();
            } catch (err) {
                console.warn("[VSC LIVE] Error stopping HLS:", err);
            }
        }
    } else {
        // Khi user quay lại tab
        if (hasVideo && currentVideo.paused) {
            try {
                currentVideo.play()
                    .then(() => console.log("[VSC LIVE] Tab visible — video resumed"))
                    .catch(() => console.warn("[VSC LIVE] Autoplay blocked after tab switch"));
            } catch (err) {
                console.warn("[VSC LIVE] Error resuming video:", err);
            }
        }

        if (hasHls) {
            try {
                currentHls.startLoad();
            } catch (err) {
                console.warn("[VSC LIVE] Error resuming HLS:", err);
            }
        }
    }
});

// =============================
// DỌN DẸP KHI RỜI TRANG
// =============================
window.addEventListener("beforeunload", function () {
    const hasVideo = typeof currentVideo !== "undefined" && currentVideo instanceof HTMLVideoElement;
    const hasHls = typeof currentHls !== "undefined" && currentHls && typeof currentHls.destroy === "function";

    if (hasHls) {
        try {
            currentHls.destroy();
        } catch (err) {
            console.warn("[VSC LIVE] Error destroying HLS:", err);
        }
        currentHls = null;
    }

    if (hasVideo) {
        try {
            currentVideo.pause();
            currentVideo.removeAttribute("src");
            currentVideo.load();
        } catch (err) {
            console.warn("[VSC LIVE] Error cleaning video:", err);
        }
        currentVideo = null;
    }
});

// =================================================
// Navigation
// =================================================
function goToMatchDetail(matchId) {
    window.location.href = `/streams/${matchId}`;
}
