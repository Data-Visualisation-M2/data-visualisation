var stationList = [];

var width = 768,
  height = 580;

var filter = {
  electricalBikes: false,
  electricalInternalBatteryBikes: false,
  electricalRemovableBatteryBikes: false,
  mechanicalBikes: false
};

var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var color = d3.scaleQuantize()
  .range(["#edf8e9","#bae4b3","#74c476","#31a354","#006d2c"])

var projection = d3
  .geoAlbersUsa()
  .translate([width / 2, height / 2])
  .scale([500]);

var path = d3.geoPath().projection(projection);

var projection = d3.geoMercator().translate([700 / 2, 580 / 2])
var path = d3.geoPath().projection(projection);
var width, height, lastUpdateDate;
var svg;
var mapData;

var map;

var color = d3.scaleQuantize().range(["#00F00", "#95FF66", "#C8FF23", "#FFC2A6", "#FF6B5E", "#FF0000"])

var currentPosition = {
  'lat': 45.75,
  'lon': 4.85
}

var tooltipDiv;

function showBarPlot(data, name, open) {
  d3.select("#detailedData").select("svg").remove();
  let container = d3.select("#detailedData");
  let svg = container.append("svg")
  .attr("height","100%")
  .attr("width","100%");

  var barPlotGroup = svg.append("g")
    .attr("transform", "translate(225px, 210px)")
    .attr("width","100%")
    .attr("height","100%")
    .attr("id", "bar-plot");

  var barWidth = 30;
  var barSpacing = 5;

  var barWidth = 30;
  var barSpacing = 5;

  var labelOffset = 20;

  document.getElementById("stationName").innerHTML = name;
  document.getElementById("stationStatus").innerHTML = open? "Ouvert" : "Fermé";
  document.getElementById("stationStatus").style.color = open? "#00B600" : "#D40000";

  barPlotGroup.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("x", (d, i) => {
      return i * (barWidth + barSpacing);
    })
    .attr("y", (d) => {
      return -d.value;
    })
    .attr("width", barWidth)
    .attr("height", function (d) { return d.value; })
    .style("fill", "steelblue")
    .attr("class","rectangle")
    .text((d) => d.value);

    barPlotGroup.selectAll(".text")
      .data(data)
      .enter().append("text")
      .attr("x", (d, i) => { return -5 + (i * (barWidth + barSpacing) + barWidth / 2); })
      .attr("y", (d) => { return labelOffset; })
      .attr("text-anchor", "right")
      .style("fill", "white")
      .attr("transform", (d, i) => {
        return "rotate(-315 " + (i * (barWidth + barSpacing) + barWidth / 2) + " 15)";
      })
      .text((d) => d.category );
  
  barPlotGroup.selectAll("text")
    .append("text")
    .attr("x", function (d, i) { return i * (barWidth + 5) + barWidth / 2; })
    .attr("y", 255)
    .attr("text-anchor", "middle")
    .attr("class", "label")
    .style("fill", "white")
    .text((d) => "Station " + name);

  barPlotGroup.selectAll(".text")
    .data(data)
    .enter().append("text")
    .attr("x", function (d, i) { return i * (barWidth + 5) + barWidth / 2; })
    .attr("y", function (d) { return -d.value - 5; })
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .text(function (d) { return d.value; });
    
}

function isMapFiltered() {
  return Object.values(filter).some(singleInput => singleInput === true);
}

function doesStationContainsInput(availabilities) {
  if (filter.electricalBikes && availabilities.electricalBikes <= 0) {
    return false;
  }
  if (filter.electricalInternalBatteryBikes && availabilities.electricalInternalBatteryBikes <= 0) {
    return false
  }
  if (filter.electricalRemovableBatteryBikes && availabilities.electricalRemovableBatteryBikes <= 0) {
    return false;
  }
  if (filter.mechanicalBikes && availabilities.mechanicalBikes <= 0) {
    return false;
  }
  return true;
}

