(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var strip = document.querySelector("[data-workshop-context]");
        if (!strip || !window.StageOneState) return;

        var slug = strip.getAttribute("data-workshop-slug");
        var state = window.StageOneState.load();
        var workshop = window.StageOneCopy.findBy(window.StageOneDiscoveryData.workshops, "slug", slug);
        var note = document.querySelector("[data-workshop-audience-note]");
        var planLinks = document.querySelectorAll("[data-workshop-plan-cta]");
        var cityLink = strip.querySelector("[data-workshop-city-link]");
        var changeLink = strip.querySelector("[data-workshop-change-link]");
        var hasContext = !!(state.city || state.audience || state.groupType);

        if (hasContext) {
            strip.hidden = false;
            strip.querySelector("[data-workshop-context-line]").textContent =
                window.StageOneCopy.workshopContextLine(state, workshop);
            if (cityLink) {
                var city = window.StageOneCopy.cityOf(state);
                cityLink.href = state.city
                    ? window.StageOneUrls.buildDiscoveryUrl("city", state.city, state)
                    : window.StageOneUrls.buildExplorerReturnUrl(state);
                cityLink.textContent = city
                    ? "Explore " + (city.short_label || city.name) + " Workshops"
                    : "Explore Workshops";
            }
            if (changeLink) {
                changeLink.href = window.StageOneUrls.buildExplorerReturnUrl(state);
            }
        }

        if (note && state.audience) {
            var audience = window.StageOneCopy.audienceOf(state);
            if (audience) {
                note.hidden = false;
                note.querySelector("[data-workshop-audience-heading]").textContent =
                    "Adapted for " + audience.label + " Groups";
                note.querySelector("[data-workshop-audience-detail]").textContent =
                    "The instructor can adjust pacing, explanations, team structure, and technical depth while preserving the full hands-on " +
                    (workshop ? workshop.heading_label : "workshop") + " experience.";
            }
        }

        if (planLinks.length) {
            var planState = window.StageOneState.assign(state, { workshop: slug });
            Array.prototype.forEach.call(planLinks, function (planLink) {
                planLink.href = window.StageOneUrls.buildPlanUrl(planState);
                planLink.addEventListener("click", function () {
                    window.StageOneState.track("workshop_page_start_planning_clicked", window.StageOneState.eventParams(planState, "workshop"));
                });
            });
        }
    });
})();
