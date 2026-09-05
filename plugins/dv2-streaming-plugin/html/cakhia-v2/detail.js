// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

const POSTER_URL =
  "https://img.freepik.com/premium-photo/close-up-soccer-player-who-kicks-ball_207634-4089.jpg";
const BASE_API_URL = "https://vsc-apidev.helizones.com/api/data/";

const MATCH_STATUS = [
  // Trước trận
  "not started",
  "to be determined",
  // Hoãn / huỷ / sự cố
  // "delay",
  // "interrupt",
  // "cut in half",
  // "postponed",
  // "suspended",
  // "abandoned",
  // "cancel",
  // "abnormal(suggest hiding)",
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
  "et",
  "overtime",
  "overtime(deprecated)",
  "ot",
  // Luân lưu
  "penalty",
  "penalties",
  "penalty shoot-out",
  "penalty shootout",
  // Kết thúc
  "finished",
  "ft",
  "end",
  "walkover"
];

const LIVE_STATUS = [
  // Tạm dừng / sự cố
  //  "delay",
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

// Global variables for retry logic
let retryTimeout = null;
let retryCount = 0;
let maxRetries = 3;
let retryInterval = 5000; // 5 seconds between retries
let maxRetryTime = 15000; // 15 seconds max retry time
let currentMatchDataCK2 = null;
let currentActiveLink_CK2 = null;
let detailScorePoll_CK2 = null;
let currentHls_CK2 = null;
let ck2PlaybackGeneration = 0;
let ck2ManifestTimeout = null;
let ck2NativeTimeout = null;

function applyPosterForActiveLink_CK2() {
  const video = document.getElementById("liveVideo");
  if (!video) return;
  DV2StreamKickoff.applyPosterForVideo(video, currentActiveLink_CK2, POSTER_URL);
}

function startDetailScorePoll_CK2(match) {
  if (!match) return;
  if (!detailScorePoll_CK2) {
    detailScorePoll_CK2 = DV2MatchScorePoll.create({
      container: ".dv2-layout-ck2",
    });
  }
  detailScorePoll_CK2.sync(match);
  detailScorePoll_CK2.start();
}

function getStreamChrome_CK2() {
  return window.DV2_StreamChrome;
}

function getStreamVideoWrapper_CK2() {
  return $(".dv2-layout-ck2 .dv2-video-wrapper").first();
}

function initStreamPlayerUi_CK2($video) {
  const $wrapper = getStreamVideoWrapper_CK2();
  const chrome = getStreamChrome_CK2();
  if (!$wrapper.length || !chrome) return;
  chrome.initPlayerUi($wrapper, $video ? $($video) : $wrapper.find("video").first());
}

function onHlsStreamReady_CK2() {
  const chrome = getStreamChrome_CK2();
  const $wrapper = getStreamVideoWrapper_CK2();
  if (chrome && $wrapper.length) {
    if (currentMatchDataCK2) {
      chrome.rememberOddsMatchData?.($wrapper, currentMatchDataCK2);
    }
    chrome.onHlsReady($wrapper);
  }
}

function initStreamOddsPanel_CK2(matchData) {
  const chrome = getStreamChrome_CK2();
  const $wrapper = getStreamVideoWrapper_CK2();
  if (!chrome || !$wrapper.length || !matchData) return;
  chrome.rememberOddsMatchData?.($wrapper, matchData);
  chrome.initOddsPanel?.($wrapper, matchData);
}

function clearStreamChrome_CK2() {
  const chrome = getStreamChrome_CK2();
  const $wrapper = getStreamVideoWrapper_CK2();
  if (chrome && $wrapper.length) {
    chrome.clearFullChrome($wrapper);
  }
}

const CK2_STREAM_LOADING_PLAYING_MS = 12000;

function showStreamLoading_CK2($videoContainer, message = "Đang tải luồng phát...") {
  if (!$videoContainer?.length) return $();
  hideStreamLoading_CK2($videoContainer);
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

function hideStreamLoading_CK2($videoContainer) {
  ($videoContainer?.length ? $videoContainer : getStreamVideoContainer_CK2())
    .find(".dv2-stream-loading")
    .remove();
}

function bindStreamLoadingUntilPlaying_CK2($videoContainer, video, onReady) {
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
    hideStreamLoading_CK2($videoContainer);
    onReady?.();
  };

  const onPlaying = () => finish();
  const onCanPlay = () => {
    if (!video.paused) finish();
  };

  video.addEventListener("playing", onPlaying);
  video.addEventListener("canplay", onCanPlay);

  const fallbackTimer = setTimeout(finish, CK2_STREAM_LOADING_PLAYING_MS);
}

function startLiveStream_CK2(streamUrl, options = {}) {
  initHLSPlayer(streamUrl, options);
}

// Khởi tạo HLS player với options
function clearCk2PlaybackTimers() {
  if (ck2ManifestTimeout) {
    clearTimeout(ck2ManifestTimeout);
    ck2ManifestTimeout = null;
  }
  if (ck2NativeTimeout) {
    clearTimeout(ck2NativeTimeout);
    ck2NativeTimeout = null;
  }
}

function destroyCurrentHls_CK2() {
  if (currentHls_CK2) {
    try {
      currentHls_CK2.destroy();
    } catch (e) {}
    currentHls_CK2 = null;
  }
}

function initHLSPlayer(videoSrc, options = {}) {
  const { enableRetry = false, matchData = null } = options;
  currentMatchDataCK2 = matchData || currentMatchDataCK2;

  ck2PlaybackGeneration += 1;
  const playbackGen = ck2PlaybackGeneration;
  clearCk2PlaybackTimers();
  destroyCurrentHls_CK2();

  const $videoContainer = getStreamVideoContainer_CK2();
  clearMatchOverlays_CK2($videoContainer);
  showStreamLoading_CK2($videoContainer, "Đang tải luồng phát...");

  const video = document.getElementById("liveVideo");

  video.autoplay = true;
  video.muted = true;
  initStreamPlayerUi_CK2(video);

  console.log(
    `[VSC LIVE] Initializing HLS player ${
      enableRetry ? "with retry" : "without retry"
    }`
  );

  if (enableRetry && matchData) {
    retryCount = 0;
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    loadVideoCore(videoSrc, matchData, true, playbackGen);
  } else {
    loadVideoCore(videoSrc, null, false, playbackGen);
  }
}

$(document).ready(function () {
  if ($(".dv2-layout-ck2 #stream-player").length > 0) {
    loadStreamData();
  }
});

// Lấy match ID từ URL path dạng /streams/matchId
function getMatchId_CK2() {
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

// Load thông tin livestream từ API
function loadStreamData() {
  const matchId = getMatchId_CK2();
  const $videoContainer = getStreamVideoContainer_CK2();

  console.log("[VSC LIVE] Loading livestream detail for ID:", matchId);

  // Tạo video element với poster trước
  const video = document.createElement("video");
  video.id = "liveVideo";
  video.controls = false; // Tạm thời ẩn controls khi loading
  video.autoplay = false; // Tạm thời tắt autoplay khi loading
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.poster = DV2StreamKickoff.resolvePosterUrl(currentActiveLink_CK2, POSTER_URL);
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "contain";

  // Clear container và thêm video element
  const videoContainer = document.getElementById("stream-player");
  videoContainer.innerHTML = "";
  videoContainer.appendChild(video);
  initStreamPlayerUi_CK2(video);

  const loadMatchData = () => {
    showStreamLoading_CK2($videoContainer, "Đang tải thông tin trận đấu...");

    // call api to get livestream data
    $.ajax({
    url: `${BASE_API_URL}lives/${matchId}`,
    method: "GET",
    success: function (res) {
      console.log("[VSC LIVE] API response:", res);

      const data = res?.data;
      if (!data) {
        return;
      }

      startDetailScorePoll_CK2(data);

      hideStreamLoading_CK2($videoContainer);

      initStreamOddsPanel_CK2(data);

      const linkState = setupStreamLinks_CK2(data);
      renderStreamLinksAdsBanner_CK2();
      applyPosterForActiveLink_CK2();

      // kiểm tra thời gian diễn ra trận đấu có lớn hơn 15 phút không, nếu lớn hơn 15 phút thì hiển thị countdown
      const kickoffTime = new Date(data?.matchInfo?.kickoff);
      const shouldShowCountdown =
        !Number.isNaN(kickoffTime.getTime()) &&
        (kickoffTime.getTime() - Date.now()) > 15 * 60 * 1000;

      if (shouldShowCountdown) {
        const showCountdown = () => {
          clearStreamChrome_CK2();
          renderMatchInfoCard($videoContainer, data, "countdown");
        };

        if (window.DV2StreamTvc?.playBeforeStream) {
          window.DV2StreamTvc.playBeforeStream($videoContainer, showCountdown);
        } else {
          showCountdown();
        }
        return;
      }

      // kiểm tra trạng thái trận đấu có kết thúc không, nếu kết thúc thì hiển thị kết quả 
      if (data?.matchInfo?.status?.toLowerCase() === "finished") {
        clearStreamChrome_CK2();
        renderMatchInfoCard($videoContainer, data, "result");
        return;
      }

      if (linkState?.activeLink?.url) {
        const streamUrl = linkState.activeLink.url;
        const isLiveMatch = LIVE_STATUS.includes(
          data?.matchInfo?.status?.toLowerCase()
        );

        const startStream = () => {
          if (isLiveMatch) {
            initHLSPlayer(streamUrl, { enableRetry: true, matchData: data });
          } else {
            initHLSPlayer(streamUrl, { enableRetry: false });
          }
        };

        if (window.DV2StreamTvc?.playBeforeStream) {
          window.DV2StreamTvc.playBeforeStream($videoContainer, startStream);
        } else {
          startStream();
        }
      }

    },
    error: function (xhr, status, error) {
      console.error("[VSC LIVE] API error:", error);
      hideStreamLoading_CK2($videoContainer);
    },
  });
  };

  loadMatchData();
}

// Load video core logic (shared between retry and non-retry modes)
function loadVideoCore(videoSrc, matchData, enableRetry, playbackGen) {
  const isStalePlayback = () => playbackGen !== ck2PlaybackGeneration;

  console.log(
    `[VSC LIVE] ${enableRetry ? "Retrying" : "Loading"} video (attempt ${
      enableRetry ? retryCount + 1 : 1
    }${enableRetry ? `/${maxRetries}` : ""})`
  );

  const $videoContainer = getStreamVideoContainer_CK2();
  if (isStalePlayback()) return;

  clearMatchOverlays_CK2($videoContainer);
  showStreamLoading_CK2(
    $videoContainer,
    enableRetry && retryCount > 0
      ? `Đang thử lại luồng phát... (${retryCount}/${maxRetries})`
      : "Đang tải luồng phát..."
  );

  const video = document.getElementById("liveVideo");
  const fallbackMatchData = matchData || currentMatchDataCK2;
  let hasFallback = false;

  const showFallback = () => {
    if (isStalePlayback() || hasFallback || !fallbackMatchData) return;
    hasFallback = true;
    clearCk2PlaybackTimers();
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    destroyCurrentHls_CK2();
    hideStreamLoading_CK2($videoContainer);
    showLiveMatchError(fallbackMatchData);
  };

  try {
    if (Hls.isSupported()) {
      ck2ManifestTimeout = setTimeout(() => {
        if (isStalePlayback()) return;
        console.error("[VSC LIVE] Manifest load timeout");
        showFallback();
      }, maxRetryTime);

      const hlsInstance = new Hls({
        maxBufferLength: 10,
        liveSyncDuration: 3,
        enableWorker: true,
        xhrSetup: function (xhr, url) {
            xhr.withCredentials = false;
            xhr.referrerPolicy = "no-referrer-when-downgrade";
        },
      });
      currentHls_CK2 = hlsInstance;

      hlsInstance.loadSource(videoSrc);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
        if (isStalePlayback()) return;
        console.log("[VSC LIVE] HLS manifest parsed successfully");
        clearCk2PlaybackTimers();
        if (retryTimeout) {
          clearTimeout(retryTimeout);
          retryTimeout = null;
        }
        bindStreamLoadingUntilPlaying_CK2($videoContainer, video, () => {
          if (isStalePlayback()) return;
          onHlsStreamReady_CK2();
        });
        video.muted = true;
        video.play().catch((err) => {
          console.warn("[VSC LIVE] Autoplay blocked:", err);
        });
      });

      hlsInstance.on(Hls.Events.ERROR, function (event, data) {
        if (isStalePlayback()) return;
        console.error("[VSC LIVE] HLS error:", data);
        if (data?.fatal && !enableRetry) {
          clearCk2PlaybackTimers();
          showFallback();
          return;
        }

        if (data.fatal && enableRetry) {
          retryCount++;

          if (retryCount < maxRetries) {
            console.log(
              `[VSC LIVE] Retrying in ${
                retryInterval / 1000
              } seconds... (${retryCount}/${maxRetries})`
            );

            retryTimeout = setTimeout(() => {
              if (isStalePlayback()) return;
              destroyCurrentHls_CK2();
              loadVideoCore(videoSrc, matchData, enableRetry, playbackGen);
            }, retryInterval);
          } else {
            console.error(
              "[VSC LIVE] Max retries reached, showing live match info"
            );
            clearCk2PlaybackTimers();
            if (retryTimeout) {
              clearTimeout(retryTimeout);
              retryTimeout = null;
            }
            destroyCurrentHls_CK2();
            showFallback();
          }
        }
      });
      video.addEventListener(
        "error",
        function () {
          if (isStalePlayback()) return;
          clearCk2PlaybackTimers();
          showFallback();
        },
        { once: true }
      );
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      ck2NativeTimeout = setTimeout(() => {
        if (isStalePlayback()) return;
        console.error("[VSC LIVE] Native HLS load timeout");
        if (!enableRetry) {
          showFallback();
        }
      }, maxRetryTime);

      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.src = videoSrc;
      var playedNative = false;
      function tryPlaySafari() {
        if (isStalePlayback() || playedNative) return;
        playedNative = true;
        clearCk2PlaybackTimers();
        if (retryTimeout) {
          clearTimeout(retryTimeout);
          retryTimeout = null;
        }
        bindStreamLoadingUntilPlaying_CK2($videoContainer, video, () => {
          if (isStalePlayback()) return;
          onHlsStreamReady_CK2();
        });
        video.muted = true;
        video.play().catch((err) => {
          console.warn("[VSC LIVE] Autoplay blocked on Safari:", err);
        });
      }
      video.addEventListener("canplay", tryPlaySafari, { once: true });
      video.addEventListener("loadedmetadata", function () {
        setTimeout(function () {
          if (!playedNative && video.readyState >= 1) tryPlaySafari();
        }, 400);
      }, { once: true });
      video.addEventListener(
        "error",
        function () {
          if (isStalePlayback()) return;
          if (!enableRetry) {
            clearCk2PlaybackTimers();
            showFallback();
          }
        },
        { once: true }
      );

      if (enableRetry) {
        video.addEventListener("error", function () {
          if (isStalePlayback()) return;
          console.error("[VSC LIVE] Video load error on Safari");
          retryCount++;

          if (retryCount < maxRetries) {
            retryTimeout = setTimeout(() => {
              if (isStalePlayback()) return;
              loadVideoCore(videoSrc, matchData, enableRetry, playbackGen);
            }, retryInterval);
          } else {
            clearCk2PlaybackTimers();
            showFallback();
          }
        });
      }
    } else {
      console.error("[VSC LIVE] HLS not supported and not Safari");
      showFallback();
    }
  } catch (error) {
    console.error("[VSC LIVE] Exception during video load:", error);
    if (enableRetry) {
      retryCount++;

      if (retryCount < maxRetries) {
        retryTimeout = setTimeout(() => {
          if (isStalePlayback()) return;
          loadVideoCore(videoSrc, matchData, enableRetry, playbackGen);
        }, retryInterval);
      } else {
        clearCk2PlaybackTimers();
        showFallback();
      }
    } else {
      showFallback();
    }
  }
}

