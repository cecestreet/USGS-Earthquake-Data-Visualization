// Initialize Leaflet map
var map = L.map('map').setView([0, 0], 2);

// Add map tiles once during initialization
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Create a layer group to manage earthquake layers
var earthquakeLayerGroup = L.layerGroup().addTo(map);

// Defining the color scale for the map
var colorScale = d3.scaleSequential()
    .domain([0, 700]) // Fixed domain
    .interpolator(d3.interpolateRainbow); 

// Function to display earthquake data on the map
function displayEarthquakeData(data) {
    console.log(data); 

    earthquakeLayerGroup.clearLayers();

    // Function to set marker color based on depth using our colorScale
    function getMarkerColor(depth) {
        return colorScale(depth);
    }

    // Add earthquake markers
    L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            var magnitude = feature.properties.mag;
            var depth = feature.geometry.coordinates[2];
            var markerSize = Math.sqrt(magnitude) * 5; 
            var marker = L.circleMarker(latlng, {
                radius: markerSize,
                fillColor: getMarkerColor(depth),
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
            marker.bindTooltip("Place: " + feature.properties.place + "<br>Magnitude: " + feature.properties.mag);
            return marker;
        }
    }).addTo(earthquakeLayerGroup);
}

// Function to create the legend
function createLegend() {
    var legend = document.getElementById("legend");
    legend.innerHTML = "<h4>Depth (km)</h4>";
    var depthValues = [0, 100, 200, 300, 400, 500, 600];
    depthValues.forEach(function (depth) {
        var color = colorScale(depth);
        var item = document.createElement("div");
        item.innerHTML = '<span class="legend-color-box" style="background:' + color + '"></span>' + depth + '+';
        legend.appendChild(item);
    });
}

// Function to aggregate earthquake data by day
function aggregateDataByDay(data) {
    var aggregatedData = {};
    data.features.forEach(function (feature) {
        var date = new Date(feature.properties.time).toDateString();
        if (!aggregatedData[date]) {
            aggregatedData[date] = [];
        }
        aggregatedData[date].push(feature);
    });
    return aggregatedData;
}

// Function to populate the dropdown menu with unique days
function populateDropdown(data) {
    var select = document.getElementById("date-filter");
    select.innerHTML = '<option value="all">All Dates</option>';
    var aggregatedData = aggregateDataByDay(data);
    Object.keys(aggregatedData).forEach(function (date) {
        var option = document.createElement("option");
        option.value = date;
        option.textContent = date + " (" + aggregatedData[date].length + " earthquakes)";
        select.appendChild(option);
    });
}

// Function to fetch earthquake data and create map
function fetchDataAndCreateMap() {
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson')
        .then(response => response.json())
        .then(data => {
            populateDropdown(data);
            displayEarthquakeData(data);
        })
        .catch(error => console.error('Error fetching:', error));
}

// Event listener for dropdown change
document.getElementById("date-filter").addEventListener("change", function (event) {
    var selectedDate = event.target.value;
    if (selectedDate === "all") {
        fetchDataAndCreateMap();
    } else {
        fetchFilteredDataAndCreateMap(selectedDate);
    }
});

// Function to fetch earthquake data for the selected date and create map
function fetchFilteredDataAndCreateMap(selectedDate) {
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson')
        .then(response => response.json())
        .then(data => {
            var filteredData = {
                type: "FeatureCollection",
                features: data.features.filter(function (feature) {
                    return new Date(feature.properties.time).toDateString() === selectedDate;
                })
            };
            displayEarthquakeData(filteredData);
        })
        .catch(error => console.error('Error fetching earthquake data:', error));
}

fetchDataAndCreateMap();
createLegend();

