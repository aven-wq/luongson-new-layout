$ = jQuery.noConflict();
const POSTER_URL_TC =
  "https://img.freepik.com/premium-photo/close-up-soccer-player-who-kicks-ball_207634-4089.jpg";
const TC_STREAM_LOADING_PLAYING_MS = 12000;

// =================================================
// Init
// =================================================
$(document).ready(function () {
  if ($(".dv2-layout-tc.dv2-detail-stream-ctn").length > 0) {
    const video = document.getElementById("liveVideo");
    if (video) {
      initStreamPlayerUi_TC(video);
      initThapcamMobilePlaybackFix_TC();
    }
    const matchId = getMatchIdFromUrl_TC();
    loadMatchData_TC(matchId);
  }
});

let currentHls_TC = null;
let matchData_TC = null;
let currentActiveLink_TC = null;
let detailScorePoll_TC = null;
let tcPlaybackGeneration = 0;
let tcManifestTimeout = null;
let tcNativeTimeout = null;

function startDetailScorePoll_TC(match) {
  if (!match) return;
  if (!detailScorePoll_TC) {
    detailScorePoll_TC = DV2MatchScorePoll.create({
      container: ".dv2-layout-tc.dv2-detail-stream-ctn",
    });
  }
  detailScorePoll_TC.sync(match);
  detailScorePoll_TC.start();
}

function getStreamChrome_TC() {
  return window.DV2_StreamChrome;
}

function getStreamVideoWrapper_TC() {
  return $(".dv2-layout-tc.dv2-detail-stream-ctn .dv2-video-wrapper").first();
}

function applyThapcamVideoAttrs_TC($video) {
  if (!$video?.length) return;
  const el = $video[0];
  $video.prop("controls", false);
  $video.removeAttr("controls");
  $video.attr({
    playsinline: "",
    "webkit-playsinline": "",
    "x-webkit-airplay": "allow",
  });
  if (el) {
    el.controls = false;
    if ("disablePictureInPicture" in el) {
      el.disablePictureInPicture = true;
    }
  }
}

function initStreamPlayerUi_TC(video) {
  const $wrapper = getStreamVideoWrapper_TC();
  const chrome = getStreamChrome_TC();
  if (!$wrapper.length || !chrome) return;
  const $video = video ? $(video) : $wrapper.find("video").first();
  applyThapcamVideoAttrs_TC($video);
  chrome.initPlayerUi($wrapper, $video);
  applyThapcamVideoAttrs_TC($video);
}

function initThapcamMobilePlaybackFix_TC() {
  const $wrapper = getStreamVideoWrapper_TC();
  if (!$wrapper.length || $wrapper.data("tcMobileFixBound")) return;
  $wrapper.data("tcMobileFixBound", true);

  const syncTcFsLayoutClass = () => {
    const wrapperEl = $wrapper[0];
    const isNativeFs =
      !!wrapperEl &&
      (document.fullscreenElement === wrapperEl ||
        document.webkitFullscreenElement === wrapperEl);
    const isFs = isNativeFs || $wrapper.hasClass("dv2-stream-wrapper-fs");
    $wrapper.toggleClass("dv2-tc-stream-fs", isFs);
    $wrapper
      .closest(".dv2-thapcam-video")
      .toggleClass("dv2-tc-stream-parent-fs", isFs);
  };

  $wrapper.on("dv2wrapperfschange.tcFsLayout", syncTcFsLayoutClass);
  $(document).on(
    "fullscreenchange.tcFsLayout webkitfullscreenchange.tcFsLayout",
    syncTcFsLayoutClass
  );
  $(window).on("resize.tcFsLayout orientationchange.tcFsLayout", syncTcFsLayoutClass);
  syncTcFsLayoutClass();

  $wrapper.on(
    "play.dv2TcMobileFix pause.dv2TcMobileFix loadedmetadata.dv2TcMobileFix",
    "video",
    function () {
      applyThapcamVideoAttrs_TC($(this));
    }
  );
}

