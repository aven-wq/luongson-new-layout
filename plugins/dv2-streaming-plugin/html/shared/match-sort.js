/**
 * Shared match sorting utilities for DV2 streaming layouts.
 *
 * Modes:
 * - priority-competition-first: PriorityCompetition -> Live -> Hot -> Kickoff
 * - live-first-priority-competition: Live -> PriorityCompetition -> Hot -> Kickoff
 * - priority-competition-when-live: Live -> PriorityCompetition (only when list has live) -> Hot -> Kickoff
 * - priority-competition-when-live-or-soon: PriorityCompetition starting within N minutes -> Live -> PriorityCompetition (when live exists) -> Hot -> Kickoff
 * - priority-competition-kickoff-only: PriorityCompetition -> Kickoff
 */
window.DV2MatchSort = window.DV2MatchSort || {};

(function (DV2MatchSort) {
  function resolveHotLeaguesRank(hotLeaguesRank) {
    if (typeof hotLeaguesRank === "function") {
      return hotLeaguesRank();
    }
    return hotLeaguesRank;
  }

  function getPriorityCompetitionIds() {
    const raw = window.DV2_STREAMING_PRIORITY_COMPETITION_IDS;
    if (!raw) {
      return [];
    }
    return String(raw)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  DV2MatchSort.getPriorityCompetitionRank = function getPriorityCompetitionRank(
    match,
  ) {
    const ids = getPriorityCompetitionIds();
    const leagueId = match?.league?.id;
    if (!leagueId || !ids.length) {
      return Infinity;
    }
    const index = ids.indexOf(String(leagueId));
    return index === -1 ? Infinity : index;
  };

  DV2MatchSort.isPriorityCompetitionMatch =
    function isPriorityCompetitionMatch(match) {
      return DV2MatchSort.getPriorityCompetitionRank(match) !== Infinity;
    };

  DV2MatchSort.isLiveMatch = function isLiveMatch(match, liveStatuses) {
    if (!Array.isArray(liveStatuses) || !liveStatuses.length) {
      return false;
    }
    const status = String(
      match?.matchInfo?.status ?? match?.status ?? "",
    ).toLowerCase();
    return liveStatuses.includes(status);
  };

  DV2MatchSort.getMatchKickoffTime = function getMatchKickoffTime(match) {
    const kickoff = match?.matchInfo?.kickoff ?? match?.kickoff;
    const kickoffTime = new Date(kickoff);
    return Number.isNaN(kickoffTime.getTime()) ? null : kickoffTime;
  };

  DV2MatchSort.isPriorityCompetitionStartingSoon = function isPriorityCompetitionStartingSoon(
    match,
    liveStatuses,
    priorityCompetitionSoonMinutes = 10,
  ) {
    if (!DV2MatchSort.isPriorityCompetitionMatch(match)) {
      return false;
    }
    if (DV2MatchSort.isLiveMatch(match, liveStatuses)) {
      return false;
    }

    const kickoffTime = DV2MatchSort.getMatchKickoffTime(match);
    if (!kickoffTime) {
      return false;
    }

    const msUntilKickoff = kickoffTime.getTime() - Date.now();
    return (
      msUntilKickoff > 0 &&
      msUntilKickoff <= priorityCompetitionSoonMinutes * 60 * 1000
    );
  };

  DV2MatchSort.getHotLeagueRank = function getHotLeagueRank(match, hotLeaguesRank) {
    const rankMap = resolveHotLeaguesRank(hotLeaguesRank);
    if (!rankMap?.has?.(match?.league?.id)) {
      return Infinity;
    }
    return rankMap.get(match.league.id);
  };

  DV2MatchSort.compareKickoff = function compareKickoff(a, b) {
    const aKickoff = DV2MatchSort.getMatchKickoffTime(a);
    const bKickoff = DV2MatchSort.getMatchKickoffTime(b);
    if (!aKickoff && !bKickoff) return 0;
    if (!aKickoff) return 1;
    if (!bKickoff) return -1;
    return aKickoff.getTime() - bKickoff.getTime();
  };

  DV2MatchSort.compareMatches = function compareMatches(a, b, options) {
    const {
      mode = "priority-competition-first",
      liveStatuses = [],
      hotLeaguesRank = null,
      hasLiveMatches = false,
      priorityCompetitionSoonMinutes = 10,
      hasPriorityCompetitionIds = getPriorityCompetitionIds().length > 0,
    } = options || {};

    const comparePriorityCompetition = function comparePriorityCompetition() {
      if (!hasPriorityCompetitionIds) {
        return 0;
      }
      const aRank = DV2MatchSort.getPriorityCompetitionRank(a);
      const bRank = DV2MatchSort.getPriorityCompetitionRank(b);
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return 0;
    };

    const compareLive = function compareLive() {
      const aIsLive = DV2MatchSort.isLiveMatch(a, liveStatuses);
      const bIsLive = DV2MatchSort.isLiveMatch(b, liveStatuses);
      if (aIsLive !== bIsLive) {
        return aIsLive ? -1 : 1;
      }
      return 0;
    };

    const compareHot = function compareHot() {
      const rankA = DV2MatchSort.getHotLeagueRank(a, hotLeaguesRank);
      const rankB = DV2MatchSort.getHotLeagueRank(b, hotLeaguesRank);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return 0;
    };

    if (mode === "priority-competition-kickoff-only") {
      if (hasPriorityCompetitionIds) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }
      return DV2MatchSort.compareKickoff(a, b);
    }

    if (mode === "priority-competition-first") {
      if (hasPriorityCompetitionIds) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }

      const liveResult = compareLive();
      if (liveResult !== 0) return liveResult;

      const hotResult = compareHot();
      if (hotResult !== 0) return hotResult;

      return DV2MatchSort.compareKickoff(a, b);
    }

    if (mode === "live-first-priority-competition") {
      const liveResult = compareLive();
      if (liveResult !== 0) return liveResult;

      if (hasPriorityCompetitionIds) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }

      const hotResult = compareHot();
      if (hotResult !== 0) return hotResult;

      return DV2MatchSort.compareKickoff(a, b);
    }

    if (mode === "priority-competition-when-live-or-soon") {
      if (hasPriorityCompetitionIds) {
        const aPriorityCompetitionSoon =
          DV2MatchSort.isPriorityCompetitionStartingSoon(
            a,
            liveStatuses,
            priorityCompetitionSoonMinutes,
          );
        const bPriorityCompetitionSoon =
          DV2MatchSort.isPriorityCompetitionStartingSoon(
            b,
            liveStatuses,
            priorityCompetitionSoonMinutes,
          );
        if (aPriorityCompetitionSoon !== bPriorityCompetitionSoon) {
          return aPriorityCompetitionSoon ? -1 : 1;
        }
      }

      const liveResult = compareLive();
      if (liveResult !== 0) return liveResult;

      if (hasPriorityCompetitionIds && hasLiveMatches) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }

      const hotResult = compareHot();
      if (hotResult !== 0) return hotResult;

      return DV2MatchSort.compareKickoff(a, b);
    }

    if (mode === "priority-competition-when-live") {
      const liveResult = compareLive();
      if (liveResult !== 0) return liveResult;

      if (hasPriorityCompetitionIds && hasLiveMatches) {
        const priorityCompetitionResult = comparePriorityCompetition();
        if (priorityCompetitionResult !== 0) return priorityCompetitionResult;
      }

      const hotResult = compareHot();
      if (hotResult !== 0) return hotResult;

      return DV2MatchSort.compareKickoff(a, b);
    }

    return DV2MatchSort.compareKickoff(a, b);
  };

  DV2MatchSort.createSortedMatchesFunction = function createSortedMatchesFunction(
    options,
  ) {
    return function sortedMatchesFunction(matches) {
      if (!Array.isArray(matches)) {
        return [];
      }

      const sortOptions = {
        ...(options || {}),
        hasLiveMatches: matches.some((match) =>
          DV2MatchSort.isLiveMatch(match, options?.liveStatuses),
        ),
        hasPriorityCompetitionIds: getPriorityCompetitionIds().length > 0,
      };

      if (options?.copy) {
        return matches
          .slice()
          .sort((a, b) => DV2MatchSort.compareMatches(a, b, sortOptions));
      }

      return matches.sort((a, b) =>
        DV2MatchSort.compareMatches(a, b, sortOptions),
      );
    };
  };
})(window.DV2MatchSort);
