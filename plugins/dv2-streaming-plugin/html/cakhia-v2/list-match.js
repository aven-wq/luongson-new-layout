$ = jQuery.noConflict();

$(document).ready(() => {
  if ($(".dv2-list-match").length > 0) {
    // updateDateTime_VB();
    loadHomeMatchesData_CK2();
  }
});
/**
 * Live match statuses
 * @type {string[]}
 */
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

function renderHomeMatchCard_VB2(match, index) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
  const kickoffDate = new Date(match.kickoff).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
  const kickoff = new Date(match.kickoff).toLocaleTimeString("vn-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const home = match.teams?.home || {};
  const score = match.score || {};
  const away = match.teams?.away || {};
  const league = match.league || {};
  // const formattedTime = formatMatchTime_VB(kickoff);
  const preferredBlv = getPreferredLivestreamLink(match);
  const isHot = appState.hotLeaguesRank.has(match.league.id);
  const isLive = LIVE_STATUS.includes(match.status.toLowerCase());
  const isToday = today === kickoffDate;

  return `
        <div
          class="match-info-primary text-white lg:flex lg:flex-row lg:items-center gap-5 lg:border-b border-0 lg:justify-between lg:py-5 lg:px-4 relative border-gradient-2 ${
            index % 2 === 0 ? "bg-[#252E3F]" : "bg-transparent"
          }"
          >
          <a class="absolute top-0 left-0 w-full h-full ${isHot ? "ck2-list-match-hot" : ""}" href="/streams/${
            match?.match_id
          }"></a>
          <div class="hidden lg:flex lg:flex-col-reverse 2xl:flex-row gap-2 lg:flex-1 lg:items-start 2xl:items-center">
            <div class="w-full max-w-44 flex">
              <div class="inline-flex gap-1.5 items-center font-semibold overflow-hidden text-xs rounded-3xl"
                style="background-color:#4986F7"><img 
                  onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'" 
                  src=${preferredBlv?.avatar || ""}
                  alt=${preferredBlv?.commentator || ""} class="w-8 h-8 rounded-full m-0.5"><span
                  class="pr-3 py-1 whitespace-nowrap text-ellipsis overflow-hidden max-w-40">${
                    preferredBlv?.commentator || ""
                  }</span>
              </div>
            </div>
            <div class="event-league pointer-events-none">
              <div class="relative flex items-center gap-2 text-neutral-3">
                <div class="flex items-center justify-center gap-2">
                  <img width="20" height="20" src="${league.logo}" alt="${
                    league.logo
                    }" 
                    onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"/>
                  <span class="text-sm line-clamp-2 max-w-36">${
                    league.name
                  }</span>
                </div>
              </div>
            </div>
          </div>
          <div class="lg:w-full lg:max-w-[500px] ">
            <div class="event-league text-center p-3 pt-4 lg:hidden">
              <div class="relative flex justify-center items-center gap-2 text-neutral-3">
                <div class="flex items-center justify-center gap-2"> <img width="20" height="20" src="${
                  league.logo
                }" onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                    alt="${league.logo}" />
                  <span class="text-sm line-clamp-2 max-w-36">${
                    league.name
                  }</span>
                </div>
              </div>
             ${
               isLive
                 ? ` <div class="h-6 flex flex-1 absolute right-0">
                <div class="flex items-center justify-center gap-1 live"><i class="fa-solid fa-circle" style="color: rgb(247 73 73)" 
                    aria-hidden="true"></i>
                  <span class="text-sm text-primary font-semibold">Live</span>
                </div>
              </div>`
                 : ""
             }
             
            </div>
              <div
              class="flex flex-row justify-center items-stretch gap-5 px-3 pb-3 mb-3 border-b border-gradient lg:p-0 lg:border-none lg:mb-0">
              <div class="flex-1 items-center justify-start flex flex-col gap-4 text-center lg:flex-row">
                <div class="inline-flex justify-center items-center max-w-max flex-1 basis-full"><img loading="lazy"
                    class="w-12 h-12 object-cover rounded-full" rel="nofollow" src="${
                      home.logo
                    }" alt="${home.logo}"
                    onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                    >
                </div>
                <h5 class="team-name text-sm font-medium line-clamp-2 min-h-10 lg:min-h-0 max-w-36 lg:text-left">
                  ${home.name}</h5>
              </div>
              <div class="w-24">
                <div class="text-2xl font-medium flex flex-col items-center justify-center gap-3"><span
                    class="time text-minute font-normal text-sm lg:text-base capitalize"> ${
                      match?.currentMinutes
                        ? `<span class="time text-minute font-normal text-sm lg:text-base capitalize">
                      ${match?.currentMinutes}'
                    </span>`
                        : ""
                    }</span><span>${
                      isLive
                        ? `${score.fulltime.home} - ${score.fulltime.away}`
                        : `VS`
                    }</span>
                    </span>
                    <span class="time text-sm  font-medium">${kickoff} ${
                      isToday ? "" : `${kickoffDate}`
                    }</span></div>
              </div>
              <div class="flex-1 items-center justify-start flex flex-col gap-4 text-center lg:flex-row-reverse">
                <div class="inline-flex justify-center items-center max-w-max flex-1 basis-full"><img loading="lazy"
                    class="w-12 h-12 object-cover rounded-full" rel="nofollow" src="${
                      away.logo
                      }" alt="${away.logo}"
                      onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                    >
                </div>
                <h5 class="team-name text-sm font-medium line-clamp-2 min-h-10 lg:min-h-0 max-w-36 lg:text-right">
                  ${away.name}</h5>
              </div>
            </div>
          </div>
          
          <div class="flex justify-between items-center gap-2 px-3 pb-4 lg:flex-1 lg:justify-end lg:p-0 z-10 relative">
            <div class="inline-flex gap-1.5 items-center font-semibold overflow-hidden lg:hidden text-xs rounded-3xl"
              style="background-color:#4986F7"><img src=${preferredBlv?.avatar || ""} onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                alt=${preferredBlv?.commentator || ""} class="w-8 h-8 rounded-full m-0.5"><span
                class="pr-3 py-1 whitespace-nowrap text-ellipsis overflow-hidden">${
                  preferredBlv?.commentator || ""
                }</span>
            </div>
            <div class="flex gap-1 shrink-0 lg:flex-col 2xl:flex-row lg:gap-2 z-10 relative text-center">
           ${
             isLive
               ? ` <a
                class="py-1 px-4 rounded-3xl font-semibold text-sm capitalize leading-5 bg-primary py-2 text-xs lg:text-sm lg:w-28 lg:leading-[22px] cakhia-btn-hover"
                href="/streams/${match?.match_id}">Trực tiếp</a>`
               : `<button type="button" class="py-1 px-3 font-semibold text-sm capitalize  text-sm border py-2 lg:w-28 text-xs lg:text-sm text-neutral-3 border-neutral-3 rounded-3xl"><span class="inline-block">Sắp diễn ra</span></button>`
           }
              <a href="${window.DV2_LINK_BET}"
              target="_blank" rel="nofollow"
              class="cakhia-btn-bet text-white py-1 px-3 rounded-3xl font-semibold text-sm capitalize text-sm leading-5 bg-primary-1 py-2 text-xs lg:text-sm">Đặt
              cược</a>
            </div>
          </div>
        </div>
    </div>
            `;
}
const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-first",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
});

