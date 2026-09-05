// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

// Constants
const DAYS_TO_DISPLAY_DESKTOP = 5;
const DAYS_TO_DISPLAY_MOBILE = 4; // Mobile: btn-live + 4 days (including today)
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

/**
 * Check if device is mobile (screen width <= 640px)
 * @returns {boolean} True if mobile
 */
function isMobile() {
  return window.innerWidth <= 640;
}

/**
 * Get number of days to display based on device type
 * @returns {number} Number of days to display
 */
function getDaysToDisplay() {
  return isMobile() ? DAYS_TO_DISPLAY_MOBILE : DAYS_TO_DISPLAY_DESKTOP;
}

// Global variables
let selectedDateIndex = -1; // -1 means LIVE button is active by default
let matchesDataByDate = {};
let isLiveMode = true; // Track if we're in live mode or date mode

// Init
$(document).ready(function () {
  renderDateList();
  loadDataForAllDays();
  setupDateClickHandlers();
  setupLiveButtonHandler();
  setupResizeHandler();
  bindVb2BlvDropdownEvents_LTT();
});

// =================================================
// Render date list
// =================================================

/**
 * Render days from today
 */
function renderDateList() {
  const $dateList = $(".mdx_-list");
  if (!$dateList.length) {
    return;
  }

  const today = new Date();
  let html = "";
  const daysToDisplay = getDaysToDisplay();

  for (let i = 0; i < daysToDisplay; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dateDDMM = DV2.formatDateDDMM(date);
    const dayLabel = DV2.getVietnameseDayLabel(date, i);
    const dateString = DV2.getDateString(date);
    const activeClass = i === selectedDateIndex ? "active" : "";

    html += `
      <a href="javascript:void(0)" class="item f-date ${activeClass}" data-date="${dateString}" data-index="${i}">
        <span class="date-a date_of_day">${dateDDMM}</span>
        <span class="date-b date_of_week">${dayLabel}</span>
      </a>
    `;
  }

  $dateList.html(html);
}

// =================================================
// Setup event handlers
// =================================================

/**
 * Setup click handlers for date items
 */
function setupDateClickHandlers() {
  $(document).on("click", ".mdx_-list .item.f-date", function () {
    const $item = $(this);
    const index = parseInt($item.data("index"), 10);

    // Remove active from all date items
    $(".mdx_-list .item.f-date").removeClass("active");

    // Remove active from LIVE button
    $(".btn-live").removeClass("active");

    // Add active to clicked item
    $item.addClass("active");

    // Update selected date index and mode
    selectedDateIndex = index;
    isLiveMode = false;

    // Load matches for selected date
    const dateString = $item.data("date");
    loadMatchesForDate(dateString);
  });
}

/**
 * Setup click handler for LIVE button
 */
function setupLiveButtonHandler() {
  $(document).on("click", ".btn-live", function () {
    const $btn = $(this);

    // Remove active from all date items
    $(".mdx_-list .item.f-date").removeClass("active");

    // Add active to LIVE button
    $btn.addClass("active");

    // Update mode
    selectedDateIndex = -1;
    isLiveMode = true;

    // Load live matches
    loadLiveMatches();
  });
}

/**
 * Setup resize handler to re-render date list when screen size changes
 */
function setupResizeHandler() {
  let resizeTimer;
  let lastDaysToDisplay = getDaysToDisplay();

  $(window).on("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      const currentDaysToDisplay = getDaysToDisplay();

      // Only re-render if number of days changed
      if (currentDaysToDisplay !== lastDaysToDisplay) {
        lastDaysToDisplay = currentDaysToDisplay;

        // If selected date index is out of range, reset to live mode
        if (selectedDateIndex >= currentDaysToDisplay) {
          selectedDateIndex = -1;
          isLiveMode = true;
          $(".mdx_-list .item.f-date").removeClass("active");
          $(".btn-live").addClass("active");
        }

        // Re-render date list
        renderDateList();

        // Re-setup click handlers (in case DOM changed)
        setupDateClickHandlers();

        // Reload data if needed (to ensure we have data for all displayed days)
        loadDataForAllDays();
      }
    }, 250); // Debounce resize events
  });
}

