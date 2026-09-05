$ = jQuery.noConflict();

$(document).ready(() => {
    if ($(".dv2-layout-ck.dv2-calendar-matchs").length > 0) {
        updateDateTime_CK();
        loadHomeMatchesData_CK();
    }
});
function updateDateTime_CK() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    $('.dv2-layout-ck.dv2-calendar-matchs #currentDateTime').text(now.toLocaleDateString('vi-VN', options));
}

function formatMatchTime_CK(datetime) {
    const date = new Date(datetime);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${d}/${m} - ${time}`;
}

function renderHomeMatchCard_CK(match) {
    const kickoff = new Date(match.kickoff);
    const home = match.teams?.home || {};
    const away = match.teams?.away || {};
    const formattedTime = formatMatchTime_CK(kickoff);
    const commentators = match?.livestream?.links;

    return `
                <div class="dv2-match-card" onclick="goToMatchDetail('${match.match_id}')">
                <div class="dv2-time-col">${formattedTime}</div>
                <div class="dv2-teams-col">
                    <div class="dv2-team">
                    <div class="dv2-team-name" style="text-align: right">${home.name}</div>
                    <div class="dv2-team-logo"><img src="${home.logo}" alt="${home.name}"></div>
                    </div>
                    <div class="dv2-vs">vs</div>
                    <div class="dv2-team">
                    <div class="dv2-team-logo"><img src="${away.logo}" alt="${away.name}"></div>
                    <div class="dv2-team-name">${away.name}</div>
                    </div>
                </div>
                ${commentators.length > 0 ? `
                    <div class="dv2-commentators">
                        ${commentators.slice(0, 4).map(blv => `
                            <div class="dv2-commentator" 
                                data-commentator-id="${blv.commentatorId || ''}">
                                <div class="dv2-commentator-avatar">
                                    ${blv.avatar ?
            `<img src="${blv.avatar}" alt="${blv.commentator}">` :
            blv.commentator.charAt(0)
        }
                                </div>
                                <span class="dv2-commentator-name">${blv.commentator}</span>
                            </div>
                        `).join('')}
                        ${commentators.length > 4 ? `<div class="dv2-commentator-more">+${commentators.length - 4}</div>` : ''}
                    </div>
                ` : ''}
                </div>
            `;
}

function groupMatchesByLeague_CK(matches) {
    const grouped = {};
    matches.forEach(m => {
        const name = m.league?.name || 'Giải đấu khác';
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push(m);
    });
    return grouped;
}

// danh sách tất cả các trận đấu hom nay và ngày mai
function renderHomeMatches_CK(matches, filter = 'all') {
    const now = new Date();
    const twoHours = 2 * 60 * 60 * 1000;
    const filtered = matches.filter(m => {
        const kickoff = new Date(m.kickoff);
        const end = new Date(kickoff.getTime() + twoHours);
        if (filter === 'live') return now >= kickoff && now <= end;
        if (filter === 'today') {
            const start = new Date(now); start.setHours(0, 0, 0, 0);
            const endDay = new Date(now); endDay.setHours(23, 59, 59, 999);
            return kickoff > now && kickoff <= endDay;
        }
        return end >= now;
    }).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    const $c = $('.dv2-layout-ck.dv2-calendar-matchs .dv2-home-container');
    $c.empty();
    if (!filtered.length) {
        $c.html(`<div class="dv2-empty-state">Không có trận đấu</div>`);
        return;
    }

    const grouped = groupMatchesByLeague_CK(filtered);
    Object.keys(grouped).forEach(league => {
        const logo = grouped[league][0]?.league?.logo || '';
        const cards = grouped[league].map(m => renderHomeMatchCard_CK(m)).join('');
        $c.append(`
                    <div class="dv2-league-section">
                        <div class="dv2-league-header">
                        ${logo ? `<img src="${logo}" class="dv2-league-logo">` : ''}
                        <div class="dv2-league-title">${league}</div>
                        </div>
                        ${cards}
                    </div>
                `);
    });
}

// danh sách trận đấu ngày trong tuần (trừ các trận đã diễn ra)
// function renderHomeMatchesCalendar_CK(matches, filter = 'all') {
//     const now = new Date();
//     const twoHours = 2 * 60 * 60 * 1000;
//     const filtered = matches.filter(m => {
//         const kickoff = new Date(m.kickoff);
//         const end = new Date(kickoff.getTime() + twoHours);
//         if (filter === 'live') return now >= kickoff && now <= end;
//         if (filter === 'today') {
//             const start = new Date(now); start.setHours(0, 0, 0, 0);
//             const endDay = new Date(now); endDay.setHours(23, 59, 59, 999);
//             return kickoff > now && kickoff <= endDay;
//         }
//         return end >= now;
//     }).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

//     const $c = $('.dv2-layout-ck.dv2-calendar-matchs .dv2-home-container');
//     $c.empty();
//     if (!filtered.length) {
//         $c.html(`<div class="dv2-empty-state">Không có trận đấu</div>`);
//         return;
//     }

//     const grouped = groupMatchesByLeague_CK(filtered);
//     Object.keys(grouped).forEach(league => {
//         const logo = grouped[league][0]?.league?.logo || '';
//         const cards = grouped[league].map(m => renderHomeMatchCard_CK(m)).join('');
//         $c.append(`
//                     <div class="dv2-league-section">
//                         <div class="dv2-league-header">
//                         ${logo ? `<img src="${logo}" class="dv2-league-logo">` : ''}
//                         <div class="dv2-league-title">${league}</div>
//                         </div>
//                         ${cards}
//                     </div>
//                 `);
//     });
// }

function goToMatchDetail(id) {
    window.location.href = `/streams/${id}`;
}

function loadHomeMatchesData_CK() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const payload = {
        fromDate: today.toISOString().split("T")[0],
        toDate: tomorrow.toISOString().split("T")[0]
    };
    $.ajax({
        url: 'https://vsc-apidev.helizones.com/api/data/lives/range-date',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: res => {
            if (res && res.matches_by_date) {
                const all = [];
                Object.keys(res.matches_by_date).forEach(d => all.push(...res.matches_by_date[d]));
                renderHomeMatches_CK(all);
            } else $('.dv2-layout-ck.dv2-calendar-matchs .dv2-home-container').html('<div class="dv2-empty-state">Không có dữ liệu</div>');
        },
        error: () => $('.dv2-layout-ck.dv2-calendar-matchs .dv2-home-container').html('<div class="dv2-empty-state">Lỗi tải dữ liệu</div>')
    });
}