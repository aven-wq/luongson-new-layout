$ = jQuery.noConflict();

const BASE_API_URL = "https://vsc-apidev.helizones.com/api/data/";
const SUGGESTED_STREAM_PAGE_SIZE = 12;
const appState = {
  hotLeaguesRank: new Map(),
};
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  // "interrupt",
  //"cut in half",
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

const NHADAI_COMMENTATOR_ID = 99999999999999999;

function isNhaDaiLivestreamLink(link) {
  if (!link) return false;
  if (link.commentatorId === NHADAI_COMMENTATOR_ID) return true;
  const name = String(link.commentator || "").trim().toLowerCase();
  return name === "nhà đài" || name === "nha dai" || name === "blv nhà đài";
}

function sortLivestreamLinksPreferRealBlv(links) {
  if (!Array.isArray(links)) return [];
  links.sort((a, b) => {
    const aIsNhaDai = isNhaDaiLivestreamLink(a);
    const bIsNhaDai = isNhaDaiLivestreamLink(b);
    if (aIsNhaDai && !bIsNhaDai) return 1;
    if (!aIsNhaDai && bIsNhaDai) return -1;
    return 0;
  });
  return links;
}

function getPreferredLivestreamLink(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) return null;
  sortLivestreamLinksPreferRealBlv(links);
  return links[0] || null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMatchId(match) {
  return match?.match_id || match?.matchId || match?.id || match?.slug || "";
}

function getSortedCommentatorLinks(match) {
  if (window.DV2StreamLinks?.sortForDetail) {
    return window.DV2StreamLinks.sortForDetail(match?.livestream?.links);
  }
  return sortLivestreamLinksPreferRealBlv(
    Array.isArray(match?.livestream?.links) ? [...match.livestream.links] : [],
  );
}

function getDetailUrl(matchId, link) {
  return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: false });
}

function renderBlvAvatar(link, label, className) {
  const avatar = link?.avatar;
  if (!avatar) return "";
  return `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(label)}" class="${className}" onerror="this.style.display='none'">`;
}

function buildCommentatorDropdown(match) {
  const sortedLinks = getSortedCommentatorLinks(match);

  if (!sortedLinks.length) {
    return `
      <div class="inline-flex gap-1.5 items-center font-semibold overflow-hidden text-sm rounded-3xl" style="background-color: #4986f7">
        <span class="pr-3 py-1 whitespace-nowrap text-ellipsis overflow-hidden">BLV Nhà Đài</span>
      </div>
    `;
  }

  return window.DV2BlvDropdown.build({
    match,
    links: sortedLinks,
    getDetailUrl,
    escapeHtml,
    menuPlacement: "up",
    toggleClass:
      "ck2-blv-dropdown__toggle--pill inline-flex gap-1.5 items-center font-semibold text-sm rounded-3xl",
    renderToggle: ({ link, label, esc }) => `
      ${renderBlvAvatar(link, label, "w-8 h-8 rounded-full m-0.5")}
      <span class="py-1 whitespace-nowrap text-ellipsis overflow-hidden max-w-[120px]">${esc(label)}</span>
    `,
    renderItemContent: ({ link, label, esc }) => `
      ${renderBlvAvatar(link, label, "dv2-blv-dropdown__avatar")}
      <span class="dv2-blv-dropdown__label">${esc(label)}</span>
    `,
  });
}

function bindCk2BlvDropdownEvents() {
  window.DV2BlvDropdown.bind($("#match_list_ck2_container"), {
    namespace: "ck2BlvDropdown",
  });
}

let allMatchesGlobal = [];
let suggestedStreamVisibleCount = 0;
let suggestedStreamAdInsertions = new Map();

function getMatchListAdBlocks_CK2() {
  return window.DV2ListAds?.getBlocks?.(
    window.DV2_SOCOLIVE_MATCH_LIST_ADS,
  ) || [];
}

