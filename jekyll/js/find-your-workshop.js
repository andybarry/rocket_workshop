(function () {
    "use strict";

    var CATEGORY_STATE_KEYS = {
        city: "city",
        audience: "audience",
        group_type: "groupType",
        workshop: "workshop"
    };

    document.addEventListener("DOMContentLoaded", function () {
        var section = document.querySelector("[data-find-your-workshop]");
        if (!section || !window.StageOneState) return;

        var state = window.StageOneState.load();

        // Section viewed — fired once per page view when the section scrolls in.
        if (window.IntersectionObserver) {
            var seen = false;
            var observer = new window.IntersectionObserver(function (entries) {
                if (seen) return;
                var showing = entries.some(function (entry) { return entry.isIntersecting; });
                if (!showing) return;
                seen = true;
                observer.disconnect();
                window.StageOneState.track("find_your_workshop_viewed",
                    window.StageOneState.eventParams(state, "homepage"));
            }, { threshold: 0.3 });
            observer.observe(section);
        } else {
            window.StageOneState.track("find_your_workshop_viewed",
                window.StageOneState.eventParams(state, "homepage"));
        }

        // Option selections. Options are plain links to landing pages; the
        // selection is remembered so landing pages can keep the context.
        Array.prototype.forEach.call(section.querySelectorAll("[data-discovery-option]"), function (option) {
            option.addEventListener("click", function () {
                var category = option.getAttribute("data-category");
                var id = option.getAttribute("data-id");
                var stateKey = CATEGORY_STATE_KEYS[category];
                if (stateKey) {
                    var patch = {};
                    patch[stateKey] = id;
                    state = window.StageOneState.assign(state, patch);
                }
                var params = window.StageOneState.eventParams(state, "homepage");
                params.category = category;
                params.selection = id;
                params.source = "find_your_workshop";
                window.StageOneState.track("discovery_option_selected", params);
            });
        });

        // "More U.S. cities" (and any future expandable group) opened.
        Array.prototype.forEach.call(section.querySelectorAll("[data-discovery-more]"), function (details) {
            details.addEventListener("toggle", function () {
                if (!details.open) return;
                window.StageOneState.track("discovery_category_opened", {
                    category: details.getAttribute("data-discovery-more"),
                    source: "find_your_workshop"
                });
            });
        });
    });
})();
