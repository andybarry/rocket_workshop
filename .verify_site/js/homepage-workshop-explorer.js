(function () {
    "use strict";

    function track(eventName, details) {
        if (typeof window.gtag === "function") {
            window.gtag("event", eventName, details || {});
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        var explorer = document.getElementById("workshop-explorer");
        if (!explorer) return;

        var tabs = Array.prototype.slice.call(explorer.querySelectorAll("[data-explorer-tab]"));
        var panels = Array.prototype.slice.call(explorer.querySelectorAll("[data-explorer-panel]"));

        function activateTab(tab, moveFocus, shouldTrack) {
            var value = tab.getAttribute("data-explorer-tab");
            tabs.forEach(function (candidate) {
                var active = candidate === tab;
                candidate.setAttribute("aria-selected", active ? "true" : "false");
                candidate.setAttribute("tabindex", active ? "0" : "-1");
            });
            panels.forEach(function (panel) {
                panel.hidden = panel.getAttribute("data-explorer-panel") !== value;
            });
            if (moveFocus) tab.focus();
            if (shouldTrack) track("workshop_explorer_tab_changed", { tab: value });
        }

        tabs.forEach(function (tab, index) {
            tab.addEventListener("click", function () {
                activateTab(tab, false, true);
            });
            tab.addEventListener("keydown", function (event) {
                var nextIndex = index;
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    nextIndex = (index + 1) % tabs.length;
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    nextIndex = (index - 1 + tabs.length) % tabs.length;
                } else if (event.key === "Home") {
                    nextIndex = 0;
                } else if (event.key === "End") {
                    nextIndex = tabs.length - 1;
                } else {
                    return;
                }
                event.preventDefault();
                activateTab(tabs[nextIndex], true, true);
            });
        });

        explorer.addEventListener("click", function (event) {
            var option = event.target.closest("[data-explorer-option]");
            if (option) {
                track("workshop_explorer_option_selected", {
                    category: option.getAttribute("data-category"),
                    slug: option.getAttribute("data-slug"),
                    label: option.getAttribute("data-label"),
                    source: "homepage"
                });
                return;
            }

            if (event.target.closest("[data-plan-general]")) {
                track("plan_a_workshop_clicked", { source: "homepage_explorer" });
            }
        });
    });
})();
