(function (root) {
    "use strict";

    function getQuery() {
        return root.StageOneQuery;
    }

    function stateParams(state, options) {
        var params = new URLSearchParams();
        var includeRegion = options && options.includeRegion;

        if (includeRegion && state.region) {
            params.set("region", state.region);
        }
        if (state.audience) {
            params.set("audience", state.audience);
        }
        if (state.groupType) {
            params.set("group", state.groupType);
        }
        if (state.workshop && state.workshop !== "all") {
            params.set("workshop", state.workshop);
        }

        getQuery().applyUtmParams(params, state.utm || getQuery().collectUtmParams());
        return params;
    }

    function withQuery(path, params) {
        var query = params.toString();
        return query ? path + "?" + query : path;
    }

    function regionPath(region) {
        if (!region) return "/#find-your-workshop";
        if (region === "international") return "/international-groups/";
        return "/regions/" + region + "/";
    }

    function buildRegionUrl(state) {
        if (!state || !state.region) return "/#find-your-workshop";
        return withQuery(regionPath(state.region), stateParams(state));
    }

    function buildExplorerReturnUrl(state) {
        var params = stateParams(state || {}, { includeRegion: true });
        var query = params.toString();
        return (query ? "/?" + query : "/") + "#find-your-workshop";
    }

    function workshopPath(workshop) {
        var catalog = (root.StageOneExplorerData && root.StageOneExplorerData.workshops) || [];
        var match = catalog.filter(function (item) {
            return item.slug === workshop;
        })[0];
        return match && match.detail_path ? match.detail_path : "/";
    }

    function buildWorkshopUrl(workshop, state) {
        var params = stateParams({
            region: state && state.region,
            audience: state && state.audience,
            groupType: state && state.groupType,
            workshop: "all",
            utm: state && state.utm
        }, { includeRegion: true });
        return withQuery(workshopPath(workshop), params);
    }

    function buildPlanUrl(state) {
        return withQuery("/plan-a-workshop/", stateParams(state || {}, { includeRegion: true }));
    }

    function replaceQuery(state, extra) {
        var next = Object.assign({}, extra || {}, state);
        var params = stateParams(next, { includeRegion: extra && extra.includeRegion });
        var path = window.location.pathname;
        var url = withQuery(path, params);
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, "", url);
        }
        return url;
    }

    root.StageOneUrls = {
        stateParams: stateParams,
        regionPath: regionPath,
        buildRegionUrl: buildRegionUrl,
        buildExplorerReturnUrl: buildExplorerReturnUrl,
        buildWorkshopUrl: buildWorkshopUrl,
        buildPlanUrl: buildPlanUrl,
        replaceQuery: replaceQuery,
        workshopPath: workshopPath
    };
})(window);
