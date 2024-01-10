var stationList = [];

var width = 768,
  height = 580;

var filter = {
  electricalBikes:false,
  electricalInternalBatteryBikes:false,
  electricalRemovableBatteryBikes:false,
  mechanicalBikes:false
};

var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var tooltip = d3
  .select("#detailledInfos")
  .append("div")
  .attr("class", "hidden tooltip");

var color = d3.scaleQuantize()
  .range(["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"])

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

var currentPosition = {
  'lat':45.75,
  'lon':4.85
}


function maxValue(data) {
  var max = -1;
  for (var i = 0; i < data.length; i++) {
    let value = data[i].value;
    if (value > max) {
      max = value
    }
  }
  return max;
}

function showBarPlot(data, name, open) {
  d3.select("#bar-plot").remove();


  var barPlotGroup = d3.select("body").select("svg").append("g")
    .attr("id", "bar-plot")
    .attr("transform", "translate(" + (width - 200) + ", " + (height - 200) + ")");


  var barWidth = 30;
  var barSpacing = 5;

  var barWidth = 30;
  var barSpacing = 5;

  var labelOffset = 20;

  var max = maxValue(data);

  barPlotGroup.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("x", function (d, i) { return i * (barWidth + barSpacing); })
    .attr("y", function (d) { return -d.value; })
    .attr("width", barWidth)
    .attr("height", function (d) { return d.value; })
    .style("fill", "steelblue")
    .text((d) => d.value);

  barPlotGroup.selectAll("text").append("text")
    .attr("x", function (d, i) { return i * (barWidth + 5) + barWidth / 2; })
    .attr("y", 255)
    .attr("text-anchor", "middle")
    .attr("class", "label")
    .style("fill", "white")
    .text((d) => "Station " + name);


  barPlotGroup.selectAll("text")
    .data(data)
    .enter().append("text")
    .attr("x", function (d, i) { return -5 + (i * (barWidth + barSpacing) + barWidth / 2); })
    .attr("y", function (d) { return labelOffset; })
    .attr("text-anchor", "right")
    .style("fill", "white")
    .attr("transform", function (d, i) {
      return "rotate(-315 " + (i * (barWidth + barSpacing) + barWidth / 2) + " 15)";
    })
    .text(function (d) { return d.category; }).exit();

  barPlotGroup.selectAll(".text")
    .data(data)
    .enter().append("text")
    .attr("x", function (d, i) { return i * (barWidth + 5) + barWidth / 2; })
    .attr("y", function (d) { return -d.value - 5; })
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .text(function (d) { return d.value; });

  barPlotGroup.append("text")
    .attr("x", (width / 8))
    .attr("y", -max - 80)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "white")
    .text("Station " + name);

  barPlotGroup.append("text")
    .attr("x", (width / 8))
    .attr("y", -max - 60)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", open ? "darkgreen" : "darkred")
    .text(open ? "Ouvert" : "Fermé");

  barPlotGroup.append("text")
    .attr("x", (width / 8))
    .attr("y", -max - 40)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "white")
    .text("Vélos disponibles");
}

function isMapFiltered(){
  return Object.values(filter).some(singleInput => singleInput === true);
}

function doesStationContainsInput(availabilities){
  if(filter.electricalBikes && availabilities.electricalBikes <= 0){
    return false;
  }
  if(filter.electricalInternalBatteryBikes && availabilities.electricalInternalBatteryBikes <= 0){
    return false
  }
  if(filter.electricalRemovableBatteryBikes && availabilities.electricalRemovableBatteryBikes <= 0){
    return false;
  }
  if(filter.mechanicalBikes && availabilities.mechanicalBikes <= 0){
    return false;
  }
  return true;
}

