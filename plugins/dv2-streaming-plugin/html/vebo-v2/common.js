// =================================================
// Common Constants
// =================================================
window.DV2 = window.DV2 || {};
/**
 * API endpoint for lives range date
 * @type {string}
 */
const API_ENDPOINT_LIVES_RANGE_DATE =
  "https://vsc-apidev.helizones.com/api/data/lives/range-date";

const API_ENDPOINT_HOT_LEAGUES =
  "https://vsc-apidev.helizones.com/api/data/lives/competitions/hot";

/**
 * appState
 * @type {string[]}
 */
const appState = {
  hotLeaguesRank: new Map(),
};

/**
 * Vietnamese day names array
 * @type {string[]}
 */

const VIETNAMESE_DAY_NAMES = [
  "Chủ Nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

/**
 * Live match statuses
 * @type {string[]}
 */
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  "interrupt",
  "cut in half",
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

/**
 * All match statuses
 * @type {string[]}
 */
const MATCH_STATUS = [
  // Trước trận
  "not started",
  "to be determined",
  // Hoãn / huỷ / sự cố
  "delay",
  "interrupt",
  "cut in half",
  "postponed",
  "suspended",
  "abandoned",
  "cancel",
  "abnormal(suggest hiding)",
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
  "walkover",
];

// =================================================
// Date Formatting Functions
// =================================================

/**
 * Format date to DD/MM format
 * @param {Date} date - Date object
 * @returns {string} Formatted date string (DD/MM)
 */
DV2.formatDateDDMM = function (date) {
  if (!date || !(date instanceof Date)) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

/**
 * Get Vietnamese day label
 * @param {Date} date - Date object
 * @param {number} index - Index from today (0 = today, 1 = tomorrow, etc.)
 * @returns {string} Vietnamese day label
 */
DV2.getVietnameseDayLabel = function (date, index) {
  if (!date || !(date instanceof Date)) {
    return "";
  }

  if (index === 0) {
    return "Hôm nay";
  }
  if (index === 1) {
    return "Ngày mai";
  }

  const dayOfWeek = date.getDay();
  return VIETNAMESE_DAY_NAMES[dayOfWeek] || "";
};

/**
 * Get date string in YYYY-MM-DD format (local date, not UTC)
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
DV2.getDateString = function (date) {
  if (!date || !(date instanceof Date)) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM format
 * @param {Date|string} datetime - Date object or ISO string
 * @returns {string} Formatted time string (HH:MM)
 */
DV2.formatTimeHHMM = function (datetime) {
  if (!datetime) {
    return "";
  }

  const date = typeof datetime === "string" ? new Date(datetime) : datetime;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Get date label for match (Hôm nay, Ngày mai, or DD/MM)
 * @param {Date|string} matchDate - Date object or ISO string
 * @returns {string} Date label
 */
DV2.getDateLabel = function (matchDate) {
  if (!matchDate) {
    return "";
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const match = typeof matchDate === "string" ? new Date(matchDate) : matchDate;
  if (!(match instanceof Date) || isNaN(match.getTime())) {
    return "";
  }

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  match.setHours(0, 0, 0, 0);

  if (match.getTime() === today.getTime()) {
    return "Hôm nay";
  } else if (match.getTime() === tomorrow.getTime()) {
    return "Ngày mai";
  } else {
    return DV2.formatDateDDMM(match);
  }
};

// =================================================
// Match Status Functions
// =================================================

/**
 * Normalize match status to lowercase
 * @param {string} status - Match status string
 * @returns {string} Normalized status (lowercase)
 */
DV2.normalizeMatchStatus = function (status) {
  if (!status || typeof status !== "string") {
    return "";
  }
  return status.toLowerCase().trim();
};

/**
 * Check if status is a live status
 * @param {string} status - Match status string
 * @returns {boolean} True if status is live
 */
DV2.isLiveStatus = function (status) {
  const normalizedStatus = DV2.normalizeMatchStatus(status);
  return LIVE_STATUS.indexOf(normalizedStatus) !== -1;
};

/**
 * Check if match is finished
 * @param {string} status - Match status string
 * @returns {boolean} True if match is finished
 */
DV2.isFinishedStatus = function (status) {
  const normalizedStatus = DV2.normalizeMatchStatus(status);
  return (
    normalizedStatus === "finished" ||
    normalizedStatus === "ft" ||
    normalizedStatus === "end"
  );
};

/**
 * Sort matches following priority: Hot match live -> normal match live -> hot match -> normat match
 * @param {Array} matches - Array of match objects
 * @returns {string} HTML string
 */

DV2.sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "live-first-priority-competition",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => DV2.appState.hotLeaguesRank,
});
/**
 * Check if match is not started
 * @param {string} status - Match status string
 * @returns {boolean} True if match is not started
 */
DV2.isNotStartedStatus = function (status) {
  const normalizedStatus = DV2.normalizeMatchStatus(status);
  return normalizedStatus === "not started" || normalizedStatus === "scheduled";
};

// =================================================
// API Functions
// =================================================

/**
 * Call API to get matches by date range
 * @param {string} fromDate - Start date in YYYY-MM-DD format
 * @param {string} toDate - End date in YYYY-MM-DD format
 * @param {Function} successCallback - Success callback function
 * @param {Function} errorCallback - Error callback function
 */
DV2.fetchMatchesByDateRange = function (
  fromDate,
  toDate,
  successCallback,
  errorCallback,
) {
  if (!$ || typeof $.ajax !== "function") {
    console.error("[COMMON] jQuery is not available");
    if (errorCallback) {
      errorCallback({ message: "jQuery is not available" });
    }
    return;
  }

  const payload = {
    fromDate: fromDate,
    toDate: toDate,
  };

  $.ajax({
    url: API_ENDPOINT_LIVES_RANGE_DATE,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function (response) {
      if (successCallback) {
        successCallback(response);
      }
    },
    error: function (xhr, status, error) {
      console.error("[COMMON] API Error:", error);
      if (errorCallback) {
        errorCallback({ xhr: xhr, status: status, error: error });
      }
    },
  });

  DV2HotLeagues.load({
    url: API_ENDPOINT_HOT_LEAGUES,
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
      DV2.appState = appState;
    },
  });
};