function getStreamVideoContainer_CK2() {
  return getStreamVideoWrapper_CK2();
}

function clearMatchOverlays_CK2($videoContainer) {
  const $container = $videoContainer?.length
    ? $videoContainer
    : getStreamVideoContainer_CK2();
  if (!$container.length) return;
  $container.find("#simulate-the-match-content-center").remove();
}

// Hiển thị live match info khi load video thất bại
function showLiveMatchError(matchData) {
  if (!matchData) return;
  clearStreamChrome_CK2();
  const $streamPlayer = $(".dv2-layout-ck2 #stream-player");
  const $videoContainer = getStreamVideoContainer_CK2();
  $streamPlayer.empty();

  // Tạo video element với poster trước
  const video = document.createElement("video");
  video.id = "liveVideo";
  video.controls = false;
  video.autoplay = false;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.poster = DV2StreamKickoff.resolvePosterUrl(currentActiveLink_CK2, POSTER_URL);
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "contain";

  const videoContainer = document.getElementById("stream-player");
  videoContainer.innerHTML = "";
  videoContainer.appendChild(video);
  initStreamPlayerUi_CK2(video);

  // Hiển thị match info với status "Live"
  renderMatchInfoCard($videoContainer, matchData, "live-error");
}

// Render match info card (countdown, result, hoặc live-error)
function renderMatchInfoCard($container, data, type = "countdown") {
  const { teams, league, matchInfo, score } = data;
  const homeTeam = teams?.home?.name || "Home Team";
  const awayTeam = teams?.away?.name || "Away Team";
  const leagueName = league?.name || "";
  const matchStatus = matchInfo?.status || "Not Started";
  const pen = score?.pen;
  const hasPen =
    (type === "result" || type === "live-error") &&
    pen &&
    (pen.home != null || pen.away != null);
  const penContent = hasPen
    ? `<div class="dv2-match-pen">
        <span class="dv2-match-pen-value"><span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span></span>
        <span class="dv2-match-pen-label">(Penalty)</span>
      </div>`
    : "";

  let timeBoxContent = "";

  if (type === "result") {
    // Hiển thị tỷ số cho trận đã kết thúc
    const homeScore = score?.fulltime?.home || 0;
    const awayScore = score?.fulltime?.away || 0;
    const homeLogo = teams?.home?.logo || "";
    const awayLogo = teams?.away?.logo || "";
    timeBoxContent = `
      <li class="flex  w-12 h-auto items-center justify-center" style="flex-direction: row;">
        ${
          homeLogo
            ? `<img src="${homeLogo}" alt="${homeTeam}" style="width:50px;height:50px;border-radius:50%;" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
            : ""
        }
        <span id="hEndScore" data-dv2-score-home>${homeScore}</span>
      </li>
      <li class="vs">:</li>
      <li class="flex w-12 h-auto items-center justify-center" style="flex-direction: row;">
        <span id="gEndScore" data-dv2-score-away>${awayScore}</span>
        ${
          awayLogo
            ? `<img src="${awayLogo}" alt="${awayTeam}" style="width:50px;height:50px;border-radius:50%;" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
            : ""
        }
      </li>
    `;
  } else if (type === "live-error") {
    // Hiển thị kết quả hiện tại cho live match bị lỗi
    const homeScore = score?.fulltime?.home || 0;
    const awayScore = score?.fulltime?.away || 0;
    const homeLogo = teams?.home?.logo || "";
    const awayLogo = teams?.away?.logo || "";
    timeBoxContent = `
      <li class="flex w-12 h-auto items-center justify-center" style="flex-direction: row;">
        ${
          homeLogo
            ? `<img src="${homeLogo}" alt="${homeTeam}" style="width:50px;height:50px;border-radius:50%;" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
            : ""
        }
        <span id="hEndScore" data-dv2-score-home>${homeScore}</span>
      </li>
      <li class="vs">:</li>
      <li class="flex w-12 h-auto items-center justify-center" style="flex-direction: row;">
        <span id="gEndScore" data-dv2-score-away>${awayScore}</span>
        ${
          awayLogo
            ? `<img src="${awayLogo}" alt="${awayTeam}" style="width:50px;height:50px;border-radius:50%;" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
            : ""
        }
      </li>
    `;
  } else {
    const kickoff = matchInfo?.kickoff;
    timeBoxContent = `<li colspan="3">${DV2StreamKickoff.renderTimeDisplay(kickoff)}</li>`;
  }

  const matchCardHtml = `
    <div id="simulate-the-match-content-center" class="flex flex-col justify-center items-center gap-4 p-4">
      <div class="dataBox_pop">
        <ul class="info">
          <li style="display:flex; flex-direction:column; align-items:center;">
            <div class="match-info__lname">${leagueName}</div>
            <h4>${matchStatus}</h4>
            <ul class="timeBox">
              ${timeBoxContent}
            </ul>
            ${penContent}
            <div class="teams flex gap-4 mt-2">
              <div class="homeTeam" title="${homeTeam}">${homeTeam}</div>
              <div class="vs">VS</div>
              <div class="guestTeam" title="${awayTeam}">${awayTeam}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `;

  $container.append(matchCardHtml);

  if (type === "countdown" && data?.matchInfo?.kickoff) {
    DV2StreamKickoff.startCountdown(data.matchInfo.kickoff);
  }
}

