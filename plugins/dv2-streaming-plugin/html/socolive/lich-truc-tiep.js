// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

const appState = {
  hotLeaguesRank: new Map(),
};
const LIVE_STATUS = [
  // Tạm dừng / sự cố
  // "delay",
  "interrupt",
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

const END_STATUS = [
    "end",
    "finished",
    "ft"
]
// Define constants
const baseApiUrl = window.BASE_API_URL
// const liveIcon = window.LIVE_ICON
// const triangleIcon = window.TRIANGLE_ICON

$(document).ready(function () {
    if ($(".dv2-layout-scl.dv2-match-wrapper-ctn").length) {
        loadMatchByRangeDate_SCL();
    }
});

// =================================================
// CALL API range-date để lấy danh sách lịch đấu
// =================================================
function loadMatchByRangeDate_SCL() {
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    const payload = {
        fromDate: today.toISOString().split("T")[0],
        toDate: next7Days.toISOString().split("T")[0],
    };

    $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-loading').show();
    $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-none').hide();
    // call api để lấy danh sách giải đấu hot
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
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-loading').hide();

            if (!response || !response.matches_by_date) {
                $('.match-none').show();
                return;
            }

            let dateMatches = Object.keys(response.matches_by_date).map(dateKey => ({
                date: dateKey,
                matches: response.matches_by_date[dateKey]
            }));

            // sort lại: hôm nay lên đầu
            dateMatches = sortDateMatches_SCL(dateMatches);

            if (dateMatches.length === 0) {
                $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-none').show();
                return;
            }

            renderDateTabs_SCL(dateMatches);
            renderMatchData_SCL(dateMatches);
        },
        error: function (xhr) {
            console.error("[VSC CALENDAR] Error:", xhr);
            $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-loading').hide();
            $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-none').show();
        }
    });
}

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function getMatchScheduleListAdBlocks() {
  return window.DV2ListAds.getBlocks(window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS);
}

function buildMatchScheduleAdInsertions(adBlocks, totalItems) {
  return window.DV2ListAds.buildInsertions(adBlocks, totalItems, {
    breakpoint: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_MOBILE_BREAKPOINT,
    repeatCycle: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_REPEAT,
  });
}

function buildMatchScheduleAdMarkup(adBlock) {
  return window.DV2ListAds.buildMarkup(adBlock, {
    wrapperTag: "div",
    wrapperClass: "dv2-match-schedule-ad",
  });
}

function refreshMatchScheduleReviveAds($container) {
  window.DV2ListAds.refreshReviveAds($container);
}