function projectPoint(x, y) {
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

function drawMap(){
  d3.select("#velovMap").remove();
  var svg = d3
    .select(map.getPanes().overlayPane)
    .append("svg");/*
    .attr("width", (document.width !== undefined) ? document.width : document.body.offsetWidth)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", "velovMap")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");  */
  
  var g = svg.append("g").attr("class","leaflet-zoom-hide");
  var transform = d3.geoPath.transform({point:projectPoint}),
    path = d3.geoPath.path().projectPoint(transform);

  var feature = g.selectAll("path").data(mapData.features).enter().append("path");
  feature.attr("d",path);

  document.getElementById("currentDate").innerHTML = "Actuellement " + lastUpdateDate;
  /*
  var xScale = d3.scaleLinear()
    .domain([d3.min(mapData.features, d => d.geometry.coordinates[0]), d3.max(mapData.features, d => d.geometry.coordinates[0])])
    .range([0, width]);

  var yScale = d3.scaleLinear()
    .domain([d3.min(mapData.features, d => d.geometry.coordinates[1]), d3.max(mapData.features, d => d.geometry.coordinates[1])])
    .range([height, 0]);

  var points = svg.selectAll("circle")
    .data(mapData.features)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return xScale(d.geometry.coordinates[0])+1;
    })
    .attr("cy", function (d) {
      return yScale(d.geometry.coordinates[1])+5;
    })
    .attr("r", (d)=>{
      return d.properties.bike_stands/5;
    })
    .style("fill", (d) => {
      if (d.properties.data) {
        let status = d.properties.data.status;
        let availabilities = d.properties.data;
        if(isMapFiltered()){
          if(doesStationContainsInput(availabilities)){
            d.selectable=false;
            return "green";
          }else{
            d.selectable=true;
            return "grey";
          }
        }else{
          if (status === "CLOSED" || d.properties.bike_stands === 0) {
            d.selectable=false;
            return "red";
          } else if (status === "OPEN") {
            d.selectable=true;
            return "green";
          }
        }
      }
    })
    .on("mousemove", function (event, station) {
      var mousePosition = [event.x, event.y];
      var htmlText = station.properties.name + "(" + station.properties.commune + ")";
      if (station.properties.data) {
        let availabilities = station.properties.data;
        htmlText += "<br><ul>" +
          "<li>Capacité maximale : " + availabilities.capacities + "</li>" +
          "<li>Vélos electriques : " + availabilities.electricalBikes + "</li>" +
          "<li>Vélos electriques (batterie interne) : " + availabilities.electricalInternalBatteryBikes + "</li>" +
          "<li>Vélos electriques (batterie externe) : " + availabilities.electricalRemovableBatteryBikes + "</li>" +
          "<li>Vélos méchaniques : " + availabilities.mechanicalBikes + "</li>" +
          "<li>Stands : " + availabilities.stands + "</li>" +
          "</ul>"
      } else {
        htmlText += "<br/>Aucune pour le jour en cours!"
      }
      tooltip
        .classed("hidden", false)
        .attr(
          "style",
          "left:" +
          (mousePosition[0] + 1) +
          "px; top:" +
          (mousePosition[1] - 35) +
          "px"
        )
        .html(htmlText);
    })
    .on("mouseout", function (event, station) {
      tooltip.classed("hidden", true);
    })
    .on("click", (_, station) => {
      let availabilities = station.properties.data;
      data = [
        { category: 'Electriques', value: availabilities.electricalBikes * 10 || 0 },
        { category: 'Electriques (batterie interne)', value: availabilities.electricalInternalBatteryBikes * 10 || 0 },
        { category: 'Electriques (batterie externe)', value: availabilities.electricalRemovableBatteryBikes * 10 || 0 },
        { category: 'Méchaniques', value: availabilities.mechanicalBikes * 10 || 0 },
      ]
      showBarPlot(data, station.properties.name, station.properties.status == "OPEN");
    })
    ;
    if(isMapFiltered()){
      var points2 = svg.selectAll(".circle")
      .data(mapData.features)
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return xScale(d.geometry.coordinates[0]) + margin.left;
      })
      .attr("cy", function (d) {
        return yScale(d.geometry.coordinates[1]) + margin.top;
      })
      .attr("r", (d)=>{
        let availabilities = d.properties.data;
        let totalNumber = d.properties.bike_stands;
        stationRatio = ratio(availabilities,totalNumber);
        if(totalNumber === 0){
          return 0;
        }else{
          return stationRatio*(d.properties.bike_stands/5);
        }
      })
      .attr("fill",(d)=>"white")
      ;
    }

  var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", function (event) {
      points.attr("r", 5 / event.transform.k);
      if(isMapFiltered()){
        points2.attr("r", 5 / event.transform.k);
      }
      svg.attr("transform", event.transform);
    });

  svg.call(zoom);*/
}

function getCurrentLocation(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(updatePosition);
  }else{
    alert("Geolocation is not supported in this browser! The browser will use a default location!");
  }
}

function updatePosition(position){
  currentPosition.lat = position.coords.latitude;
  currentPosition.lon = position.coords.longitude;
}

function ratio(availabilities,totalNumber){
  var totalNumberOfStations = 0;
  if(totalNumber === 0){
    return 0;
  } else {
    if(filter.electricalBikes){
      totalNumberOfStations += availabilities.electricalBikes;
    }
    if(filter.electricalInternalBatteryBikes){
      totalNumberOfStations += availabilities.electricalInternalBatteryBikes;
    }
    if(filter.electricalRemovableBatteryBikes){
      totalNumberOfStations += availabilities.electricalRemovableBatteryBikes;
    }
    if(filter.mechanicalBikes){
      totalNumberOfStations += availabilities.mechanicalBikes;
    }
    return totalNumberOfStations/totalNumber;
  }
}

function initMapData() {
  getCurrentLocation();
  d3.json("lyon.json").then((geoJSON) => {
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
      drawMap();
    });
  });
}

function initLeaftletMap(){
  return new L.Map("map", {center: [45.75,4.85], zoom: 12})
  .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));
}

function updateFilter(electricalBikesUpdated, electricalInternalBatteryBikesUpdated,
  electricalRemovableBatteryBikesUpdated, mechanicalBikesUpdated){
    filter.electricalBikes = electricalBikesUpdated;
    filter.electricalInternalBatteryBikes = electricalInternalBatteryBikesUpdated;
    filter.electricalRemovableBatteryBikes = electricalRemovableBatteryBikesUpdated;
    filter.mechanicalBikes = mechanicalBikesUpdated;
  drawMap();
}
map = initLeaftletMap();
initMapData();