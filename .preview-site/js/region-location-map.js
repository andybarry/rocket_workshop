(function () {
  'use strict';

  var mapElement = document.querySelector('[data-region-map]');
  var locationElements = document.querySelectorAll('[data-region-map-location]');

  if (!mapElement || !locationElements.length || typeof window.L === 'undefined') {
    return;
  }

  var map = window.L.map(mapElement, {
    scrollWheelZoom: false
  });

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  var icon = window.L.divIcon({
    className: 'region-location-map__marker',
    html: '<span aria-hidden="true"></span>',
    iconAnchor: [16, 38],
    iconSize: [32, 40],
    popupAnchor: [0, -35]
  });

  Array.prototype.forEach.call(locationElements, function (locationElement) {
    var latitude = Number(locationElement.getAttribute('data-latitude'));
    var longitude = Number(locationElement.getAttribute('data-longitude'));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    var locationName = locationElement.getAttribute('data-location-name');
    var popup = document.createElement('div');
    var heading = document.createElement('strong');
    var link = document.createElement('a');

    heading.textContent = locationName;
    link.href = locationElement.href;
    link.textContent = 'Explore workshops';
    popup.appendChild(heading);
    popup.appendChild(link);

    window.L.marker([latitude, longitude], {
      icon: icon,
      title: locationName,
      alt: locationName
    }).addTo(map).bindPopup(popup);
  });

  try {
    var regionBounds = JSON.parse(mapElement.getAttribute('data-region-bounds'));
    map.fitBounds(regionBounds, { padding: [24, 24] });
  } catch (error) {
    var firstLocation = locationElements[0];
    map.setView([
      Number(firstLocation.getAttribute('data-latitude')),
      Number(firstLocation.getAttribute('data-longitude'))
    ], 6);
  }
}());
