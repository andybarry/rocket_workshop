(function (root) {
    "use strict";

    var REGION_IDS = [
        "northeast-mid-atlantic",
        "southeast",
        "midwest-south-central",
        "mountain-west",
        "west-coast",
        "international"
    ];

    var AUDIENCE_IDS = [
        "middle-school",
        "high-school",
        "college-university",
        "adult-professional",
        "mixed-age"
    ];

    var GROUP_TYPE_IDS = [
        "educational-travel",
        "school-campus",
        "private-other"
    ];

    var WORKSHOP_IDS = [
        "artificial-intelligence",
        "robotics-drone",
        "mechanical-engineering",
        "web-development"
    ];

    var UTM_KEYS = ["utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term"];

    function includes(list, value) {
        return list.indexOf(value) !== -1;
    }

    function normalizeWorkshop(value) {
        if (!value || value === "all") return "all";
        if (includes(WORKSHOP_IDS, value)) return value;
        return null;
    }

    function validateQuery(params) {
        var search = params instanceof URLSearchParams
            ? params
            : new URLSearchParams(params || "");

        var region = search.get("region");
        var audience = search.get("audience");
        var groupType = search.get("group");
        var workshop = normalizeWorkshop(search.get("workshop"));

        return {
            region: includes(REGION_IDS, region) ? region : null,
            audience: includes(AUDIENCE_IDS, audience) ? audience : null,
            groupType: includes(GROUP_TYPE_IDS, groupType) ? groupType : null,
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
        REGION_IDS: REGION_IDS,
        AUDIENCE_IDS: AUDIENCE_IDS,
        GROUP_TYPE_IDS: GROUP_TYPE_IDS,
        WORKSHOP_IDS: WORKSHOP_IDS,
        UTM_KEYS: UTM_KEYS,
        validateQuery: validateQuery,
        normalizeWorkshop: normalizeWorkshop,
        collectUtmParams: collectUtmParams,
        applyUtmParams: applyUtmParams
    };
})(window);