function buildMatchListAdInsertions_CK2(totalItems) {
  const blocks = getMatchListAdBlocks_CK2();
  return (
    window.DV2ListAds?.buildInsertions?.(blocks, totalItems, {
      breakpoint: window.DV2_SOCOLIVE_MATCH_LIST_ADS_MOBILE_BREAKPOINT,
      repeatCycle: window.DV2_SOCOLIVE_MATCH_LIST_ADS_REPEAT,
    }) || new Map()
  );
}

function buildMatchListAdMarkup_CK2(adBlock) {
  return (
    window.DV2ListAds?.buildMarkup?.(adBlock, {
      wrapperTag: "div",
      wrapperClass: "dv2-hot-content-ad",
    }) || ""
  );
}

function refreshMatchListReviveAds_CK2($container) {
  window.DV2ListAds?.refreshReviveAds?.($container);
}

$(document).ready(function () {
  loadSuggestedStreamData();
});

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function loadSuggestedStreamData() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const fromDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const toDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

  const payload = {
    fromDate: fromDate,
    toDate: toDate,
  };

  console.log("[VSC LIVE] Loading suggested streams:", payload);
  DV2HotLeagues.load({
    url: `${BASE_API_URL}lives/competitions/hot`,
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });
  $.ajax({
    url: `${BASE_API_URL}lives/range-date`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function (res) {
      console.log("[VSC LIVE] Suggested streams API response:", res);
      if (res?.status === "success" && res?.matches_by_date) {
        // Flatten all matches from all dates
        let allMatches = [];
        Object.values(res.matches_by_date).forEach((dateMatches) => {
          allMatches = allMatches.concat(dateMatches);
        });

        // Filter out finished matches
        allMatches = allMatches.filter(
          (match) => match?.status?.toLowerCase() !== "finished",
        );

        // Sort by priority:
        // 1. Live matches first (by kickoff time)
        // 2. Upcoming matches (by kickoff time)
        const sortMatches = sortedMatchesFunction(allMatches);
        // allMatches.sort((a, b) => {
        //   const aStatus = a?.status?.toLowerCase() || "";
        //   const bStatus = b?.status?.toLowerCase() || "";

        //   const aIsLive = LIVE_STATUS.includes(aStatus);
        //   const bIsLive = LIVE_STATUS.includes(bStatus);

        //   // Live matches come first
        //   if (aIsLive && !bIsLive) return -1;
        //   if (!aIsLive && bIsLive) return 1;

        //   // If both are live or both are not live, sort by kickoff time
        //   return new Date(a.kickoff) - new Date(b.kickoff);
        // });

        console.log(
          "[VSC LIVE] Filtered and sorted matches:",
          sortMatches.length,
        );
        console.log(
          "[VSC LIVE] First few matches:",
          sortMatches.slice(0, 3).map((m) => ({
            id: m.match_id,
            status: m.status,
            teams: `${m.teams?.home?.name} vs ${m.teams?.away?.name}`,
            kickoff: m.kickoff,
          })),
        );

        allMatchesGlobal = sortMatches;
        suggestedStreamVisibleCount = 0;
        initSuggestedStreams();
      } else {
        console.error("[VSC LIVE] Invalid API response");
        showError("Không thể tải danh sách trận đấu");
      }
    },
    error: function (xhr, status, error) {
      console.error("[VSC LIVE] API error:", error);
      showError("Có lỗi xảy ra khi tải dữ liệu");
    },
  });
}

function initSuggestedStreams() {
  const $container = $("#match_list_ck2_container");

  $container.empty();
  console.log('allMatchesGlobal',allMatchesGlobal);

  suggestedStreamAdInsertions = buildMatchListAdInsertions_CK2(
    allMatchesGlobal.length,
  );
  
  if (!allMatchesGlobal.length) {
    $container.html(
      '<div class="no-matches">Hiện tại không có trận đấu nào đang diễn ra.</div>',
    );
    if (suggestedStreamAdInsertions.has(0)) {
      $container.append(
        buildMatchListAdMarkup_CK2(
          suggestedStreamAdInsertions.get(0),
        ),
      );
    }
    refreshMatchListReviveAds_CK2($container);
    updateSuggestedLoadMoreVisibility();
    return;
  }

  renderNextSuggestedBatch();
  bindCk2BlvDropdownEvents();
  $("#ck2SuggestedLoadMore").off("click").on("click", renderNextSuggestedBatch);
}

