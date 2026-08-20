(function (root) {
    "use strict";

    function data() {
        return root.StageOneDiscoveryData || {};
    }

    function findBy(list, key, value) {
        if (!list) return null;
        for (var i = 0; i < list.length; i += 1) {
            if (list[i][key] === value) return list[i];
        }
        return null;
    }

    function cityOf(state) {
        return findBy(data().cities, "slug", state && state.city);
    }

    function audienceOf(state) {
        return findBy(data().audiences, "id", state && state.audience);
    }

    function groupTypeOf(state) {
        return findBy(data().groupTypes, "id", state && state.groupType);
    }

    function workshopOf(state) {
        if (!state || !state.workshop || state.workshop === "all") return null;
        return findBy(data().workshops, "slug", state.workshop);
    }

    function selectionChips(state) {
        var chips = [];
        var city = cityOf(state);
        var audience = audienceOf(state);
        var groupType = groupTypeOf(state);
        var workshop = workshopOf(state);
        if (city) chips.push({ type: "city", id: city.slug, label: city.short_label || city.name });
        if (audience) chips.push({ type: "audience", id: audience.id, label: audience.label });
        if (groupType) chips.push({ type: "group_type", id: groupType.id, label: groupType.label });
        if (workshop) chips.push({ type: "workshop", id: workshop.slug, label: workshop.heading_label || workshop.name });
        return chips;
    }

    function workshopContextLine(state, workshop) {
        var audience = audienceOf(state);
        var city = cityOf(state);
        var name = workshop && workshop.heading_label ? workshop.heading_label : "this workshop";
        if (audience && city) {
            return "You’re exploring " + name + " for a " + audience.label + " group in " + (city.short_label || city.name) + ".";
        }
        if (city) {
            return "You’re exploring " + name + " in " + (city.short_label || city.name) + ".";
        }
        if (audience) {
            return "You’re exploring " + name + " for a " + audience.label + " group.";
        }
        return "";
    }

    root.StageOneCopy = {
        findBy: findBy,
        cityOf: cityOf,
        audienceOf: audienceOf,
        groupTypeOf: groupTypeOf,
        workshopOf: workshopOf,
        selectionChips: selectionChips,
        workshopContextLine: workshopContextLine
    };
})(window);
