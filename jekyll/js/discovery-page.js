(function () {
    "use strict";

    var CATEGORY_STATE_KEYS = {
        city: "city",
        audience: "audience",
        group_type: "groupType",
        workshop: "workshop"
    };

    document.addEventListener("DOMContentLoaded", function () {
        var body = document.body;
        if (!body.hasAttribute("data-discovery-page") || !window.StageOneState) return;

        var category = body.getAttribute("data-discovery-category");
        var pageId = body.getAttribute("data-discovery-id");
        var stateKey = CATEGORY_STATE_KEYS[category];

        // The page itself is a selection: remember it, then merge any context
        // carried in the URL or the visitor's session.
        var state = window.StageOneState.load();
        if (stateKey) {
            var patch = {};
            patch[stateKey] = pageId;
            state = window.StageOneState.assign(state, patch);
        }

        function currentContext() {
            return window.StageOneState.eventParams(state, "discovery");
        }

        // Page viewed.
        var viewedParams = currentContext();
        viewedParams.category = category;
        viewedParams.selection = pageId;
        window.StageOneState.track("discovery_page_viewed", viewedParams);

        // Keep-exploring options: carry the visitor's context into the next
        // landing page and record the secondary selection.
        Array.prototype.forEach.call(document.querySelectorAll("[data-discovery-option]"), function (option) {
            var optionCategory = option.getAttribute("data-category");
            var optionId = option.getAttribute("data-id");

            if (window.StageOneUrls) {
                option.href = window.StageOneUrls.buildDiscoveryUrl(optionCategory, optionId, state);
            }

            option.addEventListener("click", function () {
                var optionKey = CATEGORY_STATE_KEYS[optionCategory];
                if (optionKey) {
                    var patch = {};
                    patch[optionKey] = optionId;
                    window.StageOneState.assign(state, patch);
                }
                var params = currentContext();
                params.category = optionCategory;
                params.destination = optionId;
                params.current_context = pageId;
                params.source = "landing_page";
                window.StageOneState.track("discovery_context_selected", params);
            });
        });

        // Workshop detail link (workshop landing pages): carry context along.
        var detailLink = document.querySelector("[data-discovery-detail-link]");
        if (detailLink && window.StageOneUrls && category === "workshop") {
            detailLink.href = window.StageOneUrls.buildWorkshopUrl(pageId, state);
            detailLink.addEventListener("click", function () {
                var params = currentContext();
                params.workshop = pageId;
                window.StageOneState.track("discovery_workshop_detail_clicked", params);
            });
        }

        // Back to the Find Your Workshop grid.
        var backLink = document.querySelector("[data-discovery-back]");
        if (backLink) {
            backLink.addEventListener("click", function () {
                var params = currentContext();
                params.current_context = pageId;
                window.StageOneState.track("back_to_finder_clicked", params);
            });
        }

        // Testimonial interactions.
        Array.prototype.forEach.call(document.querySelectorAll("[data-testimonial]"), function (card) {
            card.addEventListener("click", function () {
                window.StageOneState.track("testimonial_interaction", {
                    action: "card_clicked",
                    testimonial_id: card.getAttribute("data-testimonial-id"),
                    current_context: pageId
                });
            });
        });
        var moreLink = document.querySelector("[data-testimonial-more]");
        if (moreLink) {
            moreLink.addEventListener("click", function () {
                window.StageOneState.track("testimonial_interaction", {
                    action: "more_feedback_clicked",
                    current_context: pageId
                });
            });
        }
    });
})();
