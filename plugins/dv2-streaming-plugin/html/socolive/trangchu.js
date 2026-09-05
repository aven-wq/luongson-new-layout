$ = jQuery.noConflict();

const baseApiUrl = "https://vsc-apidev.helizones.com";
const NHADAI_COMMENTATOR_ID = 99999999999999999;
const PRIORITY_COMPETITION_SOON_MINUTES_SCL = 10;
const TEAM_ICON_FALLBACK =
  "https://img.winfast.dev/assets/upload/football/team/images/teamicon.png";

const appState = {
  hotLeaguesRank: new Map(),
};

const LIVE_STATUS = [
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

$(document).ready(function () {
  if ($(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-wrapper").length) {
    renderFeaturedStreamBlock_SCL();
  }
  if ($(".dv2-layout-scl.dv2-blv-list-ctn .dv2-anchor-swiper-container").length) {
    renderSlideBlvBlock_SCL();
  }
  if ($(".dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content").length) {
    initHotLiveBlock_SCL();
  }
});

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

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

function getPreferredLivestreamLink(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) return null;
  return DV2StreamLinks.getPreferredLink(links);
}

function getStreamVideoWrapperHome_SCL() {
  return $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-wrapper").first();
}

function getStreamVideoContainerHome_SCL() {
  return getStreamVideoWrapperHome_SCL().find(".dv2-video-container").first();
}

function getMatchTopInfoHome_SCL() {
  const $container = getStreamVideoContainerHome_SCL();
  let $matchTopInfo = $container.children("#matchTopInfo");
  if (!$matchTopInfo.length) {
    $matchTopInfo = $('<div id="matchTopInfo"></div>');
    $container.prepend($matchTopInfo);
  }
  return $matchTopInfo;
}

function sclClearFeaturedStreamMediaHome_SCL($videoContainer) {
  $videoContainer
    .children()
    .not("#matchTopInfo, .dv2-stream-controls, .dv2-stream-chrome")
    .remove();
  getMatchTopInfoHome_SCL();
}

function clearStreamChromeHome_SCL() {
  const chrome = window.DV2_StreamChrome;
  const $wrapper = getStreamVideoWrapperHome_SCL();
  if (chrome && $wrapper.length) {
    chrome.clearFullChrome($wrapper);
  }
}

function isMatchLive_SCL(match) {
  return LIVE_STATUS.includes(String(match?.status ?? "").toLowerCase());
}

function isPriorityCompetitionStartingSoon_SCL(match) {
  return DV2MatchSort.isPriorityCompetitionStartingSoon(match, LIVE_STATUS, PRIORITY_COMPETITION_SOON_MINUTES_SCL);
}

function getTodayTomorrowRange_SCL() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(todayEnd.getDate() + 1);
  return { now, todayStart, todayEnd, tomorrowStart, tomorrowEnd };
}

