(function () {
    "use strict";

    // Shared Plan a Workshop form logic. The same form markup lives on the
    // /plan-a-workshop/ page and inside the Plan a Workshop modal; both call
    // StageOnePlanForm.init with their own container.
    function initPlanForm(form, options) {
        options = options || {};
        var source = options.source || "plan";
        var state = window.StageOneState.load();
        var internationalFields = form.querySelector("[data-international-fields]");
        var trackedStart = false;

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
            window.StageOneState.track("plan_workshop_form_started", window.StageOneState.eventParams(state, source));
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
            if (valueOf("website")) return;
            if (!validate()) return;

            var lines = [
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

            window.StageOneState.track("plan_workshop_form_submitted", window.StageOneState.eventParams(state, source));
            window.location.href = "mailto:workshops@stageoneeducation.com"
                + "?subject=" + encodeURIComponent("Workshop planning request")
                + "&body=" + encodeURIComponent(lines.join("\n"));
            window.setTimeout(function () {
                window.location.assign("/plan-a-workshop/thank-you/");
            }, 400);
        });

        syncForm();

        return {
            refresh: function () {
                state = window.StageOneState.load();
                syncForm();
            }
        };
    }

    window.StageOnePlanForm = { init: initPlanForm };

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.StageOneState || !document.body.classList.contains("plan-workshop-page")) return;
        var form = document.getElementById("plan-workshop-form");
        if (form) initPlanForm(form, { source: "plan", container: document });
    });
})();
