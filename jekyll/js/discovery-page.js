(function () {
    "use strict";

    var CATEGORY_STATE_KEYS = {
        city: "city",
        audience: "audience",
        group_type: "groupType",
        workshop: "workshop"
    };

    function initDiscoveryQuoteRotation() {
        var layer = document.querySelector("[data-discovery-quotes]");
        if (!layer) return;

        var dataEl = layer.querySelector("[data-discovery-quote-data]");
        var slots = layer.querySelectorAll("[data-discovery-quote-slot]");
        if (!dataEl || !slots.length) return;

        var quotes;
        try {
            quotes = JSON.parse(dataEl.textContent);
        } catch (err) {
            return;
        }
        if (!quotes || quotes.length < 2) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        var fadeMs = 1200;
        var gapMs = 500;
        var displayMs = 10000;
        var quoteIndex = Math.min(slots.length, quotes.length);
        var slotTimers = [];

        function nextQuote() {
            var quote = quotes[quoteIndex % quotes.length];
            quoteIndex += 1;
            return quote;
        }

        function ensureLink(slot) {
            if (slot.querySelector(".discovery-header__quote-link")) return;
            var link = document.createElement("a");
            link.className = "discovery-header__quote-link";
            link.href = "/feedback.html";
            link.setAttribute("aria-label", "View more participant feedback");
            slot.appendChild(link);
        }

        function sizeClassForQuote(quote) {
            var len = ((quote && quote.quote) || "").length;
            if (len <= 40) return "oneline";
            if (len < 90) return "narrow";
            if (len < 160) return "medium";
            if (len < 280) return "wide";
            return "long";
        }

        function applyQuoteSize(slot, quote) {
            slot.classList.remove(
                "discovery-header__quote--oneline",
                "discovery-header__quote--narrow",
                "discovery-header__quote--medium",
                "discovery-header__quote--wide",
                "discovery-header__quote--long"
            );
            slot.classList.add("discovery-header__quote--" + sizeClassForQuote(quote));
        }

        function fillSlot(slot, quote) {
            var text = slot.querySelector("blockquote p");
            var cap = slot.querySelector("figcaption");
            if (text) text.textContent = quote.quote || "";
            if (cap) cap.textContent = quote.meta || "";
            slot.setAttribute("data-testimonial", "");
            slot.setAttribute("data-testimonial-id", quote.id || "");
            slot.classList.remove("discovery-header__quote--placeholder");
            applyQuoteSize(slot, quote);
            ensureLink(slot);
        }

        function showQuote(slot, quote) {
            fillSlot(slot, quote);
            slot.classList.remove("is-leaving");
            void slot.offsetWidth;
            slot.classList.add("is-visible");
        }

        function clearSlotTimer(slotIndex) {
            if (slotTimers[slotIndex]) {
                clearTimeout(slotTimers[slotIndex]);
                slotTimers[slotIndex] = null;
            }
        }

        function holdSlot(slotIndex, holdMs) {
            clearSlotTimer(slotIndex);
            slotTimers[slotIndex] = setTimeout(function () {
                retireSlot(slotIndex);
            }, holdMs);
        }

        function retireSlot(slotIndex) {
            var slot = slots[slotIndex];
            slot.classList.remove("is-visible");
            slot.classList.add("is-leaving");
            slotTimers[slotIndex] = setTimeout(function () {
                slot.classList.remove("is-leaving");
                slotTimers[slotIndex] = setTimeout(function () {
                    showQuote(slot, nextQuote());
                    holdSlot(slotIndex, displayMs);
                }, gapMs);
            }, fadeMs);
        }

        function resumeSlot(slotIndex, holdMs) {
            var slot = slots[slotIndex];
            slot.classList.remove("is-leaving");
            if (slot.classList.contains("is-visible")) {
                holdSlot(slotIndex, holdMs);
            } else {
                showQuote(slot, nextQuote());
                holdSlot(slotIndex, holdMs);
            }
        }

        function handleVisibilityChange() {
            if (document.hidden) {
                clearSlotTimer(0);
                if (slots.length > 1) clearSlotTimer(1);
            } else {
                resumeSlot(0, displayMs);
                if (slots.length > 1) resumeSlot(1, displayMs + displayMs / 2);
            }
        }

        holdSlot(0, displayMs);
        if (slots.length > 1) holdSlot(1, displayMs + displayMs / 2);
        document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    document.addEventListener("DOMContentLoaded", function () {
        initDiscoveryQuoteRotation();

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