function onHlsStreamReady_TC() {
  const chrome = getStreamChrome_TC();
  const $wrapper = getStreamVideoWrapper_TC();
  if ($wrapper.length) {
    clearMatchOverlays_TC($wrapper);
  }
  if (chrome && $wrapper.length) {
    if (matchData_TC) {
      chrome.rememberOddsMatchData?.($wrapper, matchData_TC);
    }
    chrome.onHlsReady($wrapper);
  }
}

function initStreamOddsPanel_TC(matchData) {
  const chrome = getStreamChrome_TC();
  const $wrapper = getStreamVideoWrapper_TC();
  if (!chrome || !$wrapper.length || !matchData) return;
  chrome.rememberOddsMatchData?.($wrapper, matchData);
  chrome.initOddsPanel?.($wrapper, matchData);
}

function clearStreamChrome_TC() {
  const chrome = getStreamChrome_TC();
  const $wrapper = getStreamVideoWrapper_TC();
  if (chrome && $wrapper.length) {
    chrome.clearFullChrome($wrapper);
  }
}

function showStreamLoading_TC($videoContainer, message = "Đang tải luồng phát...") {
  if (!$videoContainer?.length) return $();
  hideStreamLoading_TC($videoContainer);
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
  $videoContainer.append($overlay);
  return $overlay;
}

function hideStreamLoading_TC($videoContainer) {
  ($videoContainer?.length ? $videoContainer : getStreamVideoWrapper_TC())
    .find(".dv2-stream-loading")
    .remove();
}

function clearTcPlaybackTimers() {
  if (tcManifestTimeout) {
    clearTimeout(tcManifestTimeout);
    tcManifestTimeout = null;
  }
  if (tcNativeTimeout) {
    clearTimeout(tcNativeTimeout);
    tcNativeTimeout = null;
  }
}

function stopStreamPlayback_TC($video) {
  tcPlaybackGeneration += 1;
  clearTcPlaybackTimers();
  if (currentHls_TC) {
    try {
      currentHls_TC.destroy();
    } catch (e) {
      console.warn(e);
    }
    currentHls_TC = null;
  }
  if (!$video?.length) return;
  const el = $video[0];
  el.pause();
  el.removeAttribute("src");
  if (typeof el.load === "function") {
    el.load();
  }
}

function ensurePosterVideo_TC($wrapper) {
  if (!$wrapper?.length) return $();

  let $video = $wrapper.find("#liveVideo");
  if ($video.length) {
    stopStreamPlayback_TC($video);
        $video.attr({
            poster: DV2StreamKickoff.resolvePosterUrl(currentActiveLink_TC, POSTER_URL_TC),
            muted: true,
            playsinline: true,
        });
    $video.prop({ autoplay: false, controls: false });
    applyThapcamVideoAttrs_TC($video);
  } else {
    $video = $("<video>", {
      id: "liveVideo",
      class: "dv2-video-player",
      controls: false,
      autoplay: false,
      muted: true,
      playsinline: true,
            poster: DV2StreamKickoff.resolvePosterUrl(currentActiveLink_TC, POSTER_URL_TC),
    });
    $wrapper.find(".dv2-video-container").append($video);
    applyThapcamVideoAttrs_TC($video);
  }

  const chrome = getStreamChrome_TC();
  if (chrome) {
    chrome.applyVideoControls?.($video);
    chrome.ensureControlsBar?.($wrapper);
  }
  return $video;
}

function clearMatchOverlays_TC($wrapper) {
  ($wrapper?.length ? $wrapper : getStreamVideoWrapper_TC())
    .find(".dv2-loading.dv2-match-overlay, .dv2-not-loaded.dv2-match-overlay")
    .remove();
}

function createMatchOverlay_TC(match) {
  const kickoff = match?.matchInfo?.kickoff;
  const league = match?.league || {};
  const homeName = match?.teams?.home?.name || "Home";
  const awayName = match?.teams?.away?.name || "Away";
  const statusMatch = match?.matchInfo?.status;
  return $(`
    <div class="dv2-loading">
      <span class="dv2-loading-status">${statusMatchRender_TC(statusMatch)}</span>
      Trận đấu: <strong>${homeName} - ${awayName}</strong>
      <div class="dv2-load-league">
        <span>Giải đấu: <strong><img src="${league.logo || ""}" alt="${league.name || "-"}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"> ${league.name || "-"}</strong></span>
      </div>
      <div class="dv2-load-time">
        <span>${DV2StreamKickoff.renderTimeDisplay(kickoff)}</span>
      </div>
    </div>
  `);
}

