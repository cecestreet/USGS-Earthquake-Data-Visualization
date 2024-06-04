// Initialize Leaflet map
var map = L.map('map').setView([0, 0], 2);

// Defining the color scale for the map
var colorScale = d3.scaleSequential()
    .domain([0, 700]) // Fixed domain
    .interpolator(d3.interpolateRainbow); 

// Function to display earthquake data on the map
function displayEarthquakeData(data) {
    console.log(data); 

    // Add map tiles and specify max zoom
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Function to set marker color based on depth using our colorScale
    function getMarkerColor(depth) {
        return colorScale(depth);
    }

    // Add earthquake markers
    //Leaflet method to add GeoJSON to the map
    L.geoJSON(data, {
        //A layer object will be returned for each data point, or "feature"
        pointToLayer: function (feature, latlng) {
            var magnitude = feature.properties.mag;
            //The depth coordinate is the third coordinate of the geometry section
            var depth = feature.geometry.coordinates[2];
            //Marker size mathmatically processed to vary with magnitude
            var markerSize = Math.sqrt(magnitude) * 5; 
            var marker = L.circleMarker(latlng, {
                radius: markerSize,
                fillColor: getMarkerColor(depth), // Marker color will depend on depth using our getMarkerColor
                color: '#000', //Border color of the marker to black
                weight: 1, //Thickness of border
                opacity: 1, //Opacity of marker
                fillOpacity: 0.8 //Opacity of markers color
            });
            // Show place and magnitude on hover with bindTooltip from Leaflet
            marker.bindTooltip("Place: " + feature.properties.place + "<br>Magnitude: " + feature.properties.mag);
            return marker;
        }
    }).addTo(map);
}

// Function to create the legend
function createLegend() {
    var legend = document.getElementById("legend");
    //Creating the content for the legend HTML inline
    legend.innerHTML = "<h4>Depth (km)</h4>";
//Declaring our depthValues, the different depths to color our earthquake data
//Writing the HTML in line so we can be more dynamic and use our colorScale for the depth
    var depthValues = [0, 100, 200, 300, 400, 500, 600];
    depthValues.forEach(function (depth) {
        var color = colorScale(depth);
        var item = document.createElement("div");
        item.innerHTML = '<span class="legend-color-box" style="background:' + color + '"></span>' + depth + '+';
        //For each legend section/element we append it to the legend, as it repeats this function for the segments of our above array/depthValues
        legend.appendChild(item);
    });
}

// Function to aggregate earthquake data by day
function aggregateDataByDay(data) {
    //Our empty variable/object to store our data once organized by day
    var aggregatedData = {};
    data.features.forEach(function (feature) {
        //Using toDateString method to translate the date
        var date = new Date(feature.properties.time).toDateString();
        //If there is no data for the current date, it sets an empty array. If there is data, it(the feature, or data point, the earthquake) gets 
        //added to the array with it's fellow date aggregates
        if (!aggregatedData[date]) {
            aggregatedData[date] = [];
        }
        aggregatedData[date].push(feature);
    });
    //After all data is aggregated, we return a sorted object
    return aggregatedData;
}

// Function to populate the dropdown menu with unique days
function populateDropdown(data) {
    var select = document.getElementById("date-filter");
    //Setting initial selection of the data filter dropdown to All Dates
    select.innerHTML = '<option value="all">All Dates</option>';
    //Saving our sorted data by day result to variable aggregatedData
    var aggregatedData = aggregateDataByDay(data);
    //The following code gets executed for each key of aggregatedData, in this case, for each day set of data
    Object.keys(aggregatedData).forEach(function (date) {
        //New HTML option element created
        var option = document.createElement("option");
        //The value is the day
        option.value = date;
        //For the dropdown, our text content will be the date, then the length of the data instances in that aggregate,
        //aka the number of earthquakes that occured that day
        option.textContent = date + " (" + aggregatedData[date].length + " earthquakes)";
        //We then append the new "child" to the drop down menu as a selectable "option"
        select.appendChild(option);
    });
}

// Function to fetch earthquake data and create map
function fetchDataAndCreateMap() {
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson')
    //Fetching our data from the geojson and passing the response to the json() method when the promise is fufilled/fetch is a success
        .then(response => response.json())
        //Once the json has been parsed into data, the data is passed on
        .then(data => {
            // Populate the dropdown menu with unique days
            populateDropdown(data);
            // Display all earthquake data on the map
            displayEarthquakeData(data);
        })
        .catch(error => console.error('Error fetching:', error));
}

// Event listener for dropdown change
//When a "change" event occurs, or new selection is selected, the innards will execute
document.getElementById("date-filter").addEventListener("change", function (event) {
    //selectedDate will hold the value selected on the target, our dropdown
    var selectedDate = event.target.value;
    //In our HTML, our "All Dates" has a value of all, if it is selected or if the value === "all"(only true when All Dates is chosen),
    //then we execute fetchDataAndCreateMap with () all data
    if (selectedDate === "all") {
        // If "All Dates" is selected, fetch all earthquake data
        fetchDataAndCreateMap();
    } else {
        // Else, fetch earthquake data for the selected date, which was declared and saved above upon the event target value change
        fetchFilteredDataAndCreateMap(selectedDate);
    }
});

// Function to fetch earthquake data for the selected date and create map
function fetchFilteredDataAndCreateMap(selectedDate) {
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson')
        .then(response => response.json())
        .then(data => {
            // Filter earthquake data for the date choen from the dropdown, the selectedDate
            var filteredData = {
                //Our type of data is FeatureCollection, a collection of GeoJSON objects
                type: "FeatureCollection",
                //We create our filter here, if the date we get after our conversion to readable string matched our chosen
                //selectedDate, then it gets returned and included in the filtered result
                features: data.features.filter(function (feature) {
                    return new Date(feature.properties.time).toDateString() === selectedDate;
                })
            };
            // We call our previously made(although asynchronous) function with our result
            displayEarthquakeData(filteredData);
        })
        .catch(error => console.error('Error fetching earthquake data:', error));
}

fetchDataAndCreateMap();

createLegend();
