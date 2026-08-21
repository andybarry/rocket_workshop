(function () {
    "use strict";

    var CATEGORY_STATE_KEYS = {
        city: "city",
        audience: "audience",
        group_type: "groupType",
        workshop: "workshop"
    };

    function shuffleQuotes(list) {
        var copy = list.slice();
        var i;
        var j;
        var swap;
        for (i = copy.length - 1; i > 0; i -= 1) {
            j = Math.floor(Math.random() * (i + 1));
            swap = copy[i];
            copy[i] = copy[j];
            copy[j] = swap;
        }
        return copy;
    }

    function initQuoteScroller() {
        var root = document.querySelector("[data-discovery-quote-scroller]");
        if (!root) return;

        var viewport = root.querySelector("[data-discovery-quote-scroller-viewport]");
        var prev = root.querySelector(".discovery-header__quote-scroller-nav--prev");
        var next = root.querySelector(".discovery-header__quote-scroller-nav--next");
        if (!viewport) return;

        Array.prototype.forEach.call(viewport.querySelectorAll("a"), function (link) {
            link.setAttribute("draggable", "false");
        });

        function scrollByCard(direction) {
            var amount = Math.max(220, Math.round(viewport.clientWidth * 0.72));
            viewport.scrollBy({ left: amount * direction, behavior: "smooth" });
        }

        if (prev) {
            prev.addEventListener("click", function () {
                scrollByCard(-1);
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                scrollByCard(1);
            });
        }

        var drag = {
            active: false,
            pointerId: null,
            startX: 0,
            startScroll: 0,
            moved: false
        };

        function stopDrag() {
            if (!drag.active) return;
            drag.active = false;
            drag.pointerId = null;
            viewport.classList.remove("is-dragging");
        }

        viewport.addEventListener("pointerdown", function (event) {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            if (event.target.closest(".discovery-header__quote-scroller-nav")) return;
            drag.active = true;
            drag.pointerId = event.pointerId;
            drag.moved = false;
            drag.startX = event.clientX;
            drag.startScroll = viewport.scrollLeft;
        });

        viewport.addEventListener("pointermove", function (event) {
            if (!drag.active || event.pointerId !== drag.pointerId) return;
            var delta = event.clientX - drag.startX;
            if (Math.abs(delta) <= 6) return;
            if (!drag.moved) {
                drag.moved = true;
                viewport.classList.add("is-dragging");
                try {
                    viewport.setPointerCapture(event.pointerId);
                } catch (err) {
                    /* ignore */
                }
            }
            viewport.scrollLeft = drag.startScroll - delta;
            event.preventDefault();
        });

        viewport.addEventListener("pointerup", stopDrag);
        viewport.addEventListener("pointercancel", stopDrag);
        viewport.addEventListener("lostpointercapture", stopDrag);

        viewport.addEventListener("click", function (event) {
            if (!drag.moved) return;
            event.preventDefault();
            event.stopPropagation();
        }, true);

        viewport.addEventListener("dragstart", function (event) {
            event.preventDefault();
        });

        viewport.addEventListener("wheel", function (event) {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            if (event.shiftKey) return;
            viewport.scrollLeft += event.deltaY;
            event.preventDefault();
        }, { passive: false });

        initQuoteReadMore(root);
    }

    function initQuoteReadMore(root) {
        var cards = root.querySelectorAll(".discovery-header__quote--scroller");
        var modal = document.querySelector("[data-discovery-quote-modal]");
        if (!cards.length || !modal) return;

        if (modal.parentNode !== document.body) {
            document.body.appendChild(modal);
        }

        var textEl = modal.querySelector("[data-discovery-quote-modal-text]");
        var metaEl = modal.querySelector("[data-discovery-quote-modal-meta]");
        var dialog = modal.querySelector(".discovery-quote-modal__dialog");
        var closeButton = modal.querySelector(".discovery-quote-modal__close");
        var lastFocus = null;

        function closeModal() {
            if (modal.hidden) return;
            modal.hidden = true;
            document.body.classList.remove("has-discovery-quote-modal");
            document.removeEventListener("keydown", onKey);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        function onKey(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                closeModal();
            }
        }

        function openModal(card) {
            var paragraph = card.querySelector("blockquote p");
            var caption = card.querySelector("figcaption");
            if (!paragraph || !textEl) return;
            lastFocus = document.activeElement;
            textEl.textContent = paragraph.textContent || "";
            if (metaEl) metaEl.textContent = caption ? caption.textContent : "";
            modal.hidden = false;
            document.body.classList.add("has-discovery-quote-modal");
            document.addEventListener("keydown", onKey);
            if (closeButton) closeButton.focus();
        }

        Array.prototype.forEach.call(cards, function (card) {
            card.setAttribute("tabindex", "0");
            card.setAttribute("role", "button");
            card.setAttribute("aria-label", "Read full quote");
            card.addEventListener("click", function () {
                openModal(card);
            });
            card.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                openModal(card);
            });
        });

        Array.prototype.forEach.call(modal.querySelectorAll("[data-discovery-quote-modal-close]"), function (el) {
            el.addEventListener("click", closeModal);
        });

        if (dialog) {
            dialog.addEventListener("click", function (event) {
                event.stopPropagation();
            });
        }
    }

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
        if (!quotes || !quotes.length) return;

        var fadeMs = 1200;
        var gapMs = 500;
        var displayMs = 10000;
        var quoteIndex = Math.min(slots.length, quotes.length);
        var slotTimers = [];
        var staticQuotes = layer.hasAttribute("data-discovery-quotes-static");

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
            if (!staticQuotes) {
                void slot.offsetWidth;
            }
            slot.classList.add("is-visible");
        }

        function hideSlot(slot) {
            slot.classList.add("discovery-header__quote--placeholder");
            slot.classList.remove("is-visible");
            slot.removeAttribute("data-testimonial");
            slot.removeAttribute("data-testimonial-id");
        }

        if (staticQuotes) {
            quotes = shuffleQuotes(quotes);
            var staticIndex;
            for (staticIndex = 0; staticIndex < slots.length; staticIndex += 1) {
                if (quotes[staticIndex]) {
                    showQuote(slots[staticIndex], quotes[staticIndex]);
                } else {
                    hideSlot(slots[staticIndex]);
                }
            }
            return;
        }

        if (quotes.length < 2) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

        function staggerMs(slotIndex) {
            return displayMs + slotIndex * (displayMs / Math.max(slots.length, 1));
        }

        function handleVisibilityChange() {
            var i;
            for (i = 0; i < slots.length; i += 1) {
                if (document.hidden) {
                    clearSlotTimer(i);
                } else {
                    resumeSlot(i, staggerMs(i));
                }
            }
        }

        var slotIndex;
        for (slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
            holdSlot(slotIndex, staggerMs(slotIndex));
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    document.addEventListener("DOMContentLoaded", function () {
        initDiscoveryQuoteRotation();
        initQuoteScroller();

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
