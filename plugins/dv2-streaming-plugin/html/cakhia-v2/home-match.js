$ = jQuery.noConflict();
const appState = {
  hotLeaguesRank: new Map(),
};
let featuredScorePoll = null;
/**
 * Live match statuses
 * @type {string[]}
 */
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

$(document).ready(() => {
  if ($(".dv2-ck2-home-featured-streams").length > 0) {
    // updateDateTime_VB();
    loadHomeMatchesData_CK2();
  }
});

const sortedMatchesFunction = DV2MatchSort.createSortedMatchesFunction({
  mode: "priority-competition-when-live-or-soon",
  liveStatuses: LIVE_STATUS,
  hotLeaguesRank: () => appState.hotLeaguesRank,
  priorityCompetitionSoonMinutes: 10,
});

function getMatchIdFromMatch(match) {
  return DV2MatchScorePoll.getMatchId(match);
}

function syncFeaturedMatchSnapshot(match) {
  if (!featuredScorePoll) {
    featuredScorePoll = DV2MatchScorePoll.create({
      container: ".dv2-ck2-home-featured-streams",
    });
  }
  featuredScorePoll.sync(match);
}

function stopFeaturedMatchScorePolling() {
  featuredScorePoll?.stop();
}

function startFeaturedMatchScorePolling() {
  featuredScorePoll?.start();
}

function normalizeMatchStats_CK2(rawStats, defaults) {
  const result = { ...defaults };
  if (!rawStats || typeof rawStats !== "object") return result;

  for (const key of Object.keys(defaults)) {
    result[key] = {
      home: rawStats[key]?.home ?? defaults[key].home,
      away: rawStats[key]?.away ?? defaults[key].away,
    };
  }
  return result;
}

