// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();
const appState = {
  hotLeaguesRank: new Map(),
};
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  // "interrupt",
  //   "cut in half", // bị hoãn nên remove khỏi live
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

function escapeHtml_TC(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMatchId_TC(match) {
  return match?.match_id || match?.matchId || match?.id || match?.slug || "";
}

function getDetailUrl_TC(matchId, link) {
  return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: true });
}

function renderTcBlvAvatar(link, label) {
  const avatar = link?.avatar;
  if (avatar) {
    return `
      <div class="dv2-commentator-avatar">
        <img src="${escapeHtml_TC(avatar)}" alt="${escapeHtml_TC(label)}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
      </div>
    `;
  }
  const initial = label ? label.charAt(0) : "?";
  return `<div class="dv2-commentator-avatar">${escapeHtml_TC(initial)}</div>`;
}

function buildCommentatorDropdown_TC(match) {
  const sortedLinks = window.DV2BlvDropdown.getSortedLinks(match);

  return window.DV2BlvDropdown.build({
    match,
    links: sortedLinks,
    getDetailUrl: getDetailUrl_TC,
    escapeHtml: escapeHtml_TC,
    menuPlacement: "up",
    emptyHtml: "<div></div>",
    toggleClass: "dv2-commentator-info",
    renderToggle: ({ link, label }) => `
      ${renderTcBlvAvatar(link, label)}
      <span class="dv2-commentator-name">${escapeHtml_TC(label)}</span>
    `,
    renderItemContent: ({ link, label }) => `
      ${renderTcBlvAvatar(link, label)}
      <span class="dv2-commentator-name">${escapeHtml_TC(label)}</span>
    `,
  });
}

function bindTcBlvDropdownEvents() {
  window.DV2BlvDropdown.bind($(".dv2-layout-tc.dv2-home-matches #matchGrid"), {
    namespace: "tcBlvDropdown",
    stopPropagationOnWrap: true,
  });
}

// =================================================
// Init
// =================================================
$(document).ready(function () {
  if ($(".dv2-layout-tc.dv2-home-matches").length > 0) {
    loadHomeData_TC();
    // Auto refresh every minute
    // setInterval(loadHomeData_TC, 60000);
  }
});

// =================================================
// Render home page
// =================================================
function renderHomePage_TC(matches) {
  const now = new Date();

  // Filter and sort matches
  const liveMatches = [];
  const upcomingMatches = [];

  matches.forEach((match) => {
    const kickoff = new Date(match.kickoff);
    // const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));
    // if (now >= kickoff && now <= matchEndTime && match.livestream.available) {
    const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
    if (isLive) {
      liveMatches.push(match);
    } else if (now < kickoff) {
      upcomingMatches.push(match);
    }
  });

  // Combine: live first, then upcoming
  const allMatches = [...liveMatches, ...upcomingMatches];

  //   allMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const sortedMatches = sortedMatchesFunction(allMatches);
  const $grid = $(".dv2-layout-tc.dv2-home-matches #matchGrid");
  $grid.empty();

  if (sortedMatches.length === 0) {
    const adInsertions = buildMatchListAdInsertions_TC(
      getMatchListAdBlocks_TC(),
      0,
    );
    let emptyHtml = `
                    <div class="dv2-empty-state">
                        <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">⚽</div>
                        <div style="font-size: 15px;">Không có trận đấu nào</div>
                    </div>
                `;
    if (adInsertions.has(0)) {
      emptyHtml += buildMatchListAdMarkup_TC(adInsertions.get(0));
    }
    $grid.html(emptyHtml);
    refreshMatchListReviveAds_TC($grid);
    return;
  }

  const adInsertions = buildMatchListAdInsertions_TC(
    getMatchListAdBlocks_TC(),
    sortedMatches.length,
  );

  sortedMatches.forEach((match, index) => {
    $grid.append(renderMatchCard_TC(match));

    const matchPosition = index + 1;
    if (adInsertions.has(matchPosition)) {
      const adMarkup = buildMatchListAdMarkup_TC(adInsertions.get(matchPosition));
      if (adMarkup) {
        $grid.append(adMarkup);
      }
    }
  });

  bindTcBlvDropdownEvents();
  refreshMatchListReviveAds_TC($grid);
}