function buildFeaturedStreamMatches_SCL(
  sortedMatches,
  now,
  todayStart,
  todayEnd,
  tomorrowStart,
  tomorrowEnd
) {
  const liveMatch = sortedMatches.filter(isMatchLive_SCL);
  const upcomingMatch = sortedMatches.filter((match) => {
    const kickoff = new Date(match?.kickoff);
    return (
      kickoff > now &&
      ((kickoff >= todayStart && kickoff <= todayEnd) ||
        (kickoff >= tomorrowStart && kickoff <= tomorrowEnd))
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

function bindFeaturedRoomListClick_SCL($roomList, matches, loadMatch) {
  $roomList.off("click.featuredMatch").on("click.featuredMatch", "li.dv2-item-match", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const index = $(this).data("index");
    loadMatch(matches[index], index);
  });
}

function renderFeaturedStreamBlock_SCL() {
  const $videoInner = $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-inner");
  const $roomList = $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-room-list");
  const $videoContainer = getStreamVideoContainerHome_SCL();
  const $dv2StreamLinks = $(".dv2-stream-links");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const payload = {
    fromDate: today.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };

  const $notMatch = $(`
    <div class="dv2-loading-nomatch">
      <div class="no-match-text">Hiện không có trận nào đang diễn ra 🔥</div>
      <div class="subtitle">Vui lòng quay lại sau...</div>
    </div>
  `);

  function showFeaturedMatchError_SCL(message) {
    getMatchTopInfoHome_SCL().html(`<div class="dv2-notfound">${message}</div>`);
    sclBindFeaturedStreamClick_SCL("");
  }

  function loadFeaturedMatch_SCL(match, index) {
    if (!match?.match_id) return;

    $roomList.find("a").removeClass("dv2-active");
    $roomList.find("li").eq(index).find("a").addClass("dv2-active");

    clearStreamChromeHome_SCL();
    sclClearFeaturedStreamMediaHome_SCL($videoContainer);
    $dv2StreamLinks.find("span").removeClass("active");

    $.ajax({
      url: `${baseApiUrl}/api/data/lives/${match.match_id}`,
      method: "GET",
      success(res) {
        const data = res?.data;
        if (!data?.livestream) {
          getMatchTopInfoHome_SCL().html(
            '<div class="dv2-notfound-video-livestream">🚫 Không có luồng livestream</div>'
          );
          hideAppointmentBlock_SCL();
          sclBindFeaturedStreamClick_SCL("");
          return;
        }
        renderNewScreen_SCL(data);
      },
      error(err) {
        console.error("[VSC LIVE] Lỗi khi gọi API:", err);
        showFeaturedMatchError_SCL("Không thể tải dữ liệu livestream");
      },
    });
  }

  function bindFeaturedStreamLinksClick_SCL(streamMatches) {
    $dv2StreamLinks.off("click.featuredLinks").on("click.featuredLinks", "span", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const index = $(this).data("index");
      const indexLinks = $(this).data("index-links");
      const match = streamMatches[index];
      const links = sortLivestreamLinksPreferRealBlv(match?.livestream?.links || []);
      const link = links[indexLinks];
      if (DV2StreamLinks.navigateForLink(link)) {
        return;
      }
      loadFeaturedMatch_SCL(match, index);
    });
  }

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
    success(res) {
      if (!res || res.status !== "success" || !res.matches_by_date) {
        $roomList.html("<li>Không có dữ liệu hợp lệ</li>");
        return;
      }

      const matches = [];
      Object.keys(res.matches_by_date).forEach((date) => {
        matches.push(...res.matches_by_date[date]);
      });

      if (!matches.length) {
        $roomList.html("<span>Không có trận đấu nào</span>");
        return;
      }

      const { now, todayStart, todayEnd, tomorrowStart, tomorrowEnd } = getTodayTomorrowRange_SCL();
      const sortedMatches = sortedMatchesFunction(matches);
      const { streamMatches, liveMatch, upcomingMatch, priorityCompetitionSoonMatch } =
        buildFeaturedStreamMatches_SCL(
          sortedMatches,
          now,
          todayStart,
          todayEnd,
          tomorrowStart,
          tomorrowEnd
        );

      if (!liveMatch.length && !upcomingMatch.length) {
        clearStreamChromeHome_SCL();
        $videoInner.append($notMatch);
        $(".dv2-layout-scl.dv2-appoinment-list-ctn").hide();
        return;
      }

      if (liveMatch.length && !upcomingMatch.length) {
        $(".dv2-layout-scl.dv2-appoinment-list-ctn").hide();
      }

      if (!liveMatch.length && !priorityCompetitionSoonMatch && upcomingMatch.length > 0) {
        renderListLiveMatch_SCL(upcomingMatch);
        bindFeaturedRoomListClick_SCL($roomList, upcomingMatch, loadFeaturedMatch_SCL);
        loadFeaturedMatch_SCL(upcomingMatch[0], 0);
      }

      if (liveMatch.length > 0 || priorityCompetitionSoonMatch) {
        renderListLiveMatch_SCL(streamMatches);
        bindFeaturedRoomListClick_SCL($roomList, streamMatches, loadFeaturedMatch_SCL);
        bindFeaturedStreamLinksClick_SCL(streamMatches);
        loadFeaturedMatch_SCL(streamMatches[0], 0);
      }

      renderSliderAppointmentsBlock_SCL(upcomingMatch);
      renderHotLiveBlock_SCL(
        DV2SocoliveHotLive.prepareMatches(matches, hotLiveSortedMatchesFunction)
      );
    },
    error() {
      clearStreamChromeHome_SCL();
      $roomList.html('<li class="dv2-list-empty">Danh sách phát trống</li>');
      showFeaturedMatchError_SCL("Không thể tải danh sách trận đấu");
      $(".dv2-layout-scl.dv2-appoinment-list-ctn").hide();
    },
  });
}