function renderHomeMatchCard_CK2(match) {
  console.log(match);
  const matchKickOff = match?.matchInfo?.kickoff ?? match?.kickoff;
  const kickoff = new Date(matchKickOff).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  });
  console.log(kickoff);

  const home = match?.teams?.home || {};
  const score = match?.score || {};
  const away = match?.teams?.away || {};
  const league = match?.league || {};
  const defaultStats = {
    possession: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
  };
  const stats = normalizeMatchStats_CK2(match.stats, defaultStats);
  const sumOfCornors = stats.corners.home + stats.corners.away;
  const sumOfShots = stats.shotsOnTarget.home + stats.shotsOnTarget.away;

  const preferredBlv = getPreferredLivestreamLink(match);
  const matchId = getMatchIdFromMatch(match);
  const homeScore = score?.fulltime?.home ?? 0;
  const awayScore = score?.fulltime?.away ?? 0;
  const pen = score?.pen;
  const hasPen = pen && (pen.home != null || pen.away != null);
  return `
      <div class="flex flex-col xl:gap-4">
        <div class="w-full">
          <div class="pb-7 lg:pt-7 m-auto">
            <div class="relative">
              <a
               href="/streams/${matchId}" 
                class="absolute top-0 left-0 w-full h-full z-10"
              ></a>
              <div
                class="match-card-featured flex flex-col lg:flex-row gap-4 xl:gap-7 justify-center items-center"
              >
                <div
                  class="match-info-primary text-white flex-1 w-full px-2 lg:px-0"
                >
                  <div class="event-league text-center md:pb-4">
                    <div
                      class="flex justify-center items-center gap-2 mb-2 md:mb-4 text-text"
                    >
                        <img
                          onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                          width="20"
                          height="20"
                          src="${league.logo}"
                          alt="${league.logo}"
                        />
                        ${league.name}
                    </div>
                    <div
                      class="inline-flex gap-1.5 items-center font-semibold overflow-hidden hidden md:inline-flex rounded-3xl"
                      style="background-color: #4986f7"
                    >
                      <img
                        onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                        src=${preferredBlv?.avatar || ""}
                        alt=${preferredBlv?.commentator || ""}
                        class="w-8 h-8 rounded-full m-0.5"
                      /><span class="pr-3 py-1 text-sm md:text-base py-2 !pr-4">${
                        preferredBlv?.commentator || ""
                      }</span>
                       
                    </div>
                  </div>
                  <div
                    class="flex flex-row justify-between items-stretch gap-3 lg:gap-5 xl:gap-10 border-b border-gradient pb-4 mb-5"
                  >
                    <div
                      class="flex-1 items-center justify-start flex flex-col lg:flex-row-reverse gap-2 lg:gap-4 text-center"
                    >
                      <div
                        class="inline-flex justify-center items-center max-w-max p-2 lg:p-3 bg-[#5a5a5a] bg-opacity-25 rounded-full"
                      >
                        <img
                          onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                          class="w-10 h-10 md:w-16 md:h-16 object-cover rounded-full flex"
                          rel="nofollow"
                          src="${home.logo}"
                          alt="${home.logo}"
                        />
                      </div>
                      <h5
                        class="team-name text-base lg:text-2xl font-medium line-clamp-2 lg:text-right flex-1 min-h-10 lg:min-h-auto"
                      >
                        ${home.name}
                      </h5>
                    </div>
                    <div
                      class="text-2xl font-medium flex flex-col items-center justify-center gap-3"
                    >
                     ${
                       match?.currentMinute ?? match?.currentMinutes
                         ? `<span class="time text-minute font-normal text-sm lg:text-base capitalize" data-dv2-score-minute>
                           ${match?.currentMinute ?? match?.currentMinutes}'
                         </span>`
                         : ""
                     } <span
                        ><span class="" data-dv2-score-home>${homeScore}</span> -<!-- -->
                        <span class="" data-dv2-score-away>${awayScore}</span></span
                      >${
                        hasPen
                          ? `<span class="flex flex-col items-center leading-tight -mt-1">
                        <span class="text-base font-semibold text-white"><span data-dv2-score-pen-home>${pen.home}</span> - <span data-dv2-score-pen-away>${pen.away}</span></span>
                        <span class="text-xs font-normal text-white">(Penalty)</span>
                      </span>`
                          : ""
                      }<span class="time text-sm font-medium">${kickoff}</span>
                    </div>
                    <div
                      class="flex-1 items-center justify-start flex flex-col lg:flex-row gap-2 lg:gap-4 text-center"
                    >
                      <div
                        class="inline-flex justify-center items-center max-w-max p-2 lg:p-3 bg-[#5a5a5a] bg-opacity-25 rounded-full"
                      >
                        <img
                          onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                          class="w-10 h-10 md:w-16 md:h-16 object-cover rounded-full flex"
                          rel="nofollow"
                          src="${away.logo}"
                          alt="${away.logo}"
                        />
                      </div>
                      <h5
                        class="team-name text-base lg:text-2xl font-medium line-clamp-2 lg:text-left flex-1 min-h-10 lg:min-h-auto"
                      >
                        ${away.name}
                      </h5>
                    </div>
                  </div>
                  <div class="flex gap-1 justify-between md:justify-center">
                    <div
                      class="inline-flex gap-1.5 items-center font-semibold overflow-hidden md:hidden rounded-3xl"
                      style="background-color: #4986f7"
                    >
                      <img 
                        onerror="this.src='https://img.winfast.dev/assets/upload/football/team/images/teamicon.png'"
                        src="${preferredBlv?.avatar || ""}"
                        alt="${preferredBlv?.commentator || ""}" class="w-8 h-8
                        rounded-full m-0.5" /><span
                        class="pr-3 py-1 text-xs py-2 !pr-4 whitespace-nowrap text-ellipsis overflow-hidden"
                        >${preferredBlv?.commentator || ""}</span
                      >
                    </div>
                    <div
                      class="flex gap-1 shrink-0 justify-center z-10 relative"
                    >
                      <a class="cakhia-btn py-1 px-4 rounded-3xl font-semibold text-sm capitalize leading-5 bg-primary py-2 rounded-3xl cakhia-btn-hover"
                        href="/streams/${matchId}">Trực tiếp</a>
                      <a
                        href="${window.DV2_LINK_BET}"
                        target="_blank" rel="nofollow"
                        class="cakhia-btn-bet text-white py-1 px-3 rounded-3xl font-semibold text-sm capitalize text-sm leading-5 bg-primary-1 py-2 px-5 rounded-3xl"
                        >Đặt cược</a>
                    </div>
                  </div>
                </div>
                <div
                  class="match-stats text-neutral-4 text-sm flex-col gap-2 xl:flex"
                >
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8" id="home-possession">${stats?.possession?.home}%</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full" id="home-possessionPercent"
                          style="width: ${stats?.possession?.home}%"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Kiểm soát bóng
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1" id="away-possessionPercent"
                          style="width: ${stats?.possession?.away}%"
                        ></div>
                      </div>
                      <span class="w-8 text-right" id="away-possession">${
                        stats?.possession?.away
                      }%</span>
                    </div>
                  </div>
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8" id="home-corners">${stats?.corners?.home}</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full" id="home-cornersPercent"
                          style="width: ${
                            sumOfCornors !== 0
                              ? stats?.corners?.home / sumOfCornors
                              : 0
                          }"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Góc
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1"  id="away-cornersPercent"
                          style="width: ${
                            sumOfCornors !== 0
                              ? stats?.corners?.away / sumOfCornors
                              : 0
                          }"
                        ></div>
                      </div>
                      <span class="w-8 text-right" id="away-corners">${stats?.corners?.away}</span>
                    </div>
                  </div>
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8">0</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full"
                          style="width: 0%"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Thẻ vàng
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1"
                          style="width: 0%"
                        ></div>
                      </div>
                      <span class="w-8 text-right">0</span>
                    </div>
                  </div>
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8">0</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full"
                          style="width: 0%"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Thẻ đỏ
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1"
                          style="width: 0%"
                        ></div>
                      </div>
                      <span class="w-8 text-right">0</span>
                    </div>
                  </div>
                  <div
                    class="o-row flex md:gap-4 xl:gap-7 items-center justify-between py-3 md:px-3 px-5 bg-stats rounded-2xl backdrop-blur-sm"
                  >
                    <div class="team team-home flex items-center gap-4">
                      <span class="w-8" id="home-shots">${stats?.shotsOnTarget?.home}</span>
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5 flex justify-end"
                      >
                        <div
                          class="bg-neutral-3 h-1.5 rounded-full" id="home-shotsPercent"
                          style="width: ${
                            sumOfShots !== 0
                              ? stats?.shotsOnTarget?.home / sumOfShots
                              : 0
                          }"
                        ></div>
                      </div>
                    </div>
                    <div class="title text-white capitalize text-xs xl:text-sm">
                      Sút trúng đích
                    </div>
                    <div
                      class="team team-away flex items-center gap-4 text-primary-1"
                    >
                      <div
                        class="md:w-16 xl:w-20 bg-neutral-2 rounded-full h-1.5"
                      >
                        <div
                          class="h-1.5 rounded-full bg-primary-1" id="away-shotsPercent"
                          style="width: ${
                            sumOfShots !== 0
                              ? stats?.shotsOnTarget?.away / sumOfShots
                              : 0
                          }"
                        ></div>
                      </div>
                      <span class="w-8 text-right" id="away-shots">${
                        stats?.shotsOnTarget?.away
                      }</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
            `;
}

