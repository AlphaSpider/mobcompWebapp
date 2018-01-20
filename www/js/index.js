
var map;
var currLocation;
var destLocation;

function googleApiLoaded() {
    console.log("Google API has been loaded.");
}



function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 12
    });
    var infoWindow = new google.maps.InfoWindow({map: map});
    var currMarker = new google.maps.Marker({map: map});
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
    } else {
        //browser does not support geolocation
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                            'Error: The Geolocation service failed.' :
                            'Error: Your browser doesn\'t support geolocation.');
}

function showAddress() {
	$("addressInputPanel").panel("open", null);
	$("address").val("");
}

function closeAddress() {
	$("addressInputPanel").panel("close");
	var address = $().val();
}

