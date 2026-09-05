// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

$(document).ready(function () {
    if ($(".dv2-layout-ck.dv2-home-matchs").length > 0) {
        renderListMatchs_CK();
    }
});

let currentIndex_CK = 0;
let filteredMatchesGlobal_CK = [];

function renderListMatchs_CK() {
    const $listContainer = $(".dv2-layout-ck.dv2-home-matchs");
    const $liveVideoGrid = $listContainer.find(".dv2-match-grid");

    // nếu đã có loading thì không append thêm
    if ($listContainer.find('.dv2-loading').length === 0) {
        $listContainer.append(`
            <div class="dv2-loading">
                <div class="dv2-spinner"></div>
            </div>
        `);
    }

    const today = new Date();
    const toDate = new Date();
    toDate.setDate(today.getDate() + 7);

    const payload = {
        fromDate: today.toISOString().split("T")[0],
        toDate: toDate.toISOString().split("T")[0]
    };

    $.ajax({
        url: "https://vsc-apidev.helizones.com/api/data/lives/range-date",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
        dataType: "json",
        success: function (res) {
            // remove loading ngay khi có response
            $listContainer.find('.dv2-loading').remove();

            const matches = [];
            Object.values(res.matches_by_date || {}).forEach(dayMatches => {
                if (Array.isArray(dayMatches)) matches.push(...dayMatches);
            });

            if (!matches.length) {
                $liveVideoGrid.html('<div class="dv2-empty-state">Không có trận đấu nào trong 7 ngày tới</div>');
                return;
            }

            const normalizedMatches = matches.map(match => {
                const kickoff = match.kickoff ? new Date(match.kickoff) : null;
                const MATCH_DURATION_MINUTES = 120;
                const endTime = kickoff ? new Date(kickoff.getTime() + MATCH_DURATION_MINUTES * 60 * 1000) : null;
                const now = new Date();
                let status = 'Sắp diễn ra';

                if (kickoff && now >= kickoff && now <= endTime && match.livestream.available) status = 'LIVE';
                else if (kickoff && now > endTime) status = 'Kết thúc';

                return {
                    id: match.match_id,
                    slug: match.slug || "",
                    homeLogo: match?.teams?.home?.logo || "",
                    awayLogo: match?.teams?.away?.logo || "",
                    homeName: match?.teams?.home?.name || "Đội nhà",
                    awayName: match?.teams?.away?.name || "Đội khách",
                    kickoff: kickoff,
                    league: match?.league?.name || "Giải đấu",
                    leagueLogo: match?.league?.logo || '',
                    livestream: match.livestream,
                    links: match?.livestream?.links || [],
                    scoreHalftime: match?.score?.halftime || { home: '-', away: '-' },
                    scoreFulltime: match?.score?.fulltime || { home: '-', away: '-' },
                    status
                };
            });

            // Filter and sort matches
            const now = new Date();
            const liveMatches = [];
            const upcomingMatches = [];

            normalizedMatches.forEach(match => {
                const kickoff = new Date(match.kickoff);
                const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));

                if (now >= kickoff && now <= matchEndTime && match.livestream.available) {
                    liveMatches.push(match);
                } else if (now < kickoff) {
                    upcomingMatches.push(match);
                }
            });

            // Combine: live first, then upcoming
            const allMatches = [...liveMatches, ...upcomingMatches];

            updateFilterCounts_CK(allMatches);
            setupFilterButtons_CK(allMatches);

            renderHomeMatches_CK(allMatches, 'live');
        },
        error: function (err) {
            console.error("[VSC LIVE] API error:", err);
            $liveVideoGrid.html('<div class="dv2-empty-state">Lỗi khi tải dữ liệu</div>');
        }
    });
}

// Cập nhật tổng số trận cho từng filter
function updateFilterCounts_CK(matches) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7);

    const counts = {
        all: matches.filter(m => m.kickoff >= todayStart && m.kickoff <= weekEnd).length,
        live: matches.filter(m => m.status === 'LIVE').length,
        today: matches.filter(m => m.kickoff >= todayStart && m.kickoff <= todayEnd).length
    };

    $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn[data-filter="all"]').text(`Tất cả (${counts.all})`);
    $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn[data-filter="live"]').text(`Đang live (${counts.live})`);
    $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn[data-filter="today"]').text(`Hôm nay (${counts.today})`);
}

// filter theo trạng thái
function setupFilterButtons_CK(matches) {
    $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn').off('click').on('click', function () {
        $('.dv2-layout-ck.dv2-home-matchs .dv2-filter-btn').removeClass('dv2-active');
        $(this).addClass('dv2-active');
        const filter = $(this).data('filter');
        renderHomeMatches_CK(matches, filter);
    });
}

