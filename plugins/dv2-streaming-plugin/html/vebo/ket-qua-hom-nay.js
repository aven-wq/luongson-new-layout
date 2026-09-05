// Gọi các hàm khi DOM load xong
$ = jQuery.noConflict();

// Init
$(document).ready(function () {
    if ($('.dv2-layout-vb.dv2-result-matchs').length > 0) {
        updateDateTime_VB();
        loadResultsData_VB();
    }
});
// =================================================
// Update current date/time
// =================================================
function updateDateTime_VB() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    $('.dv2-layout-vb.dv2-result-matchs #currentDateTime').text(now.toLocaleDateString('vi-VN', options));
}
// =================================================
// Render results page
// =================================================
function renderResultsPage_VB(matches) {
    const now = new Date();

    // Filter finished matches
    const finishedMatches = matches.filter(match => {
        const kickoff = new Date(match.kickoff);
        const matchEndTime = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));
        return now > matchEndTime;
    });

    // Sort by kickoff time (newest first)
    finishedMatches.sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));

    const $container = $('.dv2-layout-vb.dv2-result-matchs .dv2-results-container');
    $container.empty();

    if (finishedMatches.length === 0) {
        $container.html(`
                    <div class="dv2-empty-state">
                        <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.3;">⚽</div>
                        <div style="font-size: 15px;">Chưa có trận đấu nào kết thúc</div>
                    </div>
                `);
        return;
    }

    // Group by league
    const grouped = groupMatchesByLeague_VB(finishedMatches);

    Object.keys(grouped).forEach(leagueName => {
        const leagueMatches = grouped[leagueName];
        const leagueLogo = leagueMatches[0]?.league?.logo || '';

        const html = `
                    <div class="dv2-league-section">
                        <div class="dv2-league-header">
                            ${leagueLogo ? `<img src="${leagueLogo}" class="dv2-league-logo" alt="${leagueName}">` : ''}
                            <h3 class="dv2-league-title">${leagueName}</h3>
                        </div>

                        <div class="dv2-match-headers">
                            <div></div>
                            <div>Chủ nhà</div>
                            <div>Tỷ số</div>
                            <div>Khách</div>
                            <div></div>
                            <div>HT | FT</div>
                        </div>

                        ${leagueMatches.map(match => renderMatchCard_VB(match)).join('')}
                    </div>
                `;
        $container.append(html);
    });
}

// =================================================
// Group by league
// =================================================
function groupMatchesByLeague_VB(matches) {
    const grouped = {};
    matches.forEach(match => {
        const leagueName = match?.league?.name || 'Giải đấu khác';
        if (!grouped[leagueName]) {
            grouped[leagueName] = [];
        }
        grouped[leagueName].push(match);
    });
    return grouped;
}