function getMatchScheduleListAdBlocks_VB2() {
  return (
    window.DV2ListAds?.getBlocks?.(
      window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS,
    ) || []
  );
}

function buildMatchScheduleAdInsertions_VB2(adBlocks, totalItems) {
  return (
    window.DV2ListAds?.buildInsertions?.(adBlocks, totalItems, {
      breakpoint:
        window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_MOBILE_BREAKPOINT,
      repeatCycle: window.DV2_SOCOLIVE_MATCH_SCHEDULE_LIST_ADS_REPEAT,
    }) || new Map()
  );
}

function buildMatchScheduleAdMarkup_VB2(adBlock) {
  return (
    window.DV2ListAds?.buildMarkup?.(adBlock, {
      wrapperTag: "div",
      wrapperClass: "dv2-match-schedule-ad",
    }) || ""
  );
}

function refreshMatchScheduleReviveAds_VB2($container) {
  window.DV2ListAds?.refreshReviveAds?.($container);
}

function renderLiveMatch_CK2(matches, filter = "all") {
  const now = new Date();
  const filtered = matches
    .filter((m) => {
      const kickoff = new Date(m.kickoff);

      if (filter === "live")
        return LIVE_STATUS.includes(m.status.toLowerCase());
      if (filter === "today") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const endDay = new Date(now);
        endDay.setHours(23, 59, 59, 999);
        return (
          (m.status !== "Finished" && kickoff > now && kickoff <= endDay) ||
          LIVE_STATUS.includes(m.status.toLowerCase())
        );
      }
      if (filter === "tmr") {
        return kickoff.getDate() === now.getDate() + 1;
      }
      return (
        LIVE_STATUS.includes(m.status.toLowerCase()) ||
        kickoff.getTime() > now.getTime()
      );
    })
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    );

  const sortedMatches = sortedMatchesFunction(filtered);

  const $c = $(".dv2-container-ck2");
  $c.empty();

  const adBlocks = getMatchScheduleListAdBlocks_VB2();
  const adInsertions = buildMatchScheduleAdInsertions_VB2(
    adBlocks,
    sortedMatches.length,
  );

  if (!sortedMatches.length) {
    let emptyHtml = `<div class="dv2-empty-state">Hiện tại không có trận đấu nào đang diễn ra.</div>`;
    const emptyInsertions = buildMatchScheduleAdInsertions_VB2(
      adBlocks,
      0,
    );
    if (emptyInsertions.has(0)) {
      emptyHtml += buildMatchScheduleAdMarkup_VB2(
        emptyInsertions.get(0),
      );
    }
    $c.html(emptyHtml);
    refreshMatchScheduleReviveAds_VB2($c);
    return;
  }

  let html = "";
  sortedMatches.forEach((m, index) => {
    html += renderHomeMatchCard_VB2(m, index);

    const matchPosition = index + 1;
    if (adInsertions.has(matchPosition)) {
      html += buildMatchScheduleAdMarkup_VB2(
        adInsertions.get(matchPosition),
      );
    }
  });

  $c.append(html);
  refreshMatchScheduleReviveAds_VB2($c);
}

