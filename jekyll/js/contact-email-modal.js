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

    // Name/email/message form inside the Contact Us modal. Delivery goes
    // through the same Web3Forms inbox as the Plan a Workshop form.
    function bindContactForm(modal) {
        var form = modal.querySelector("[data-contact-email-form]");
        if (!form) return;
        var submitButton = form.querySelector('button[type="submit"]');
        var statusEl = modal.querySelector("[data-contact-email-status]");
        var successEl = modal.querySelector("[data-contact-email-success]");
        var sending = false;

        function translate(key, fallback) {
            var value = window.SOI18n && window.SOI18n.t ? window.SOI18n.t(key) : null;
            return value || fallback;
        }

        function valueOf(name) {
            var el = form.elements.namedItem(name);
            return el && el.value ? el.value.trim() : "";
        }

        function markInvalid(name, invalid) {
            var el = form.elements.namedItem(name);
            if (!el) return;
            var wrap = el.closest(".plan-workshop-field");
            if (wrap) wrap.classList.toggle("is-invalid", invalid);
            el.setAttribute("aria-invalid", invalid ? "true" : "false");
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            if (sending) return;
            if (valueOf("website")) return;

            var nameOk = !!valueOf("contactName");
            var emailEl = form.elements.namedItem("email");
            var emailOk = !!(emailEl && emailEl.value.trim() && emailEl.checkValidity());
            markInvalid("contactName", !nameOk);
            markInvalid("email", !emailOk);
            if (!nameOk) { form.elements.namedItem("contactName").focus(); return; }
            if (!emailOk) { emailEl.focus(); return; }

            var sender = window.StageOnePlanForm && window.StageOnePlanForm.send;
            sending = true;
            if (statusEl) statusEl.hidden = true;
            var restingLabel = submitButton ? submitButton.textContent : "";
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = translate("discovery.ui.formSending", "Sending\u2026");
            }

            function showFailure() {
                sending = false;
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = restingLabel;
                }
                if (statusEl) statusEl.hidden = false;
            }

            if (!sender) { showFailure(); return; }

            sender({
                subject: "Contact Us message",
                from_name: valueOf("contactName"),
                name: valueOf("contactName"),
                email: valueOf("email"),
                message: [
                    "New Contact Us message from the website:",
                    "",
                    "Name: " + valueOf("contactName"),
                    "Email: " + valueOf("email"),
                    "",
                    "Message:",
                    valueOf("message") || "None"
                ].join("\n"),
                botcheck: valueOf("website")
            }).then(function () {
                sending = false;
                form.hidden = true;
                if (successEl) successEl.hidden = false;
            }).catch(showFailure);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        Array.prototype.forEach.call(document.querySelectorAll("[data-contact-email-copy]"), bindEmailCopy);

        var openers = document.querySelectorAll("[data-contact-email-open]");
        var modal = document.querySelector("[data-contact-email-modal]");
        if (!openers.length || !modal) return;

        bindContactForm(modal);

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
