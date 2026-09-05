/**
 * Shared BLV (commentator) dropdown for match list cards.
 * - Build HTML from sorted livestream links
 * - jQuery event binding: toggle, close others, click-outside
 */
window.DV2BlvDropdown = window.DV2BlvDropdown || {};

(function (DV2BlvDropdown) {
  const documentCloseBound = new Set();

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getMatchId(match) {
    return match?.match_id || match?.matchId || match?.id || match?.slug || "";
  }

  function getSortedLinks(match) {
    if (window.DV2StreamLinks?.sortForDetail) {
      return window.DV2StreamLinks.sortForDetail(match?.livestream?.links);
    }
    return Array.isArray(match?.livestream?.links) ? match.livestream.links : [];
  }

  function getBlvLabel(link, index) {
    if (window.DV2StreamLinks?.getBlvName) {
      return window.DV2StreamLinks.getBlvName(link, index);
    }
    return String(link?.commentator || "").trim() || `Link ${index + 1}`;
  }

  function defaultGetDetailUrl(matchId, link) {
    if (window.DV2StreamLinks?.getDetailUrl) {
      return window.DV2StreamLinks.getDetailUrl(matchId, link, { trailingSlash: false });
    }
    const liveId = link?.liveId != null ? String(link.liveId) : "";
    if (liveId) {
      return `/streams/${matchId}?liveId=${encodeURIComponent(liveId)}`;
    }
    return `/streams/${matchId}`;
  }

  function closeAllDropdowns($, $container) {
    $container.find(".dv2-blv-dropdown.is-open").each(function () {
      $(this)
        .removeClass("is-open")
        .find(".dv2-blv-dropdown__toggle")
        .attr("aria-expanded", "false");
    });
  }

  DV2BlvDropdown.escapeHtml = escapeHtml;
  DV2BlvDropdown.getMatchId = getMatchId;
  DV2BlvDropdown.getSortedLinks = getSortedLinks;
  DV2BlvDropdown.getBlvLabel = getBlvLabel;
  DV2BlvDropdown.defaultGetDetailUrl = defaultGetDetailUrl;

  /**
   * @param {Object} options
   * @param {Object} options.match
   * @param {Array} [options.links]
   * @param {Object} [options.preferredLink]
   * @param {string} [options.matchId]
   * @param {Function} [options.getDetailUrl]
   * @param {Function} [options.escapeHtml]
   * @param {Function} options.renderToggle - ({ link, label, esc }) => HTML before caret
   * @param {Function} options.renderItemContent - ({ link, label, href, index, esc }) => HTML inside <a>
   * @param {string} [options.emptyHtml]
   * @param {'up'|'down'} [options.menuPlacement]
   * @param {string} [options.rootClass]
   * @param {string} [options.toggleClass]
   */
  DV2BlvDropdown.build = function build(options) {
    const opts = options || {};
    const {
      match,
      links = getSortedLinks(match),
      preferredLink,
      matchId = getMatchId(match),
      getDetailUrl = defaultGetDetailUrl,
      renderToggle,
      renderItemContent,
      emptyHtml = "",
      menuPlacement = "up",
      rootClass = "",
      toggleClass = "",
    } = opts;

    if (!links.length) {
      return emptyHtml;
    }
    if (typeof renderToggle !== "function" || typeof renderItemContent !== "function") {
      return emptyHtml;
    }

    const esc = opts.escapeHtml || escapeHtml;
    const preferred = preferredLink ?? links[0] ?? null;
    const preferredLabel = getBlvLabel(preferred, 0);
    const placementClass =
      menuPlacement === "down" ? "dv2-blv-dropdown--menu-down" : "dv2-blv-dropdown--menu-up";

    const itemsHtml = links
      .map((link, index) => {
        const label = getBlvLabel(link, index);
        const href = getDetailUrl(matchId, link);
        return `
          <li class="dv2-blv-dropdown__item">
            <a href="${esc(href)}" class="dv2-blv-dropdown__link">
              ${renderItemContent({ link, label, href, index, esc })}
            </a>
          </li>
        `;
      })
      .join("");

    return `
      <div class="dv2-blv-dropdown ${placementClass}${rootClass ? ` ${rootClass}` : ""}">
        <button type="button" class="dv2-blv-dropdown__toggle${toggleClass ? ` ${toggleClass}` : ""}" aria-expanded="false" aria-haspopup="listbox">
          ${renderToggle({ link: preferred, label: preferredLabel, esc })}
          <span class="dv2-blv-dropdown__caret" aria-hidden="true"></span>
        </button>
        <ul class="dv2-blv-dropdown__menu" role="listbox">
          ${itemsHtml}
        </ul>
      </div>
    `;
  };

  /**
   * @param {jQuery} $container
   * @param {Object} options
   * @param {string} options.namespace - jQuery event namespace suffix
   * @param {boolean} [options.closeOnDocument]
   * @param {boolean} [options.documentCloseDelay] - defer close to next tick (vebo)
   * @param {boolean} [options.stopPropagationOnWrap] - stop clicks on dropdown wrapper (thapcam)
   * @param {boolean} [options.rebindDocumentClose] - off/on document handler each bind (socolive)
   */
  DV2BlvDropdown.bind = function bind($container, options) {
    const $ = window.jQuery || window.$;
    if (!$?.fn || !$container?.length) {
      return;
    }

    const {
      namespace = "dv2BlvDropdown",
      closeOnDocument = true,
      documentCloseDelay = false,
      stopPropagationOnWrap = false,
      rebindDocumentClose = false,
    } = options || {};

    function handleToggleClick(event, $dropdown) {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = $dropdown.hasClass("is-open");
      $container
        .find(".dv2-blv-dropdown.is-open")
        .not($dropdown)
        .removeClass("is-open")
        .find(".dv2-blv-dropdown__toggle")
        .attr("aria-expanded", "false");
      $dropdown
        .toggleClass("is-open", !isOpen)
        .find(".dv2-blv-dropdown__toggle")
        .attr("aria-expanded", !isOpen ? "true" : "false");
    }

    if (stopPropagationOnWrap) {
      // Direct bind: wrap stopPropagation blocks delegated handlers on $container.
      $container.find(".dv2-blv-dropdown").each(function () {
        const $dropdown = $(this);

        $dropdown
          .off(`click.${namespace}Wrap`)
          .on(`click.${namespace}Wrap`, function (event) {
            event.stopPropagation();
          });

        $dropdown
          .find(".dv2-blv-dropdown__toggle")
          .off(`click.${namespace}`)
          .on(`click.${namespace}`, function (event) {
            handleToggleClick(event, $dropdown);
          });

        $dropdown
          .find(".dv2-blv-dropdown__menu a")
          .off(`click.${namespace}Menu`)
          .on(`click.${namespace}Menu`, function (event) {
            event.stopPropagation();
          });
      });
    } else {
      $container
        .off(`click.${namespace}`, ".dv2-blv-dropdown__toggle")
        .on(`click.${namespace}`, ".dv2-blv-dropdown__toggle", function (event) {
          handleToggleClick(event, $(this).closest(".dv2-blv-dropdown"));
        });

      $container
        .off(`click.${namespace}Menu`, ".dv2-blv-dropdown__menu a")
        .on(`click.${namespace}Menu`, ".dv2-blv-dropdown__menu a", function (event) {
          event.stopPropagation();
        });
    }

    if (!closeOnDocument) {
      return;
    }

    const closeEventName = `click.${namespace}Close`;

    if (rebindDocumentClose) {
      $(document).off(closeEventName);
    } else if (documentCloseBound.has(closeEventName)) {
      return;
    }

    const closeHandler = function (event) {
      const run = () => {
        if ($(event.target).closest(".dv2-blv-dropdown").length) {
          return;
        }
        closeAllDropdowns($, $container);
      };
      if (documentCloseDelay) {
        window.setTimeout(run, 0);
      } else {
        run();
      }
    };

    $(document).on(closeEventName, closeHandler);
    if (!rebindDocumentClose) {
      documentCloseBound.add(closeEventName);
    }
  };
})(window.DV2BlvDropdown);