function showMatchPosterOverlay_TC($wrapper, matchData) {
  if (!$wrapper?.length) return;

  hideStreamLoading_TC($wrapper);
  $wrapper.find(".dv2-loading").not(".dv2-match-overlay").remove();
  clearMatchOverlays_TC($wrapper);
  $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();
  ensurePosterVideo_TC($wrapper);

  if (matchData) {
    const $overlay = createMatchOverlay_TC(matchData);
    $overlay.addClass("dv2-match-overlay");
    $wrapper.append($overlay);
  }

  const chrome = getStreamChrome_TC();
  if (chrome) {
    chrome.bindEvents?.($wrapper);
  }
  if (matchData?.matchInfo?.kickoff) {
    DV2StreamKickoff.startCountdown(matchData.matchInfo.kickoff);
  }
}

function createMatchInfoCard_TC(match, type = "countdown") {
  const kickoff = match?.matchInfo?.kickoff;
  const league = match?.league || {};
  const homeName = match?.teams?.home?.name || "Home";
  const awayName = match?.teams?.away?.name || "Away";
  const homeScore = match?.score?.fulltime?.home ?? 0;
  const awayScore = match?.score?.fulltime?.away ?? 0;
  const pen = match?.score?.pen;
  const hasPen = pen && (pen.home != null || pen.away != null);
  const statusMatch = match?.matchInfo?.status;

  let timeContent = "";
  if (type === "result") {
    timeContent = `<span>Kết quả: <strong><span data-dv2-score-home>${homeScore}</span> - <span data-dv2-score-away>${awayScore}</span></strong>${hasPen ? ` <span class="dv2-load-pen">(Penalty <span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span>)</span>` : ""}</span>`;
  } else {
    timeContent = `<span>${DV2StreamKickoff.renderTimeDisplay(kickoff)}</span>`;
  }

  return $(`
    <div class="dv2-loading">
      <span class="dv2-loading-status">${
        type === "result"
          ? statusMatchRender_TC("finished")
          : statusMatchRender_TC(statusMatch)
      }</span>
      Trận đấu: <strong>${homeName} - ${awayName}</strong>
      <div class="dv2-load-league">
        <span>Giải đấu: <strong><img src="${league.logo || ""}" alt="${league.name || "-"}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"> ${league.name || "-"}</strong></span>
      </div>
      <div class="dv2-load-time">
        ${timeContent}
      </div>
    </div>
  `);
}

function showMatchInfoCard_TC($wrapper, matchData, type = "countdown") {
  if (!$wrapper?.length) return;

  hideStreamLoading_TC($wrapper);
  $wrapper.find(".dv2-loading").not(".dv2-match-overlay").remove();
  clearMatchOverlays_TC($wrapper);
  $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();
  ensurePosterVideo_TC($wrapper);

  if (matchData) {
    const $overlay = createMatchInfoCard_TC(matchData, type);
    $overlay.addClass("dv2-match-overlay");
    $wrapper.append($overlay);
  }

  if (type === "countdown" && matchData?.matchInfo?.kickoff) {
    DV2StreamKickoff.startCountdown(matchData.matchInfo.kickoff);
  }

  const chrome = getStreamChrome_TC();
  if (chrome) {
    chrome.bindEvents?.($wrapper);
  }
}

function bindStreamLoadingUntilPlaying_TC($videoContainer, video, onReady) {
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
    hideStreamLoading_TC($videoContainer);
    onReady?.();
  };

  const onPlaying = () => finish();
  const onCanPlay = () => {
    if (!video.paused) finish();
  };

  video.addEventListener("playing", onPlaying);
  video.addEventListener("canplay", onCanPlay);

  const fallbackTimer = setTimeout(finish, TC_STREAM_LOADING_PLAYING_MS);
}

