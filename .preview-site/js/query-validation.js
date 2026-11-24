(function (root) {
    "use strict";

    // Allowed ids come from the discovery data embedded by discovery-data.html,
    // so adding a city/audience/group type in _data requires no JS change.
    function data() {
        return root.StageOneDiscoveryData || {};
    }

    function ids(list, key) {
        return (list || []).map(function (item) {
            return item[key];
        });
    }

    function cityIds() {
        return ids(data().cities, "slug");
    }

    function audienceIds() {
        return ids(data().audiences, "id");
    }

    function groupTypeIds() {
        return ids(data().groupTypes, "id");
    }

    function workshopIds() {
        return ids(data().workshops, "slug");
    }

    var UTM_KEYS = ["utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term"];

    function includes(list, value) {
        return list.indexOf(value) !== -1;
    }

    function normalizeWorkshop(value) {
        if (!value || value === "all") return "all";
        if (includes(workshopIds(), value)) return value;
        return null;
    }

    function validateQuery(params) {
        var search = params instanceof URLSearchParams
            ? params
            : new URLSearchParams(params || "");

        var city = search.get("city");
        var audience = search.get("audience");
        var groupType = search.get("group");
        var workshop = normalizeWorkshop(search.get("workshop"));

        return {
            city: includes(cityIds(), city) ? city : null,
            audience: includes(audienceIds(), audience) ? audience : null,
            groupType: includes(groupTypeIds(), groupType) ? groupType : null,
            workshop: workshop === null ? "all" : workshop
        };
    }

    function collectUtmParams(params) {
        var search = params instanceof URLSearchParams
            ? params
            : new URLSearchParams(params || window.location.search);
        var utm = {};
        UTM_KEYS.forEach(function (key) {
            var value = search.get(key);
            if (value) utm[key] = value;
        });
        return utm;
    }

    function applyUtmParams(searchParams, utm) {
        Object.keys(utm || {}).forEach(function (key) {
            if (utm[key]) searchParams.set(key, utm[key]);
        });
        return searchParams;
    }

    root.StageOneQuery = {
        cityIds: cityIds,
        audienceIds: audienceIds,
        groupTypeIds: groupTypeIds,
        workshopIds: workshopIds,
        UTM_KEYS: UTM_KEYS,
        validateQuery: validateQuery,
        normalizeWorkshop: normalizeWorkshop,
        collectUtmParams: collectUtmParams,
        applyUtmParams: applyUtmParams
    };
})(window);
