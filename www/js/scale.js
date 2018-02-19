var isPanorama = false;


$("#compassPage").on("pagebeforeshow", function () {
    scaleCompass();
});

$(window).on("orientationchange", function() {
    scaleContent();
    scaleCompass();
});

$(function() {
    var timer_id;
    $(window).resize(function() {
        clearTimeout(timer_id);
        timer_id = setTimeout(function() {
            console.log("[scale-timer]: rescaling");
            scaleCompass();
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
		//TODO: Add to "rescaling/multi-device"
	// calc height for addressInputPanel
	var headerHeight = $("[data-role=header]").outerHeight();
	var newPanelHeight = $(".ui-panel").height() - headerHeight;
	$(".ui-panel").css({
		'top': headerHeight,
		'min-height': newPanelHeight,
		'z-index': 1002
	});
	// 2. calc hight for map
	// window.height - header 
	var windowHeight = $(window).height();
	var mapHeight = windowHeight - headerHeight;
	console.log("[scaleContent]: "
				+ " windowHeight = " + windowHeight
				+ " mapHeight = " + mapHeight);
	$("#map").css({
		'height': mapHeight
	})
}
