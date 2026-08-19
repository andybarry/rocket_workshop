(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var explorer = document.getElementById("find-your-workshop");
        if (!explorer || !window.StageOneState) return;

        var state = window.StageOneState.load();
        var reducedMotion = window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var desktopQuery = window.matchMedia("(min-width: 960px)");
        var mapPanel = explorer.querySelector(".workshop-explorer__map-panel");
        var mapSvg = explorer.querySelector(".explorer-region-map__svg");
        var mapRefiner = explorer.querySelector("[data-explorer-map-refiner]");
        var mapTitle = explorer.querySelector("[data-explorer-map-title]");
        var mapInstruction = explorer.querySelector("[data-explorer-map-instruction]");
        var resultHeading = explorer.querySelector("[data-explorer-result-heading]");
        var resultParagraph = explorer.querySelector("[data-explorer-result-paragraph]");
        var resultCta = explorer.querySelector("[data-explorer-result-cta]");
        var resultCopy = explorer.querySelector(".workshop-explorer__result-copy");
        var chips = explorer.querySelector("[data-explorer-chips]");
        var fullMapViewBox = [0, 0, 959, 593];
        var currentMapViewBox = mapSvg ? parseViewBox(mapSvg.getAttribute("viewBox")) : fullMapViewBox.slice();
        var mapAnimationFrame = null;
        var renderedRegion = null;

        function optionButtons(category) {
            return explorer.querySelectorAll('[data-explorer-option][data-category="' + category + '"]');
        }

        function mapLinks() {
            return explorer.querySelectorAll(
                '.explorer-region-map__states .explorer-region-map__link[data-category="region"]'
            );
        }

        function mapLabels() {
            return explorer.querySelectorAll(
                ".explorer-region-map__labels [data-region-label]"
            );
        }

        function parseViewBox(value) {
            var parsed = String(value || "").trim().split(/\s+/).map(Number);
            return parsed.length === 4 && parsed.every(function (item) {
                return Number.isFinite(item);
            }) ? parsed : fullMapViewBox.slice();
        }

        function itemFrom(listName, key, value) {
            var list = (window.StageOneExplorerData || {})[listName] || [];
            for (var index = 0; index < list.length; index += 1) {
                if (list[index][key] === value) return list[index];
            }
            return null;
        }

        function regionData(slug) {
            return itemFrom("regions", "id", slug);
        }

        function audienceData(slug) {
            return itemFrom("audiences", "id", slug);
        }

        function workshopData(slug) {
            return itemFrom("workshops", "slug", slug);
        }

        function setPressed(category, slug) {
            Array.prototype.forEach.call(optionButtons(category), function (button) {
                var selected = button.getAttribute("data-slug") === slug;
                button.classList.toggle("is-selected", selected);
                button.setAttribute("aria-pressed", selected ? "true" : "false");
            });
        }

        function setMapSelected(slug) {
            Array.prototype.forEach.call(mapLinks(), function (link) {
                var selected = link.getAttribute("data-slug") === slug;
                link.classList.toggle("is-selected", selected);
                link.setAttribute("aria-pressed", selected ? "true" : "false");
            });
            Array.prototype.forEach.call(mapLabels(), function (label) {
                label.classList.toggle(
                    "is-selected",
                    label.getAttribute("data-region-label") === slug
                );
            });
        }

        function setMapPreview(slug) {
            Array.prototype.forEach.call(mapLinks(), function (link) {
                link.classList.toggle("is-preview", link.getAttribute("data-slug") === slug);
            });
            Array.prototype.forEach.call(mapLabels(), function (label) {
                label.classList.toggle(
                    "is-preview",
                    label.getAttribute("data-region-label") === slug
                );
            });
            Array.prototype.forEach.call(optionButtons("region"), function (button) {
                button.classList.toggle("is-preview", button.getAttribute("data-slug") === slug);
            });
        }

        function clearPreview() {
            setMapPreview(null);
        }

        function mapTarget(slug) {
            var region = regionData(slug);
            return region && region.kind === "us" && region.map_viewbox
                ? parseViewBox(region.map_viewbox)
                : fullMapViewBox.slice();
        }

        function setMapViewBox(values) {
            if (!mapSvg) return;
            currentMapViewBox = values.slice();
            mapSvg.setAttribute("viewBox", values.map(function (item) {
                return Math.round(item * 100) / 100;
            }).join(" "));
        }

        function zoomMap(slug) {
            if (!mapSvg || renderedRegion === slug) return;
            renderedRegion = slug;
            var start = currentMapViewBox.slice();
            var target = mapTarget(slug);

            if (mapAnimationFrame) window.cancelAnimationFrame(mapAnimationFrame);
            if (reducedMotion) {
                setMapViewBox(target);
                return;
            }

            var startedAt = null;
            function animate(timestamp) {
                if (!startedAt) startedAt = timestamp;
                var progress = Math.min((timestamp - startedAt) / 500, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                setMapViewBox(start.map(function (value, index) {
                    return value + (target[index] - value) * eased;
                }));
                if (progress < 1) {
                    mapAnimationFrame = window.requestAnimationFrame(animate);
                } else {
                    mapAnimationFrame = null;
                }
            }
            mapAnimationFrame = window.requestAnimationFrame(animate);
        }

        function renderChips(list) {
            chips.innerHTML = "";
            list.forEach(function (chip) {
                var item = document.createElement("span");
                item.className = "workshop-explorer__chip";
                item.textContent = chip.label;
                chips.appendChild(item);
            });
        }

        function renderResultHeading() {
            var region = regionData(state.region);
            var audience = audienceData(state.audience);
            resultHeading.innerHTML = "";

            var locationLine = document.createElement("span");
            locationLine.className = "workshop-explorer__result-location";
            locationLine.textContent = region ? region.label : "Choose a Region";
            resultHeading.appendChild(locationLine);

            var audienceLine = document.createElement("span");
            audienceLine.className = "workshop-explorer__result-audience";
            audienceLine.textContent = audience ? audience.label : "All Audiences";
            resultHeading.appendChild(audienceLine);

            if (!resultParagraph) return;
            if (!region) {
                resultParagraph.textContent =
                    "Select a region on the map to begin exploring Stage One workshops.";
            } else if (region.kind === "international") {
                resultParagraph.textContent =
                    "Explore hands-on engineering experiences for groups visiting the USA, delivered directly to your hotel, school, campus, or group venue.";
            } else if (region.kind === "other") {
                resultParagraph.textContent =
                    "Tell us where your group will be, and Stage One can help coordinate workshop delivery for your destination and venue.";
            } else {
                resultParagraph.textContent =
                    "Explore hands-on engineering experiences delivered to hotels, schools, campuses, and group venues throughout " +
                    region.label + ".";
            }
        }

        function renderResult() {
            if (resultCopy) resultCopy.classList.add("is-updating");
            renderResultHeading();
            renderChips(window.StageOneCopy.selectionChips(state));

            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    if (resultCopy) resultCopy.classList.remove("is-updating");
                });
            });

            if (state.region) {
                resultCta.textContent = window.StageOneCopy.resultButtonLabel(state);
                resultCta.href = window.StageOneUrls.buildRegionUrl(state);
                resultCta.classList.remove("is-disabled");
                resultCta.removeAttribute("aria-disabled");
            } else {
                resultCta.textContent = (window.StageOneExplorerData.copy || {}).default_button || "Select a Region";
                resultCta.href = "#find-your-workshop";
                resultCta.classList.add("is-disabled");
                resultCta.setAttribute("aria-disabled", "true");
            }
        }

        function renderSummary(name, value, complete, active) {
            var row = explorer.querySelector('[data-explorer-summary-action="' + name + '"]');
            var summary = explorer.querySelector('[data-explorer-summary="' + name + '"]');
            if (!row || !summary) return;
            summary.textContent = value;
            row.classList.toggle("is-complete", complete);
            row.classList.toggle("is-active", active);
            var action = row.querySelector(".workshop-explorer__summary-action");
            if (action) action.textContent = complete || name === "workshop" ? "Change" : "Choose";
        }

        function renderSummaries() {
            var region = regionData(state.region);
            var audience = audienceData(state.audience);
            var workshop = state.workshop && state.workshop !== "all"
                ? workshopData(state.workshop)
                : null;
            var activeName = !region ? "region" : (!audience ? "audience" : "workshop");

            renderSummary("region", region ? region.label : "Choose on the map", !!region, activeName === "region");
            renderSummary("audience", audience ? audience.label : "Optional", !!audience, activeName === "audience");
            renderSummary(
                "workshop",
                workshop ? workshop.explorer_label : ((window.StageOneExplorerData.copy || {}).all_workshops_label || "All Workshops"),
                !!workshop,
                activeName === "workshop"
            );

            if (mapTitle) mapTitle.textContent = region ? region.label : "Choose a Region";
            if (mapInstruction) {
                mapInstruction.textContent = region
                    ? "Refine your audience and workshop below, or continue anytime."
                    : "Select a region on the map to begin.";
            }
        }

        function writeUrl() {
            var params = window.StageOneUrls.stateParams(state, { includeRegion: true });
            var nextUrl = window.location.pathname +
                (params.toString() ? "?" + params.toString() : "") +
                window.location.hash;
            if (window.history && window.history.replaceState) {
                window.history.replaceState({ stageOneExplorer: true }, "", nextUrl);
            }
        }

        function render(options) {
            setPressed("region", state.region);
            setPressed("audience", state.audience);
            setPressed("group", state.groupType);
            setPressed("workshop", state.workshop || "all");
            setMapSelected(state.region);
            if (mapRefiner) mapRefiner.hidden = !state.region;
            renderSummaries();
            renderResult();
            zoomMap(state.region);
            if (!options || options.writeUrl !== false) writeUrl();
        }

        function select(category, slug) {
            var patch = {};
            if (category === "region") {
                patch.region = slug;
            } else if (category === "audience") {
                patch.audience = state.audience === slug ? null : slug;
            } else if (category === "group") {
                patch.groupType = state.groupType === slug ? null : slug;
            } else if (category === "workshop") {
                patch.workshop = slug;
            }

            state = window.StageOneState.assign(state, patch);
            render();

            var events = {
                region: "workshop_explorer_region_selected",
                audience: "workshop_explorer_audience_selected",
                group: "workshop_explorer_group_type_selected",
                workshop: "workshop_explorer_workshop_selected"
            };
            if (events[category]) {
                window.StageOneState.track(
                    events[category],
                    window.StageOneState.eventParams(state, "homepage")
                );
            }
        }

        function focusChoice(category) {
            if (category !== "region" && !state.region) category = "region";
            var target;
            if (category === "region" && desktopQuery.matches) {
                if (state.region === "international" || state.region === "other") {
                    target = explorer.querySelector(
                        '.workshop-explorer__mobile-regions [data-slug="' + state.region + '"]'
                    );
                } else {
                    target = explorer.querySelector(
                        '.explorer-region-map__states [data-slug="' +
                        (state.region || "northeast-mid-atlantic") + '"]'
                    );
                }
            } else if (category === "region") {
                target = explorer.querySelector(
                    '.workshop-explorer__mobile-regions [data-slug="' + (state.region || "northeast-mid-atlantic") + '"]'
                );
            } else {
                var selected = category === "audience" ? state.audience : (state.workshop || "all");
                target = mapRefiner && mapRefiner.querySelector(
                    '[data-category="' + category + '"][data-slug="' + selected + '"]'
                );
                if (!target && mapRefiner) {
                    target = mapRefiner.querySelector('[data-category="' + category + '"]');
                }
            }
            if (target) {
                target.focus({ preventScroll: true });
                target.scrollIntoView({
                    behavior: reducedMotion ? "auto" : "smooth",
                    block: "nearest",
                    inline: "nearest"
                });
            }
        }

        function syncMapPanel() {
            if (!mapPanel) return;
            mapPanel.open = desktopQuery.matches;
        }

        explorer.addEventListener("click", function (event) {
            var clear = event.target.closest("[data-explorer-clear]");
            if (clear) {
                event.preventDefault();
                state = window.StageOneState.assign(state, window.StageOneState.defaults());
                renderedRegion = undefined;
                render();
                window.StageOneState.track(
                    "workshop_explorer_cleared",
                    window.StageOneState.eventParams(state, "homepage")
                );
                return;
            }

            var summaryAction = event.target.closest("[data-explorer-summary-action]");
            if (summaryAction) {
                event.preventDefault();
                focusChoice(summaryAction.getAttribute("data-explorer-summary-action"));
                return;
            }

            var option = event.target.closest("[data-explorer-option]");
            if (!option) return;
            event.preventDefault();
            select(option.getAttribute("data-category"), option.getAttribute("data-slug"));
        });

        explorer.addEventListener("click", function (event) {
            var cta = event.target.closest("[data-explorer-result-cta]");
            if (!cta || cta.classList.contains("is-disabled")) {
                if (cta && cta.classList.contains("is-disabled")) event.preventDefault();
                return;
            }
            window.StageOneState.track(
                "workshop_explorer_region_cta_clicked",
                window.StageOneState.eventParams(state, "homepage")
            );
        });

        Array.prototype.forEach.call(mapLinks(), function (link) {
            link.setAttribute("role", "button");
            link.setAttribute("tabindex", "0");
            link.addEventListener("pointerenter", function () {
                setMapPreview(link.getAttribute("data-slug"));
            });
            link.addEventListener("pointerleave", clearPreview);
            link.addEventListener("focus", function () {
                setMapPreview(link.getAttribute("data-slug"));
            });
            link.addEventListener("blur", clearPreview);
            link.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                select("region", link.getAttribute("data-slug"));
            });
        });

        Array.prototype.forEach.call(optionButtons("region"), function (button) {
            var slug = button.getAttribute("data-slug");
            if (slug === "international" || slug === "other") return;
            button.addEventListener("pointerenter", function () {
                setMapPreview(slug);
            });
            button.addEventListener("pointerleave", clearPreview);
            button.addEventListener("focus", function () {
                setMapPreview(slug);
            });
            button.addEventListener("blur", clearPreview);
        });

        if (desktopQuery.addEventListener) {
            desktopQuery.addEventListener("change", syncMapPanel);
        } else if (desktopQuery.addListener) {
            desktopQuery.addListener(syncMapPanel);
        }

        window.addEventListener("popstate", function () {
            state = window.StageOneState.normalize(window.StageOneState.fromUrl());
            window.StageOneState.writeStorage(state);
            renderedRegion = undefined;
            render({ writeUrl: false });
        });
        window.addEventListener("pageshow", syncMapPanel);

        syncMapPanel();
        window.setTimeout(syncMapPanel, 0);
        render();

        if (window.location.hash === "#find-your-workshop" ||
            window.location.hash === "#workshop-explorer") {
            explorer.scrollIntoView({
                behavior: reducedMotion ? "auto" : "smooth",
                block: "start"
            });
            window.setTimeout(function () {
                if (resultHeading) resultHeading.focus();
            }, 50);
        }
    });
})();
