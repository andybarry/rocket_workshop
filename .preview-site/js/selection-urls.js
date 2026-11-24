(function (root) {
    "use strict";

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

    function stateParams() {
        return new URLSearchParams();
    }

    function withQuery(path, params) {
        var query = params && params.toString();
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

    function buildDiscoveryUrl(category, id) {
        return discoveryPath(category, id);
    }

    function buildExplorerReturnUrl() {
        return "/#find-your-workshop";
    }

    // Full workshop detail page (e.g. /robotics-workshop.html).
    function workshopPath(workshop) {
        var match = findBy(data().workshops, "slug", workshop);
        return match && match.detail_path ? match.detail_path : "/";
    }

    function buildWorkshopUrl(workshop) {
        return workshopPath(workshop);
    }

    function buildPlanUrl() {
        return "/plan-a-workshop/";
    }

    function replaceQuery() {
        var url = window.location.pathname;
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
