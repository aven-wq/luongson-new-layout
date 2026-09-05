// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

// Global variables
let selectedDateIndex = -1; // -1 means today is active by default
let matchesDataByDate = {};
let isSchedulePage = false; // true for "lich-thi-dau-bong-da" page

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

// Init
$(document).ready(function () {
  // Check page type from global variable or data attribute (fallback)
  if (typeof window.DV2_PAGE_TYPE === "undefined") {
    const $container = $(".content-area.dv2-layout-vb2");
    window.DV2_PAGE_TYPE = $container.length
      ? $container.attr("data-page-type") || ""
      : "";
  }

  isSchedulePage = window.DV2_PAGE_TYPE === "lich-thi-dau-bong-da";

  renderDateList();
  loadDataForAllDays();
  setupDateClickHandlers();
});

// =================================================
// Render date list
// =================================================

/**
 * Render days based on page type:
 * - Results page: 7 days ago to today (8 days total)
 * - Schedule page: today, tomorrow, next 6 days (8 days total)
 */
function renderDateList() {
  const $dateWrapper = $(".match_date--wrapper");
  if (!$dateWrapper.length) {
    return;
  }

  const today = new Date();
  let html = "";

  if (isSchedulePage) {
    // Schedule page: today, tomorrow, next 6 days (8 days total, forward-looking)
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dateDDMM = DV2.formatDateDDMM(date);
      const dateString = DV2.getDateString(date);
      const activeClass = i === 0 ? "active" : ""; // Today is active by default

      // Determine label
      let label = dateDDMM;
      if (i === 0) {
        label = "Hôm nay";
      } else if (i === 1) {
        label = "Ngày mai";
      }

      html += `
        <a href="javascript:void(0)" class="match_date--item ${activeClass}" data-date="${dateString}" data-index="${i}">
          ${label}
        </a>
      `;
    }
  } else {
    // Results page: 7 days ago, 6 days ago, ..., yesterday, today (8 days total)
    for (let i = 7; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateDDMM = DV2.formatDateDDMM(date);
      const dateString = DV2.getDateString(date);
      const activeClass = i === 0 ? "active" : ""; // Today is active by default

      // Determine label
      let label = dateDDMM;
      if (i === 0) {
        label = "Hôm nay";
      } else if (i === 1) {
        label = "Hôm qua";
      }

      html += `
        <a href="javascript:void(0)" class="match_date--item ${activeClass}" data-date="${dateString}" data-index="${i}">
          ${label}
        </a>
      `;
    }
  }

  $dateWrapper.html(html);
  selectedDateIndex = 0; // Today is selected by default
}

// =================================================
// Setup event handlers
// =================================================

/**
 * Setup click handlers for date items
 */
function setupDateClickHandlers() {
  $(document).on("click", ".match_date--item", function () {
    const $item = $(this);
    const dateString = $item.data("date");
    const index = parseInt($item.data("index"), 10);

    // Remove active from all date items
    $(".match_date--item").removeClass("active");

    // Add active to clicked item
    $item.addClass("active");

    // Update selected date index
    selectedDateIndex = index;

    // Update header text
    updateHeaderText(dateString);

    // Show loading if data is not available
    if (!matchesDataByDate[dateString]) {
      showLoading();
      // Try to reload data for this specific date
      const date = new Date(dateString + "T00:00:00");
      const fromDate = new Date(date);
      const toDate = new Date(date);

      DV2.fetchMatchesByDateRange(
        DV2.getDateString(fromDate),
        DV2.getDateString(toDate),
        function (response) {
          hideLoading();
          if (response && response.matches_by_date) {
            // Merge new data
            Object.assign(matchesDataByDate, response.matches_by_date);
            loadMatchesForDate(dateString);
          } else {
            loadMatchesForDate(dateString);
          }
        },
        function (err) {
          hideLoading();
          console.error("[KET QUA] Error loading data for date:", err);
          loadMatchesForDate(dateString);
        },
      );
    } else {
      // Load matches for selected date (data already available)
      loadMatchesForDate(dateString);
    }
  });
}

/**
 * Update header text based on selected date
 */