function loadHomeMatchesData_CK2() {
  const $c = $(".dv2-ck2-home-featured-streams");
  $c.empty();
  stopFeaturedMatchScorePolling();
  featuredScorePoll?.destroy?.();
  featuredScorePoll = null;

  // Nếu có MATCH ID → call API lấy duy nhất 1 trận
  const MATCH_ID =
    typeof DV2_MATCH_ID !== "undefined" && DV2_MATCH_ID ? DV2_MATCH_ID : "";
  if (MATCH_ID !== "") {
    $.ajax({
      url: "https://vsc-apidev.helizones.com/api/data/lives/" + DV2_MATCH_ID,
      method: "GET",
      contentType: "application/json",
      success: (res) => {
        if (res && res.data) {
          try {
            const cards = renderHomeMatchCard_CK2(res.data);
            $c.append(cards);
            syncFeaturedMatchSnapshot(res.data);
            startFeaturedMatchScorePolling();
          } catch (error) {
            console.error("[CK2 home-match] Render error:", error);
            $c.html(
              '<div class="dv2-empty-state">Lỗi hiển thị dữ liệu trận đấu.</div>',
            );
          }
        } else {
          $c.html(
            '<div class="dv2-empty-state">Không có dữ liệu cho MATCH_ID.</div>',
          );
        }
      },
      error: () =>
        $c.html('<div class="dv2-empty-state">Lỗi tải dữ liệu MATCH_ID</div>'),
    });

    return; // DỪNG, KHÔNG chạy tiếp logic lấy list
  }

  // --- Không có MATCH_ID → lấy trận đầu tiên (cùng pipeline với suggested-stream.js) ---
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const payload = {
    fromDate: today.toISOString().split("T")[0],
    toDate: tomorrow.toISOString().split("T")[0],
  };

  function renderFirstFeaturedMatch(res) {
    if (res?.status !== "success" || !res?.matches_by_date) {
      $c.html('<div class="dv2-empty-state">Không có dữ liệu</div>');
      return;
    }

    let allMatches = [];
    Object.values(res.matches_by_date).forEach((dateMatches) => {
      allMatches = allMatches.concat(dateMatches);
    });

    allMatches = allMatches.filter(
      (match) => match?.status?.toLowerCase() !== "finished",
    );

    const sortMatches = sortedMatchesFunction(allMatches);

    if (!sortMatches.length) {
      $c.html(
        `<div class="dv2-empty-state">Hiện tại không có trận đấu nào đang diễn ra.</div>`,
      );
      return;
    }

    const match = sortMatches[0];
    const cards = renderHomeMatchCard_CK2(match);
    $c.append(cards);
    syncFeaturedMatchSnapshot(match);
    startFeaturedMatchScorePolling();
  }

  DV2HotLeagues.load({
    ajax: $.ajax,
    setHotLeaguesRank: (rankMap) => {
      appState.hotLeaguesRank = rankMap;
    },
  }).always(() => {
      $.ajax({
        url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: renderFirstFeaturedMatch,
        error: () =>
          $c.html('<div class="dv2-empty-state">Lỗi tải dữ liệu</div>'),
      });
    });
}
