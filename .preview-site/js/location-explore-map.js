(function () {
    "use strict";

    function init() {
        var el = document.querySelector("[data-location-explore-map]");
        if (!el || typeof window.L === "undefined") return;
        if (el.getAttribute("data-map-bound")) return;
        el.setAttribute("data-map-bound", "true");

        var lat = Number(el.getAttribute("data-lat"));
        var lng = Number(el.getAttribute("data-lng"));
        var zoom = Number(el.getAttribute("data-zoom"));
        var showPin = el.getAttribute("data-show-pin") !== "false";

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        if (!Number.isFinite(zoom)) zoom = 10;
        if (showPin) zoom = 10;
        if (!showPin) zoom = 4;

        var map = window.L.map(el, {
            center: [lat, lng],
            zoom: zoom,
            zoomControl: false,
            attributionControl: true,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            tap: false,
            touchZoom: false
        });

        window.L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 19
        }).addTo(map);

        if (showPin) {
            var icon = window.L.divIcon({
                className: "discovery-location-explore__pin",
                html: "<span></span>",
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            });
            window.L.marker([lat, lng], { icon: icon, interactive: false }).addTo(map);
        }

        requestAnimationFrame(function () {
            map.invalidateSize();
        });
        window.addEventListener("resize", function () {
            map.invalidateSize();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}());