function projectPoint(x, y) {
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

function getStationColor(station) {
  if (station.properties.data) {
    let status = station.properties.data.status;
    let availabilities = station.properties.data;
    if (isMapFiltered()) {
      if (doesStationContainsInput(availabilities)) {
        station.selectable = true;
        return "green";
      } else {
        station.selectable = false;
        return "grey";
      }
    } else {
      if (status === "CLOSED" || station.properties.bike_stands === 0) {
        station.selectable = false;
        return "red";
      } else if (status === "OPEN") {
        station.selectable = true;
        return "green";
      }
    }
  }
}

function toRadian(degree) {
  return degree * Math.PI / 180;
}

function computeDistanceFromUser(currentGeoLoc) {
  mapData.features.forEach((currentStation)=>{
    let lon1 = toRadian(currentGeoLoc.lon),
        lat1 = toRadian(currentGeoLoc.lat);
        lon2 = toRadian(currentStation.properties.lng),
        lat2 = toRadian(currentStation.properties.lat);

    let deltaLat = lat2 - lat1,
        deltaLon = lon2 - lon1;

    let a = Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon / 2), 2),
      c = 2 * Math.asin(Math.sqrt(a));

    let EARTH_RADIUS = 6731;
    let distance = c * EARTH_RADIUS * 1000;
    currentStation.distanceFromUser = distance;
  });
}
function displayHover(coordinates, station) {
  var htmlText = station.properties.name + "(" + station.properties.commune + ")";
  if (station.properties.data) {
    tooltipDiv
      .transition()
      .duration(200)
      .style("opacity", 0.9)
    let availabilities = station.properties.data;
    htmlText += "<br><ul>" +
      "<li>Capacité maximale : " + availabilities.capacities + "</li>" +
      "<li>Vélos electriques : " + availabilities.electricalBikes + "</li>" +
      "<li>Vélos electriques (batterie interne) : " + availabilities.electricalInternalBatteryBikes + "</li>" +
      "<li>Vélos electriques (batterie externe) : " + availabilities.electricalRemovableBatteryBikes + "</li>" +
      "<li>Vélos mécaniques : " + availabilities.mechanicalBikes + "</li>" +
      "<li>Stands : " + availabilities.stands + "</li>" +
      "</ul>";
  } else {
    htmlText += "<br/>Aucune pour le jour en cours!"
  }
  tooltipDiv
    .style("left", coordinates.x + 10 + "px")
    .style("top", coordinates.y + 10 + "px");
  tooltipDiv.html(htmlText);
}

function getStandardDeviation(ratioList){
  if(!ratioList || !ratioList.length || ratioList.length === 0){
    return 0;
  }else{
    const n = ratioList.length;
    const mean = ratioList.reduce(
      (firstRatio,secondRatio) => firstRatio+secondRatio
    )/n;
    return Math.sqrt(
      ratioList.map(
        ratio => Math.pow(ratio-mean,2)
      ).reduce((firstRatio,secondRatio)=> firstRatio+secondRatio)/n
    )
  }
}

function getFilteredStationRadius(station) {
  let availabilities = station.properties.data;
  if(doesStationContainsInput(availabilities)){
    let totalNumber = station.properties.bike_stands;
    let stationRatio = ratio(availabilities, totalNumber);
    if (totalNumber === 0) {
      return 0;
    } else {
      return stationRatio * (station.radius);
    }
  }else{
    return 0;
  }
}

function getRatios(stationList){
  let ratioList = [];
  stationList.map((singleStation)=>{
    let availabilities = singleStation.properties.data;
    let totalNumber = singleStation.properties.bike_stands;
    let stationRatio = ratio(availabilities, totalNumber);
    ratioList.push(stationRatio);
  })
  return ratioList;
}

function drawMap() {
  if (map != undefined) {
    map.remove();
  }

  document.getElementById("currentDate").innerHTML = "Actuellement " + lastUpdateDate;

  map = L
    .map('velovMap')
    .setView([45.763420, 4.834277], 13);


  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    minZoom: 11,
    maxZoom: 17,
  }).addTo(map);

  L.svg().addTo(map);

  L.geoJSON(mapData, {
    pointToLayer: (feature, latlng) => {
      feature.radius = feature.properties.bike_stands/5
      return L.circleMarker(
        latlng,
        {
          radius: feature.radius,
          color: getStationColor(feature),
          weight: 1,
          opacity: 0.95,
          fillOpacity: 0.75
        }
      )
    },

    onEachFeature: (feature, layer) => {
      layer.on('click', (e) => {
        let availabilities = feature.properties.data;
        if(
          isMapFiltered() && doesStationContainsInput(availabilities)
          || !isMapFiltered()
        ){
          data = [
            {
              category: 'Electriques',
              value: availabilities.electricalBikes * 10 || 0
            },
            {
              category: 'Electriques (batterie interne)',
              value: availabilities.electricalInternalBatteryBikes * 10 || 0
            },
            {
              category: 'Electriques (batterie externe)',
              value: availabilities.electricalRemovableBatteryBikes * 10 || 0
            },
            {
              category: 'Mécaniques',
              value: availabilities.mechanicalBikes * 10 || 0
            },
          ]
          showBarPlot(data, feature.properties.name, feature.properties.status == "OPEN");
        }else{
          let name = feature.properties.name
          alert("La station "+name+" que vous avez demandé pour l'affichage n'est pas disponible en raison du filtrage.\nEnlevez les filtrages pour la voir.")
        }
      });
      layer.on('mouseover', (event, d) => {
        let availabilities = feature.properties.data;
        if(
          isMapFiltered() && doesStationContainsInput(availabilities)
          || !isMapFiltered()
        ){
          tooltipDiv = d3
          .select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);
          let coordinates = {
            x: event.originalEvent.pageX,
            y: event.originalEvent.pageY
          }
          displayHover(coordinates, feature);
        }
      });
      layer.on('mouseout', (e) => {
        tooltipDiv.innerHTML = "";
        tooltipDiv
          .transition()
          .duration(500)
          .style("opacity", 0);
        let elements = document.getElementsByClassName("tooltip");
        while (elements.length > 0) {
          elements[0].parentNode.removeChild(elements[0]);
        }
      })
    }
  }).addTo(map);

  if (isMapFiltered()) {
    let filteredStations = mapData.features.filter(
      (singleStation) =>
        doesStationContainsInput(
          singleStation.properties.main_stands.availabilities
        )
    )
    let ratios = getRatios(filteredStations);
    let standardDeviation = getStandardDeviation(ratios);
    console.log(standardDeviation);
    L.geoJSON(filteredStations, {
      pointToLayer: (feature, latlng) => {
          let filteredRadius = getFilteredStationRadius(feature);
          return L.circleMarker(
            latlng,
            {
              radius: 0.5*filteredRadius+feature.radius/6,
              color: getFilteredStationColor(feature),
              weight: 1,
              opacity: 0.3,
              fillOpacity: 0.3
            }
          )
      },
    }).addTo(map);
  }
}