// =================================================
// Load data functions
// =================================================

/**
 * Load data for all days
 */
function loadDataForAllDays() {
  const today = new Date();
  const fromDate = new Date(today);
  const toDate = new Date(today);
  const daysToDisplay = getDaysToDisplay();
  toDate.setDate(today.getDate() + daysToDisplay);

  DV2.fetchMatchesByDateRange(
    DV2.getDateString(fromDate),
    DV2.getDateString(toDate),
    function (response) {
      if (response && response.matches_by_date) {
        matchesDataByDate = response.matches_by_date;

        // Update live count badge
        updateLiveCountBadge();

        // Load live matches by default (since isLiveMode = true and selectedDateIndex = -1)
        if (isLiveMode) {
          loadLiveMatches();
        } else {
          // Load matches for selected date
          const selectedDate = new Date(today);
          selectedDate.setDate(today.getDate() + selectedDateIndex);
          const selectedDateString = DV2.getDateString(selectedDate);
          loadMatchesForDate(selectedDateString);
        }
      }
    },
    function (err) {
      console.error("[DATE LIST] Error loading data:", err);
    },
  );
}

// =================================================
// Match status and sorting functions
// =================================================

const EXCLUDED_MATCH_STATUSES = ["delay", "interrupt", "cut in half"];

function isExcludedMatchStatus(status) {
  return EXCLUDED_MATCH_STATUSES.includes(DV2.normalizeMatchStatus(status || ""));
}

/**
 * Check if match is currently live
 * @param {Object} match - Match object
 * @returns {boolean} True if match is live
 */
function isMatchLive(match) {
  if (!match || !match.kickoff) {
    return false;
  }

  const status = match.status || "";
  if (isExcludedMatchStatus(status)) {
    return false;
  }

  // Check if status is in LIVE_STATUS
  if (DV2.isLiveStatus(status)) {
    return true;
  }

  // Fallback: Check if livestream is available and within time range
  if (match.livestream && match.livestream.available) {
    const now = new Date();
    const kickoff = new Date(match.kickoff);
    const matchEndTime = new Date(kickoff.getTime() + 2 * 60 * 60 * 1000); // 2 hours after kickoff

    return kickoff <= now && now <= matchEndTime;
  }

  return false;
}

/**
 * Get match status priority for sorting
 * @param {Object} match - Match object
 * @returns {number} Priority (lower = higher priority)
 */
function getMatchStatusPriority(match) {
  if (isMatchLive(match)) {
    return 1; // Live matches first
  }

  const status = match.status || "";
  const now = new Date();
  const kickoff = new Date(match.kickoff);

  if (DV2.isFinishedStatus(status)) {
    return 4; // Finished matches last
  }

  if (kickoff > now && DV2.isNotStartedStatus(status)) {
    return 2; // Upcoming matches
  }

  return 3; // Other statuses
}

/**
 * Sort matches within a league (matches are already grouped by league)
 * @param {Array} matches - Array of match objects (all from same league)
 * @returns {Array} Sorted matches
 */
function sortMatches(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return [];
  }

  return matches.slice().sort(function (a, b) {
    // Sort by status priority
    const priorityA = getMatchStatusPriority(a);
    const priorityB = getMatchStatusPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Finally sort by kickoff time
    const kickoffA = new Date(a.kickoff || 0).getTime();
    const kickoffB = new Date(b.kickoff || 0).getTime();
    return kickoffA - kickoffB;
  });
}

/**
 * Group matches by league
 * @param {Array} matches - Array of match objects
 * @returns {Object} Matches grouped by league
 */
function groupMatchesByLeague(matches) {
  const grouped = {};

  matches.forEach(function (match) {
    const leagueId = match.league?.id || "unknown";
    const leagueName = match.league?.name || "Unknown League";

    if (!grouped[leagueId]) {
      grouped[leagueId] = {
        league: match.league,
        leagueName: leagueName,
        matches: [],
      };
    }

    grouped[leagueId].matches.push(match);
  });

  return grouped;
}