function sclOddsValueHasData_SCL(value) {
  return value != null && value !== "";
}

function sclOddsSectionHasData_SCL(section) {
  if (section == null) return false;
  return (
    sclOddsValueHasData_SCL(section.home) ||
    sclOddsValueHasData_SCL(section.away) ||
    sclOddsValueHasData_SCL(section.rate) ||
    sclOddsValueHasData_SCL(section.over) ||
    sclOddsValueHasData_SCL(section.under)
  );
}

function sclHasStreamOddsData_SCL(data) {
  if (!data) return false;
  return sclOddsSectionHasData_SCL(data.hdp) || sclOddsSectionHasData_SCL(data.ou);
}

function sclNormalizeAssetBase_SCL(base) {
  if (!base) return "";
  return String(base).endsWith("/") ? String(base) : `${base}/`;
}

function sclGetImagePath_SCL() {
  if (typeof DV2_IMAGE_PATH !== "undefined" && DV2_IMAGE_PATH) {
    return sclNormalizeAssetBase_SCL(DV2_IMAGE_PATH);
  }

  if (typeof window.DV2_STREAMING_PLUGIN_URL === "string" && window.DV2_STREAMING_PLUGIN_URL) {
    return `${sclNormalizeAssetBase_SCL(window.DV2_STREAMING_PLUGIN_URL)}assets/images/`;
  }

  if (typeof dv2Streaming !== "undefined") {
    if (dv2Streaming.imagePath) {
      return sclNormalizeAssetBase_SCL(dv2Streaming.imagePath);
    }
    if (dv2Streaming.pluginUrl) {
      return `${sclNormalizeAssetBase_SCL(dv2Streaming.pluginUrl)}assets/images/`;
    }
  }

  return "../../assets/images/";
}

function sclGetSocoliveImgBase_SCL() {
  return `${sclGetImagePath_SCL()}socolive/`;
}