// =================================================
// Render match card
// =================================================
function renderMatchCard_TC(match) {
  const kickoffDate = new Date(match.kickoff || "").toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
    },
  );
  //const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));
  // const isLive = now >= kickoff && now <= matchEndTime;
  const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
  const homeTeam = match.teams?.home || {};
  const awayTeam = match.teams?.away || {};
  const leagueName = match.league?.name || "Giải đấu";
  const leagueLogo = match.league?.logo || "";
  const isHot = appState.hotLeaguesRank.has(match.league.id);

  const homeScore = match.score?.fulltime?.home ?? 0;
  const awayScore = match.score?.fulltime?.away ?? 0;

  const status = match.status || "";

  // Format time
  const timeDisplay = isLive ? "LIVE" : formatMatchTime_TC(match.kickoff);
  // Status badge
  let statusBadge = "";
  if (isLive) {
    if (status === "Half Time") {
      statusBadge = '<div class="dv2-status-badge ht">HT</div>';
    } else if (status === "Second Half") {
      statusBadge = '<div class="dv2-status-badge">LIVE</div>';
    }
  }

  return `
                <div class="dv2-match-card ${isHot ? "hot-game" : ""}" 
                     data-match-id="${match.match_id}"
                     onclick="goToMatchDetail('${match.match_id}')">
                    
                    <!-- Header -->
                    <div class="dv2-card-header">
                        <div class="dv2-league-info">
                            ${
                              leagueLogo
                                ? `<img src="${leagueLogo}" class="dv2-league-logo" alt="${leagueName}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">`
                                : '<span class="dv2-league-logo">⚽</span>'
                            }
                            <span class="dv2-league-name">${leagueName}</span>
                        </div>
                        <div style="display:flex;align-items: center;">
                        
                        <div class="dv2-match-time ${isLive ? "live" : "upcoming"}">${timeDisplay}</div>
                        ${isLive ? "" : `<div class="dv2-match-time upcoming">${kickoffDate}</div>`}
                        </div>

                    </div>

                    <!-- Body -->
                    <div class="dv2-card-body">
                        <!-- Home Team -->
                        <div class="dv2-team-row">
                            <div class="dv2-team-logo">
                                <img src="${homeTeam.logo || "https://via.placeholder.com/36"}" 
                                     alt="${homeTeam.name}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                            </div>
                            <div class="dv2-team-name">${homeTeam.name || "Home Team"}</div>
                        </div>

                        ${
                          isLive
                            ? `
                            <!-- Score Display -->
                            <div class="dv2-score-display">
                                <div class="dv2-score-number">${homeScore}</div>
                                <div class="dv2-score-separator">:</div>
                                <div class="dv2-score-number">${awayScore}</div>
                            </div>
                        `
                            : `
                            <!-- VS Divider -->
                            <div class="dv2-vs-divider">VS</div>
                        `
                        }

                        <!-- Away Team -->
                        <div class="dv2-team-row">
                            <div class="dv2-team-logo">
                                <img src="${awayTeam.logo || "https://via.placeholder.com/36"}" 
                                     alt="${awayTeam.name}" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'">
                            </div>
                            <div class="dv2-team-name">${awayTeam.name || "Away Team"}</div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="dv2-card-footer">
                        ${buildCommentatorDropdown_TC(match)}
                        <a class="dv2-action-btn" href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow"
                           onclick="event.stopPropagation();">
                            Đặt cược
                        </a>
                        <button class="dv2-action-btn" onclick="event.stopPropagation(); goToMatchDetail('${match.match_id}')">
                            Xem Ngay
                        </button>
                    </div>
                </div>
            `;
}

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function getMatchListAdBlocks_TC() {
  return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_LIST_ADS);
}

function buildMatchListAdInsertions_TC(adBlocks, totalItems) {
  return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
    breakpoint: window.DV2_SOCOLIVE_MATCH_LIST_ADS_MOBILE_BREAKPOINT,
    repeatCycle: window.DV2_SOCOLIVE_MATCH_LIST_ADS_REPEAT,
  });
}

function buildMatchListAdMarkup_TC(adBlock) {
  return window.DV2ListAds.buildMarkup(adBlock, {
    wrapperTag: "div",
    wrapperClass: "dv2-tc-match-list-ad",
  });
}

function refreshMatchListReviveAds_TC($container) {
  window.DV2ListAds.refreshReviveAds($container);
}

// =================================================
// Format time
// =================================================
function formatMatchTime_TC(datetime) {
  if (!datetime) return "--:--";
  const date = new Date(datetime);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =================================================
// Navigation
// =================================================
function goToMatchDetail(matchId) {
  window.location.href = `/streams?match=${matchId}`;
}

// =================================================
// Load data
// =================================================
function loadHomeData_TC() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const payload = {
    fromDate: yesterday.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };
  DV2HotLeagues.load({
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });
  // call api để lấy danh sách trận đấu
  $.ajax({
    url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function (response) {
      if (response && response.matches_by_date) {
        const allMatches = [];
        Object.keys(response.matches_by_date).forEach((date) => {
          allMatches.push(...response.matches_by_date[date]);
        });
        //remove những trận đã kết thúc (của ngày hôm qua)
        const isLiveAndTodayMatches = allMatches.filter(
          (m) => m.status !== "Finished",
        );
        renderHomePage_TC(isLiveAndTodayMatches);
      } else {
        $(".dv2-layout-tc.dv2-home-matches #matchGrid").html(`
                            <div class="dv2-empty-state">
                                <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">⚽</div>
                                <div>Không có dữ liệu</div>
                            </div>
                        `);
      }
    },
    error: function (err) {
      console.error("Error:", err);
      $(".dv2-layout-tc.dv2-home-matches #matchGrid").html(`
                        <div class="dv2-empty-state">
                            <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">❌</div>
                            <div>Lỗi tải dữ liệu</div>
                        </div>
                    `);
    },
  });
}