// =================================================
// Render match functions
// =================================================

/**
 * Format match status display
 * @param {Object} match - Match object
 * @returns {string} Formatted status
 */
function formatMatchStatus(match) {
  if (!match) {
    return "Chưa diễn ra";
  }

  const status = DV2.normalizeMatchStatus(match.status || "");

  // Check if live
  if (isMatchLive(match) || DV2.isLiveStatus(status)) {
    // Format specific live statuses
    if (
      status === "half-time" ||
      status === "halftime" ||
      status === "ht" ||
      status == "half time"
    ) {
      return "HT";
    }
    if (status === "first half") {
      return "Hiệp 1";
    }
    if (status === "second half") {
      return "Hiệp 2";
    }
    if (status === "overtime" || status === "overtime(deprecated)") {
      return "Hiệp phụ";
    }
    if (status === "penalty shoot-out" || status === "penalty") {
      return "Penalty";
    }
    return "Live";
  }

  // Check if finished
  if (DV2.isFinishedStatus(status)) {
    return "FT";
  }

  // Check if not started
  if (DV2.isNotStartedStatus(status)) {
    return "Chưa diễn ra";
  }

  // Other statuses
  if (status === "delay") {
    return "Hoãn";
  }
  if (status === "interrupt") {
    return "Tạm dừng";
  }
  if (status === "cancel") {
    return "Hủy";
  }

  return match.status || "Chưa diễn ra";
}

/**
 * Get match score
 * @param {Object} match - Match object
 * @returns {Object} Score object with home and away
 */
function getMatchScore(match) {
  if (!match || !match.score || !match.score.fulltime) {
    return { home: 0, away: 0 };
  }

  return {
    home: match.score.fulltime.home || 0,
    away: match.score.fulltime.away || 0,
  };
}

function escapeHtml_VB2(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDetailUrl_VB2(matchId, link) {
  return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: true });
}

function renderLttBlvAvatar(link, label) {
  const avatar = link?.avatar || "";
  return `
    <img
      src="${escapeHtml_VB2(avatar)}"
      alt="${escapeHtml_VB2(label)}"
      width="24"
      height="24"
      onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
    />
  `;
}

function buildCommentatorDropdown_VB2(match) {
  const sortedLinks = window.DV2BlvDropdown.getSortedLinks(match);

  return window.DV2BlvDropdown.build({
    match,
    links: sortedLinks,
    getDetailUrl: getDetailUrl_VB2,
    escapeHtml: escapeHtml_VB2,
    menuPlacement: "down",
    emptyHtml: "",
    rootClass: "detail mt-2 match_item--commentator",
    renderToggle: ({ link, label }) => `
      ${renderLttBlvAvatar(link, label)}
      <span class="match_item--commentator-name">${escapeHtml_VB2(label)}</span>
    `,
    renderItemContent: ({ link, label }) => `
      ${renderLttBlvAvatar(link, label)}
      <span class="match_item--commentator-name">${escapeHtml_VB2(label)}</span>
    `,
  });
}

function bindVb2BlvDropdownEvents_LTT() {
  window.DV2BlvDropdown.bind($(".match_list_container"), {
    namespace: "vb2BlvDropdownLtt",
    documentCloseDelay: true,
  });
}

function getMatchScheduleListAdBlocks_VB2() {
  return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS);
}

function buildMatchScheduleAdInsertions_VB2(adBlocks, totalItems) {
  return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
    breakpoint: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_MOBILE_BREAKPOINT,
    repeatCycle: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_REPEAT,
  });
}

function buildMatchScheduleAdMarkup_VB2(adBlock) {
  return window.DV2ListAds.buildMarkup(adBlock, {
    wrapperTag: "div",
    wrapperClass: "dv2-match-schedule-ad",
  });
}

function refreshMatchScheduleReviveAds_VB2($container) {
  window.DV2ListAds.refreshReviveAds($container);
}