function sclGetSocoliveImageUrl_SCL(filename) {
  const file = String(filename || "").replace(/^\//, "");
  return `${sclGetSocoliveImgBase_SCL()}${file}`;
}

function sclGetHomeBetButtonsDefaultHtml_SCL() {
  return `
    <a href="#">
      <img src="${sclGetSocoliveImageUrl_SCL("cuoc-say88.png")}" alt="Cược SAY88" />
    </a>
    <a href="#">
      <img src="${sclGetSocoliveImageUrl_SCL("cuoc-fabet88.png")}" alt="Cược FABET88" />
    </a>
    <a href="#">
      <img src="${sclGetSocoliveImageUrl_SCL("cuoc-fabet88.png")}" alt="Cược FABET88" />
    </a>`;
}

function sclGetHomeBetButtonHeaderDefaultHtml_SCL() {
  return `<img src="${sclGetSocoliveImageUrl_SCL("top-banner.png")}" alt="top-banner"/>`;
}

function sclGetHomeBetButtonFooterDefaultHtml_SCL() {
  const href =
    typeof window.DV2_LINK_BET === "string" && window.DV2_LINK_BET.trim()
      ? window.DV2_LINK_BET
      : "#";

  return `<a href="${href}" target="_blank" rel="nofollow">
    <img src="${sclGetSocoliveImageUrl_SCL("footer-banner-cuocngay-say88.png")}" alt="banner cược ngay footer" />
  </a>`;
}

function sclGetHomeBetButtonsHtml_SCL() {
  const html = window.DV2_SOCOLIVE_HOME_BET_BUTTONS_HTML;
  if (typeof html === "string" && html.trim()) {
    return html;
  }
  return sclGetHomeBetButtonsDefaultHtml_SCL();
}

function sclGetHomeBetButtonHeaderHtml_SCL() {
  const html = window.DV2_SOCOLIVE_HOME_BET_BUTTON_HEADER_HTML;
  if (typeof html === "string" && html.trim()) {
    return html;
  }
  return sclGetHomeBetButtonHeaderDefaultHtml_SCL();
}

function sclGetHomeBetButtonFooterHtml_SCL() {
  const html = window.DV2_SOCOLIVE_HOME_BET_BUTTON_FOOTER_HTML;
  if (typeof html === "string" && html.trim()) {
    return html;
  }
  return sclGetHomeBetButtonFooterDefaultHtml_SCL();
}

function sclGetStreamDetailUrl_SCL(data, link) {
  if (!data) return "";

  const matchId = data.matchId || data.match_id || data.id || "";
  if (!matchId) return "";

  let activeLink = link || null;
  if (!activeLink) {
    const rawLinks = data.livestream?.links || [];
    const links = sortLivestreamLinksPreferRealBlv(rawLinks);
    activeLink = links[0] || rawLinks[0] || null;
  }

  if (window.DV2StreamLinks?.getDetailUrl) {
    return DV2StreamLinks.getDetailUrl(matchId, activeLink, { trailingSlash: true });
  }

  const encodedMatchId = encodeURIComponent(String(matchId));
  const liveId = activeLink?.liveId;
  if (liveId != null && liveId !== "") {
    return `/streams/${encodedMatchId}/?liveId=${encodeURIComponent(String(liveId))}`;
  }

  return `/streams/${encodedMatchId}/`;
}

function sclBindFeaturedStreamClick_SCL(detailUrl) {
  const $wrapper = getStreamVideoWrapperHome_SCL();
  if (!$wrapper.length) return;

  if (detailUrl) {
    $wrapper.attr("data-stream-detail-url", detailUrl).addClass("dv2-video-wrapper--clickable");
  } else {
    $wrapper.removeAttr("data-stream-detail-url").removeClass("dv2-video-wrapper--clickable");
  }
}

function sclRefreshFeaturedReviveAds_SCL() {
  window.DV2_StreamChrome?.refreshReviveAds?.(getMatchTopInfoHome_SCL());
}

function sclRefreshHotLiveReviveAds_SCL() {
  window.DV2_StreamChrome?.refreshReviveAds?.(
    $(".dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content"),
  );
}

function sclInitTopMarquee_SCL($root) {
  const $scope = $root?.length ? $root : getMatchTopInfoHome_SCL();
  $scope.find(".dv2-video-inner-top-marquee").each(function () {
    const container = this;
    const track = container.querySelector(".dv2-video-inner-top-marquee-track");
    const contents = track?.querySelectorAll(".dv2-video-inner-top-marquee-content");
    if (!track || !contents?.length) return;

    contents.forEach((el) => {
      el.style.display = "";
    });

    const contentWidth = contents[0].offsetWidth;
    if (!contentWidth) return;

    const pxPerSec = 60;
    const duration = Math.max(contentWidth / pxPerSec, 6);
    // track.style.animation = `dv2-video-inner-marquee ${duration}s linear infinite`;
  });
}

function sclScheduleTopMarqueeInit_SCL($root) {
  const run = () => sclInitTopMarquee_SCL($root);
  requestAnimationFrame(() => requestAnimationFrame(run));
  setTimeout(run, 400);
}

function renderNewScreen_SCL(data) {
  if (!data) return;

  const league = data.league || {};
  const home = data.teams?.home || {};
  const away = data.teams?.away || {};
  const matchInfo = data.matchInfo || {};
  const hdp = data.hdp;
  const ou = data.ou;
  const hasOddsData = sclHasStreamOddsData_SCL(data);
  const links = data.livestream?.links || [];
  const detailUrl = sclGetStreamDetailUrl_SCL(data);
  const betButtonsHtml = sclGetHomeBetButtonsHtml_SCL();
  const betButtonHeaderHtml = sclGetHomeBetButtonHeaderHtml_SCL();
  const betButtonFooterHtml = sclGetHomeBetButtonFooterHtml_SCL();

  const leagueName = league.name || "";
  const leagueLogo = league.logo || "";
  const homeName = home.name || "Home";
  const homeLogo = home.logo || "";
  const awayName = away.name || "Away";
  const awayLogo = away.logo || "";

  const kickoff = matchInfo.kickoff ? new Date(matchInfo.kickoff) : null;
  const dateStr = kickoff
    ? `${String(kickoff.getDate()).padStart(2, "0")}/${String(kickoff.getMonth() + 1).padStart(2, "0")}`
    : "";

  let timeStr = "";
  if (kickoff) {
    const now = new Date();
    const diffMs = kickoff - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs > 0 && diffHours < 24) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      matchInfo._kickoffForCountdown = kickoff;
    } else {
      timeStr = `${String(kickoff.getHours()).padStart(2, "0")}:${String(kickoff.getMinutes()).padStart(2, "0")}`;
    }
  }

  const commentatorHtml = links.length
    ? links
        .map((link) => {
          const commentatorUrl = sclGetStreamDetailUrl_SCL(data, link);
          return `
            <a href="${commentatorUrl}">
              <div class="dv2-video-inner-commentator-item">
                <div class="dv2-video-inner-commentator-avatar">
                  ${link.avatar ? `<img src="${link.avatar}" alt="${link.commentator}" />` : "👨"}
                </div>
                <div class="dv2-video-inner-commentator-name">${link.commentator}</div>
              </div>
            </a>`;
        })
        .join("")
    : "";

  const oddsHtml = hasOddsData
    ? `
      <div class="dv2-video-inner-odds">
        <div class="dv2-video-inner-odds-group">
          <div class="dv2-video-inner-odds-type">HDP</div>
          <div class="dv2-video-inner-odds-values">
            <div>${hdp?.home ?? ""}</div>
            <div>${hdp?.rate ?? ""}</div>
            <div>${hdp?.away ?? ""}</div>
          </div>
        </div>
        <div class="dv2-video-inner-odds-group">
          <div class="dv2-video-inner-odds-type">O/U</div>
          <div class="dv2-video-inner-odds-values">
            <div>${ou?.over ?? "-"}</div>
            <div>${ou?.rate ?? "-"}</div>
            <div>${ou?.under ?? "-"}</div>
          </div>
        </div>
      </div>`
    : "";

  const html = `
    <div class="dv2-video-inner-top-banner">
      <div class="dv2-video-inner-top-left">
        <div class="dv2-video-inner-top-icon"><img src="${leagueLogo}" alt="${leagueName}" /></div>
        <div class="dv2-video-inner-top-title">${leagueName}</div>
      </div>
      <div class="dv2-video-inner-top-marquee">
        <div class="dv2-video-inner-top-marquee-track">
          <div class="dv2-video-inner-top-marquee-content">${betButtonHeaderHtml}</div>
          <div class="dv2-video-inner-top-marquee-content" aria-hidden="true">${betButtonHeaderHtml}</div>
        </div>
      </div>
    </div>
    <div class="dv2-video-inner-main-banner">
      <div class="dv2-video-inner-team-info">
        <div class="dv2-video-inner-team dv2-video-inner-team-left">
          <div class="dv2-video-inner-team-flag">
            ${homeLogo ? `<img src="${homeLogo}" alt="${homeName}" />` : ""}
          </div>
          <div class="dv2-video-inner-team-name">${homeName}</div>
        </div>
        <div class="vs-image">
          <img src="${sclGetSocoliveImageUrl_SCL("vs-icon.png")}" alt="VS" />
        </div>
        <div class="dv2-video-inner-team dv2-video-inner-team-right">
          <div class="dv2-video-inner-team-flag">
            ${awayLogo ? `<img src="${awayLogo}" alt="${awayName}" />` : ""}
          </div>
          <div class="dv2-video-inner-team-name">${awayName}</div>
        </div>
      </div>
    </div>
    <div class="dv2-video-inner-time-box-wrapper">
      <div class="dv2-video-inner-time-box">
        <div class="dv2-video-inner-time-label">Thời gian: ${dateStr}</div>
        <div class="dv2-video-inner-time-value">${timeStr}</div>
      </div>
    </div>
    <div class="dv2-video-inner-footer-bar">
      <div class="dv2-video-inner-odds-row">
        ${oddsHtml}
        <div class="dv2-video-inner-cta-group"><div class="dv2-video-inner-cta-track">${betButtonsHtml}</div></div>
      </div>
      <div class="dv2-video-inner-commentator">
        ${betButtonFooterHtml}
        <div class="dv2-video-inner-commentator-list">${commentatorHtml}</div>
      </div>
    </div>`;

  const $matchTopInfo = getMatchTopInfoHome_SCL();
  $matchTopInfo.html(html);
  sclBindFeaturedStreamClick_SCL(detailUrl);
  sclRefreshFeaturedReviveAds_SCL();
  sclScheduleTopMarqueeInit_SCL($matchTopInfo);
  $matchTopInfo.find(".dv2-video-inner-top-marquee img").each(function () {
    if (this.complete) {
      sclScheduleTopMarqueeInit_SCL($matchTopInfo);
    } else {
      $(this).one("load error", () => sclScheduleTopMarqueeInit_SCL($matchTopInfo));
    }
  });

  if (matchInfo._kickoffForCountdown) {
    const kickoffForCountdown = matchInfo._kickoffForCountdown;
    delete matchInfo._kickoffForCountdown;

    if (window._sclCountdownInterval) {
      clearInterval(window._sclCountdownInterval);
    }

    window._sclCountdownInterval = setInterval(() => {
      const diffMs = kickoffForCountdown - new Date();
      if (diffMs <= 0) {
        clearInterval(window._sclCountdownInterval);
        window._sclCountdownInterval = null;
        location.reload();
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      const countdownStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      getMatchTopInfoHome_SCL().find(".dv2-video-inner-time-value").text(countdownStr);
    }, 1000);
  }
}

