var isPanorama = true;
var isTablet = false;

$(document).on("ready", function() {
	// 1. check if we are on a tablet or a smartphone
	console.log("READY!");
	checkTablet();
});

$("#compassPage").on("pagebeforeshow", function () {
    scaleCompass();
});
$("#main").on("pagebeforeshow", scaleContent());

$(window).on("orientationchange", function() {
	// 1. set panorama
	checkPanorama();
	scaleContent();
    scaleCompass();
});

$(function() {
    var timer_id;
    $(window).resize(function() {
        clearTimeout(timer_id);
        timer_id = setTimeout(function() {
            console.log("[scale-timer]: rescaling");
			checkPanorama();
			scaleCompass();
			scaleContent();
        }, 300);
    });
});

function scaleCompass() {
    var headerHeight = $("[data-role=header]").outerHeight();
    var windowHeight = $(window).height();
    if(!isPanorama) {
        // 1. css for the compass container
        var tempNewHeight = Math.floor((windowHeight - headerHeight) / 2.0);
        $(".custom-compass-base-pos").css({
            height: tempNewHeight
        });
        console.log("[compassPage.pagebeforeload]: new compass height = " + tempNewHeight);
        // 2. scale Compass
    }
}

function scaleContent() {
	console.log("[scaleContent]: scaling");
	// 1. set new css relative to tablet/smartphone
	if(isTablet) {
		$("#compassImg").removeClass("compass-img");
		$("#compassImg").addClass("compass-img-tab");
		$("#compassCircle").removeClass("custom-circle");
		$("#compassCircle").addClass("custom-circle-tab");
	} else {
		$("#compassImg").addClass("compass-img");
		$("#compassImg").removeClass("compass-img-tab");
		$("#compassCircle").removeClass("custom-circle-tab");	
		$("#compassCircle").addClass("custom-circle");
	}

	// 1. calc height for addressInputPanel
	var headerHeight = $("[data-role=header]").outerHeight();
	var newPanelHeight = $(".ui-panel").height() - headerHeight;
	$(".ui-panel").css({
		'top': headerHeight,
		'min-height': newPanelHeight
	});
	// 3. calc hight for map
	var windowHeight = $(window).height();
	var mapHeight = windowHeight - headerHeight - (windowHeight - Math.floor($("#startNavBtn").offset().top) + 3);
	console.log("[scaleContent]: "
				+ " windowHeight = " + windowHeight
				+ " mapHeight = " + mapHeight);
	$("#map").css({
		'height': mapHeight
	})

	// 4. calc Height for ui-conten
	var endNavBtnOffset = $("endNavBtn")
	var newContentHeight = windowHeight - headerHeight - endNavBtnOffset;
	$(".ui-content").css({
		'height': newContentHeight
	});

}
function checkPanorama() {
	if($(window).width() > $(window).height()) {
		isPanorama = true;
	} else {
		isPanorama = false;
	}
	console.log("[orientationChange]: is Panorama = " + isPanorama);
}

function checkTablet() {
	if($(window).width() >= 600) {
		isTablet = true;
	} else {
		isTablet = false;
	}
}
