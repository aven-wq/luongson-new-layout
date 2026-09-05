/**
 * Shared hot leagues loader for DV2 streaming layouts.
 */
window.DV2HotLeagues = window.DV2HotLeagues || {};

(function (DV2HotLeagues) {
  const DEFAULT_ENDPOINT =
    "https://vsc-apidev.helizones.com/api/data/lives/competitions/hot";

  DV2HotLeagues.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT;

  DV2HotLeagues.createRankMap = function createRankMap(result) {
    return new Map(
      (result || []).map((league, index) => [league.id, index]),
    );
  };

  DV2HotLeagues.load = function load(options) {
    const {
      url = DEFAULT_ENDPOINT,
      ajax = window.jQuery?.ajax || window.$?.ajax,
      setHotLeaguesRank,
      onSuccess,
      onError,
      method = "GET",
    } = options || {};

    if (!ajax) {
      console.error("[DV2HotLeagues] jQuery ajax is not available");
      if (onError) {
        onError({ message: "jQuery ajax is not available" });
      }
      return null;
    }

    return ajax({
      url,
      method,
      success: function (response) {
        const rankMap = DV2HotLeagues.createRankMap(response?.result);
        if (setHotLeaguesRank) {
          setHotLeaguesRank(rankMap);
        }
        if (onSuccess) {
          onSuccess(rankMap, response);
        }
      },
      error: function (xhr, status, error) {
        console.error("[DV2HotLeagues] Failed to load hot leagues:", error);
        if (onError) {
          onError({ xhr, status, error });
        }
      },
    });
  };
})(window.DV2HotLeagues);