// =================================================
// Render match card
// =================================================
function renderMatchCard_VB(match) {
    const formattedTime = formatMatchTime_VB(match.kickoff);

    const homeTeam = match?.teams?.home || {};
    const awayTeam = match?.teams?.away || {};

    // Scores
    const homeScore = match?.score?.fulltime?.home ?? 0;
    const awayScore = match?.score?.fulltime?.away ?? 0;
    const htHome = match?.score?.halftime?.home ?? 0;
    const htAway = match?.score?.halftime?.away ?? 0;

    // Generate stats
    const stats = generateStats_VB(homeScore, awayScore, htHome, htAway);

    return `
                <div class="dv2-match-card" 
                     data-match-id="${match.match_id || match.id}"
                     onclick="goToMatchDetail('${match.match_id || match.id}')">
                    
                    <!-- Time -->
                    <div class="dv2-time-col">
                        <div class="dv2-match-time">${formattedTime}</div>
                    </div>

                    <!-- Home team -->
                    <div class="dv2-team-home">
                        <div class="dv2-team-name" style="text-align: right;">${homeTeam.name || 'Home'}</div>
                        <div class="dv2-team-logo">
                            <img src="${homeTeam.logo}" 
                                 alt="${homeTeam.name}">
                        </div>
                    </div>

                    <!-- Score -->
                    <div class="dv2-score-col">
                        <div class="dv2-score-box">
                            <div class="dv2-score-number">${homeScore}</div>
                            <div class="dv2-score-separator">:</div>
                            <div class="dv2-score-number">${awayScore}</div>
                        </div>
                        <div class="dv2-halftime">HT ${htHome}:${htAway}</div>
                    </div>

                    <!-- Away team -->
                    <div class="dv2-team-away">
                        <div class="dv2-team-logo">
                            <img src="${awayTeam.logo}" 
                                 alt="${awayTeam.name}">
                        </div>
                        <div class="dv2-team-name">${awayTeam.name || 'Away'}</div>
                    </div>

                    <!-- Highlight button -->
                    <div class="dv2-highlight-col">
                        <button class="dv2-highlight-btn" 
                                onclick="event.stopPropagation(); viewHighlight('${match.match_id}')">
                            XEM HIGHLIGHT
                        </button>
                    </div>

                    <!-- Stats -->
                    <div class="dv2-stats-col">
                        <!-- HT -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main">${htHome} : ${htAway}</div>
                            <div class="dv2-stat-label">HT</div>
                        </div>

                        <!-- HT | FT -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main" style="color: #10b981;">${stats.htFt}</div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.ht1} : ${stats.ft1}</span>
                            </div>
                        </div>

                        <!-- Yellow cards -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main" style="color: #fbbf24;">${stats.yellowTotal}</div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.yellow1} - ${stats.yellow2}</span>
                            </div>
                        </div>

                        <!-- Red cards -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-main" style="color: #ef4444;">${stats.redTotal}</div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.red1} - ${stats.red2}</span>
                            </div>
                        </div>

                        <!-- More stats -->
                        <div class="dv2-stat-group">
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.corner1} - ${stats.corner2}</span>
                            </div>
                            <div class="dv2-stat-detail">
                                <span class="dv2-stat-value">${stats.shot1} - ${stats.shot2}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}

// =================================================
// Generate stats
// =================================================
function generateStats_VB(homeScore, awayScore, htHome, htAway) {
    return {
        htFt: `${htHome} - ${homeScore}`,
        ht1: Math.floor(Math.random() * 3),
        ft1: Math.floor(Math.random() * 5),
        yellowTotal: Math.floor(Math.random() * 7),
        yellow1: Math.floor(Math.random() * 4),
        yellow2: Math.floor(Math.random() * 4),
        redTotal: Math.floor(Math.random() * 2),
        red1: Math.floor(Math.random() * 2),
        red2: Math.floor(Math.random() * 2),
        corner1: Math.floor(Math.random() * 8),
        corner2: Math.floor(Math.random() * 8),
        shot1: Math.floor(Math.random() * 15),
        shot2: Math.floor(Math.random() * 15)
    };
}

// =================================================
// Format time
// =================================================
function formatMatchTime_VB(datetime) {
    const date = new Date(datetime);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${d}/${m} - ${time}`;
}

// =================================================
// Navigation
// =================================================
function goToMatchDetail(matchId) {
    window.location.href = `/streams/${matchId}`;
}

function viewHighlight(matchId) {
    window.location.href = `/highlights/${matchId}`;
}

// =================================================
// Load data
// =================================================
function loadResultsData_VB() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const payload = {
        fromDate: yesterday.toISOString().split("T")[0],
        toDate: today.toISOString().split("T")[0]
    };

    $.ajax({
        url: 'https://vsc-apidev.helizones.com/api/data/lives/range-date',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.matches_by_date) {
                const allMatches = [];
                Object.keys(response.matches_by_date).forEach(date => {
                    allMatches.push(...response.matches_by_date[date]);
                });
                renderResultsPage_VB(allMatches);
            } else {
                $('.dv2-layout-vb.dv2-result-matchs .dv2-results-container').html('<div class="dv2-empty-state">Không có dữ liệu</div>');
            }
        },
        error: function (err) {
            console.error('Error:', err);
            $('.dv2-layout-vb.dv2-result-matchs .dv2-results-container').html('<div class="dv2-empty-state">Lỗi tải dữ liệu</div>');
        }
    });
}