function renderSliderAppointmentsBlock_SCL(matches) {
  const $scheduleContainer = $(".dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container");
  const $wrapper = $scheduleContainer.find(".dv2-swiper-wrapper");
  $wrapper.empty();

  matches.forEach(function (match, index) {
    const matchId = match?.match_id || match?.id || match?.slug || index;
    const leagueName = match?.league?.name || "N/A";
    const leagueLogo =
      match?.league?.logo ||
      "https://sta.vnres.co/file/common/20210503/fca5954ec22137ad05325506d6645592";
    const dateLabel = getDateLabel_SCL(match?.kickoff || "");
    const timeLabel = formatTime_SCL(match?.kickoff || "");
    const homeName = match?.teams?.home?.name || "Home Team";
    const homeLogo = match?.teams?.home?.logo || "Logo";
    const awayName = match?.teams?.away?.name || "Away Team";
    const awayLogo = match?.teams?.away?.logo || "Logo";

    $wrapper.append(`
      <div class="dv2-swiper-slide swiper-slide" style="cursor:pointer;" data-id="${matchId}" onclick="goToMatchDetail('${matchId}')">
        <div class="dv2-title">
          <div class="dv2-fl">
            <img onerror="this.src='${TEAM_ICON_FALLBACK}'" src="${leagueLogo}" class="icon" draggable="false">
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
              <img onerror="this.src='${TEAM_ICON_FALLBACK}'" class="dv2-logo" src="${homeLogo}" data-src="${homeLogo}" draggable="false">
              <span class="dv2-ellipsis">${homeName}</span>
            </p>
            <p>
              <img onerror="this.src='${TEAM_ICON_FALLBACK}'" class="dv2-logo" src="${awayLogo}" data-src="${awayLogo}" alt="" draggable="false">
              <span class="dv2-ellipsis">${awayName}</span>
            </p>
          </div>
          <a href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow"
            data-id="${matchId}" data-slug="${match.slug || ""}"
            class="dv2-appoinment" onclick="event.stopPropagation();" draggable="false">
            <span class="no-appoinment">Đặt cược</span>
          </a>
        </div>
      </div>
    `);
  });

  $scheduleContainer.show();
  initSwiperInstance(
    ".dv2-layout-scl.dv2-appoinment-list-ctn .dv2-appoinment-swiper-container",
    ".dv2-appoinment-next",
    ".dv2-appoinment-prev"
  );
}