function updateHeaderText(dateString) {
  const $headerText = $(".match_date_text");
  if (!$headerText.length) {
    return;
  }

  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  date.setHours(0, 0, 0, 0);

  let text = "";
  const dateFormatted = `${DV2.formatDateDDMM(date)}/${date.getFullYear()}`;

  if (date.getTime() === today.getTime()) {
    // Hôm nay
    text = `Hôm nay (${dateFormatted})`;
  } else if (date.getTime() === yesterday.getTime()) {
    // Hôm qua
    text = `Hôm qua (${dateFormatted})`;
  } else if (date.getTime() === tomorrow.getTime()) {
    // Ngày mai
    text = `Ngày mai (${dateFormatted})`;
  } else {
    // Ngày khác
    text = dateFormatted;
  }

  $headerText.text(text);

  // Update page heading if schedule page
  if (isSchedulePage) {
    const $heading = $("#page-heading");
    if ($heading.length) {
      $heading.html(
        `TRỰC TIẾP LỊCH THI ĐẤU BÓNG ĐÁ ${text} CẬP NHẬT 24H VEBO TV`,
      );
    }

    // Update description
    const $description = $("#page-description");
    if ($description.length) {
      $description.html(
        `Trực tiếp lịch thi đấu ${text} mới nhất sẽ được cập nhật liên tục 24h. Cứ khi nào có bóng đá thì BXH cũng sẽ được cập nhật ngay trong giờ đấu đang diễn ra. Các fan hâm mộ có thể theo dõi nhiều hơn nữa BXH các giải nhỏ cho tới giải to trên toàn thế giới tại VeboTV.`,
      );
    }
  }
}

// =================================================
// Loading indicator functions
// =================================================

/**
 * Show loading indicator
 */
