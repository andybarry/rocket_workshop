(function (root) {
    "use strict";

    var STORAGE_KEY = "stageone.explorerState";

    function defaults() {
        return {
            region: null,
            audience: null,
            groupType: null,
            workshop: "all"
        };
    }

    function normalize(state) {
        var query = root.StageOneQuery;
        var next = defaults();
        if (!state) return next;
        next.region = query.REGION_IDS.indexOf(state.region) !== -1 ? state.region : null;
        next.audience = query.AUDIENCE_IDS.indexOf(state.audience) !== -1 ? state.audience : null;
        next.groupType = query.GROUP_TYPE_IDS.indexOf(state.groupType) !== -1 ? state.groupType : null;
        next.workshop = query.normalizeWorkshop(state.workshop) || "all";
        next.utm = state.utm || query.collectUtmParams();
        return next;
    }

    function readStorage() {
        try {
            var raw = window.sessionStorage.getItem(STORAGE_KEY);
            return raw ? normalize(JSON.parse(raw)) : defaults();
        } catch (error) {
            return defaults();
        }
    }

    function writeStorage(state) {
        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                region: state.region,
                audience: state.audience,
                groupType: state.groupType,
                workshop: state.workshop
            }));
        } catch (error) {
            // Ignore private-mode or quota errors.
        }
    }

    function fromUrl(search) {
        var parsed = root.StageOneQuery.validateQuery(search || window.location.search);
        parsed.utm = root.StageOneQuery.collectUtmParams(search || window.location.search);
        return parsed;
    }

    function mergePriority(urlState, pageState, storedState) {
        var fallback = storedState || defaults();
        var page = pageState || {};
        var url = urlState || {};
        return normalize({
            region: url.region || page.region || fallback.region,
            audience: url.audience || page.audience || fallback.audience,
            groupType: url.groupType || page.groupType || fallback.groupType,
            workshop: url.workshop && url.workshop !== "all"
                ? url.workshop
                : (page.workshop && page.workshop !== "all" ? page.workshop : fallback.workshop),
            utm: url.utm || page.utm || fallback.utm
        });
    }

    function load(pageState) {
        var urlState = fromUrl();
        var stored = readStorage();
        var hasUrlSelection = !!(urlState.region || urlState.audience || urlState.groupType ||
            (urlState.workshop && urlState.workshop !== "all"));
        var state = hasUrlSelection
            ? mergePriority(urlState, pageState, stored)
            : mergePriority(urlState, pageState, stored);
        writeStorage(state);
        return state;
    }

    function assign(target, patch) {
        var next = normalize({
            region: Object.prototype.hasOwnProperty.call(patch, "region") ? patch.region : target.region,
            audience: Object.prototype.hasOwnProperty.call(patch, "audience") ? patch.audience : target.audience,
            groupType: Object.prototype.hasOwnProperty.call(patch, "groupType") ? patch.groupType : target.groupType,
            workshop: Object.prototype.hasOwnProperty.call(patch, "workshop") ? patch.workshop : target.workshop,
            utm: target.utm
        });
        writeStorage(next);
        return next;
    }

    function track(eventName, details) {
        if (typeof root.gtag === "function") {
            root.gtag("event", eventName, details || {});
        }
    }

    function eventParams(state, sourcePage) {
        return {
            region: state.region || "none",
            audience: state.audience || "none",
            group_type: state.groupType || "none",
            workshop: state.workshop || "all",
            source_page: sourcePage || "unknown"
        };
    }

    root.StageOneState = {
        STORAGE_KEY: STORAGE_KEY,
        defaults: defaults,
        normalize: normalize,
        readStorage: readStorage,
        writeStorage: writeStorage,
        fromUrl: fromUrl,
        load: load,
        assign: assign,
        track: track,
        eventParams: eventParams
    };
})(window);
