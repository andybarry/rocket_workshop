(function () {
    "use strict";

    function track(eventName, details) {
        if (typeof window.gtag === "function") {
            window.gtag("event", eventName, details || {});
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        var page = document.querySelector(".explore-page[data-context-category]");
        if (!page) return;

        var category = page.getAttribute("data-context-category");
        var slug = page.getAttribute("data-context-slug");

        track("contextual_explore_page_viewed", {
            category: category,
            slug: slug
        });

        var mobilePlan = page.querySelector("[data-contextual-mobile-plan]");
        var inlinePlanLinks = Array.prototype.slice.call(page.querySelectorAll("[data-plan-general]"))
            .filter(function (link) { return !link.closest("[data-contextual-mobile-plan]"); });
        if (mobilePlan && "IntersectionObserver" in window) {
            var visiblePlans = new Set();
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) visiblePlans.add(entry.target);
                    else visiblePlans.delete(entry.target);
                });
                var showSticky = visiblePlans.size === 0;
                mobilePlan.classList.toggle("is-hidden", !showSticky);
                page.classList.toggle("has-mobile-plan", showSticky);
            }, { threshold: 0.2 });
            inlinePlanLinks.forEach(function (link) { observer.observe(link); });
        }

        page.addEventListener("click", function (event) {
            var view = event.target.closest("[data-workshop-view]");
            if (view) {
                track("workshop_card_view_clicked", {
                    workshop: view.getAttribute("data-workshop"),
                    contextCategory: category,
                    contextSlug: slug
                });
                return;
            }

            var planWorkshop = event.target.closest("[data-plan-workshop]");
            if (planWorkshop) {
                track("plan_this_workshop_clicked", {
                    workshop: planWorkshop.getAttribute("data-workshop"),
                    contextCategory: category,
                    contextSlug: slug
                });
                return;
            }

            var planGeneral = event.target.closest("[data-plan-general]");
            if (planGeneral) {
                track("plan_a_workshop_clicked", {
                    source: planGeneral.getAttribute("data-plan-source") || "contextual_intro"
                });
            }
        });
    });
})();
