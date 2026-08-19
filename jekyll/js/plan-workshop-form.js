(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var form = document.getElementById("plan-workshop-form");
        if (!form || !window.StageOneState || !document.body.classList.contains("plan-workshop-page")) return;

        var state = window.StageOneState.load();
        var internationalFields = form.querySelector("[data-international-fields]");
        var summaryChips = document.querySelector("[data-plan-summary-chips]");
        var editLink = document.querySelector("[data-plan-edit-selections]");
        var trackedStart = false;

        function field(name) {
            return form.elements.namedItem(name);
        }

        function setValue(name, value) {
            var el = field(name);
            if (!el || value == null || value === "") return;
            el.value = value;
        }

        function renderSummary() {
            if (!summaryChips) return;
            summaryChips.innerHTML = "";
            window.StageOneCopy.selectionChips(state).forEach(function (chip) {
                var item = document.createElement("span");
                item.className = "selection-chip";
                item.textContent = chip.label;
                summaryChips.appendChild(item);
            });
            if (editLink) editLink.href = window.StageOneUrls.buildExplorerReturnUrl(state);
        }

        function toggleInternational() {
            var region = field("region") ? field("region").value : "";
            if (internationalFields) {
                internationalFields.hidden = region !== "international";
            }
        }

        function prefill() {
            setValue("region", state.region);
            setValue("audience", state.audience);
            setValue("groupType", state.groupType);
            if (state.workshop && state.workshop !== "all") {
                var box = form.querySelector('input[name="workshops"][value="' + state.workshop + '"]');
                if (box) box.checked = true;
            }
            toggleInternational();
            renderSummary();
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

        form.addEventListener("focusin", function () {
            if (trackedStart) return;
            trackedStart = true;
            window.StageOneState.track("plan_workshop_form_started", window.StageOneState.eventParams(state, "plan"));
        });

        if (field("region")) {
            field("region").addEventListener("change", function () {
                state = window.StageOneState.assign(state, { region: field("region").value || null });
                toggleInternational();
                renderSummary();
            });
        }
        if (field("audience")) {
            field("audience").addEventListener("change", function () {
                state = window.StageOneState.assign(state, { audience: field("audience").value || null });
                renderSummary();
            });
        }
        if (field("groupType")) {
            field("groupType").addEventListener("change", function () {
                state = window.StageOneState.assign(state, { groupType: field("groupType").value || null });
                renderSummary();
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
                "Group type: " + (valueOf("groupType") || "Not provided"),
                "Audience: " + (valueOf("audience") || "Not provided"),
                "Estimated participants: " + (valueOf("participantCount") || "Not provided"),
                "Accompanying adults: " + (valueOf("accompanyingAdults") || "Not provided"),
                "Country of origin: " + (valueOf("countryOfOrigin") || "Not provided"),
                "Tour provider: " + (valueOf("tourProvider") || "Not provided"),
                "Primary language: " + (valueOf("primaryLanguage") || "Not provided"),
                "",
                "Destination and schedule",
                "Region: " + (valueOf("region") || "Not provided"),
                "Destination city: " + (valueOf("destinationCity") || "Not provided"),
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

            window.StageOneState.track("plan_workshop_form_submitted", window.StageOneState.eventParams(state, "plan"));
            window.location.href = "mailto:workshops@stageoneeducation.com"
                + "?subject=" + encodeURIComponent("Workshop planning request")
                + "&body=" + encodeURIComponent(lines.join("\n"));
            window.setTimeout(function () {
                window.location.assign("/plan-a-workshop/thank-you/");
            }, 400);
        });

        prefill();
    });
})();