function shouldShowPreMatchOverlay_CK2(matchData) {
  const kickoffTime = new Date(matchData?.matchInfo?.kickoff);
  return (
    !Number.isNaN(kickoffTime.getTime()) &&
    kickoffTime.getTime() - Date.now() > 15 * 60 * 1000
  );
}

// ========================================
// Ads Banner for detail page (stream links row)
// ========================================
function renderStreamLinksAdsBanner_CK2() {
    const $container = $(".dv2-layout-ck2.dv2-container .dv2-stream-list .dv2-bet-links");
    if (!$container.length) return;

    const html = window.DV2_SOCOLIVE_STREAM_BET_BUTTONS_HTML;
    if (typeof html === "string" && html.trim()) {
        $container.html(html);
    }

    if (!$container.children().length) return;
    window.DV2_StreamChrome?.refreshReviveAds?.($container);
}

function setupStreamLinks_CK2(data) {
  const links = DV2StreamLinks.sortForDetail(data?.livestream?.links);
  if (!links.length) return null;

  currentMatchDataCK2 = data;
  const resolved = DV2StreamLinks.resolveActiveLink(links);
  currentActiveLink_CK2 = resolved.activeLink;
  renderStreamLinks(links, resolved.activeIndex);
  applyPosterForActiveLink_CK2();
  return resolved;
}

