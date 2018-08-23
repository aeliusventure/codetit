// This is a reference file of how to use the googleMaps module in
// different window scenarios. all of these were tested for correct
// memory usage and leaks, all have passed.
// 
// see bottom of file for the various scenarios


var gmaps = require('com.moshemarciano.googleMaps');
gmaps.licenseKey('AIzaSyBqM0p-AIzaSyBePtgsYwwu3rRJkhiaXZFCDDdeJTCtvyA');

function addMap(w, x, y)
{
    Titanium.API.info ('!!! create map');

	var mapM = gmaps.createGoogleMap({
		myLocation: true,
		rotateGestures: false,
		customInfoWindow: false,
		tiltGestures: false,
		mapType: 'normal',
		width: 250,
		height:250,
		top:x,
		left:y
	});

	var m1 = gmaps.createMarker({
		title: 'vector pin',
		location: {
			latitude: 51.30614700317383,
			longitude: -0.389761507511138
		},
		icon: '/images/district_pin.png',
		animated: true
	});
    
	mapM.addMarker(m1);
    
	var baseLat = 51.43580627441406;
	var baseLong = -0.14256912469863892;
	var offset = 0.3;
    
	var r1 = gmaps.createPolyline({
		path: [baseLat - offset, baseLong, baseLat, baseLong - offset],
		color: "yellow",
		width: 4
	});
    
	mapM.addPolyline(r1);
    
	mapM.setCamera({
		latitude: 51.43580627441406,
		longitude: -0.14256912469863892,
		zoom: 9,
		bearing: 0,
		viewingAngle: 0
	});

    w.add(mapM);

    return mapM;
}

function removeMap (map) {
	map.removeMap();
	map = null;
}

function openWindow()
{
	var mapWin = Titanium.UI.createWindow({backgroundColor: 'green'});

	map2 = addMap(mapWin, 0, 0);

	var close_btn =Ti.UI.createButton({
		title:'close',
		right:10,
		top:10
	});

	mapWin.add (close_btn);

	close_btn.addEventListener('click', function(){
        map2 = null;
        mapWin.remove (close_btn);
        mapWin.close();
	});

	mapWin.open();
}

function setupWindow(a) {
	var win1 = Titanium.UI.createWindow({
		title: '',
		backgroundColor: '#fff'
	});

	var btn = Ti.UI.createButton({
		title: 'new Window',
	    left:0
	});

	win1.add(btn);	
	win1.open();

	if (a)
		var mainMap = addMap(win1, 150,150);

	btn.addEventListener('click', function() {
		openWindow();
	});
}

function setupDrilldown(a) {

	var win1 = Titanium.UI.createWindow({
		title: 'test',
		backgroundColor: 'white'
	});

	var btnNav = Ti.UI.createButton({
		title: 'new Navigation',
	  bottom:50
	});

	win1.add(btnNav);

	if (a) {
		firstMap = addMap(win1, 0, 0);
	}

	var tab = Ti.UI.createTab({
		title:'tab',
		window:win1
	});

	var tabGroup = Ti.UI.createTabGroup({
		tabs:[tab]
	});

	tabGroup.open();

	btnNav.addEventListener('click', function() {
		var tabWin = Titanium.UI.createWindow({backgroundColor: 'blue'});
		var map3 = addMap (tabWin, 125, 125);

		tab.open(tabWin);

		tabWin.addEventListener('close', function() {
			Titanium.API.info ("drill down 1");
	        map3 = null;
		});
	});
}

function setupDrilldownMulti() {
	setupDrilldown (true);
}

function setupOneMap() {
	setupWindow (true);
}


// test case #1: new window, multiple map case - PASSED
//setupOneMap();

// test case #2: new window, single map case - PASSED
//setupWindow();

// test case #3: drill down, single inner map case - PASSED
//setupDrilldown();

// test case #4: drill down, multiple map case - PASSED
setupDrilldownMulti();