/**
 * Render a single match item
 * @param {Object} match - Match object
 * @returns {string} HTML string
 */
function renderMatchItem(match) {
  if (!match) {
    return "";
  }

  const matchId = match.match_id || "";
  const slug = match.slug || "";
  const homeTeam = match.teams?.home || {};
  const awayTeam = match.teams?.away || {};
  const homeTeamName = homeTeam.name || "";
  const awayTeamName = awayTeam.name || "";
  const homeTeamLogo = homeTeam.logo || "";
  const awayTeamLogo = awayTeam.logo || "";
  const kickoff = new Date(match.kickoff || "");
  const matchTime = DV2.formatTimeHHMM(kickoff);
  const status = formatMatchStatus(match);
  const isLive = isMatchLive(match);
  const score = getMatchScore(match);
  const matchUrl = `/streams/${matchId || slug}`;

  // Status badge class
  const statusClass = isLive ? "live" : "pending";
  const statusText = isLive ? "Live" : status;

  // Commentator dropdown
  const commentatorDropdownHtml = buildCommentatorDropdown_VB2(match);

  // Info block: live vs not started/upcoming
  let infoBlockHtml = "";
  if (isLive) {
    // Check if Half Time
    const normalizedStatus = DV2.normalizeMatchStatus(match.status || "");
    const isHalfTime =
      normalizedStatus === "half-time" ||
      normalizedStatus === "halftime" ||
      normalizedStatus === "ht" ||
      normalizedStatus === "half time";
    const currentMinutes = match.currentMinutes || 0;
    const timeDisplay = isHalfTime ? "HT" : `${currentMinutes}'`;

    infoBlockHtml = `
        <div class="badge-live">
          <i class="dot"></i>
          ${statusText}
        </div>
        <div style="display: flex; gap: 6px">
          <div class="detail match_item--time">
            <b>${matchTime}</b>
          </div>
          <div class="time-loaded match_item--status">
            <span class="match-status ${statusClass}">${timeDisplay}</span>
          </div>
        </div>
    `;
  } else {
    // Not live: show time + date (if not today) and pending status
    const today = new Date();
    const isToday =
      kickoff.getFullYear() === today.getFullYear() &&
      kickoff.getMonth() === today.getMonth() &&
      kickoff.getDate() === today.getDate();

    const dateLabel = isToday ? "" : ` ${DV2.formatDateDDMM(kickoff)}`;
    const displayTime = `${matchTime}${dateLabel}`;

    infoBlockHtml = `
        <div style="display: flex; gap: 6px; flex-direction: column-reverse;">
          <div class="detail">
            <b>${displayTime}</b>
          </div>
          <div class="time-loaded">
            <span class="match-status pending">${status}</span>
          </div>
        </div>
    `;
  }

  const matchItemHtml = `
    <div class="vitem vitem-vertical ${isLive ? "vitem-live" : ""} match_item">
      <a href="${matchUrl}" class="match-link match_item--link"></a>
      <div class="vitem-info match_item--info">
        ${infoBlockHtml}
        ${commentatorDropdownHtml}
      </div>
      <div class="item-team match_item--team">
        <div class="team team-home match_item--team-home">
          <div class="team-logo match_item--home-logo">
            <img class="team-logo-img" loading="lazy" src="${homeTeamLogo}" 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 alt="${homeTeamName} logo" />
          </div>
          <h3 class="team-name match_item--home-name">${homeTeamName}</h3>
          <div class="vitem-card ml-3"></div>
        </div>
        <div class="team team-away match_item--team-away">
          <div class="team-logo match_item--away-logo">
            <img class="team-logo-img" loading="lazy" src="${awayTeamLogo}" 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 alt="${awayTeamName} logo" />
          </div>
          <h3 class="team-name match_item--away-name">${awayTeamName}</h3>
          <div class="vitem-card ml-3"></div>
        </div>
      </div>
      <div class="item-result match_item--result">
        <div class="ir-col">
          ${
            !isLive
              ? `<div class="xspace">vs</div>`
              : `
            <div class="match_item--score-home">${score.home}</div>
            <div class="match_item--score-away">${score.away}</div> 
            `
          }
        </div>
      </div>
      <div class="item-buttons match_item--button">
        <div class="ibs-live">
          <a href="${matchUrl}" class="btn btn-sm vebo2-btn-bet-hover">Xem ngay</a>
        </div>
        <div class="ibs-bet">
          <a href="${window.DV2_LINK_BET}" target="_blank" rel="nofollow" class="btn btn-sm btn-betnow vebo2-btn-bet">Đặt cược</a>
        </div>
      </div>
      <div class="clearfix"></div>
    </div>
  `;

  return matchItemHtml;
}