function buildMatchCardHtml_SCL(match, label, dayIndex) {
  const isHot = appState.hotLeaguesRank.has(match.league.id);
  const kickoff = new Date(match.kickoff);
  const timeStr = formatTime_SCL(kickoff);

  return `
    <div class="dv2-match-card ${isHot ? 'hot-match' : ''} ${label}" data-id="${match.match_id || ''}">
      <div class="dv2-left">
        <div class="dv2-info">
          <div class="name dv2-ellipsis" style="color:${label === "live" ? "red" : "#000"};">
            ${match?.league?.name || "Giải đấu"}
          </div>
          <div class="time">${timeStr}</div>
        </div>
        <div class="dv2-team">
          <div class="host">
            <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" class="host-img match-cover" src="${match.teams?.home?.logo || ''}">
            <span class="host-name dv2-ellipsis">${match.teams?.home?.name || ''}</span>
          </div>
          <div class="guest">
            <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" class="guest-img match-cover" src="${match.teams?.away?.logo || ''}">
            <span class="guest-name dv2-ellipsis">${match.teams?.away?.name || ''}</span>
          </div>
        </div>
      </div>
      <div class="dv2-right">
        <div class="anchor-list" data-tag="${dayIndex}">
          <div class="avatar-prev"></div>
          <div class="avatar-list avatar-swiper-container container-${dayIndex}">
            <div class="swiper-wrapper">
              ${(match.livestream?.links || []).map(blv => `
                <div class="dv2-blv-detail-match avatar-box swiper-slide ${label === "live" ? "living" : ""}" 
                     data-id="${match.match_id}" data-slug="${match.slug}"
                     data-href="${getBlvDetailUrl_SCL(match.match_id, blv)}">
                  <img onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" class="avatar" src="${blv.avatar}" title="${blv.commentator}">
                  <div class="name dv2-ellipsis">${blv.commentator}</div>
                  ${label === "live" ? '<img class="live" src="https://sta.vnres.co/web/assets/soco/img/live.png">' : ''}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="avatar-next"></div>
        </div>
        ${label === "live" ? `
          <div class="living-box">
            <img src="https://sta.vnres.co/web/assets/soco/img/triangle.png">
            <span>Đang trực tiếp...</span>
          </div>` : ``}
      </div>
    </div>`;
}

// =================================================
// Sort ngày: hôm nay lên đầu, còn lại tăng dần
// =================================================
function sortDateMatches_SCL(dateMatches) {
    return dateMatches.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);

        const isAToday = dateA.getTime() === today.getTime();
        const isBToday = dateB.getTime() === today.getTime();

        if (isAToday) return -1;
        if (isBToday) return 1;

        return dateA - dateB;
    });
}

// =================================================
// Format hiển thị ngày
// =================================================
function formatDateLabel_SCL(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const isToday = compareDate.getTime() === today.getTime();

    const weekdays = [
        "Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư",
        "Thứ năm", "Thứ sáu", "Thứ bảy"
    ];

    const weekday = isToday ? "Hôm nay" : weekdays[date.getDay()];
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dateFormatted = `${day}.${month}`;

    return { weekday, dateFormatted, isToday };
}

// =================================================
// Render tabs ngày
// =================================================
function renderDateTabs_SCL(dateMatches) {
    const $dateList = $('.dv2-layout-scl.dv2-match-wrapper-ctn .dv2-date-list .dv2-date-item');
    $dateList.empty();

    const sortedDates = [...dateMatches];

    if (sortedDates.length < 7) {
        const lastDate = new Date(sortedDates[sortedDates.length - 1].date);
        const daysNeeded = 7 - sortedDates.length;
        for (let i = 1; i <= daysNeeded; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);
            sortedDates.push({ date: nextDate.toISOString().split("T")[0], matches: [] });
        }
    }

    sortedDates.slice(0, 7).forEach((item, index) => {
        const { weekday, dateFormatted } = formatDateLabel_SCL(item.date);
        const activeClass = index === 0 ? "dv2-active" : "";

        const html = `
            <li class="dv2-item ${activeClass}" data-tag="${index + 1}" data-date="${item.date}">
                <div class="dv2-day">${weekday}</div>
                <div class="dv2-date">${dateFormatted}</div>
                ${activeClass ? '<div class="dv2-indicator"></div>' : ''}
            </li>
        `;
        $dateList.append(html);
    });
}

// =================================================
// Render dữ liệu trận đấu theo ngày
// =================================================
function renderMatchData_SCL(dateMatches) {
    const $matchWrapper = $('.dv2-layout-scl.dv2-match-wrapper-ctn .dv2-match-data');
    const $matchNone = $('.dv2-layout-scl.dv2-match-wrapper-ctn .match-none');
    $matchWrapper.empty();

    dateMatches.forEach((item, index) => {
        const { liveMatches, upcomingMatches, endedMatches } = getListMatchsByTime_SCL(item.matches, item.date);
        const dayMatchCount =
          liveMatches.length + upcomingMatches.length + endedMatches.length;
        const adInsertions = buildMatchScheduleAdInsertions(
          getMatchScheduleListAdBlocks(),
          dayMatchCount,
        );

        let matchHtml = "";
        let matchPosition = 0;

        const renderMatchList = (matches, label) => {

            if (!matches.length) return "";
            const title = label === "live" ? "🔴 Đang diễn ra" : label === "upcoming" ? "⏰ Sắp diễn ra" : "✅ Đã kết thúc";
            let html = `<div class="match-section"><h4 class="section-title">${title}</h4>`;
            matches.forEach((match) => {
                html += buildMatchCardHtml_SCL(match, label, index);
                matchPosition += 1;
                if (adInsertions.has(matchPosition)) {
                    const adMarkup = buildMatchScheduleAdMarkup(adInsertions.get(matchPosition));
                    if (adMarkup) {
                        html += adMarkup;
                    }
                }
            });
            html += `</div>`;
            return html;
        };

        matchHtml += renderMatchList(liveMatches, "live");
        matchHtml += renderMatchList(upcomingMatches, "upcoming");
        matchHtml += renderMatchList(endedMatches, "ended");

        let dayContent = matchHtml;
        if (!dayContent) {
            if (adInsertions.has(0)) {
                dayContent = buildMatchScheduleAdMarkup(adInsertions.get(0));
            } else {
                dayContent = '<div class="match-none">Không có trận đấu nào</div>';
            }
        }

        $matchWrapper.append(`
            <div class="dv2-match-day ${index === 0 ? 'dv2-active' : 'dv2-hidden'}" data-tag="${index + 1}" data-date="${item.date}">
                ${dayContent}
            </div>
        `);
    });

    // Khởi tạo Swiper sau khi render xong DOM
    initSwiperInstance('.avatar-swiper-container', '.avatar-next', '.avatar-prev');
    refreshMatchScheduleReviveAds($matchWrapper);

    // --- Click tabs ---
    $('.dv2-date-list .dv2-item').off('click').on('click', function () {
        const tag = $(this).data('tag');
        $('.dv2-date-list .dv2-item').removeClass('dv2-active');
        $(this).addClass('dv2-active');

        $('.dv2-match-day').addClass('dv2-hidden').removeClass('dv2-active');
        const $activeDay = $(`.dv2-match-day[data-tag="${tag}"]`);
        $activeDay.removeClass('dv2-hidden').addClass('dv2-active');

        const hasMatches = $activeDay.find('.dv2-match-card').length > 0;
        if (hasMatches) $matchNone.hide(); else $matchNone.show();
    });
}

// =================================================
// Phân loại trận đấu trong ngày
// =================================================
function getListMatchsByTime_SCL(matchs, selectedDate) {
    const now = new Date();
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const MATCH_DURATION_MINUTES = 120;
    const liveMatches = [], upcomingMatches = [], endedMatches = [];
    const sortedMatches = sortedMatchesFunction(matchs)
    sortedMatches.forEach(match => {
        const kickoff = new Date(match?.kickoff);
        if (isNaN(kickoff)) return;
        const endTime = new Date(kickoff.getTime() + MATCH_DURATION_MINUTES * 60 * 1000);

        const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
        const isEnd = END_STATUS.includes(match.status.toLowerCase());
        if (kickoff >= dayStart && kickoff <= dayEnd) {
            if (isLive) liveMatches.push(match);
            else if (kickoff > now) upcomingMatches.push(match);
            else if (isEnd) endedMatches.push(match);
        }
    });

    // liveMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    // upcomingMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    // endedMatches.sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));

    return { liveMatches, upcomingMatches, endedMatches };
}

// =================================================
// Utils
// =================================================
function formatTime_SCL(date) {
    const d = new Date(date);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

function getBlvDetailUrl_SCL(matchId, blv) {
    if (window.DV2StreamLinks?.getDetailUrl) {
        return window.DV2StreamLinks.getDetailUrl(matchId, blv, { trailingSlash: false });
    }
    const liveId = blv?.liveId;
    if (liveId != null && liveId !== '') {
        return `/streams/${matchId}?liveId=${encodeURIComponent(String(liveId))}`;
    }
    return `/streams/${matchId}`;
}

$(document).on('click', '.dv2-layout-scl .dv2-match-card', function (e) {
    e.preventDefault();
    const matchId = $(this).data('id') || '';
    window.location.href = `/streams/${matchId}`;
});

$(document).on('click', '.dv2-layout-scl .dv2-match-card .dv2-blv-detail-match', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const href = $(this).data('href') || '';
    const matchId = $(this).data('id') || '';
    window.location.href = href || `/streams/${matchId}`;
});

// Chặn click nút điều hướng slider nổi bọt lên .dv2-match-card
$(document).on('click', '.dv2-layout-scl .dv2-match-card .avatar-next, .dv2-layout-scl .dv2-match-card .avatar-prev', function (e) {
    e.preventDefault();
    e.stopPropagation();
});

function initSwiperInstance(containerSelector, nextBtnSelector, prevBtnSelector) {
    const $containers = $(containerSelector);
    if (!$containers.length || typeof Swiper === 'undefined') return;

    const instances = [];
    $containers.each(function () {
        // Bỏ qua nếu đã init rồi
        if (this.swiper) return;
        // Lấy đúng nút prev/next nằm trong .anchor-list cha của slider này
        const $anchor = $(this).closest('.anchor-list');
        const nextEl = $anchor.find(nextBtnSelector).get(0);
        const prevEl = $anchor.find(prevBtnSelector).get(0);
        instances.push(new Swiper(this, {
            slidesPerView: 5,
            spaceBetween: 8,
            watchOverflow: true,
            navigation: { nextEl, prevEl },
            breakpoints: {
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
                1280: { slidesPerView: 5 },
            },
            loop: false,
        }));
    });
    return instances;
}
