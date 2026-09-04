<?php
/**
 * Single live match card.
 *
 * @var string $img Base URL for images.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="luongson-match-card" data-border="true">
	<div class="luongson-match-header">
		<div class="luongson-match-league"><p>Premier League</p></div>
		<div class="luongson-match-status-container">
			<div class="luongson-match-status" data-highlight="true">
				<span class="luongson-match-status-dot" aria-hidden="true"></span>
				<span class="luongson-match-status-text">Hiệp 2 - 72’</span>
			</div>
		</div>
		<div class="luongson-match-time-box">
			<span class="luongson-match-time">15:30</span>
			<span class="luongson-match-date">15.08</span>
		</div>
	</div>

	<a class="luongson-match-body" href="#">
		<div class="luongson-match-team">
			<div class="luongson-match-team-logo">
				<img alt="" decoding="async" height="128" src="<?php echo esc_url( $img . 'Dq03h2PCDoRXrVQvPC7ywAo9R0_7881bb5a.png' ); ?>" width="128" />
			</div>
			<div class="luongson-match-team-name"><p>Burnley</p></div>
		</div>

		<div class="luongson-match-score-center">
			<div class="luongson-match-score-box"><p class="luongson-match-score-text">2 - 1</p></div>
			<div class="luongson-match-stats">
				<div class="luongson-match-stat-item">
					<svg class="luongson-match-stat-flag" role="presentation" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M5 21V4m0 0l13 4.5L5 13V4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<span class="luongson-match-stat-text">6-8</span>
				</div>
				<div class="luongson-match-stat-item">
					<span class="luongson-match-stat-card is-yellow" aria-hidden="true"></span>
					<span class="luongson-match-stat-text">2-2</span>
				</div>
				<div class="luongson-match-stat-item">
					<span class="luongson-match-stat-card is-red" aria-hidden="true"></span>
					<span class="luongson-match-stat-text">2-0</span>
				</div>
			</div>
		</div>

		<div class="luongson-match-team">
			<div class="luongson-match-team-logo">
				<img alt="" decoding="async" height="128" src="<?php echo esc_url( $img . 'U86AWvixUpZ9FQv4FEwV6sRB5Y_59f68630.png' ); ?>" width="128" />
			</div>
			<div class="luongson-match-team-name"><p>Wolverhampton</p></div>
		</div>
	</a>

	<div class="luongson-match-footer">
		<div class="luongson-match-commentator-container">
			<div class="luongson-match-commentator" data-commentator="Lưu Bang">
				<button type="button" class="luongson-match-commentator-trigger" aria-haspopup="listbox" aria-expanded="false">
					<span class="luongson-match-commentator-avatar" data-border="true">
						<img alt="" decoding="async" height="472" src="<?php echo esc_url( $img . 'luu-bang.png' ); ?>" width="400" />
					</span>
					<span class="luongson-match-commentator-name">Lưu Bang</span>
					<svg class="luongson-match-commentator-chevron" role="presentation" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</div>

		<div class="luongson-match-odds-wrapper">
			<div class="luongson-match-odds-box">
				<div class="luongson-match-odds-type"><span>HDP FT</span></div>
				<div class="luongson-match-odds-values">
					<span class="luongson-match-odds-val is-home">0.97</span>
					<span class="luongson-match-odds-val">2.5</span>
					<span class="luongson-match-odds-val is-away">0.83</span>
				</div>
			</div>
			<a class="luongson-match-bet-btn" href="#" data-border="true">
				<img class="luongson-match-bet-logo" alt="" decoding="async" height="68" loading="lazy" src="<?php echo esc_url( $img . 'KB717wZbU63tSAHyTm9pLUqxM_b79bb177.png' ); ?>" width="280" />
				<span class="luongson-match-bet-text">cược</span>
			</a>
		</div>
	</div>
</div>