// Render stream links
function renderStreamLinks(links, activeIndex = 0) {
  const $wrapLink = $(".dv2-stream-links-ck2");

  if (!links || links.length === 0) return;

  // Clear existing buttons
  $wrapLink.empty();

  links.forEach((link, index) => {
    const blvName = DV2StreamLinks.getBlvName(link, index);
    const liveId = link.liveId != null ? String(link.liveId) : "";
    const $button = $(`
      <button type="button"
        class="match_link--button py-1 px-3 font-semibold text-sm capitalize !text-[11px] lg:!text-sm border border-neutral-2 bg-btnlink text-neutral-4 flex items-center gap-1 flex-row-reverse !px-2 lg:!px-3 transition-all duration-150 bg-primary-1 text-white border-primary-1 hover:bg-primary-1 hover:text-white hover:border-primary-1 rounded-3xl 
        ${index === activeIndex ? "active" : ""}"
        data-link-index="${index}"
        data-live-id="${liveId}"
        data-stream-url="${link.url}">
        <span class="inline-block">${blvName}</span>
      </button>
    `);

    $button.on("click", function () {
      const linkIndex = Number($(this).attr("data-link-index"));
      const link = links[linkIndex];
      if (DV2StreamLinks.navigateForLink(link)) {
        return;
      }
      currentActiveLink_CK2 = link;
      applyPosterForActiveLink_CK2();
      const liveId = $(this).attr("data-live-id");
      if (liveId) {
        DV2StreamLinks.updateLiveIdInUrl(liveId);
      }
      $wrapLink.find(".match_link--button").removeClass("active");
      $(this).addClass("active");

      const $videoContainer = getStreamVideoContainer_CK2();
      const streamUrl = $(this).data("stream-url");

      if (currentMatchDataCK2) {
        initStreamOddsPanel_CK2(currentMatchDataCK2);
      }

      if (shouldShowPreMatchOverlay_CK2(currentMatchDataCK2) || !streamUrl) {
        clearStreamChrome_CK2();
        clearMatchOverlays_CK2($videoContainer);
        renderMatchInfoCard($videoContainer, currentMatchDataCK2, "countdown");
        return;
      }

      clearMatchOverlays_CK2($videoContainer);
      initHLSPlayer(streamUrl, { enableRetry: false, matchData: currentMatchDataCK2 });
    });

    $wrapLink.append($button);
  });
}