/**
 * Render match box wrapper with league header
 * @param {Object} match - Match object
 * @returns {string} HTML string
 */
function renderMatchBox(match) {
  const isHotMatch = DV2.appState.hotLeaguesRank.has(match.league.id);

  let html = `
      <div class="match_box match_item--box ${isHotMatch ? "hot-match" : ""}">
        <div class="mb_-header">
          <span class="item-league match_item--league">
            ${
              match.league?.logo
                ? `
              <i class="league-icon mr-2">
                <img loading="lazy" class="match_item--league-icon" src="${match.league.logo}" alt="${match.league.name}"
                  onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 />
              </i>
            `
                : ""
            }
            <span class="item-league__name match_item--league-name">
              ${match.league.name}
            </span>
          </span>
        </div>
        <div class="match_list match_list-list match_item--list">
    `;

  html += renderMatchItem(match);

  html += `
        </div>
      </div>
    `;

  return html;
}

/**
 * Filter out finished matches
 * @param {Array} matches - Array of match objects
 * @returns {Array} Filtered matches without finished ones
 */
function filterFinishedMatches(matches) {
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.filter(function (match) {
    if (!match || !match.status) {
      return true; // Keep matches without status
    }
    if (isExcludedMatchStatus(match.status)) {
      return false;
    }
    return !DV2.isFinishedStatus(match.status);
  });
}

function buildEmptyScheduleListHtml_VB2(message, styleAttr = "") {
  const adInsertions = buildMatchScheduleAdInsertions_VB2(
    getMatchScheduleListAdBlocks_VB2(),
    0,
  );
  const style = styleAttr ? ` style="${styleAttr}"` : "";
  let html = `<div class="no-matches"${style}>${message}</div>`;
  if (adInsertions.has(0)) {
    html += buildMatchScheduleAdMarkup_VB2(adInsertions.get(0));
  }
  return html;
}

/**
 * Render match list grouped by league
 * @param {Array} matches - Array of match objects
 * @returns {string} HTML string
 */
function renderMatchList(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return buildEmptyScheduleListHtml_VB2("Không có trận đấu nào");
  }

  // Filter out finished matches
  const filteredMatches = filterFinishedMatches(matches);
  if (filteredMatches.length === 0) {
    return buildEmptyScheduleListHtml_VB2("Không có trận đấu nào");
  }

  // Group by league first
  // const groupedByLeague = groupMatchesByLeague(filteredMatches);

  // Sort matches within each league group
  // Object.keys(groupedByLeague).forEach(function (leagueId) {
  //   const leagueGroup = groupedByLeague[leagueId];
  //   leagueGroup.matches = sortMatches(leagueGroup.matches);
  // });

  const sorted = DV2.sortedMatchesFunction(filteredMatches);
  const adInsertions = buildMatchScheduleAdInsertions_VB2(
    getMatchScheduleListAdBlocks_VB2(),
    sorted.length,
  );

  let html = "";

  sorted.forEach(function (match, index) {
    html += renderMatchBox(match);

    const matchPosition = index + 1;
    if (adInsertions.has(matchPosition)) {
      const adMarkup = buildMatchScheduleAdMarkup_VB2(adInsertions.get(matchPosition));
      if (adMarkup) {
        html += adMarkup;
      }
    }
  });

  return html;
}

/**
 * Update live count badge (total across all dates)
 */