function renderSlideBlvBlock_SCL() {
  const $scheduleContainer = $(".dv2-layout-scl.dv2-blv-list-ctn .dv2-anchor-swiper-container");
  const $wrapper = $scheduleContainer.find(".dv2-swiper-wrapper");
  $wrapper.empty();
  $wrapper.html(`
    <div class="dv2-loading-blv" style="color:#000;text-align:center;padding:40px 0;">
      Đang tải danh sách bình luận viên...
    </div>
  `);

  $.ajax({
    url: `${baseApiUrl}/api/admin/streams/commentators`,
    method: "GET",
    dataType: "json",
    success(res) {
      if (!res || res.message !== "success" || !Array.isArray(res.commentators)) {
        $wrapper.html(
          '<div style="color:#fff;text-align:center;padding:40px 0;">Không có dữ liệu bình luận viên</div>'
        );
        return;
      }

      if (!res.commentators.length) {
        $wrapper.html(
          '<div style="color:#fff;text-align:center;padding:40px 0;">Không có bình luận viên nào</div>'
        );
        return;
      }

      $wrapper.empty();
      res.commentators.forEach((blv) => {
        const name = blv?.name || "Bình luận viên";
        const avatar =
          blv?.avatar ||
          "https://sta.vnres.co/file/common/20250410/000bfdfc22afe0f322140fabd2228aec.jpg";
        $wrapper.append(`
          <div class="dv2-swiper-slide swiper-slide dv2-person-blv" data-id="${blv?.id}">
            <a href="javascript:void(0)">
              <img onerror="this.src='${TEAM_ICON_FALLBACK}'" class="dv2-blv-avatar" src="${avatar}" alt="${name}">
              <p class="dv2-blv-name ellipsis">${name}</p>
            </a>
          </div>
        `);
      });

      initSwiperInstanceCom(
        ".dv2-layout-scl.dv2-blv-list-ctn .dv2-anchor-swiper-container",
        ".dv2-anchor-next",
        ".dv2-anchor-prev"
      );
    },
    error() {
      $wrapper.html(`
        <div style="color:#fff;text-align:center;padding:40px 0;">
          Lỗi khi tải danh sách bình luận viên
        </div>
      `);
    },
  });
}

