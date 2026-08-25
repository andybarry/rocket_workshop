(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var openers = document.querySelectorAll("[data-plan-workshop-open]");
        var modal = document.querySelector("[data-plan-workshop-modal]");
        if (!openers.length || !modal) return;

        function trackCta(source) {
            if (!window.StageOneState) return;
            window.StageOneState.track("plan_workshop_cta_clicked",
                withSource(window.StageOneState.eventParams(window.StageOneState.load(), pageName()), source));
        }

        function withSource(params, source) {
            params.source = source || "unknown";
            return params;
        }

        function pageName() {
            return document.body.hasAttribute("data-discovery-page") ? "discovery" : "homepage";
        }

        var dialog = modal.querySelector(".plan-workshop-modal__dialog");
        var form = modal.querySelector("[data-plan-workshop-form]");
        var closers = modal.querySelectorAll("[data-plan-workshop-close]");
        var closeButton = modal.querySelector(".plan-workshop-modal__close");
        var lastFocused = null;
        var formApi = null;

        function focusables() {
            return dialog.querySelectorAll(
                'a[href], button:not([disabled]), select, textarea, ' +
                'input:not([type="hidden"]):not(.plan-workshop-honeypot)'
            );
        }

        function isOpen() {
            return !modal.hidden;
        }

        function open(source) {
            if (!formApi && window.StageOnePlanForm && form) {
                formApi = window.StageOnePlanForm.init(form, { source: "modal", container: modal });
            } else if (formApi) {
                formApi.refresh();
            }
            lastFocused = document.activeElement;
            modal.hidden = false;
            document.body.classList.add("has-plan-workshop-modal");
            if (window.StageOneState) {
                window.StageOneState.track("plan_workshop_modal_opened",
                    withSource(window.StageOneState.eventParams(window.StageOneState.load(), pageName()), source));
            }
            if (closeButton) closeButton.focus();
        }

        function close() {
            if (!isOpen()) return;
            modal.hidden = true;
            document.body.classList.remove("has-plan-workshop-modal");
            if (lastFocused && document.body.contains(lastFocused)) lastFocused.focus();
            lastFocused = null;
        }

        function trapFocus(event) {
            var stops = focusables();
            if (!stops.length) return;
            var first = stops[0];
            var last = stops[stops.length - 1];
            if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
                last.focus();
                event.preventDefault();
            } else if (!event.shiftKey && document.activeElement === last) {
                first.focus();
                event.preventDefault();
            }
        }

        Array.prototype.forEach.call(openers, function (opener) {
            opener.addEventListener("click", function (event) {
                event.preventDefault();
                var source = opener.getAttribute("data-plan-source");
                if (opener.hasAttribute("data-plan-clear-context") && window.StageOneState) {
                    window.StageOneState.writeStorage(window.StageOneState.defaults());
                }
                trackCta(source);
                open(source);
            });
        });

        Array.prototype.forEach.call(closers, function (closer) {
            closer.addEventListener("click", close);
        });

        document.addEventListener("keydown", function (event) {
            if (!isOpen()) return;
            if (event.key === "Escape" || event.key === "Esc") {
                close();
                event.preventDefault();
            } else if (event.key === "Tab") {
                trapFocus(event);
            }
        });

        var params = new URLSearchParams(window.location.search);
        var hash = window.location.hash;
        if (params.get("mode") === "plan" || hash === "#plan-workshop-form" || hash === "#workshop-finder") {
            open("deep_link");
        }
    });
})();
