(function () {
    "use strict";

    // Web3Forms delivers each submission to workshops@stageoneeducation.com.
    // The key is public by design (it only identifies the destination inbox).
    var WEB3FORMS_ACCESS_KEY = "7eb2fa50-b592-4119-803b-ad43462823ac";
    var WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

    // Shared sender, also used by the Contact Us modal form.
    function sendToWeb3Forms(fields) {
        if (!window.fetch) {
            return Promise.reject(new Error("fetch unavailable"));
        }
        var payload = { access_key: WEB3FORMS_ACCESS_KEY };
        for (var key in fields) {
            if (Object.prototype.hasOwnProperty.call(fields, key)) payload[key] = fields[key];
        }
        return window.fetch(WEB3FORMS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(payload)
        }).then(function (response) {
            return response.json()
                .catch(function () { return {}; })
                .then(function (data) {
                    if (!response.ok || !data.success) throw new Error("send failed");
                });
        });
    }

    // Shared Plan a Workshop form logic. The same form markup lives on the
    // /plan-a-workshop/ page and inside the Plan a Workshop modal; both call
    // StageOnePlanForm.init with their own container.
    function initPlanForm(form, options) {
        options = options || {};
        var source = options.source || "plan";
        var compact = form.hasAttribute("data-plan-workshop-compact");
        var state = window.StageOneState ? window.StageOneState.load() : {};
        var internationalFields = form.querySelector("[data-international-fields]");
        var submitButton = form.querySelector('button[type="submit"]');
        var statusEl = form.querySelector("[data-plan-workshop-status]");
        var trackedStart = false;
        var sending = false;

        function translate(key, fallback) {
            var value = window.SOI18n && window.SOI18n.t ? window.SOI18n.t(key) : null;
            return value || fallback;
        }

        function field(name) {
            return form.elements.namedItem(name);
        }

        function toggleInternational() {
            if (!internationalFields) return;
            var groupType = field("groupType") ? field("groupType").value : "";
            var audience = field("audience") ? field("audience").value : "";
            internationalFields.hidden = groupType !== "international-groups" &&
                audience !== "international-students";
        }

        function syncForm() {
            toggleInternational();
        }

        function markInvalid(name, invalid) {
            var el = field(name);
            if (!el) return;
            var wrap = el.closest(".plan-workshop-field");
            if (wrap) wrap.classList.toggle("is-invalid", invalid);
            el.setAttribute("aria-invalid", invalid ? "true" : "false");
        }

        function validate() {
            var nameOk = !!(field("contactName") && field("contactName").value.trim());
            var emailEl = field("email");
            var emailOk = !!(emailEl && emailEl.value.trim() && emailEl.checkValidity());
            markInvalid("contactName", !nameOk);
            markInvalid("email", !emailOk);
            if (!nameOk && field("contactName")) field("contactName").focus();
            else if (!emailOk && emailEl) emailEl.focus();
            return nameOk && emailOk;
        }

        function selectedWorkshops() {
            return Array.prototype.map.call(form.querySelectorAll('input[name="workshops"]:checked'), function (box) {
                return box.nextElementSibling ? box.nextElementSibling.textContent.trim() : box.value;
            });
        }

        function valueOf(name) {
            var el = field(name);
            return el && el.value ? el.value.trim() : "";
        }

        // Display label of a <select>'s chosen option (falls back to the value).
        function labelOf(name) {
            var el = field(name);
            if (!el || !el.value) return "";
            var option = el.options ? el.options[el.selectedIndex] : null;
            return option ? option.textContent.trim() : el.value.trim();
        }

        form.addEventListener("focusin", function () {
            if (trackedStart) return;
            trackedStart = true;
            if (window.StageOneState) {
                window.StageOneState.track("plan_workshop_form_started", window.StageOneState.eventParams(state, source));
            }
        });

        if (field("city")) {
            field("city").addEventListener("change", function () {
                state = window.StageOneState.assign(state, { city: field("city").value || null });
            });
        }
        if (field("audience")) {
            field("audience").addEventListener("change", function () {
                state = window.StageOneState.assign(state, { audience: field("audience").value || null });
                toggleInternational();
            });
        }
        if (field("groupType")) {
            field("groupType").addEventListener("change", function () {
                state = window.StageOneState.assign(state, { groupType: field("groupType").value || null });
                toggleInternational();
            });
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            if (sending) return;
            if (valueOf("website")) return;
            if (!validate()) return;

            var lines = compact ? [
                "New workshop planning request from the website:",
                "",
                "Name: " + valueOf("contactName"),
                "Email: " + valueOf("email"),
                "",
                "What we should know about the group:",
                valueOf("notes") || "None"
            ] : [
                "New workshop planning request from the website:",
                "",
                "Contact",
                "Name: " + valueOf("contactName"),
                "Email: " + valueOf("email"),
                "Phone: " + (valueOf("phone") || "Not provided"),
                "Organization: " + (valueOf("organization") || "Not provided"),
                "Role: " + (valueOf("role") || "Not provided"),
                "",
                "Group",
                "Planning for: " + (labelOf("groupType") || "Not provided"),
                "Audience: " + (labelOf("audience") || "Not provided"),
                "Estimated participants: " + (valueOf("participantCount") || "Not provided"),
                "Accompanying adults: " + (valueOf("accompanyingAdults") || "Not provided"),
                "Country of origin: " + (valueOf("countryOfOrigin") || "Not provided"),
                "Tour provider: " + (valueOf("tourProvider") || "Not provided"),
                "Primary language: " + (valueOf("primaryLanguage") || "Not provided"),
                "",
                "Destination and schedule",
                "Destination city: " + (labelOf("city") || "Not provided"),
                "Destination, if not listed: " + (valueOf("destinationCity") || "Not provided"),
                "U.S. destinations: " + (valueOf("usDestinations") || "Not provided"),
                "Anticipated date: " + (valueOf("preferredDate") || "Not provided"),
                "Date range: " + (valueOf("dateRange") || "Not provided"),
                "Preferred time: " + (valueOf("preferredTime") || "Not provided"),
                "Venue type: " + (valueOf("venueType") || "Not provided"),
                "",
                "Workshop interests: " + (selectedWorkshops().join(", ") || "Not provided"),
                "",
                "Additional information: " + (valueOf("notes") || "None")
            ];

            // Post to Web3Forms so the request reaches the Stage One inbox
            // without relying on the visitor having an email application.
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

            sendToWeb3Forms({
                subject: "Workshop planning request",
                from_name: valueOf("contactName"),
                name: valueOf("contactName"),
                email: valueOf("email"),
                message: lines.join("\n"),
                botcheck: valueOf("website")
            }).then(function () {
                if (window.StageOneState) {
                    window.StageOneState.track("plan_workshop_form_submitted", window.StageOneState.eventParams(state, source));
                }
                window.location.assign("/plan-a-workshop/thank-you/");
            }).catch(showFailure);
        });

        syncForm();

        return {
            refresh: function () {
                if (window.StageOneState) state = window.StageOneState.load();
                syncForm();
            }
        };
    }

    window.StageOnePlanForm = { init: initPlanForm, send: sendToWeb3Forms };

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.StageOneState || !document.body.classList.contains("plan-workshop-page")) return;
        var form = document.getElementById("plan-workshop-form");
        if (form) initPlanForm(form, { source: "plan", container: document });
    });
})();
