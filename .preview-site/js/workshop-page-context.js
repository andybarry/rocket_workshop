(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.StageOneState) return;

        var planLinks = document.querySelectorAll("[data-workshop-plan-cta]");
        var slugNode = document.querySelector("[data-workshop-slug]");
        var slug = (planLinks[0] && planLinks[0].getAttribute("data-workshop-slug")) ||
            (slugNode && slugNode.getAttribute("data-workshop-slug"));
        if (!slug) return;

        var state = window.StageOneState.load();
        var planState = window.StageOneState.assign(state, { workshop: slug });

        Array.prototype.forEach.call(planLinks, function (planLink) {
            planLink.href = window.StageOneUrls.buildPlanUrl(planState);
            planLink.addEventListener("click", function () {
                window.StageOneState.track("workshop_page_start_planning_clicked", window.StageOneState.eventParams(planState, "workshop"));
            });
        });
    });
})();
