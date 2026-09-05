/**
 * Shared live match score polling for DV2 streaming layouts.
 * Compare in-memory snapshot with API; update DOM only when score changes.
 */
window.DV2MatchScorePoll = window.DV2MatchScorePoll || {};

(function (DV2MatchScorePoll) {
  const DEFAULT_API_BASE =
    typeof API_URL !== "undefined"
      ? API_URL
      : "https://vsc-apidev.helizones.com/api/data/";

  DV2MatchScorePoll.DEFAULT_API_BASE = DEFAULT_API_BASE;

  DV2MatchScorePoll.getMatchId = function getMatchId(match) {
    return match?.match_id || match?.matchId || match?.id || match?.slug || "";
  };

  DV2MatchScorePoll.getScoreSnapshot = function getScoreSnapshot(match) {
    const score = match?.score?.fulltime || {};
    const pen = match?.score?.pen;
    const hasPen = !!pen && (pen.home != null || pen.away != null);
    return {
      home: score.home ?? 0,
      away: score.away ?? 0,
      currentMinute: match?.currentMinute ?? match?.currentMinutes ?? null,
      hasPen,
      penHome: hasPen ? pen.home ?? 0 : null,
      penAway: hasPen ? pen.away ?? 0 : null,
    };
  };

  function getDefaultIntervalMs() {
    return typeof window.DV2_HOME_MATCH_SCORE_POLL_INTERVAL_MS === "number"
      ? window.DV2_HOME_MATCH_SCORE_POLL_INTERVAL_MS
      : 30000;
  }

  function resolveContainer(container, $) {
    if (!container) return $(document);
    return typeof container === "string" ? $(container) : container;
  }

  DV2MatchScorePoll.create = function create(options) {
    const {
      ajax = window.jQuery?.ajax || window.$?.ajax,
      $: jq = window.jQuery || window.$,
      apiBase = DEFAULT_API_BASE,
      intervalMs = getDefaultIntervalMs(),
      container,
      onScoreChange,
    } = options || {};

    let timer = null;
    let snapshot = null;

    function applyDomUpdate(next) {
      const $scope = resolveContainer(container, jq);
      const $home = $scope.find("[data-dv2-score-home]");
      const $away = $scope.find("[data-dv2-score-away]");
      const $minute = $scope.find("[data-dv2-score-minute]");
      const $penHome = $scope.find("[data-dv2-score-pen-home]");
      const $penAway = $scope.find("[data-dv2-score-pen-away]");

      if ($home.length) {
        $home.text(next.home);
      }
      if ($away.length) {
        $away.text(next.away);
      }
      if (next.currentMinute != null && $minute.length) {
        $minute.text(`${next.currentMinute}'`);
      }
      if (next.hasPen) {
        if ($penHome.length) $penHome.text(next.penHome);
        if ($penAway.length) $penAway.text(next.penAway);
      }

      if (onScoreChange) {
        onScoreChange(next, snapshot);
      }
    }

    function sync(match) {
      const matchId = DV2MatchScorePoll.getMatchId(match);
      if (!matchId) return;

      snapshot = {
        matchId,
        ...DV2MatchScorePoll.getScoreSnapshot(match),
      };
    }

    function poll() {
      if (!snapshot?.matchId || !ajax) return;

      const base = String(apiBase).replace(/\/?$/, "/");
      ajax({
        url: `${base}lives/${snapshot.matchId}`,
        method: "GET",
        success(res) {
          if (!res?.data) return;

          const next = DV2MatchScorePoll.getScoreSnapshot(res.data);
          const changed =
            snapshot.home !== next.home ||
            snapshot.away !== next.away ||
            snapshot.currentMinute !== next.currentMinute ||
            snapshot.hasPen !== next.hasPen ||
            snapshot.penHome !== next.penHome ||
            snapshot.penAway !== next.penAway;

          if (!changed) return;

          snapshot = { ...snapshot, ...next };
          applyDomUpdate(snapshot);
        },
      });
    }

    function start() {
      stop();
      if (!snapshot?.matchId || !intervalMs || intervalMs <= 0) return;
      timer = setInterval(poll, intervalMs);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function destroy() {
      stop();
      snapshot = null;
    }

    return { sync, start, stop, destroy, poll };
  };
})(window.DV2MatchScorePoll);
