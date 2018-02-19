/**
* Google API global variables
*/
var map;
var currMarker;
var destMarker;
var infoWindow;

/**
* Navigation global variables
*/
var currLocation;
var destLocation;
var currDistance;
var lastAddressInput; 
var distanceThreshold = 10;
var navigatorHandlerID = 0;

function googleApiLoaded() {
    console.log("Google API has been loaded.");
	initMap();
}

// init some values befor everything starts
$(document).ready(function() {
	
	//TODO: Add to "rescaling/multi-device"
	// calc height for addressInputPanel
	var headerHeight = $("[data-role=header]").outerHeight();
	var newPanelHeight = $(".ui-panel").height() - headerHeight;
	$(".ui-panel").css({
		'top': headerHeight,
		'min-height': newPanelHeight
	});
}); 

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 12
    });
	infoWindow = new google.maps.InfoWindow({map: map});
    currMarker = new google.maps.Marker({map: map});
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
            infoWindow.setPosition(pos);
            currMarker.setPosition(pos);
            currLocation = pos;
            infoWindow.setContent('Location found.');
            map.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
		// 1. add onClick to map
		google.maps.event.addListener(map, "click", function(e) {
			// 1.1 new destination marker
			if(destMarker == null)
				destMarker = new google.maps.Marker({map: map});
			destMarker.setPosition(e.latLng);
			infoWindow.setPosition(e.latLng);
			infoWindow.setContent("Your destination");
		});
    } else {
        //browser does not support geolocation
		alert("Browser does not support GPS");
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                            'Error: The Geolocation service failed.' :
                            'Error: Your browser doesn\'t support geolocation.');
}

$("#addressInputBtn").click(function () {
	$("#addressInputPanel").panel("toggle");
	// remove warnings
	$("#addressError").hide();
});

// Check if there are geolocations for the given address
$("#findOnMapBtn").click(function () {
	// ### 1. check for an input value ###
	if($("#address").val()) {
		console.log("Adresse ist nicht leer! " + $("#address").val());
		$("#addressError").hide();
		// ### 2. send Address to Google API ###
		
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode(
			{'address': $("#address").val()},
			function (results, status) {
				console.log("Got a result for the Query...");
				switch(status) {
					case google.maps.GeocoderStatus.OK:
						// ### 3. place marker on map and save position ###
						destMarker = new google.maps.Marker({
							map: map,
							position: results[0].geometry.location
						});
						map.setCenter(results[0].geometry.location);
						$("#addressInputPanel").panel("close");
						$("#address").val("");
						$("#addressError").hide();
						console.log("Geocoder Status: OK");
						
						// ### 4. Enable button to start the navigation view
						break;
					case google.maps.GeocoderStatus.ZERO_RESULTS:
						$("#addressError").html("No results for this address!");
						$("#addressError").show();
						console.log("Geocoder Status: ZERO_RESULTS" + status);
						break;
					case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
						$("#addressError").html("Internal Server Error!");
						$("#addressError").show();
						console.log("Geocoder Status: OVER_QUERY_LIMIT" + status);
						break;
					case google.maps.GeocoderStatus.REQUEST_DENIED:
						$("#addressError").html("Internal Server Error!");
						$("#addressError").show();
						console.log("Geocoder Status: REQUEST_DENIED" + status);
						break;
					case google.maps.GeocoderStatus.INVALID_REQUEST:
						$("#addressError").html("Incorrect address request!");
						$("#addressError").show();
						console.log("Geocoder Status: INVALID_REQUEST" + status);
						break;
					case google.maps.GeocoderStatus.UNKNOWN_ERROR:
						$("#addressError").html("Internal Server Error!");
						$("#addressError").show();
						console.log("Geocoder Status: UNKNOWN_ERROR" + status);
						break;
				}
			}
		);
	} else {
		// show warning: empty string
		$("#addressError").html("You have to enter a valid address!");
		//$("#addressError").style.display = "inline";
		$("#addressError").show();
	}
});

$("#endNavBtn").on("click", function() {
	// prepare navigation
	endNavigation();
});


$("#compassPage").on("pageCreate", function () {
	initNavigation();
});

function initNavigation() {
	// 1. init location update
	navigatorHandlerID = navigator.geolocation.watchPosition(updatePosition, failedPosUpdate);
	console.log("[initNavigation]: navigatorHandlerID = " + navigatorHandlerID);
	// 2. init compass update
	$(window).on("deviceorientation", updateCompass);
}

function endNavigation() {
	// 1. remove watchPosition update from navigator
	navigator.geolocation.clearWatch(navigatorHandlerID);
	// 2. stop compass updates
	$(window).off("deviceorientation");
	
}

function updatePosition(pos) {
	// check what navigator watchPosition returns
	currLocation = pos;
	var newDist = calcDistanceLatLong(
					currLocation.coords.latitude, 
					currLocation.coords.longitude,
					destLocation.coords.latitude,
					destLocation.coords.longitude);
	// check if Destination is reached
	if((currDistance - newDist) < distanceThreshold ) {
		// TODO
		// destination reached, end navigation
		// and update UI
		endNavigation();
	} else {
		// show distance in UI
		$("#unit").html("[meter]");
		$("#distance").html(newDist);
	}	
}

function updateCompass(event) {
	var rot = getOrientationDegrees(
				currLocation.latitude, 
				currLocation.longitude,
				destLocation.latitude,
				destLocation.longitude) - event.webkitCompassHeading; 
}

function failedPosUpdate() {
	alert("Position could not be updated!");
}

/*
* Returns distance in meters.
*/
function calcDistanceLatLong(lat1, long1, lat2, long2) {
	var lat = (lat1 + lat2) / 2 * (Math.PI / 180);

	var distance = Math.sqrt(Math.pow(111.3 * Math.cos(lat) * (long1 - long2), 2) + Math.pow(111.3 * (lat1 - lat2), 2));

	return Math.round(distance * 1000);
}

function getOrientationDegrees(lat1, long1, lat2, long2){
	var dLat = (lat2 - lat1) * (Math.PI / 180);
	var dLong = (long1 - long2) * (Math.PI / 180);

	lat1 *= (Math.PI / 180);
	lat2 *= (Math.PI / 180);

	var y = Math.sin(dLong) * Math.cos(lat2);
	var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLong);
	var deg = Math.atan2(y, x) * (180 / Math.PI);

	if(deg < 0) {
		deg = 360 - Math.abs(deg);
	}

	return Math.round(360 - deg);
}