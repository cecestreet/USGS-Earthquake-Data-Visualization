document.addEventListener('DOMContentLoaded', () => {
    // URL for the earthquake data
    const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson';

    // Initialize the map
    const map = L.map('map').setView([20.0, 0.0], 2);

    // Add the base map layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Fetch earthquake data
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Process the GeoJSON data
            L.geoJSON(data, {
                onEachFeature: (feature, layer) => {
                    // Popup with earthquake details
                    const { place, mag, time } = feature.properties;
                    const date = new Date(time);
                    layer.bindPopup(`<h3>${place}</h3><p>Magnitude: ${mag}</p><p>${date.toUTCString()}</p>`);
                },
                pointToLayer: (feature, latlng) => {
                    // Customize marker appearance
                    return L.circleMarker(latlng, {
                        radius: feature.properties.mag * 2,
                        fillColor: 'red',
                        color: '#000',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error fetching earthquake data:', error));
});