// =================================================
// Get match ID from URL
// =================================================
function getMatchIdFromUrl_TC() {
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

function shouldShowPreMatchOverlay_TC(matchData) {
  const kickoffTime = new Date(matchData?.matchInfo?.kickoff);
  return (
    !Number.isNaN(kickoffTime.getTime()) &&
    kickoffTime.getTime() - Date.now() > 15 * 60 * 1000
  );
}

function getStreamLinkContainers_TC() {
  return $(".dv2-layout-tc.dv2-detail-stream-ctn .dv2-stream-links");
}

function renderStreamBetButtons_TC() {
    const $container = $(".dv2-layout-tc.dv2-detail-stream-ctn .dv2-stream-list .dv2-bet-links");
    if (!$container.length) return;

    const html = window.DV2_SOCOLIVE_STREAM_BET_BUTTONS_HTML;
    if (typeof html === "string" && html.trim()) {
        $container.html(html);
    }

    if (!$container.children().length) return;
    window.DV2_StreamChrome?.refreshReviveAds?.($container);
}
function renderCommentatorLinks_TC(data, options = {}) {
  const { autoPlay = true } = options;
  let sortedLinks = [];

  const linkState = DV2StreamLinks.prepareSpanLinks({
    rawLinks: data?.livestream?.links,
    $container: getStreamLinkContainers_TC(),
    onSelect(link, index) {
      currentActiveLink_TC = link;
      const $wrapper = getStreamVideoWrapper_TC();
      const $video = $wrapper.find("#liveVideo");
      DV2StreamKickoff.applyPosterForLink($video, link, POSTER_URL_TC);
      updateCommentatorInfo_TC(data, index, sortedLinks);

      initStreamOddsPanel_TC(matchData_TC);

      if (
        shouldShowPreMatchOverlay_TC(matchData_TC) ||
        matchData_TC?.matchInfo?.status?.toLowerCase() === "finished" ||
        !link?.url
      ) {
        stopStreamPlayback_TC($video);
        clearMatchOverlays_TC($wrapper);
        $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();

        if (matchData_TC?.matchInfo?.status?.toLowerCase() === "finished") {
          showMatchInfoCard_TC($wrapper, matchData_TC, "result");
        } else if (shouldShowPreMatchOverlay_TC(matchData_TC)) {
          showMatchInfoCard_TC($wrapper, matchData_TC, "countdown");
        } else {
          ensurePosterVideo_TC($wrapper);
        }
        return;
      }

      clearMatchOverlays_TC($wrapper);
      $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();
      initVideoPlayer_TC(link.url);
    },
  });

  sortedLinks = linkState.links || [];
  if (!sortedLinks.length) return null;

  currentActiveLink_TC = linkState.activeLink;
  updateCommentatorInfo_TC(data, linkState.activeIndex, sortedLinks);
  renderStreamBetButtons_TC();
  DV2StreamKickoff.applyPosterForLink(
    getStreamVideoWrapper_TC().find("#liveVideo"),
    currentActiveLink_TC,
    POSTER_URL_TC
  );

  if (autoPlay && linkState.activeLink?.url) {
    const streamUrl = linkState.activeLink.url;
    const startStream = () => initVideoPlayer_TC(streamUrl);
    const $wrapper = getStreamVideoWrapper_TC();
    if (window.DV2StreamTvc?.playBeforeStream) {
      window.DV2StreamTvc.playBeforeStream($wrapper, startStream);
    } else {
      startStream();
    }
  }

  return linkState;
}

// =================================================
// Load match data
// =================================================
function loadMatchData_TC(matchId) {
  const $wrapper = getStreamVideoWrapper_TC();
  showStreamLoading_TC($wrapper, "Đang tải thông tin trận đấu...");

  $.ajax({
    url: `https://vsc-apidev.helizones.com/api/data/lives/${matchId}`,
    method: "GET",
    success: function (response) {
      hideStreamLoading_TC($wrapper);
      if (response && response.data) {
        matchData_TC = response.data;
        const data = matchData_TC;

        startDetailScorePoll_TC(data);
        initStreamOddsPanel_TC(data);

        // kiểm tra thời gian diễn ra trận đấu có lớn hơn 15 phút không, nếu lớn hơn 15 phút thì hiển thị countdown
        const kickoffTime = new Date(data?.matchInfo?.kickoff);
        const shouldShowCountdown =
          !Number.isNaN(kickoffTime.getTime()) &&
          kickoffTime.getTime() - Date.now() > 15 * 60 * 1000;

        if (shouldShowCountdown) {
          clearStreamChrome_TC();
          updatePageTitle_TC(data);
          renderScoreOverlay_TC(data);
          renderCommentatorLinks_TC(data, { autoPlay: false });

          const showCountdown = () => {
            showMatchInfoCard_TC($wrapper, data, "countdown");
            $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreOverlay").show();
          };

          if (window.DV2StreamTvc?.playBeforeStream) {
            window.DV2StreamTvc.playBeforeStream($wrapper, showCountdown);
          } else {
            showCountdown();
          }
          return;
        }

        // kiểm tra trạng thái trận đấu có kết thúc không, nếu kết thúc thì hiển thị kết quả
        if (data?.matchInfo?.status?.toLowerCase() === "finished") {
          clearStreamChrome_TC();
          updatePageTitle_TC(data);
          renderScoreOverlay_TC(data);
          renderCommentatorLinks_TC(data, { autoPlay: false });
          showMatchInfoCard_TC($wrapper, data, "result");
          $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreOverlay").show();
          return;
        }

        renderMatchPage_TC();
      } else {
        showError_TC();
      }
    },
    error: function () {
      hideStreamLoading_TC($wrapper);
      showError_TC();
    },
  });
}

// =================================================
// Render match page
// =================================================
function renderMatchPage_TC() {
  const data = matchData_TC;

  updatePageTitle_TC(data);
  renderScoreOverlay_TC(data);

  const linkState = renderCommentatorLinks_TC(data);
  if (linkState?.links?.length) {
    $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreOverlay").show();
  } else {
    clearStreamChrome_TC();
    showMatchPosterOverlay_TC(getStreamVideoWrapper_TC(), data);
    $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreOverlay").show();
  }
}

// =================================================
// Update page title
// =================================================
function updatePageTitle_TC(data) {
  const homeTeam = data.teams?.home?.name || "Home";
  const awayTeam = data.teams?.away?.name || "Away";
  const kickoff = new Date(data.matchInfo.kickoff);
  const dateStr = kickoff.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = kickoff.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  $(".dv2-layout-tc.dv2-detail-stream-ctn #pageTitle").text(
    `LINK TRỰC TIẾP ${homeTeam.toUpperCase()} VS ${awayTeam.toUpperCase()} LÚC ${timeStr} ${dateStr} MIỄN PHÍ`
  );
}

// =================================================
// Render score overlay
// =================================================
function renderScoreOverlay_TC(data) {
  const homeTeam = data.teams?.home || {};
  const awayTeam = data.teams?.away || {};
  const homeScore = data.score?.fulltime?.home ?? 0;
  const awayScore = data.score?.fulltime?.away ?? 0;
  const pen = data.score?.pen;
  const hasPen = pen && (pen.home != null || pen.away != null);

  $(".dv2-layout-tc.dv2-detail-stream-ctn #homeTeam").html(`
                <div class="dv2-overlay-flag">
                    <img src="${homeTeam.logo}" alt="${homeTeam.name}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                </div>
                <div class="dv2-overlay-team-name">${
                  homeTeam.name || "Home"
                }</div>
            `);

  $(".dv2-layout-tc.dv2-detail-stream-ctn #scoreDisplay").html(`
                <div class="dv2-overlay-score-main">
                    <div class="dv2-score-number dv2-home-score-number" data-dv2-score-home>${homeScore}</div>
                    <div class="dv2-score-separator">-</div>
                    <div class="dv2-score-number dv2-away-score-number" data-dv2-score-away>${awayScore}</div>
                </div>
                ${hasPen ? `
                <div class="dv2-overlay-score-pen">
                    <span class="dv2-pen-value"><span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span></span>
                    <span class="dv2-pen-label">(Penalty)</span>
                </div>
                ` : ""}
            `);

  $(".dv2-layout-tc.dv2-detail-stream-ctn #awayTeam").html(`
                <div class="dv2-overlay-flag">
                    <img src="${awayTeam.logo}" alt="${awayTeam.name}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                </div>
                <div class="dv2-overlay-team-name">${
                  awayTeam.name || "Away"
                }</div>
            `);
}

// =================================================
// Update commentator info
// =================================================
function updateCommentatorInfo_TC(data, index = 0, sortedLinks = null) {
  const links = sortedLinks || DV2StreamLinks.sortForDetail(data?.livestream?.links);
  const commentator = links[index];
  if (commentator) {
    $(".dv2-layout-tc.dv2-detail-stream-ctn #commentatorInfo").text(
      commentator.commentator.toUpperCase()
    );
  }
}

// =================================================
// Init video player
// =================================================
function initVideoPlayer_TC(streamUrl) {
  const $wrapper = getStreamVideoWrapper_TC();
  const $video = $wrapper.find("#liveVideo");
  const video = $video[0];

  tcPlaybackGeneration += 1;
  const playbackGen = tcPlaybackGeneration;
  const isStalePlayback = () => playbackGen !== tcPlaybackGeneration;

  clearMatchOverlays_TC($wrapper);
  clearTcPlaybackTimers();

  if (!streamUrl || !video) {
    hideStreamLoading_TC($wrapper);
    if (matchData_TC) {
      showMatchPosterOverlay_TC($wrapper, matchData_TC);
    } else {
      showError_TC("Không tìm thấy video livestream");
    }
    return;
  }

  let hasFallback = false;
  const showFallback = () => {
    if (isStalePlayback() || hasFallback) return;
    hasFallback = true;
    clearTcPlaybackTimers();
    if (currentHls_TC) {
      try {
        currentHls_TC.destroy();
      } catch (e) {
        console.warn(e);
      }
      currentHls_TC = null;
    }
    if (video) {
      video.pause();
      video.removeAttribute("src");
      if (typeof video.load === "function") {
        video.load();
      }
    }
    hideStreamLoading_TC($wrapper);
    clearStreamChrome_TC();
    if (matchData_TC) {
      showMatchPosterOverlay_TC($wrapper, matchData_TC);
    } else {
      showError_TC("Không tải được video livestream");
    }
  };

  if (currentHls_TC) {
    try {
      currentHls_TC.destroy();
    } catch (e) {
      console.warn(e);
    }
    currentHls_TC = null;
  }

  $(".dv2-layout-tc.dv2-detail-stream-ctn #noStreamMessage").hide();
  showStreamLoading_TC($wrapper, "Đang tải luồng phát...");
  initStreamPlayerUi_TC(video);

  if (Hls.isSupported()) {
    tcManifestTimeout = setTimeout(() => {
      if (isStalePlayback()) return;
      console.warn("[VSC LIVE] Manifest load timeout");
      showFallback();
    }, 15000);

    currentHls_TC = new Hls({
      maxBufferLength: 10,
      liveSyncDuration: 3,
      enableWorker: true,
      xhrSetup: function (xhr) {
        xhr.withCredentials = false;
        xhr.referrerPolicy = "no-referrer-when-downgrade";
      },
    });

    currentHls_TC.loadSource(streamUrl);
    currentHls_TC.attachMedia(video);

    currentHls_TC.on(Hls.Events.MANIFEST_PARSED, function () {
      if (isStalePlayback()) return;
      clearTcPlaybackTimers();
      bindStreamLoadingUntilPlaying_TC($wrapper, video, () => {
        if (isStalePlayback()) return;
        onHlsStreamReady_TC();
      });
      video.muted = true;
      getStreamChrome_TC()?.syncControlsState?.($wrapper, $video);
      video.play().catch(() => console.warn("Autoplay blocked"));
    });

    currentHls_TC.on(Hls.Events.ERROR, function (event, data) {
      if (isStalePlayback()) return;
      if (data.fatal) {
        clearTcPlaybackTimers();
        showFallback();
      }
    });
    video.addEventListener(
      "error",
      function () {
        if (isStalePlayback()) return;
        clearTcPlaybackTimers();
        showFallback();
      },
      { once: true }
    );
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    tcNativeTimeout = setTimeout(() => {
      if (isStalePlayback()) return;
      console.warn("[VSC LIVE] Native HLS load timeout");
      showFallback();
    }, 15000);
    video.src = streamUrl;
    video.addEventListener("loadedmetadata", function () {
      if (isStalePlayback()) return;
      clearTcPlaybackTimers();
      bindStreamLoadingUntilPlaying_TC($wrapper, video, () => {
        if (isStalePlayback()) return;
        onHlsStreamReady_TC();
      });
      video.muted = true;
      getStreamChrome_TC()?.syncControlsState?.($wrapper, $video);
      video.play().catch(() => console.warn("Autoplay blocked on Safari"));
    });
    video.addEventListener(
      "error",
      function () {
        if (isStalePlayback()) return;
        clearTcPlaybackTimers();
        showFallback();
      },
      { once: true }
    );
  } else {
    showFallback();
  }
}

// =================================================
// Show error
// =================================================
function showError_TC(message = "Không có luồng livestream") {
  const $wrapper = getStreamVideoWrapper_TC();
  hideStreamLoading_TC($wrapper);
  clearStreamChrome_TC();
  $wrapper.find(".dv2-loading").not(".dv2-match-overlay").remove();
  clearMatchOverlays_TC($wrapper);
  ensurePosterVideo_TC($wrapper);

  const safeMessage = String(message || "Không có luồng livestream")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const $error = $(`
    <div class="dv2-not-loaded dv2-match-overlay">
      <div class="dv2-no-stream" id="noStreamMessage">
        <div class="dv2-no-stream-icon">🚫</div>
        <div class="dv2-no-stream-title">${safeMessage}</div>
        <div class="dv2-no-stream-subtitle">
          Trận đấu này hiện chưa có luồng phát trực tiếp hoặc bị lỗi.<br>
          Vui lòng quay lại sau hoặc xem các trận đấu khác.
        </div>
      </div>
    </div>
  `);
  $wrapper.append($error);

  const chrome = getStreamChrome_TC();
  if (chrome) {
    chrome.bindEvents?.($wrapper);
  }
}

function getDateLabel_TC(matchDate) {
  if (!matchDate) return "";
  const match = new Date(matchDate);
  const day = String(match.getDate()).padStart(2, "0");
  const month = String(match.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${match.getFullYear()}`;
}

function formatTime_TC(datetime) {
  if (!datetime) return "";
  const date = new Date(datetime);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function statusMatchRender_TC(status) {
  const MATCH_STATUS_VI = {
    "not started": "Sắp diễn ra",
    "to be determined": "Chưa xác định",
    delay: "Trì hoãn",
    interrupt: "Tạm dừng",
    "cut in half": "Bị cắt hiệp",
    postponed: "Hoãn trận",
    suspended: "Tạm hoãn",
    abandoned: "Bỏ dở",
    cancel: "Hủy trận",
    "abnormal(suggest hiding)": "Trạng thái bất thường",
    "first half": "Đang thi đấu",
    firsthalf: "Đang thi đấu",
    "first-half": "Đang thi đấu",
    fh: "Đang thi đấu",
    "half-time": "Nghỉ giữa hiệp",
    "half time": "Nghỉ giữa hiệp",
    halftime: "Nghỉ giữa hiệp",
    ht: "Nghỉ giữa hiệp",
    "second half": "Đang thi đấu",
    secondhalf: "Đang thi đấu",
    "second-half": "Đang thi đấu",
    sh: "Đang thi đấu",
    "extra time": "Hiệp phụ",
    extratime: "Hiệp phụ",
    et: "Hiệp phụ",
    overtime: "Hiệp phụ",
    "overtime(deprecated)": "Hiệp phụ",
    ot: "Hiệp phụ",
    penalty: "Luân lưu",
    penalties: "Luân lưu",
    "penalty shoot-out": "Luân lưu",
    "penalty shootout": "Luân lưu",
    finished: "Đã kết thúc",
    ft: "Đã kết thúc",
    end: "Đã kết thúc",
    walkover: "Thắng xử thua",
  };

  const key = status ? String(status).toLowerCase() : "";
  return MATCH_STATUS_VI[key] || "Không xác định";
}

// Cleanup
window.addEventListener("beforeunload", function () {
  if (currentHls_TC) {
    currentHls_TC.destroy();
  }
});
