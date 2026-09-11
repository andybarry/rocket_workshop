(function () {
    "use strict";

    function bindEmailCopy(copyButton) {
        if (!copyButton || copyButton.getAttribute("data-email-copy-bound")) return;
        copyButton.setAttribute("data-email-copy-bound", "true");

        var container = copyButton.closest("[data-contact-email-modal], [data-plan-workshop-modal], .plan-workshop-modal__email, .contact-email-modal__row");
        var addressEl = container ? container.querySelector("[data-contact-email]") : null;
        var copiedTimer = null;

        function emailAddress() {
            return addressEl ? addressEl.textContent.replace(/\s+/g, "") : "workshops@stageoneeducation.com";
        }

        function copyLabel() {
            return copyButton.getAttribute("data-copy-label") || "Copy";
        }

        function copiedLabel() {
            return copyButton.getAttribute("data-copied-label") || "Copied";
        }

        function resetCopyLabel() {
            if (copiedTimer) {
                window.clearTimeout(copiedTimer);
                copiedTimer = null;
            }
            copyButton.textContent = copyLabel();
            copyButton.classList.remove("is-copied");
        }

        function markCopied() {
            if (!copyButton.getAttribute("data-copy-label")) {
                copyButton.setAttribute("data-copy-label", copyButton.textContent.trim());
            }
            copyButton.textContent = copiedLabel();
            copyButton.classList.add("is-copied");
            if (copiedTimer) window.clearTimeout(copiedTimer);
            copiedTimer = window.setTimeout(resetCopyLabel, 2000);
        }

        function fallbackCopy(email) {
            var field = document.createElement("textarea");
            field.value = email;
            field.setAttribute("readonly", "");
            field.style.position = "fixed";
            field.style.top = "0";
            field.style.left = "0";
            field.style.opacity = "0";
            document.body.appendChild(field);
            field.select();
            try {
                document.execCommand("copy");
                markCopied();
            } catch (err) {
                /* ignore */
            }
            document.body.removeChild(field);
        }

        copyButton.addEventListener("click", function () {
            var email = emailAddress();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(email).then(markCopied).catch(function () {
                    fallbackCopy(email);
                });
                return;
            }
            fallbackCopy(email);
        });

        copyButton.resetEmailCopyLabel = resetCopyLabel;
    }

    document.addEventListener("DOMContentLoaded", function () {
        Array.prototype.forEach.call(document.querySelectorAll("[data-contact-email-copy]"), bindEmailCopy);

        var openers = document.querySelectorAll("[data-contact-email-open]");
        var modal = document.querySelector("[data-contact-email-modal]");
        if (!openers.length || !modal) return;

        var dialog = modal.querySelector(".contact-email-modal__dialog");
        var closers = modal.querySelectorAll("[data-contact-email-close]");
        var closeButton = modal.querySelector(".contact-email-modal__close");
        var copyButton = modal.querySelector("[data-contact-email-copy]");
        var lastFocused = null;

        function focusables() {
            return dialog.querySelectorAll(
                'a[href], button:not([disabled]), select, textarea, input:not([type="hidden"])'
            );
        }

        function isOpen() {
            return !modal.hidden;
        }

        function open() {
            lastFocused = document.activeElement;
            modal.hidden = false;
            document.body.classList.add("has-contact-email-modal");
            if (closeButton) closeButton.focus();
        }

        function close() {
            if (!isOpen()) return;
            modal.hidden = true;
            document.body.classList.remove("has-contact-email-modal");
            if (copyButton && copyButton.resetEmailCopyLabel) copyButton.resetEmailCopyLabel();
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
                open();
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
    });
})();