function showLoading() {
  const $matchContainer = $("#match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  // Remove existing content
  $matchContainer.find(".match_box").remove();
  $matchContainer.find(".no-matches").remove();
  $matchContainer.find(".dv2-match-schedule-ad").remove();
  $matchContainer.find(".loading-container").remove();

  // Add loading indicator
  const loadingHtml = `
    <div class="loading-container">
      <div>
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang tải dữ liệu...</div>
      </div>
    </div>
  `;
  $matchContainer.append(loadingHtml);
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const $matchContainer = $("#match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  $matchContainer.find(".loading-container").remove();
}

// =================================================
// Load data functions
// =================================================

/**
 * Load data for all days
 * - Results page: 7 days ago to today (8 days total)
 * - Schedule page: today to 7 days ahead (8 days total)
 */
function loadDataForAllDays() {
  const today = new Date();
  const fromDate = new Date(today);
  const toDate = new Date(today);

  if (isSchedulePage) {
    // Schedule page: today to 7 days ahead
    toDate.setDate(today.getDate() + 7);
  } else {
    // Results page: 7 days ago to today
    fromDate.setDate(today.getDate() - 7);
  }

  // Show loading
  showLoading();

  DV2.fetchMatchesByDateRange(
    DV2.getDateString(fromDate),
    DV2.getDateString(toDate),
    function (response) {
      // Hide loading
      hideLoading();

      if (response && response.matches_by_date) {
        matchesDataByDate = response.matches_by_date;

        // Load today's matches by default
        const todayString = DV2.getDateString(today);
        loadMatchesForDate(todayString);
        updateHeaderText(todayString);
      } else {
        // Show no data message
        const $matchContainer = $("#match_list_container");
        if ($matchContainer.length) {
          $matchContainer.append(
            '<div class="no-matches" style="padding: 20px; text-align: center; color: #8e8f92;">Không có dữ liệu.</div>',
          );
        }
      }
    },
    function (err) {
      // Hide loading
      hideLoading();

      console.error("[KET QUA] Error loading data:", err);

      // Show error message
      const $matchContainer = $("#match_list_container");
      if ($matchContainer.length) {
        $matchContainer.append(
          '<div class="no-matches" style="padding: 20px; text-align: center; color: #8e8f92;">Đã xảy ra lỗi khi tải dữ liệu.</div>',
        );
      }
    },
  );
}

// =================================================
// Match rendering functions
// =================================================

/**
 * Check if match is currently live
 * @param {Object} match - Match object
 * @returns {boolean} True if match is live
 */
function isMatchLive(match) {
  if (!match || !match.kickoff) {
    return false;
  }

  // Check if status is in LIVE_STATUS
  const status = match.status || "";
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
 * Filter only finished matches (for results page)
 * @param {Array} matches - Array of match objects
 * @returns {Array} Filtered matches with only finished ones
 */
function filterFinishedMatches(matches) {
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.filter(function (match) {
    if (!match || !match.status) {
      return false; // Exclude matches without status
    }
    return DV2.isFinishedStatus(match.status);
  });
}

/**
 * Filter matches in the future (not started/scheduled) - for schedule page
 * @param {Array} matches - Array of match objects
 * @returns {Array} Filtered matches with only future/scheduled ones
 */
function filterFutureMatches(matches) {
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.filter(function (match) {
    if (!match || !match.status) {
      return false; // Exclude matches without status
    }
    return DV2.isNotStartedStatus(match.status);
  });
}

/**
 * Sort matches within a league (matches are already grouped by league)
 * @param {Array} matches - Array of match objects (all from same league)
 * @param {string} dateString - Date string in YYYY-MM-DD format (to determine if today)
 * @returns {Array} Sorted matches
 */
function sortMatches(matches, dateString) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return [];
  }

  const today = new Date();
  const todayString = DV2.getDateString(today);
  const isToday = dateString === todayString;

  return matches.slice().sort(function (a, b) {
    // If today: Live matches first, then finished
    if (isToday) {
      const aIsLive = isMatchLive(a);
      const bIsLive = isMatchLive(b);

      // Live matches come first
      if (aIsLive && !bIsLive) {
        return -1;
      }
      if (!aIsLive && bIsLive) {
        return 1;
      }

      // Both live or both finished: sort by currentMinutes if available, else by kickoff
      if (aIsLive && bIsLive) {
        // Sort live matches by currentMinutes (descending - more minutes first)
        // or by kickoff if currentMinutes not available
        const aMinutes = a.currentMinutes || 0;
        const bMinutes = b.currentMinutes || 0;
        if (aMinutes !== bMinutes) {
          return bMinutes - aMinutes; // Descending: more minutes first
        }
        // If same minutes, sort by kickoff (ascending - earlier kickoff first)
        const kickoffA = new Date(a.kickoff || 0).getTime();
        const kickoffB = new Date(b.kickoff || 0).getTime();
        return kickoffA - kickoffB;
      }

      // Both finished: sort by kickoff (descending - most recent first)
      const kickoffA = new Date(a.kickoff || 0).getTime();
      const kickoffB = new Date(b.kickoff || 0).getTime();
      return kickoffB - kickoffA;
    } else {
      // Yesterday or earlier: sort by kickoff ascending (oldest first)
      const kickoffA = new Date(a.kickoff || 0).getTime();
      const kickoffB = new Date(b.kickoff || 0).getTime();
      return kickoffA - kickoffB; // Ascending order (oldest first)
    }
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

/**
 * BLV ưu tiên hiển thị: bỏ qua Nhà Đài khi có BLV khác
 * @param {Object} match - Match object
 * @returns {Object|null} Commentator link object or null
 */
function getFirstCommentator(match) {
  const links = match?.livestream?.links;
  if (!Array.isArray(links) || !links.length) {
    return null;
  }

  sortLivestreamLinksPreferRealBlv(links);
  return links[0] || null;
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
  const score = getMatchScore(match);
  const commentator = getFirstCommentator(match);
  const matchUrl = `/streams/${matchId || slug}`;
  const isLive = isMatchLive(match);

  // Commentator info
  const commentatorName = commentator?.commentator || "";
  const commentatorAvatar = commentator?.avatar || "";

  // Info block: live vs finished vs scheduled
  let infoBlockHtml = "";
  const matchStatus = match.status || "";
  const isFinished = DV2.isFinishedStatus(matchStatus);
  const isNotStarted = DV2.isNotStartedStatus(matchStatus);

  if (isLive) {
    // Live: badge-live + kickoff HH:MM và currentMinutes (hoặc HT nếu Half Time) + commentator
    const status = DV2.normalizeMatchStatus(matchStatus);
    const isHalfTime =
      status === "half-time" ||
      status === "halftime" ||
      status === "ht" ||
      status === "half time";
    const currentMinutes = match.currentMinutes || 0;
    const timeDisplay = isHalfTime ? "HT" : `${currentMinutes}'`;

    infoBlockHtml = `
        <div class="badge-live">
          <i class="dot"></i>Live
        </div>
        <div style="display: flex; gap: 6px;">
          <div class="detail match_item--time">
            <b>${matchTime}</b>
          </div>
          <div class="time-loaded match_item--status">
            <span class="match-status live">${timeDisplay}</span>
          </div>
        </div>
        ${
          commentator
            ? `
          <div class="detail mt-2 match_item--commentator">
            <img 
              onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
              src="${commentatorAvatar}" alt="${commentatorName}" width="24" height="24"/>
            ${commentatorName}
          </div>
        `
            : ""
        }
    `;
  } else if (isFinished) {
    // Finished: text "Kết thúc" + kickoff HH:MM DD/MM + commentator
    const matchDate = DV2.formatDateDDMM(kickoff);
    const dateTimeDisplay = `${matchTime} ${matchDate}`;
    infoBlockHtml = `
        <div style="display: flex; gap: 6px; flex-direction: column;">
          <div class="detail match_item--time">
            <span class="match-status finished">Kết thúc</span>
          </div>
          <div class="match_item--status">
            <span class="match-status">${dateTimeDisplay}</span>
          </div>
        </div>
        ${
          commentator
            ? `
          <div class="detail mt-2 match_item--commentator">
            <img
                onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                src="${commentatorAvatar}" alt="${commentatorName}" width="24" height="24"/>
            ${commentatorName}
          </div>
        `
            : ""
        }
    `;
  } else if (isNotStarted) {
    // Not started/Scheduled: text "Chưa diễn ra" + kickoff HH:MM DD/MM + commentator
    const matchDate = DV2.formatDateDDMM(kickoff);
    const dateTimeDisplay = `${matchTime} ${matchDate}`;
    infoBlockHtml = `
        <div style="display: flex; gap: 6px; flex-direction: column;">
          <div class="detail match_item--time">
            <span class="match-status scheduled">Chưa diễn ra</span>
          </div>
          <div class="match_item--status">
            <span class="match-status">${dateTimeDisplay}</span>
          </div>
        </div>
        ${
          commentator
            ? `
          <div class="detail mt-2 match_item--commentator">
            <img 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
            src="${commentatorAvatar}" alt="${commentatorName}" width="24" height="24"/>
            ${commentatorName}
          </div>
        `
            : ""
        }
    `;
  } else {
    // Other status: show time and date
    const matchDate = DV2.formatDateDDMM(kickoff);
    const dateTimeDisplay = `${matchTime} ${matchDate}`;
    infoBlockHtml = `
        <div style="display: flex; gap: 6px; flex-direction: column;">
          <div class="detail match_item--time">
            <span class="match-status">${matchStatus}</span>
          </div>
          <div class="match_item--status">
            <span class="match-status">${dateTimeDisplay}</span>
          </div>
        </div>
        ${
          commentator
            ? `
          <div class="detail mt-2 match_item--commentator">
            <img 
            onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
            src="${commentatorAvatar}" alt="${commentatorName}" width="24" height="24"/>
            ${commentatorName}
          </div>
        `
            : ""
        }
    `;
  }

  const matchItemHtml = `
    <div class="vitem vitem-vertical ${isLive ? "vitem-live" : ""} match_item">
      <a href="${matchUrl}" class="match-link match_item--link"></a>
      <div class="vitem-info match_item--info">
        ${infoBlockHtml}
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
          <div class="match_item--score-home">${score.home}</div>
          <div class="match_item--score-away">${score.away}</div>
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

function getMatchScheduleListAdBlocks_KQHN() {
  return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS);
}

function buildMatchScheduleAdInsertions_KQHN(adBlocks, totalItems) {
  return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
    breakpoint: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_MOBILE_BREAKPOINT,
    repeatCycle: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_REPEAT,
  });
}

function buildMatchScheduleAdMarkup_KQHN(adBlock) {
  return window.DV2ListAds.buildMarkup(adBlock, {
    wrapperTag: "div",
    wrapperClass: "dv2-match-schedule-ad",
  });
}

function refreshMatchScheduleReviveAds_KQHN($container) {
  window.DV2ListAds.refreshReviveAds($container);
}

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
                <img loading="lazy" class="match_item--league-icon" src="${match.league?.logo}" alt="${match.league?.name}"
                  onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                 />
              </i>
            `
                : ""
            }
            <span class="item-league__name match_item--league-name">
              ${match.league?.name}
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

function buildEmptyScheduleListHtml_KQHN(message, styleAttr = "") {
  const adInsertions = buildMatchScheduleAdInsertions_KQHN(
    getMatchScheduleListAdBlocks_KQHN(),
    0,
  );
  const style = styleAttr ? ` style="${styleAttr}"` : "";
  let html = `<div class="no-matches"${style}>${message}</div>`;
  if (adInsertions.has(0)) {
    html += buildMatchScheduleAdMarkup_KQHN(adInsertions.get(0));
  }
  return html;
}

/**
 * Render match list grouped by league
 * @param {Array} matches - Array of match objects
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} HTML string
 */
function renderMatchList(matches, dateString) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return buildEmptyScheduleListHtml_KQHN("Không có trận đấu nào");
  }

  // Filter matches based on page type
  let filteredMatches = [];
  if (isSchedulePage) {
    // Schedule page: show live matches + future matches (not started/scheduled)
    filteredMatches = matches.filter(function (match) {
      if (!match || !match.status) {
        return false;
      }
      return isMatchLive(match) || DV2.isNotStartedStatus(match.status);
    });
  } else {
    // Results page: show finished matches + live matches (quá khứ + đang live)
    filteredMatches = matches.filter(function (match) {
      if (!match || !match.status) {
        return false;
      }
      return DV2.isFinishedStatus(match.status) || isMatchLive(match);
    });
  }

  if (filteredMatches.length === 0) {
    return buildEmptyScheduleListHtml_KQHN("Không có trận đấu nào");
  }

  const sorted = DV2.sortedMatchesFunction(filteredMatches);
  const adInsertions = buildMatchScheduleAdInsertions_KQHN(
    getMatchScheduleListAdBlocks_KQHN(),
    sorted.length,
  );

  let html = "";

  sorted.forEach(function (match, index) {
    html += renderMatchBox(match);

    const matchPosition = index + 1;
    if (adInsertions.has(matchPosition)) {
      const adMarkup = buildMatchScheduleAdMarkup_KQHN(adInsertions.get(matchPosition));
      if (adMarkup) {
        html += adMarkup;
      }
    }
  });

  return html;
}

/**
 * Load matches for a specific date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
function loadMatchesForDate(dateString) {
  const $matchContainer = $("#match_list_container");
  if (!$matchContainer.length) {
    return;
  }

  // Remove loading if exists
  hideLoading();

  if (!matchesDataByDate[dateString]) {
    $matchContainer.find(".match_box").remove();
    $matchContainer.find(".no-matches").remove();
    $matchContainer.find(".dv2-match-schedule-ad").remove();
    $matchContainer.append(
      buildEmptyScheduleListHtml_KQHN(
        "Không có trận đấu nào trong ngày.",
        "padding: 20px; text-align: center; color: #8e8f92;",
      ),
    );
    refreshMatchScheduleReviveAds_KQHN($matchContainer);
    return;
  }

  const matches = matchesDataByDate[dateString];

  // Remove existing matches
  $matchContainer.find(".match_box").remove();
  $matchContainer.find(".no-matches").remove();
  $matchContainer.find(".dv2-match-schedule-ad").remove();

  // Render new matches (pass dateString for sorting logic)
  const html = renderMatchList(matches, dateString);
  $matchContainer.append(html);
  refreshMatchScheduleReviveAds_KQHN($matchContainer);
}
