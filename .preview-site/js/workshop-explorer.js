(function () {
    "use strict";

    var STORAGE_KEY = "so_workshop_explorer";
    var STATE_KEYS = ["workshop", "destination", "customDestination", "participants", "participantGroup", "region", "groupType", "international"];
    var WORKSHOP_ORDER = ["artificial-intelligence", "robotics-drone", "mechanical-engineering", "web-development"];
    var WORKSHOP_NAMES = {
        "artificial-intelligence": "Artificial Intelligence",
        "robotics-drone": "Robotics Drone",
        "mechanical-engineering": "Mechanical Engineering",
        "web-development": "Web Development"
    };
    var REGION_NAMES = {
        "northeast-mid-atlantic": "Northeast & Mid-Atlantic",
        "southeast": "Southeast",
        "midwest-south-central": "Midwest & South Central",
        "mountain-west": "Mountain West",
        "west-coast": "West Coast"
    };

    function safeRead() {
        try {
            var stored = window.localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            return {};
        }
    }

    function safeWrite(state) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            /* Storage can be unavailable in private browsing. URL state still works. */
        }
    }

    function readUrlState() {
        var params = new URLSearchParams(window.location.search);
        var result = {};
        var mode = params.get("mode");
        if (mode === "plan" || mode === "explore") result.mode = mode;
        STATE_KEYS.forEach(function (key) {
            var value = params.get(key);
            if (value) result[key] = value;
        });
        return result;
    }

    function emptyState() {
        return {
            mode: "explore",
            workshop: "",
            destination: "",
            customDestination: "",
            participants: "",
            participantGroup: "",
            region: "",
            groupType: "",
            international: ""
        };
    }

    function stateFromUrlOnly() {
        var state = Object.assign(emptyState(), readUrlState());
        if (state.participantGroup && !state.participants) state.participants = state.participantGroup;
        if (state.participants && !state.participantGroup) state.participantGroup = state.participants;
        return state;
    }

    function mergedInitialState() {
        var stored = safeRead();
        var fromUrl = readUrlState();
        var state = emptyState();
        STATE_KEYS.forEach(function (key) {
            if (stored[key]) state[key] = stored[key];
            if (fromUrl[key]) state[key] = fromUrl[key];
        });
        if (fromUrl.mode) state.mode = fromUrl.mode;
        if (state.participantGroup && !state.participants) state.participants = state.participantGroup;
        if (state.participants && !state.participantGroup) state.participantGroup = state.participants;
        return state;
    }

    function translated(key, fallback) {
        if (window.SOI18n && typeof window.SOI18n.t === "function") {
            return window.SOI18n.t(key) || fallback;
        }
        return fallback;
    }

    function track(eventName, details) {
        if (typeof window.gtag !== "function") return;
        window.gtag("event", eventName, details || {});
    }

    function stateParams(state, includeMode) {
        var params = new URLSearchParams();
        if (includeMode && state.mode === "plan") params.set("mode", "plan");
        STATE_KEYS.forEach(function (key) {
            if (key === "participants" && state.participantGroup) return;
            if (state[key]) params.set(key, state[key]);
        });
        return params;
    }

    function stateUrl(state, hash, includeMode) {
        var url = new URL(window.location.href);
        var params = stateParams(state, includeMode);
        url.search = params.toString();
        url.hash = hash || "";
        return url.pathname.replace(/\/index\.html$/, "/") + (url.search || "") + (url.hash || "");
    }

    function updateGlobalPlanLinks(state) {
        document.querySelectorAll("[data-workshop-plan-link]").forEach(function (link) {
            var next = Object.assign({}, state, { mode: "plan" });
            var slug = link.getAttribute("data-workshop-slug");
            if (slug) next.workshop = slug;
            var params = stateParams(next, true);
            var source = link.getAttribute("data-source");
            if (source) params.set("source", source);
            var target = "/index.html?" + params.toString() + "#workshop-finder";
            link.setAttribute("href", target);
        });
    }

    var initial = mergedInitialState();
    var urlState = readUrlState();
    if (Object.keys(urlState).length) safeWrite(initial);
    updateGlobalPlanLinks(initial);

    document.addEventListener("DOMContentLoaded", function () {
        var explorer = document.getElementById("workshop-finder");
        if (!explorer) {
            updateGlobalPlanLinks(mergedInitialState());
            document.querySelectorAll("[data-workshop-plan-link]").forEach(function (link) {
                link.addEventListener("click", function () {
                    track("workshop_planner_opened", {
                        source: link.getAttribute("data-source") || "unknown",
                        workshop: link.getAttribute("data-workshop-slug") || "not_sure_yet"
                    });
                });
            });
            return;
        }

        var state = mergedInitialState();
        var homepageExplorer = document.getElementById("workshop-explorer");
        var heading = document.getElementById("workshop-explorer-heading");
        var controls = document.getElementById("workshop-explorer-controls");
        var chips = explorer.querySelector(".workshop-explorer__chips");
        var results = explorer.querySelector(".workshop-explorer__results");
        var planArea = explorer.querySelector(".workshop-explorer__plan");
        var refine = explorer.querySelector(".workshop-explorer__refine");
        var form = document.getElementById("plan-workshop-form");
        var cards = Array.prototype.slice.call(explorer.querySelectorAll("[data-workshop]"));
        var fields = {
            destination: explorer.querySelector('[name="explorerDestination"]'),
            customDestination: explorer.querySelector('[name="explorerCustomDestination"]'),
            participants: explorer.querySelector('[name="explorerParticipants"]'),
            groupType: explorer.querySelector('[name="explorerGroupType"]'),
            international: explorer.querySelector('[name="explorerInternational"]'),
            workshop: explorer.querySelector('[name="explorerWorkshop"]')
        };

        function optionLabel(field, value) {
            if (!field || !value) return "";
            var option = field.querySelector('option[value="' + value.replace(/"/g, '\\"') + '"]');
            return option ? option.textContent.trim() : value;
        }

        function workshopName(slug) {
            return optionLabel(fields.workshop, slug) || WORKSHOP_NAMES[slug] || slug;
        }

        function displayValue(key) {
            var none = translated("home.explorer.notSelected", "Not selected yet");
            if (key === "destination") {
                if (state.destination === "other") return state.customDestination || none;
                return optionLabel(fields.destination, state.destination) || none;
            }
            if (key === "workshop") return state.workshop ? workshopName(state.workshop) : none;
            return optionLabel(fields[key], state[key]) || none;
        }

        function setModeCopy() {
            var isPlan = state.mode === "plan";
            var mobileAction = explorer.querySelector(".workshop-explorer__mobile-action");
            explorer.hidden = !isPlan;
            if (homepageExplorer) homepageExplorer.hidden = isPlan;
            explorer.setAttribute("data-mode", state.mode);
            explorer.querySelectorAll("[data-explore-copy]").forEach(function (node) {
                node.hidden = isPlan;
            });
            explorer.querySelectorAll("[data-plan-copy]").forEach(function (node) {
                node.hidden = !isPlan;
            });
            planArea.hidden = !isPlan;
            if (mobileAction) mobileAction.hidden = !isPlan;
            explorer.classList.remove("is-form-open");
        }

        function renderCards() {
            var selected = state.workshop;
            cards.sort(function (a, b) {
                var aSlug = a.getAttribute("data-workshop");
                var bSlug = b.getAttribute("data-workshop");
                if (aSlug === selected) return -1;
                if (bSlug === selected) return 1;
                return WORKSHOP_ORDER.indexOf(aSlug) - WORKSHOP_ORDER.indexOf(bSlug);
            }).forEach(function (card) {
                results.appendChild(card);
                var slug = card.getAttribute("data-workshop");
                var isSelected = slug === selected;
                var details = card.querySelector(".workshop-explorer-card__details");
                var select = card.querySelector(".workshop-explorer-card__plan");
                card.classList.toggle("is-selected", isSelected);
                card.setAttribute("aria-label", workshopName(slug) + (isSelected ? ", selected" : ""));

                var detailsParams = stateParams(state, state.mode === "plan");
                details.setAttribute("href", card.getAttribute("data-details") + (detailsParams.toString() ? "?" + detailsParams.toString() : ""));
                if (state.mode === "plan") {
                    details.textContent = translated("home.explorer.viewDetails", "VIEW DETAILS");
                    select.innerHTML = isSelected
                        ? '<i class="fa fa-check" aria-hidden="true"></i> ' + translated("home.explorer.selected", "SELECTED")
                        : translated("home.explorer.selectWorkshop", "SELECT WORKSHOP");
                } else {
                    details.textContent = translated("home.explorer.exploreWorkshop", "EXPLORE WORKSHOP");
                    select.textContent = translated("home.explorer.planThis", "PLAN THIS WORKSHOP");
                }
                select.setAttribute("aria-pressed", isSelected ? "true" : "false");
            });
            if (state.mode === "plan" && state.workshop && window.innerWidth <= 767) {
                var selectedCard = results.querySelector('[data-workshop="' + state.workshop + '"]');
                if (selectedCard) selectedCard.insertAdjacentElement("afterend", planArea);
            } else {
                results.insertAdjacentElement("afterend", planArea);
            }
        }

        function renderChips() {
            chips.innerHTML = "";
            ["destination", "participants", "groupType", "international", "workshop"].forEach(function (key) {
                var value = displayValue(key);
                if (value === translated("home.explorer.notSelected", "Not selected yet")) return;
                var chip = document.createElement("span");
                chip.className = "workshop-explorer__chip";
                chip.appendChild(document.createTextNode(value));
                var remove = document.createElement("button");
                remove.type = "button";
                remove.setAttribute("data-clear-filter", key);
                remove.setAttribute("aria-label", translated("home.explorer.clearSelection", "Clear selection") + ": " + value);
                remove.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
                chip.appendChild(remove);
                chips.appendChild(chip);
            });
        }

        function renderSummary() {
            explorer.querySelectorAll("[data-summary-edit]").forEach(function (button) {
                button.textContent = displayValue(button.getAttribute("data-summary-edit"));
            });
            var region = explorer.querySelector("[data-plan-region]");
            if (region) {
                region.textContent = REGION_NAMES[state.region]
                    || state.region
                    || translated("home.explorer.notSelected", "Not selected yet");
            }
            var mobile = explorer.querySelector("[data-mobile-plan-label]");
            var workshop = state.workshop
                ? translated("home.explorer.mobileSelected", "Workshop selected:") + " " + workshopName(state.workshop)
                : translated("home.explorer.mobileNotSure", "Workshop: Not sure yet");
            mobile.textContent = workshop;
        }

        function syncControls() {
            fields.destination.value = state.destination;
            fields.customDestination.value = state.customDestination;
            fields.participants.value = state.participants;
            fields.groupType.value = state.groupType;
            fields.international.value = state.international;
            fields.workshop.value = state.workshop;
            fields.customDestination.hidden = state.destination !== "other";
        }

        function syncForm() {
            if (!form) return;
            var values = {
                explorerDestination: displayValue("destination"),
                explorerCustomDestination: state.customDestination || "",
                explorerParticipants: displayValue("participants"),
                explorerRegion: REGION_NAMES[state.region] || state.region || "",
                explorerGroupType: displayValue("groupType"),
                explorerInternational: displayValue("international"),
                explorerWorkshop: state.workshop ? workshopName(state.workshop) : "Not sure yet"
            };
            Object.keys(values).forEach(function (name) {
                var input = form.elements.namedItem(name);
                if (input) input.value = values[name];
            });
        }

        function render() {
            setModeCopy();
            syncControls();
            renderChips();
            renderCards();
            renderSummary();
            syncForm();
            safeWrite(state);
            updateGlobalPlanLinks(state);
        }

        function commit(eventName, details, method) {
            render();
            var url = stateUrl(state, state.mode === "plan" ? "#workshop-finder" : "#workshop-explorer", true);
            if (window.history && window.history[method || "pushState"]) {
                window.history[method || "pushState"]({ workshopExplorer: state }, "", url);
            }
            if (eventName) track(eventName, details);
        }

        function scrollAndFocus(shouldFocus) {
            var nav = document.getElementById("mainNav");
            var navHeight = nav ? Math.ceil(nav.getBoundingClientRect().height) : 56;
            var scrollTarget = state.mode === "plan" || !homepageExplorer ? explorer : homepageExplorer;
            scrollTarget.style.scrollMarginTop = (navHeight + 18) + "px";
            scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
            if (shouldFocus && heading) {
                window.setTimeout(function () { heading.focus({ preventScroll: true }); }, 450);
            }
        }

        Object.keys(fields).forEach(function (key) {
            var field = fields[key];
            var eventName = field.tagName === "INPUT" ? "input" : "change";
            field.addEventListener(eventName, function () {
                state[key] = field.value.trim();
                if (key === "participants") state.participantGroup = state.participants;
                if (key === "destination" && state.destination !== "other") state.customDestination = "";
                if (key === "workshop" && state.workshop && state.mode === "plan") {
                    track("workshop_selected", { workshop: state.workshop, source: "explorer_selector" });
                }
                commit("explorer_filter_selected", { filter: key, value: state[key], mode: state.mode }, eventName === "input" ? "replaceState" : "pushState");
            });
        });

        explorer.addEventListener("click", function (event) {
            var clear = event.target.closest("[data-clear-filter]");
            if (clear) {
                var clearKey = clear.getAttribute("data-clear-filter");
                state[clearKey] = "";
                if (clearKey === "destination") state.customDestination = "";
                commit("explorer_filter_selected", { filter: clearKey, value: "", mode: state.mode });
                return;
            }
            var select = event.target.closest("[data-workshop-select]");
            if (select) {
                var slug = select.getAttribute("data-workshop-select");
                var wasExplore = state.mode === "explore";
                state.mode = "plan";
                state.workshop = slug;
                commit("workshop_selected", { workshop: slug, source: wasExplore ? "workshop_card" : "planner_card" });
                if (wasExplore) {
                    track("workshop_planner_opened", { source: "workshop_card", workshop: slug });
                    scrollAndFocus(true);
                }
                return;
            }
            var edit = event.target.closest("[data-summary-edit]");
            if (edit) {
                var editKey = edit.getAttribute("data-summary-edit");
                if (window.innerWidth <= 767) {
                    explorer.classList.add("is-refine-open");
                    refine.setAttribute("aria-expanded", "true");
                }
                var target = fields[editKey];
                if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                    window.setTimeout(function () { target.focus(); }, 350);
                }
            }
        });

        refine.addEventListener("click", function () {
            var open = explorer.classList.toggle("is-refine-open");
            refine.setAttribute("aria-expanded", open ? "true" : "false");
            if (open) controls.querySelector("select").focus();
        });

        explorer.querySelectorAll("[data-continue-planning]").forEach(function (button) {
            button.addEventListener("click", function () {
                state.mode = "plan";
                syncForm();
                explorer.classList.add("is-form-open");
                track("continue_planning_clicked", {
                    source: button.closest(".workshop-explorer__mobile-action") ? "mobile_sticky" : "explorer",
                    workshop: state.workshop || "not_sure_yet"
                });
                if (form) {
                    var nextUrl = stateUrl(state, "#plan-workshop-form", true);
                    window.history.pushState({ workshopExplorer: state }, "", nextUrl);
                    form.scrollIntoView({ behavior: "smooth", block: "start" });
                    var formHeading = form.querySelector(".participants-plan-cta__title");
                    if (formHeading) {
                        formHeading.setAttribute("tabindex", "-1");
                        window.setTimeout(function () { formHeading.focus({ preventScroll: true }); }, 450);
                    }
                }
            });
        });

        document.querySelectorAll("[data-explorer-entry]").forEach(function (link) {
            link.addEventListener("click", function (event) {
                var mode = link.getAttribute("data-explorer-mode") || "explore";
                var source = link.getAttribute("data-source") || "unknown";
                event.preventDefault();
                state.mode = mode;
                commit(mode === "plan" ? "workshop_planner_opened" : "workshop_explorer_opened", { source: source });
                scrollAndFocus(mode === "plan");
            });
        });

        document.querySelectorAll("[data-workshop-plan-link]").forEach(function (link) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                state.mode = "plan";
                var slug = link.getAttribute("data-workshop-slug");
                if (slug) state.workshop = slug;
                var source = link.getAttribute("data-source") || "unknown";
                commit("workshop_planner_opened", { source: source, workshop: state.workshop || "not_sure_yet" });
                scrollAndFocus(true);
            });
        });

        window.addEventListener("popstate", function () {
            var restored = stateFromUrlOnly();
            state = restored;
            render();
            if (window.location.hash === "#workshop-finder") scrollAndFocus(state.mode === "plan");
        });
        window.addEventListener("resize", function () {
            render();
        });

        function renderAfterLanguageChange() {
            window.setTimeout(render, 0);
        }
        if (window.SOI18n && typeof window.SOI18n.ready === "function") {
            window.SOI18n.ready(renderAfterLanguageChange);
        }

        render();
        var source = new URLSearchParams(window.location.search).get("source") || "direct";
        if (window.location.hash === "#workshop-finder" || window.location.hash === "#workshop-explorer" || state.mode === "plan") {
            window.setTimeout(function () {
                scrollAndFocus(state.mode === "plan");
                track(state.mode === "plan" ? "workshop_planner_opened" : "workshop_explorer_opened", { source: source });
            }, 0);
        }
    });
})();