function updateLiveCountBadge() {
  const $badge = $(".badge-live-count");
  if (!$badge.length) {
    return;
  }

  // Collect all matches from all dates
  let allMatches = [];
  Object.keys(matchesDataByDate).forEach(function (dateString) {
    const matches = matchesDataByDate[dateString] || [];
    allMatches = allMatches.concat(matches);
  });

  // Filter out finished matches first
  const filteredMatches = filterFinishedMatches(allMatches);
  // Count live matches
  const liveCount = filteredMatches.filter(function (match) {
    return isMatchLive(match);
  }).length;

  $badge.text(liveCount);
}

/**
 * Update live count badge for a specific date (legacy - kept for compatibility)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
function updateLiveCountForDate(dateString) {
  // Always update with total live count across all dates
  updateLiveCountBadge();
}

/**
 * Load matches for a specific date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
function loadMatchesForDate(dateString) {
  const $matchContainer = $(".match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  if (!matchesDataByDate[dateString]) {
    $matchContainer.find(".match_box").remove();
    $matchContainer.find(".no-matches").remove();
    $matchContainer.find(".dv2-match-schedule-ad").remove();
    updateLiveCountForDate(dateString);
    $matchContainer.append(
      buildEmptyScheduleListHtml_VB2(
        "Không có trận đấu nào trong ngày.",
        "padding: 20px; text-align: center; color: #8e8f92;",
      ),
    );
    refreshMatchScheduleReviveAds_VB2($matchContainer);
    return;
  }

  const matches = matchesDataByDate[dateString];

  // Remove existing matches
  $matchContainer.find(".match_box").remove();
  $matchContainer.find(".no-matches").remove();
  $matchContainer.find(".dv2-match-schedule-ad").remove();

  // Render new matches
  const html = renderMatchList(matches);
  $matchContainer.append(html);
  bindVb2BlvDropdownEvents_LTT();
  refreshMatchScheduleReviveAds_VB2($matchContainer);
  updateLiveCountForDate(dateString);
}

/**
 * Load all live matches from all dates
 */
function loadLiveMatches() {
  const $matchContainer = $(".match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  // Collect all matches from all dates
  let allMatches = [];
  Object.keys(matchesDataByDate).forEach(function (dateString) {
    const matches = matchesDataByDate[dateString] || [];
    allMatches = allMatches.concat(matches);
  });

  // Filter only live matches
  const liveMatches = allMatches.filter(function (match) {
    return isMatchLive(match);
  });

  // console.log(`[LIVE] Live matches:`, liveMatches);

  // Remove existing matches
  $matchContainer.find(".match_box").remove();
  $matchContainer.find(".no-matches").remove();
  $matchContainer.find(".dv2-match-schedule-ad").remove();

  // Render live matches or show message
  if (liveMatches.length === 0) {
    $matchContainer.append(
      buildEmptyScheduleListHtml_VB2(
        "Hiện tại không có trận đấu nào đang diễn ra.",
        "padding: 20px; text-align: center; color: #8e8f92;",
      ),
    );
    refreshMatchScheduleReviveAds_VB2($matchContainer);
  } else {
    const html = renderMatchList(liveMatches);
    $matchContainer.append(html);
    bindVb2BlvDropdownEvents_LTT();
    refreshMatchScheduleReviveAds_VB2($matchContainer);
  }

  // Update live count badge
  updateLiveCountBadge();
}

/**
 * Load data (legacy function - kept for compatibility)
 * @param {number} addingDays - Number of days to add
 */
function loadData(addingDays = 1) {
  const today = new Date();
  const fromDate = new Date(today);
  const toDate = new Date(today);
  fromDate.setDate(fromDate.getDate());
  toDate.setDate(toDate.getDate() + addingDays);

  DV2.fetchMatchesByDateRange(
    DV2.getDateString(fromDate),
    DV2.getDateString(toDate),
    function (res) {
      if (res && res.matches_by_date) {
        matchesDataByDate = res.matches_by_date;
      }
      loadLiveMatches();
    },
    function (err) {
      console.error("Error:", err);
    }
  );
}