async function loadHomeMatchesData_CK2() {
  const today = new Date();
  const tomorrow = new Date(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  tomorrow.setDate(today.getDate() + 1);
  const payload = {
    // date: today.toISOString().split("T")[0],
    fromDate: yesterday.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };

  $.ajax({
    url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: (res) => {
      if (res && res.matches_by_date) {
        const all = [];
        Object.keys(res.matches_by_date).forEach((d) =>
          all.push(...res.matches_by_date[d]),
        );
        //remove những trận đã kết thúc (của ngày hôm qua)
        const isLiveAndTodayMatches = all.filter(
          (m) => m.status !== "Finished",
        );

        renderLiveMatch_CK2(isLiveAndTodayMatches);
        setupFilterButtons_CK2(isLiveAndTodayMatches);
      } else
        $(".dv2-list-match").html(
          '<div class="dv2-empty-state">Không có dữ liệu</div>',
        );
    },
    error: () =>
      $(".dv2-list-match").html(
        '<div class="dv2-empty-state">Lỗi tải dữ liệu</div>',
      ),
  });
  DV2HotLeagues.load({
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  });
  // Process the array into a Map and store it in our state
}

// filter theo trạng thái
function setupFilterButtons_CK2(matches) {
  $(".dv2-list-match .dv2-filter-btn")
    .off("click")
    .on("click", function () {
      $(".dv2-list-match .dv2-filter-btn").removeClass(
        "from-[#FA764C] to-[#C84217]",
      );
      $(this).addClass("from-[#FA764C] to-[#C84217]");
      renderLiveMatch_CK2(matches, $(this).data("filter"));
    });
}