function getHotLiveRenderOptions_SCL() {
  return {
    baseApiUrl,
    ajax: $.ajax,
    sortedMatchesFunction: hotLiveSortedMatchesFunction,
    liveStatuses: LIVE_STATUS,
    hotLeaguesRank: appState.hotLeaguesRank,
    getPreferredLivestreamLink,
    onRendered() {
      sclRefreshHotLiveReviveAds_SCL();
    },
  };
}

function renderHotLiveBlock_SCL(matches = []) {
  DV2SocoliveHotLive.render(matches, getHotLiveRenderOptions_SCL());
}

function initHotLiveBlock_SCL() {
  if (!$(".dv2-layout-scl.dv2-hotlive-ctn .dv2-hot-content").length) {
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

function renderListLiveMatch_SCL(liveMatch) {
  const $roomList = $(".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-room-list");
  const slicedMatches = (liveMatch || []).slice(0, 10).map((match) => {
    const title = (match?.title || match?.slug || "Trận đấu").replace(/vuasanco/gi, "").trim();
    const slug = match?.slug || title.toLowerCase().replace(/\s+/g, "-");
    return {
      id: match?.match_id || slug,
      homeLogo: match?.teams?.home?.logo || "",
      awayLogo: match?.teams?.away?.logo || "",
      homeName: match?.teams?.home?.name || "Đội nhà",
      awayName: match?.teams?.away?.name || "Đội khách",
    };
  });

  $roomList.empty();
  slicedMatches.forEach((match, index) => {
    $roomList.append(`
      <li class="dv2-item-match" data-id="${match.id}" data-index="${index}">
        <a href="javascript:void(0)" class="${index === 0 ? "dv2-active" : ""}">
          <div class="dv2-match-card">
            <div class="dv2-team dv2-team-home">
              <img class="dv2-team-logo" src="${match.homeLogo}" alt="${match.homeName}" onerror="this.src='${TEAM_ICON_FALLBACK}'">
              <span class="dv2-team-name">${match.homeName}</span>
            </div>
            <div class="vs">VS</div>
            <div class="dv2-team dv2-team-away">
              <img class="dv2-team-logo" src="${match.awayLogo}" alt="${match.awayName}" onerror="this.src='${TEAM_ICON_FALLBACK}'">
              <span class="dv2-team-name">${match.awayName}</span>
            </div>
          </div>
        </a>
      </li>
    `);
  });
}

function formatTime_SCL(datetime) {
  if (!datetime) return "";
  const date = new Date(datetime);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
    return "Hôm nay";
  }
  if (match.getTime() === tomorrow.getTime()) {
    return "Ngày mai";
  }

  const day = String(match.getDate()).padStart(2, "0");
  const month = String(match.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function initSwiperInstance(containerSelector, nextBtnSelector, prevBtnSelector) {
  if (!$(containerSelector).length) {
    return null;
  }

  return new Swiper(containerSelector, {
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

  return new Swiper(containerSelector, {
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

$(document).on(
  "click",
  ".dv2-layout-scl.dv2-home-featured-streaming-ctn .dv2-video-wrapper.dv2-video-wrapper--clickable",
  function (e) {
    if (
      $(e.target).closest(
        "a, button, input, label, .dv2-video-inner-cta-group, .dv2-video-inner-commentator-list"
      ).length
    ) {
      return;
    }

    const url = $(this).attr("data-stream-detail-url");
    if (url) {
      window.location.href = url;
    }
  }
);

$(document).on("click", ".dv2-layout-scl.dv2-hotlive-ctn .dv2-game", function (e) {
  if ($(e.target).closest(".dv2-blv-dropdown").length) {
    return;
  }
  const $btn = $(this);
  const href = $btn.attr("href");
  if (href && href !== "#") {
    return;
  }
  e.preventDefault();
  const matchId = $btn.data("id") || "";
  window.location.href = `/streams/${matchId}`;
});

function goToMatchDetail(matchId) {
  window.location.href = `/streams/${matchId}`;
}
