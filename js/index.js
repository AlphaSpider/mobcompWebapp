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
var lastCurrLocation;
var currDistance;
var lastAddressInput; 
var distanceThreshold = 15;
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
	
	// show LOADER view
	showLoadingView();
}); 

function initMap() {
    if(map == null) {
		map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 51.005665, lng: 10.505793},
			zoom: 6
		});
	}
	if(infoWindow == null)
		infoWindow = new google.maps.InfoWindow({map: map});
	if(currMarker == null)
		currMarker = new google.maps.Marker({map: map});
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            infoWindow.setPosition(pos);
            currMarker.setPosition(pos);
            currLocation = pos;
            infoWindow.setContent('Location found.');
            map.setCenter(pos);
			map.setZoom(12);
			hideLoadingView();
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
			hideLoadingView();
        });
		// 1. add onClick to map
		google.maps.event.addListener(map, "click", function(e) {
			// 1.1 new destination marker
			if(destMarker == null)
				destMarker = new google.maps.Marker({map: map});
			destMarker.setPosition(e.latLng);
			destLocation = {
				lat: e.latLng.lat(),
				lng: e.latLng.lng()
			};
			infoWindow.setPosition(e.latLng);
			infoWindow.setContent("Your destination");
			console.log("[maps.onClick]: Destination Lat = " 
						+ destLocation.lat
						+ " Lng = " + destLocation.lng
						+ " Start Lat = " + currLocation.lat
						+ " Lng = " + currLocation.lng);
		});
    } else {
        //browser does not support geolocation
		alert("Browser does not support GPS");
		hideLoadingView();
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
						if(destMarker == null)
							destMarker = new google.maps.Marker({map: map});
						destMarker.setPosition(results[0].geometry.location);
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

$("#startNavBtn").on("click", function() {
	// 1. check if a destination is set
	if(destMarker == null) {
		// show alert
		alert("Your have to set a destination on the Map.");
	} else {
		// 2. if yes, switch to compassPage
		$(":mobile-pagecontainer").pagecontainer("change", "#compassPage", {
			transition: 'slide',
			changeHash: false,
			reverse: false,
			showLoadMsg: true
		});
	}
});

$("#endNavBtn").on("click", function() {
	// prepare navigation
	endNavigation();
	$(":mobile-pagecontainer").pagecontainer("change", "#main", {
		transition: 'slide',
		changeHash: false,
		reverse: true,
		showLoadMsg: true
	});
	initMap();
});


$("#compassPage").on("pagebeforeshow", function () {
	console.log("[compassPage.onPagebeforeshow]: initialize navigation.")
	initNavigation();
});

function showLoadingView() {
	$("#loadingScreen").show();
	$.mobile.loading("show", {
		text: "Loading API",
		textVisible: true,
		theme: "a",
		textonly: false,
		html: ""
	});
}

function hideLoadingView() {
	// close LOADER view
	$("#loadingScreen").fadeOut();
	$.mobile.loading("hide");
}

function initNavigation() {
	// 1. init location update
	navigatorHandlerID = navigator.geolocation.watchPosition(updatePosition, failedPosUpdate);
	console.log("[initNavigation]: navigatorHandlerID = " + navigatorHandlerID);
	lastCurrLocation = currLocation;
	// 2. init compass update
	if("ondeviceorientationabsolte" in window) {
		$(window).on("deviceorientationabsolute", updateCompass);
	} else if ("ondeviceorientation" in window) {
		$(window).on("deviceorientation", updateCompass);
	} else {
		// event is not supported
		alert("An Event is not supported by this browser. Website could not work without it.");
		// end navigation
		endNavigation();
		// move back to map view
		$(":mobile-pagecontainer").pagecontainer("change", "#main", {
			transition: 'slide',
			changeHash: false,
			reverse: true,
			showLoadMsg: true
		});
	}
}

function endNavigation() {
	// 1. remove watchPosition update from navigator
	navigator.geolocation.clearWatch(navigatorHandlerID);
	// 2. stop compass updates
	$(window).off("deviceorientation");
	console.log("[endNavigation]: end navigation");
}

function updatePosition(pos) {
	currLastLocation = currLocation;
	// check what navigator watchPosition returns
	currLocation = {
		lat: pos.coords.latitude,
		lng: pos.coords.longitude
	};
	var newDist = calcDistanceLatLong(
					currLocation.lat, 
					currLocation.lng,
					destLocation.lat,
					destLocation.lng);
	// check if Destination is reached
	if(newDist < distanceThreshold ) {
		// TODO
		// destination reached, end navigation
		// and update UI
		endNavigation();
		alert("Destination reached!");
	} else {
		// update current distance
		currDistance = newDist;
		// show distance in UI
		if(newDist > 2000) {
			$("#unit").html("[km]");
			$("#distance").html(Math.round(newDist / 1000));
		} else {
			$("#unit").html("[meter]");
			$("#distance").html(newDist);
		}

	}	
}

function updateCompass(event) {
	var rot = getOrientationDegrees(
				currLocation.lat, 
				currLocation.lng,
				destLocation.lat,
				destLocation.lng);
				
	if(event.absolute) {
		console.log("[updateCompass]: absolut Support.");
		rot -= event.alpha;
				
	} else if(event.hasOwnProperty("webkitCompassHeading")) {
		console.log("[updateCompass]: webkit support.");
			rot -= (360 - event.webkitCompassHeading); 
	} else {
		console.log("[updateCompass]: backup solution");
		// asume, user is holding the phone in moving-direction
		// calculate the compass orientation based on the previous location
		var tempRot = getOrientationDegrees(
						lastCurrLocation.lat,
						lastCurrLocation.lng,
						currLocation.lat,
						currLocation.lng);
		rot -= tempRot;
	}

	$("#compassImg").css("transform", "rotate(" + rot + "deg)");
	console.log("[updateCompass]: rotation = " + rot
				+ " Curr[" + currLocation.lat + "|" + currLocation.lng + "] "
				+ "Dest[" + destLocation.lat + "|" + destLocation.lng + "]"
				+ "Last[" + lastCurrLocation.lat + "|" + lastCurrLocation.lng + "]");
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

	return deg;
}