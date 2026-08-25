(function (root) {
    "use strict";

    function getQuery() {
        return root.StageOneQuery;
    }

    function data() {
        return root.StageOneDiscoveryData || {};
    }

    function findBy(list, key, value) {
        var items = list || [];
        for (var i = 0; i < items.length; i += 1) {
            if (items[i][key] === value) return items[i];
        }
        return null;
    }

    // options.omit — state key to leave out of the query string (used when the
    // destination page already represents that dimension in its path).
    function stateParams(state, options) {
        var params = new URLSearchParams();
        var omit = (options && options.omit) || null;
        state = state || {};

        if (state.city && omit !== "city") {
            params.set("city", state.city);
        }
        if (state.audience && omit !== "audience") {
            params.set("audience", state.audience);
        }
        if (state.groupType && omit !== "groupType") {
            params.set("group", state.groupType);
        }
        if (state.workshop && state.workshop !== "all" && omit !== "workshop") {
            params.set("workshop", state.workshop);
        }

        getQuery().applyUtmParams(params, state.utm || getQuery().collectUtmParams());
        return params;
    }

    function withQuery(path, params) {
        var query = params.toString();
        return query ? path + "?" + query : path;
    }

    // Path for any discovery dimension.
    // Workshops go to the full workshop page (detail_path); other
    // categories go to their discovery landing pages.
    // category: "city" | "audience" | "group_type" | "workshop"
    function discoveryPath(category, id) {
        var entry;
        if (category === "city") {
            entry = findBy(data().cities, "slug", id);
            return entry ? "/locations/" + entry.slug + "/" : "/locations/";
        }
        if (category === "audience") {
            entry = findBy(data().audiences, "id", id);
            return entry ? "/workshops/" + entry.id + "/" : "/#find-your-workshop";
        }
        if (category === "group_type") {
            entry = findBy(data().groupTypes, "id", id);
            return entry ? "/workshops/" + entry.id + "/" : "/#find-your-workshop";
        }
        if (category === "workshop") {
            entry = findBy(data().workshops, "slug", id);
            return entry && entry.detail_path ? entry.detail_path : "/#find-your-workshop";
        }
        return "/#find-your-workshop";
    }

    var CATEGORY_STATE_KEYS = {
        city: "city",
        audience: "audience",
        group_type: "groupType",
        workshop: "workshop"
    };

    // Link to a discovery landing page, carrying the rest of the visitor's
    // context as query parameters (the destination's own dimension travels in
    // the path instead).
    function buildDiscoveryUrl(category, id, state) {
        var params = stateParams(state, { omit: CATEGORY_STATE_KEYS[category] });
        return withQuery(discoveryPath(category, id), params);
    }

    function buildExplorerReturnUrl(state) {
        var params = stateParams(state || {});
        var query = params.toString();
        return (query ? "/?" + query : "/") + "#find-your-workshop";
    }

    // Full workshop detail page (e.g. /robotics-workshop.html).
    function workshopPath(workshop) {
        var match = findBy(data().workshops, "slug", workshop);
        return match && match.detail_path ? match.detail_path : "/";
    }

    function buildWorkshopUrl(workshop, state) {
        var params = stateParams({
            city: state && state.city,
            audience: state && state.audience,
            groupType: state && state.groupType,
            workshop: "all",
            utm: state && state.utm
        });
        return withQuery(workshopPath(workshop), params);
    }

    function buildPlanUrl(state) {
        return withQuery("/plan-a-workshop/", stateParams(state || {}));
    }

    function replaceQuery(state) {
        var params = stateParams(state);
        var path = window.location.pathname;
        var url = withQuery(path, params);
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, "", url);
        }
        return url;
    }

    root.StageOneUrls = {
        stateParams: stateParams,
        discoveryPath: discoveryPath,
        buildDiscoveryUrl: buildDiscoveryUrl,
        buildExplorerReturnUrl: buildExplorerReturnUrl,
        buildWorkshopUrl: buildWorkshopUrl,
        buildPlanUrl: buildPlanUrl,
        replaceQuery: replaceQuery,
        workshopPath: workshopPath
    };
})(window);