function renderHomeMatches_CK(matches, filter = 'all') {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7);

    let filteredMatches = matches.filter(match => {
        if (filter === 'live') return match.status === 'LIVE';
        if (filter === 'today') return match.kickoff >= todayStart && match.kickoff <= todayEnd;
        if (filter === 'all') return match.kickoff >= todayStart && match.kickoff <= weekEnd;
        return true;
    });

    filteredMatches.sort((a, b) => {
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return new Date(a.kickoff) - new Date(b.kickoff);
    });

    filteredMatchesGlobal_CK = filteredMatches;
    currentIndex_CK = 0;

    const $c = $('.dv2-layout-ck.dv2-home-matchs .dv2-match-grid');
    $c.empty();

    if (!filteredMatches.length) {
        $c.html(`<div class="dv2-empty-state">
                        <div style="font-size: 56px; opacity: 0.3;">⚽</div>
                        <div style="font-size: 15px;">Không có trận đấu nào</div>
                    </div>`);
        $('.dv2-loadmore').hide();
        return;
    }

    renderNextMatchesBatch_CK();

    $('.dv2-layout-ck.dv2-home-matchs .dv2-load-more-btn').off('click').on('click', renderNextMatchesBatch_CK);
}

function renderNextMatchesBatch_CK() {
    const $c = $('.dv2-layout-ck.dv2-home-matchs .dv2-match-grid');
    const limit = 10;
    const nextBatch = filteredMatchesGlobal_CK.slice(currentIndex_CK, currentIndex_CK + limit);

    nextBatch.forEach(match => {
        const $card = $(renderMatchCard_CK(match));
        $c.append($card);
        setTimeout(() => $card.addClass('fade-in'), 50);
    });

    currentIndex_CK += nextBatch.length;

    if (currentIndex_CK >= filteredMatchesGlobal_CK.length) {
        $('.dv2-layout-ck.dv2-home-matchs .dv2-loadmore').fadeOut(200);
    } else {
        $('.dv2-layout-ck.dv2-home-matchs .dv2-loadmore').show();
    }
}

function renderMatchCard_CK(match) {
    const matchDateTime = match.kickoff || '';
    const dateLabel = getDateLabel_CK(matchDateTime);
    const timeLabel = matchDateTime ? formatTime_CK(matchDateTime) : '';
    const statusClass = match.status === 'LIVE' ? 'dv2-status-live' : (match.status === 'Sắp diễn ra' ? 'dv2-status-scheduled' : 'dv2-status-finished');

    return `
        <div class="dv2-match-card" data-id="${match.id}">
            <div class="dv2-match-header">
                <div class="dv2-league-info">
                    <span class="dv2-league-name">${match.league}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="dv2-match-status ${statusClass}">
                        ${match.status === 'LIVE' ? '● LIVE' : match.status === 'Sắp diễn ra' ? 'Sắp diễn ra' : 'Kết thúc'}
                    </span>
                    <span class="dv2-match-time">${dateLabel} - ${timeLabel}</span>
                </div>
            </div>
            <div class="dv2-match-content">
                <div class="dv2-team">
                    <div class="dv2-team-logo"><img src="${match.homeLogo}" alt="${match.homeName}"></div>
                    <div class="dv2-team-name">${match.homeName}</div>
                </div>
                <div class="dv2-score-section">
                    <div class="dv2-score">
                        <div class="dv2-score-number">${match.scoreFulltime.home}</div>
                        <div class="dv2-score-separator">:</div>
                        <div class="dv2-score-number">${match.scoreFulltime.away}</div>
                    </div>
                    <div class="dv2-half-time">HT ${match.scoreHalftime.home} - ${match.scoreHalftime.away}</div>
                </div>
                <div class="dv2-team dv2-away">
                    <div class="dv2-team-logo"><img src="${match.awayLogo}" alt="${match.awayName}"></div>
                    <div class="dv2-team-name">${match.awayName}</div>
                </div>
            </div>
            <div class="dv2-blv-box">
                ${(match?.links || []).map(blv => `
                    <a class="dv2-bottom-group" href="#" data-id="${match.id}">
                        <span class="dv2-bottom-logo">
                            <img class="dv2-image-blv" alt="${blv.commentator}"
                                src="${blv.avatar}">
                        </span>
                        <span class="dv2-bottom-name dv2-ellipsis">${blv.commentator}</span>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
}

// Hàm xử lý vào xem chi tiết trận đấu
$(document).on('click', '.dv2-layout-ck.dv2-home-matchs .dv2-match-card', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const matchId = $btn.data('id') || '';
    // redirect to livestream page
    window.location.href = `/streams/${matchId}`;
});

function formatTime_CK(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getDateLabel_CK(matchDate) {
    if (!matchDate) return '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const match = new Date(matchDate); match.setHours(0, 0, 0, 0);

    return `${String(match.getDate()).padStart(2, '0')}/${String(match.getMonth() + 1).padStart(2, '0')}`;
}