function renderNextSuggestedBatch() {
  const $container = $("#match_list_ck2_container");
  const nextBatch = allMatchesGlobal.slice(
    suggestedStreamVisibleCount,
    suggestedStreamVisibleCount + SUGGESTED_STREAM_PAGE_SIZE,
  );

  if (!nextBatch.length) {
    updateSuggestedLoadMoreVisibility();
    return;
  }

  let html = "";
  nextBatch.forEach((match, localIndex) => {
    const globalPosition =
      suggestedStreamVisibleCount + localIndex + 1;

    html += generateMatchBlock(match);

    if (suggestedStreamAdInsertions.has(globalPosition)) {
      html += buildMatchListAdMarkup_CK2(
        suggestedStreamAdInsertions.get(globalPosition),
      );
    }
  });

  $container.append(html);
  refreshMatchListReviveAds_CK2($container);
  bindCk2BlvDropdownEvents();
  suggestedStreamVisibleCount += nextBatch.length;
  updateSuggestedLoadMoreVisibility();
}

function updateSuggestedLoadMoreVisibility() {
  const $btn = $("#ck2SuggestedLoadMore");
  const $footer = $(".ck2-suggested-streams-footer");

  const hasMore =
    allMatchesGlobal.length > SUGGESTED_STREAM_PAGE_SIZE &&
    suggestedStreamVisibleCount < allMatchesGlobal.length;

  if (!$btn.length) {
    return;
  }

  if (hasMore) {
    $footer.prop("hidden", false).show();
    $btn.prop("hidden", false);
  } else {
    $footer.prop("hidden", true).hide();
    $btn.prop("hidden", true);
  }
}