function getFilteredStationColor(station){
  let availabilities = station.properties.main_stands.availabilities;
  if(doesStationContainsInput(availabilities)){
    return color(station.distanceFromUser);
  }else{
    return "grey";
  }
}
function displayErrorMessage(error){
  alert("Vous avez refusé la gélocalisation! Elle se base alors sur la ville de Lyon à savoir 45.75° en latitude et 4.78° en longitude!")
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(updatePosition,displayErrorMessage);
  } else {
    alert("Geolocation is not supported in this browser! The browser will use a default location!");
  }
}

function updatePosition(position) {
  currentPosition.lat = position.coords.latitude;
  currentPosition.lon = position.coords.longitude;
}

function initFilteredMapColorRange(mapData, currentPosition){
  computeDistanceFromUser(currentPosition);
  color.domain([
    d3.min(mapData, (singleStation)=>{
      return singleStation.distanceFromUser
    }),
    d3.max(mapData, (singleStation)=>{
      return singleStation.distanceFromUser
    })
  ]);
}

function ratio(availabilities, totalNumber) {
  var totalNumberOfStations = 0;
  if (totalNumber === 0) {
    return 0;
  } else {
    if (filter.electricalBikes) {
      totalNumberOfStations += availabilities.electricalBikes;
    }
    if (filter.electricalInternalBatteryBikes) {
      totalNumberOfStations += availabilities.electricalInternalBatteryBikes;
    }
    if (filter.electricalRemovableBatteryBikes) {
      totalNumberOfStations += availabilities.electricalRemovableBatteryBikes;
    }
    if (filter.mechanicalBikes) {
      totalNumberOfStations += availabilities.mechanicalBikes;
    }
    return totalNumberOfStations / totalNumber;
  }
}

function initMapData() {
  getCurrentLocation();
  d3.json("data.json").then(function (data) {
    var margin = { top: 20, right: 20, bottom: 20, left: 20 };
    width = 500 - margin.left - margin.right;
    height = 500 - margin.top - margin.bottom;

    lastUpdateDate = data.features[0].properties.last_update_gl.replace(/\.\d+/, "").substring(0, 19).replace("T", " ");

    for (var i = 0; i < data.features.length; i++) {
      let currentData = data.features[i].properties;
      let availabilities = currentData.main_stands.availabilities;
      let capacity = currentData.total_stands.capacity;
      currentData.value =
        (
          availabilities.bikes +
          availabilities.electricalBikes +
          availabilities.electricalInternalBatteryBikes +
          availabilities.electricalRemovableBatteryBikes +
          availabilities.mechanicalBikes
        )
        / capacity;
      availabilities['capacities'] = capacity
      currentData.data = availabilities;
      if (currentData.status == "OPEN" || currentData.status == "CLOSED") {
        currentData.data["status"] = currentData.status;
      }
    }
    mapData = data;
    initFilteredMapColorRange(mapData.features, currentPosition);
    drawMap();
  });
}

function updateFilter(electricalBikesUpdated, electricalInternalBatteryBikesUpdated,
  electricalRemovableBatteryBikesUpdated, mechanicalBikesUpdated) {
  filter.electricalBikes = electricalBikesUpdated;
  filter.electricalInternalBatteryBikes = electricalInternalBatteryBikesUpdated;
  filter.electricalRemovableBatteryBikes = electricalRemovableBatteryBikesUpdated;
  filter.mechanicalBikes = mechanicalBikesUpdated;
  drawMap();
}

initMapData();