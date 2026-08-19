(function (root) {
    "use strict";

    function data() {
        return root.StageOneExplorerData || {};
    }

    function findBy(list, key, value) {
        if (!list) return null;
        for (var i = 0; i < list.length; i += 1) {
            if (list[i][key] === value) return list[i];
        }
        return null;
    }

    function regionOf(state) {
        return findBy(data().regions, "id", state && state.region);
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

    function audiencePhrase(audience) {
        if (!audience) return "";
        if (audience.id === "mixed-age") return "mixed-age";
        if (audience.id === "college-university") return "college and university";
        if (audience.id === "adult-professional") return "adult and professional";
        return audience.label.toLowerCase();
    }

    function resultHeading(state) {
        var copy = data().copy || {};
        var region = regionOf(state);
        if (!region) return copy.default_heading || "Choose a Region to Continue";

        var audience = audienceOf(state);
        var workshop = workshopOf(state);
        var location = region.location_phrase;

        if (region.kind === "international") {
            if (workshop && audience) {
                return workshop.heading_label + " Workshops for " + audience.heading_label +
                    " International Groups Visiting the USA";
            }
            if (workshop) {
                return workshop.heading_label + " Workshops for International Groups Visiting the USA";
            }
            if (audience) {
                return audience.heading_label + " Workshops for International Groups Visiting the USA";
            }
            return "Workshops for International Groups Visiting the USA";
        }

        if (workshop && audience) {
            return workshop.heading_label + " Workshops for " + audience.heading_label + " Groups " + location;
        }
        if (workshop) {
            return workshop.heading_label + " Workshops " + location;
        }
        if (audience) {
            return audience.heading_label + " Workshops " + location;
        }
        return "Workshops " + location;
    }

    function resultParagraph(state) {
        var copy = data().copy || {};
        var region = regionOf(state);
        if (!region) return copy.default_paragraph || "";

        var audience = audienceOf(state);
        var workshop = workshopOf(state);
        var groupType = groupTypeOf(state);
        var venue = region.venue_phrase;
        var groupPhrase = groupType ? groupType.paragraph_phrase : "";

        if (workshop && audience) {
            var workshopName = workshop.heading_label;
            var audienceName = audiencePhrase(audience);
            if (groupPhrase) {
                return "Explore a hands-on " + workshopName + " experience that can be adapted for " + audienceName +
                    " groups and " + groupPhrase +
                    ". Stage One delivers it directly to your hotel, school, campus, or group venue.";
            }
            return "Explore a hands-on " + workshopName + " experience that can be adapted for " + audienceName +
                " groups and delivered directly to your hotel, school, campus, or group venue.";
        }

        if (workshop) {
            if (groupPhrase) {
                return "Explore a hands-on " + workshop.heading_label +
                    " experience " + groupPhrase +
                    ". Stage One brings the instructor, equipment, and complete three-hour workshop directly to your group’s venue " +
                    venue + ".";
            }
            return "Explore a hands-on " + workshop.heading_label +
                " experience delivered as a complete three-hour workshop at hotels, schools, campuses, and group venues " +
                venue + ".";
        }

        if (audience) {
            return "Explore hands-on engineering workshops that can be adapted for " + audiencePhrase(audience) +
                " groups and delivered directly to hotels, schools, campuses, and group venues " + venue + ".";
        }

        return "Explore hands-on engineering workshops delivered to hotels, schools, campuses, and group venues " + venue + ".";
    }

    function resultButtonLabel(state) {
        var copy = data().copy || {};
        var region = regionOf(state);
        if (!region) return copy.default_button || "Select a Region";
        return region.cta_label + " →";
    }

    function selectionChips(state) {
        var chips = [];
        var region = regionOf(state);
        var audience = audienceOf(state);
        var groupType = groupTypeOf(state);
        var workshop = workshopOf(state);
        if (region) chips.push({ type: "region", id: region.id, label: region.short_label });
        if (audience) chips.push({ type: "audience", id: audience.id, label: audience.label });
        if (groupType) chips.push({ type: "group", id: groupType.id, label: groupType.label });
        if (workshop) chips.push({ type: "workshop", id: workshop.slug, label: workshop.heading_label });
        return chips;
    }

    function workshopContextLine(state, workshop) {
        var audience = audienceOf(state);
        var region = regionOf(state);
        var name = workshop && workshop.heading_label ? workshop.heading_label : "this workshop";
        if (audience && region) {
            return "You’re exploring " + name + " for a " + audience.label + " group " + region.location_phrase + ".";
        }
        if (region) {
            return "You’re exploring " + name + " " + region.location_phrase + ".";
        }
        if (audience) {
            return "You’re exploring " + name + " for a " + audience.label + " group.";
        }
        return "";
    }

    root.StageOneCopy = {
        findBy: findBy,
        regionOf: regionOf,
        audienceOf: audienceOf,
        groupTypeOf: groupTypeOf,
        workshopOf: workshopOf,
        resultHeading: resultHeading,
        resultParagraph: resultParagraph,
        resultButtonLabel: resultButtonLabel,
        selectionChips: selectionChips,
        workshopContextLine: workshopContextLine
    };
})(window);