function generateMatchBlock(match) {
  const homeTeam = match?.teams?.home;
  const awayTeam = match?.teams?.away;
  const league = match?.league;
  const score = match?.score;

  // Determine match status and display
  const matchStatus = match?.status?.toLowerCase() || "not started";
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
  const isLive = LIVE_STATUS.includes(matchStatus);

  // Get current time display
  let currentTimeDisplay = "";
  if (isLive) {
    // Use currentMinutes if available, otherwise calculate from status
    if (match?.currentMinutes) {
      currentTimeDisplay = `${match.currentMinutes}'`;
    } else {
      currentTimeDisplay = getCurrentMatchTime(match);
    }
  } else {
    currentTimeDisplay = ""; // Don't show time for finished/upcoming matches
  }

  // Get scores
  const homeScore = score?.fulltime?.home || 0;
  const awayScore = score?.fulltime?.away || 0;

  const matchId = getMatchId(match);

  // Check hot match
  const isHot = appState.hotLeaguesRank.has(match.league.id);

  return `
    <div class="match-info-primary w-full match_list--item ${isHot ? "hot-match" :''} ">
        <div class="bg-white text-black rounded-xl flex flex-col h-full">
            <div class="relative flex-1">
                <a class="match_item--link absolute top-0 left-0 w-full h-full"
                    href="/streams/${matchId}"></a>
                <div class="event-league text-center p-3 pt-2">
                    <div class="flex justify-between items-center gap-2 text-neutral-3">
                        <div class="text-primary font-medium flex items-center gap-1 uppercase flex-1">
                            ${
                              isLive
                                ? `<img decoding="async" src="${DV2_IMAGE_PATH}cakhia/hot.png" alt="hot" class="">Live`
                                : ""
                            }
                        </div>
                        <div class="flex items-center justify-center gap-2">
                            <img decoding="async" class="match_item--llogo icon-cup text-2xl leading-6" src="${
                              league?.logo || ""
                            }" alt="${
                              league?.name || ""
                            }" style="width: 24px; height: 24px;"/>
                            <span class="match_item--lname text-sm whitespace-nowrap text-ellipsis overflow-hidden max-w-[150px]">
                                ${league?.name || ""}
                            </span>
                        </div>
                        <div class="h-6 flex flex-1 justify-end"></div>
                    </div>
                </div>
                <div class="flex flex-row justify-between items-stretch gap-3 px-2">
                    <div class="flex-1 items-center justify-start flex flex-col gap-4 text-center">
                        <div class="match_item--home-logo inline-flex justify-center items-center max-w-max">
                            <img class="w-12 h-12 object-cover rounded-full" rel="nofollow"
                                src="${homeTeam?.logo || ""}"
                                alt="${homeTeam?.name || ""}">
                        </div>
                        <h5 class="match_item--home-name team-name text-sm lg:text-base lg:leading-5 font-medium line-clamp-2 min-h-10 lg:min-h-auto">
                            ${homeTeam?.name || ""}
                        </h5>
                    </div>
                    <div class="text-2xl font-medium flex flex-col items-center justify-center gap-3">
                        ${
                          currentTimeDisplay
                            ? `<span class="match_item--current-time time text-minute font-normal text-sm lg:text-base capitalize">${currentTimeDisplay}</span>`
                            : ""
                        }
                        <span>
                            ${
                              isLive || matchStatus === "finished"
                                ? `<span class="match_item--home-score">${homeScore}</span> - <span class="match_item--away-score">${awayScore}</span>`
                                : `<span class="">vs</span>`
                            }
                        </span>
                        <span class="match_item--kickoff-time time text-sm font-medium">${formatKickoffTime(
                          match?.kickoff,
                        )}</span>
                    </div>
                    <div class="flex-1 items-center justify-start flex flex-col gap-4 text-center">
                        <div class="match_item--away-logo inline-flex justify-center items-center max-w-max">
                            <img loading="lazy" class="w-12 h-12 object-cover rounded-full" rel="nofollow"
                                src="${awayTeam?.logo || ""}"
                                alt="${awayTeam?.name || ""}">
                        </div>
                        <h5 class="match_item--away-name team-name text-sm lg:text-base lg:leading-5 font-medium line-clamp-2 min-h-10 lg:min-h-auto">
                            ${awayTeam?.name || ""}
                        </h5>
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-center gap-2 px-2 pb-2 text-white z-10 pt-3 mt-3 border-t border-gradient">
                ${buildCommentatorDropdown(match)}
                <div class="flex gap-1 shrink-0">
                    <a class="${
                      isLive
                        ? "py-1 px-4 rounded-3xl font-semibold text-sm capitalize leading-5 text-xs leading-6 bg-primary cakhia-btn-hover"
                        : "py-2 px-3 font-semibold text-sm capitalize  text-sm border text-xs border-neutral-3 text-neutral-3 rounded-3xl cakhia-btn-hover"
                    } "
                        href="/streams/${matchId}"
                        <span class="inline-block">${
                          isLive ? "Trực tiếp" : "Sắp diễn ra"
                        }</span></a>
                    <a href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow" class="cakhia-btn-bet text-white py-1 px-3 rounded-3xl font-semibold text-sm capitalize text-sm leading-5 bg-primary-1 text-xs leading-6">Đặt cược</a>
                </div>
            </div>
        </div>
    </div>
  `;
}

function getCurrentMatchTime(match) {
  // This would need to be calculated based on match start time and current time
  // For now, return a placeholder based on status
  const status = match?.status?.toLowerCase();
  if (status === "first half") return "45+";
  if (status === "half-time" || status === "half time") return "HT";
  if (status === "second half") return "90+";
  return "LIVE";
}

function formatKickoffTime(kickoffTime) {
  if (!kickoffTime) return "";

  const date = new Date(kickoffTime);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  return `${hours}:${minutes} ${day}/${month}`;
}

function showError(message) {
  const $container = $(".suggested-streams-container");
  $container.html(`
    <div class="error-message" style="color: red; text-align: center; padding: 20px;">
      ${message}
    </div>
  `);
}
