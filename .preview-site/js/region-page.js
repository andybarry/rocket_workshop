(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var page = document.querySelector("[data-region-page]");
        if (!page || !window.StageOneState) return;

        var regionId = page.getAttribute("data-region-id");
        var pageState = { region: regionId };
        var state = window.StageOneState.load(pageState);
        state = window.StageOneState.assign(state, { region: regionId });

        var summaryChips = page.querySelector("[data-region-summary-chips]");
        var planningChips = page.querySelector("[data-planning-chips]");
        var planningLink = page.querySelector("[data-start-planning]");
        var changeLinks = page.querySelectorAll("[data-change-selections]");
        var audienceButtons = page.querySelectorAll("[data-audience-button]");
        var audienceTitle = page.querySelector("[data-audience-panel-title]");
        var audienceDetail = page.querySelector("[data-audience-panel-detail]");
        var audienceAvailability = page.querySelector("[data-audience-panel-availability]");
        var copy = window.StageOneExplorerData.copy || {};

        function renderChips(container) {
            if (!container) return;
            container.innerHTML = "";
            window.StageOneCopy.selectionChips(state).forEach(function (chip) {
                var item = document.createElement("span");
                item.className = "selection-chip";
                item.textContent = chip.label;
                container.appendChild(item);
            });
        }

        function renderWorkshops() {
            Array.prototype.forEach.call(page.querySelectorAll("[data-workshop-card]"), function (card) {
                var slug = card.getAttribute("data-workshop-card");
                var selected = state.workshop === slug;
                card.classList.toggle("is-selected", selected);
                var label = card.querySelector(".region-page__selected-label");
                if (label) label.hidden = !selected;
                var link = card.querySelector("[data-workshop-link]");
                if (link) {
                    link.href = window.StageOneUrls.buildWorkshopUrl(slug, state);
                }
            });
        }

        function renderAudience() {
            var audience = window.StageOneCopy.audienceOf(state);
            Array.prototype.forEach.call(audienceButtons, function (button) {
                var selected = button.getAttribute("data-audience-button") === state.audience;
                button.classList.toggle("is-selected", selected);
                button.setAttribute("aria-pressed", selected ? "true" : "false");
                button.setAttribute("aria-expanded", selected ? "true" : "false");
            });
            if (audience) {
                audienceTitle.textContent = audience.label;
                audienceDetail.textContent = audience.detail;
                audienceAvailability.textContent = audience.availability || "";
            } else {
                audienceTitle.textContent = "Every audience";
                audienceDetail.textContent = copy.audience_general_intro || "";
                audienceAvailability.textContent = "";
            }
        }

        function renderLinks() {
            if (planningLink) planningLink.href = window.StageOneUrls.buildPlanUrl(state);
            Array.prototype.forEach.call(changeLinks, function (link) {
                link.href = window.StageOneUrls.buildExplorerReturnUrl(state);
            });
        }

        function render() {
            renderChips(summaryChips);
            renderChips(planningChips);
            renderWorkshops();
            renderAudience();
            renderLinks();
        }

        function stateFromCurrentUrl() {
            var next = window.StageOneState.normalize(window.StageOneState.fromUrl());
            next = window.StageOneState.assign(next, { region: regionId });
            return next;
        }

        Array.prototype.forEach.call(audienceButtons, function (button) {
            button.addEventListener("click", function () {
                var next = button.getAttribute("data-audience-button");
                state = window.StageOneState.assign(state, {
                    audience: state.audience === next ? null : next
                });
                window.StageOneUrls.replaceQuery(state);
                render();
                window.StageOneState.track("region_page_audience_selected", window.StageOneState.eventParams(state, "region"));
            });
        });

        var clearAudience = page.querySelector("[data-clear-audience]");
        if (clearAudience) {
            clearAudience.addEventListener("click", function () {
                state = window.StageOneState.assign(state, { audience: null });
                window.StageOneUrls.replaceQuery(state);
                render();
            });
        }

        Array.prototype.forEach.call(page.querySelectorAll("[data-workshop-link]"), function (link) {
            link.addEventListener("click", function () {
                window.StageOneState.track("region_page_workshop_clicked", Object.assign(
                    window.StageOneState.eventParams(state, "region"),
                    { workshop: link.getAttribute("data-workshop-link") }
                ));
            });
        });

        Array.prototype.forEach.call(changeLinks, function (link) {
            link.addEventListener("click", function () {
                window.StageOneState.track("region_page_change_selections_clicked", window.StageOneState.eventParams(state, "region"));
            });
        });

        if (planningLink) {
            planningLink.addEventListener("click", function () {
                window.StageOneState.track("region_page_start_planning_clicked", window.StageOneState.eventParams(state, "region"));
            });
        }

        window.addEventListener("popstate", function () {
            state = stateFromCurrentUrl();
            render();
        });

        window.StageOneUrls.replaceQuery(state);
        render();
    });
})();
