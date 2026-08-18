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

        var mapCanvas = explorer.querySelector(".explorer-region-map__canvas");
        var mapFigure = explorer.querySelector(".explorer-region-map");
        var groupChooser = explorer.querySelector(".homepage-workshop-explorer__group-chooser");
        var regionChooser = explorer.querySelector(".homepage-workshop-explorer__region-chooser");
        var workshopChooser = explorer.querySelector(".homepage-workshop-explorer__workshop-chooser");
        var callout = explorer.querySelector("[data-region-map-callout]");
        var sources = {};
        var groupSources = {};
        var workshopSources = {};
        var locationSources = {};
        var regionLinks = [];
        var regionButtons = [];
        var regionSlugs = [];
        var activeSlug = "west-coast";
        var calloutContext = "region";
        var cycleTimer = null;
        var mapIsVisible = true;
        var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function setupRegionMap() {
            if (!mapCanvas || !mapFigure || !callout) return;

            Array.prototype.forEach.call(explorer.querySelectorAll("[data-region-story]"), function (source) {
                sources[source.getAttribute("data-region-slug")] = source;
            });
            Array.prototype.forEach.call(explorer.querySelectorAll("[data-group-story]"), function (source) {
                groupSources[source.getAttribute("data-group-slug")] = source;
            });
            Array.prototype.forEach.call(explorer.querySelectorAll("[data-workshop-story]"), function (source) {
                workshopSources[source.getAttribute("data-workshop-slug")] = source;
            });
            Array.prototype.forEach.call(explorer.querySelectorAll("[data-location-story]"), function (source) {
                locationSources[source.getAttribute("data-location-slug")] = source;
            });

            regionLinks = Array.prototype.slice.call(mapCanvas.querySelectorAll('[data-category="region"][data-slug]'));
            regionLinks.forEach(function (link) {
                var slug = link.getAttribute("data-slug");
                if (regionSlugs.indexOf(slug) === -1) regionSlugs.push(slug);

                link.addEventListener("pointerenter", function () {
                    pauseCycle();
                    showRegion(slug);
                });
            });
            if (regionChooser) {
                regionButtons = Array.prototype.slice.call(regionChooser.querySelectorAll('[data-category="region"][data-slug]'));
                regionButtons.forEach(function (link) {
                    var slug = link.getAttribute("data-slug");
                    link.addEventListener("pointerenter", function () {
                        pauseCycle();
                        showRegion(slug);
                    });
                    link.addEventListener("focus", function () {
                        pauseCycle();
                        showRegion(slug);
                    });
                });
                Array.prototype.forEach.call(regionChooser.querySelectorAll('[data-category="location"][data-slug]'), function (link) {
                    var slug = link.getAttribute("data-slug");
                    link.addEventListener("pointerenter", function () {
                        pauseCycle();
                        showLocation(slug);
                    });
                    link.addEventListener("focus", function () {
                        pauseCycle();
                        showLocation(slug);
                    });
                });
                regionChooser.addEventListener("pointerenter", pauseCycle);
                regionChooser.addEventListener("pointerleave", function () {
                    scheduleCycle(2200);
                });
                regionChooser.addEventListener("focusout", function () {
                    window.setTimeout(function () {
                        if (!regionChooser.contains(document.activeElement)) scheduleCycle(2200);
                    }, 0);
                });
            }

            mapFigure.addEventListener("pointerenter", pauseCycle);
            mapFigure.addEventListener("pointerleave", function () {
                scheduleCycle(2200);
            });
            mapFigure.addEventListener("touchstart", pauseCycle, { passive: true });
            mapFigure.addEventListener("keydown", pauseCycle);
            mapFigure.addEventListener("focus", function (event) {
                var link = event.target.closest('[data-category="region"][data-slug]');
                if (!link) return;
                pauseCycle();
                showRegion(link.getAttribute("data-slug"));
            }, true);
            mapFigure.addEventListener("focusout", function () {
                window.setTimeout(function () {
                    if (!mapFigure.contains(document.activeElement)) scheduleCycle(2200);
                }, 0);
            });

            if (groupChooser) {
                Array.prototype.forEach.call(groupChooser.querySelectorAll('[data-category="group"][data-slug]'), function (link) {
                    var slug = link.getAttribute("data-slug");
                    link.addEventListener("pointerenter", function () {
                        pauseCycle();
                        showGroup(slug);
                    });
                    link.addEventListener("focus", function () {
                        pauseCycle();
                        showGroup(slug);
                    });
                });
                groupChooser.addEventListener("pointerenter", pauseCycle);
                groupChooser.addEventListener("focusin", pauseCycle);
                groupChooser.addEventListener("pointerleave", function (event) {
                    if (!callout.contains(event.relatedTarget)) restoreRegionCallout();
                    scheduleCycle(2200);
                });
                groupChooser.addEventListener("focusout", function (event) {
                    window.setTimeout(function () {
                        if (!groupChooser.contains(document.activeElement) && !callout.contains(event.relatedTarget)) {
                            restoreRegionCallout();
                            scheduleCycle(2200);
                        }
                    }, 0);
                });
            }
            if (workshopChooser) {
                Array.prototype.forEach.call(workshopChooser.querySelectorAll('[data-category="workshop"][data-slug]'), function (link) {
                    var slug = link.getAttribute("data-slug");
                    link.addEventListener("pointerenter", function () {
                        pauseCycle();
                        showWorkshop(slug);
                    });
                    link.addEventListener("focus", function () {
                        pauseCycle();
                        showWorkshop(slug);
                    });
                });
            }

            callout.addEventListener("pointerenter", pauseCycle);
            callout.addEventListener("pointerleave", function () {
                scheduleCycle(2200);
            });
            callout.addEventListener("focusin", pauseCycle);
            callout.addEventListener("focusout", function () {
                scheduleCycle(2200);
            });

            if ("IntersectionObserver" in window) {
                mapIsVisible = false;
                new IntersectionObserver(function (entries) {
                    mapIsVisible = entries[0].isIntersecting;
                    if (mapIsVisible) {
                        scheduleCycle(1800);
                    } else {
                        pauseCycle();
                    }
                }, { threshold: 0.25 }).observe(mapFigure);
            }

            document.addEventListener("visibilitychange", function () {
                if (document.hidden) {
                    pauseCycle();
                } else {
                    scheduleCycle(1800);
                }
            });

            finishRegionChange(activeSlug, true);
            scheduleCycle(5500);
        }

        function transitionCallout(update, immediate) {
            if (reducedMotion || immediate) {
                callout.classList.remove("is-changing");
                update();
                return;
            }

            callout.classList.remove("is-changing");
            void callout.offsetWidth;
            callout.classList.add("is-changing");
            void callout.offsetWidth;
            update();
            window.requestAnimationFrame(function () {
                callout.classList.remove("is-changing");
            });
        }

        function showRegion(slug) {
            var source = sources[slug];
            if (!source) return;
            calloutContext = "region";
            finishRegionChange(slug);
        }

        function finishRegionChange(slug, immediate) {
            if (!slug || !sources[slug]) return;
            var source = sources[slug];

            activeSlug = slug;
            mapCanvas.classList.add("is-spotlighting");
            regionLinks.forEach(function (link) {
                link.classList.remove("is-leaving");
                link.classList.toggle("is-active", link.getAttribute("data-slug") === slug);
            });
            regionButtons.forEach(function (link) {
                link.classList.toggle("is-active", link.getAttribute("data-slug") === slug);
            });

            if (calloutContext !== "region") return;

            transitionCallout(function () {
                callout.querySelector("[data-region-callout-category]").textContent = "Region";
                callout.querySelector("[data-region-callout-name]").textContent = source.getAttribute("data-region-name");
                callout.querySelector("[data-region-callout-story]").textContent =
                    source.querySelector("[data-region-story-text]").textContent;

                var calloutLink = callout.querySelector("[data-region-callout-link]");
                calloutLink.href = "#workshop-explorer";
                calloutLink.setAttribute("data-category", "region");
                calloutLink.setAttribute("data-slug", slug);
                calloutLink.setAttribute("data-label", source.getAttribute("data-region-name"));
                calloutLink.querySelector("[data-region-callout-action]").textContent = "Select this region";
            }, immediate);
        }

        function clearRegionSpotlight() {
            mapCanvas.classList.remove("is-spotlighting");
            regionLinks.forEach(function (link) {
                link.classList.remove("is-active", "is-leaving");
            });
            regionButtons.forEach(function (link) {
                link.classList.remove("is-active");
            });
        }

        function showGroup(slug) {
            var source = groupSources[slug];
            if (!source) return;
            calloutContext = "group";
            clearRegionSpotlight();

            var name = source.getAttribute("data-group-name");
            transitionCallout(function () {
                callout.querySelector("[data-region-callout-category]").textContent = "Age or Group";
                callout.querySelector("[data-region-callout-name]").textContent = name;
                callout.querySelector("[data-region-callout-story]").textContent =
                    source.querySelector("[data-group-story-text]").textContent;

                var calloutLink = callout.querySelector("[data-region-callout-link]");
                calloutLink.href = "#workshop-explorer";
                calloutLink.setAttribute("data-category", "group");
                calloutLink.setAttribute("data-slug", slug);
                calloutLink.setAttribute("data-label", name);
                calloutLink.querySelector("[data-region-callout-action]").textContent = "Select this group";
            });
        }

        function showWorkshop(slug) {
            var source = workshopSources[slug];
            if (!source) return;
            calloutContext = "workshop";
            clearRegionSpotlight();

            var name = source.getAttribute("data-workshop-name");
            transitionCallout(function () {
                callout.querySelector("[data-region-callout-category]").textContent = "Workshop";
                callout.querySelector("[data-region-callout-name]").textContent = name;
                callout.querySelector("[data-region-callout-story]").textContent =
                    source.querySelector("[data-workshop-story-text]").textContent;

                var calloutLink = callout.querySelector("[data-region-callout-link]");
                calloutLink.href = "#workshop-explorer";
                calloutLink.setAttribute("data-category", "workshop");
                calloutLink.setAttribute("data-slug", slug);
                calloutLink.setAttribute("data-label", name);
                calloutLink.querySelector("[data-region-callout-action]").textContent = "Select this workshop";
            });
        }

        function showLocation(slug) {
            var source = locationSources[slug];
            if (!source) return;
            calloutContext = "location";
            clearRegionSpotlight();

            var name = source.getAttribute("data-location-name");
            transitionCallout(function () {
                callout.querySelector("[data-region-callout-category]").textContent = "Region";
                callout.querySelector("[data-region-callout-name]").textContent = name;
                callout.querySelector("[data-region-callout-story]").textContent =
                    source.querySelector("[data-location-story-text]").textContent;

                var calloutLink = callout.querySelector("[data-region-callout-link]");
                calloutLink.href = "#workshop-explorer";
                calloutLink.setAttribute("data-category", "location");
                calloutLink.setAttribute("data-slug", slug);
                calloutLink.setAttribute("data-label", name);
                calloutLink.querySelector("[data-region-callout-action]").textContent = "Select international";
            });
        }

        function restoreRegionCallout() {
            calloutContext = "region";
            finishRegionChange(activeSlug);
        }

        function cycleRegion() {
            if (!regionSlugs.length) return;
            var currentIndex = regionSlugs.indexOf(activeSlug);
            var nextSlug = regionSlugs[(currentIndex + 1) % regionSlugs.length];
            finishRegionChange(nextSlug);
            scheduleCycle(6500);
        }

        function pauseCycle() {
            if (cycleTimer) {
                window.clearTimeout(cycleTimer);
                cycleTimer = null;
            }
        }

        function scheduleCycle(delay) {
            pauseCycle();
            if (reducedMotion || !mapIsVisible || !regionSlugs.length) return;
            cycleTimer = window.setTimeout(cycleRegion, delay);
        }

        setupRegionMap();

        explorer.addEventListener("click", function (event) {
            var option = event.target.closest("[data-explorer-option]");
            if (option) {
                event.preventDefault();
                var category = option.getAttribute("data-category");
                var slug = option.getAttribute("data-slug");
                var label = option.getAttribute("data-label");

                if (category === "region") showRegion(slug);
                else if (category === "group") showGroup(slug);
                else if (category === "workshop") showWorkshop(slug);
                else if (category === "location") showLocation(slug);

                var planForm = document.getElementById("plan-workshop-form");
                if (planForm) {
                    if (category === "region" && planForm.elements.namedItem("explorerRegion")) {
                        planForm.elements.namedItem("explorerRegion").value = label;
                    } else if (category === "group" && planForm.elements.namedItem("explorerParticipants")) {
                        planForm.elements.namedItem("explorerParticipants").value = label;
                    } else if (category === "workshop" && planForm.elements.namedItem("explorerWorkshop")) {
                        planForm.elements.namedItem("explorerWorkshop").value = label;
                    } else if (category === "location" && planForm.elements.namedItem("explorerInternational")) {
                        planForm.elements.namedItem("explorerInternational").value = "Yes";
                    }
                }

                track("workshop_explorer_option_selected", {
                    category: category,
                    slug: slug,
                    label: label,
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
