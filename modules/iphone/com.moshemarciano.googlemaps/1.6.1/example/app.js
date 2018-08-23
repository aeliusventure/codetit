
// open a single window
var win = Ti.UI.createWindow({
	backgroundColor:'white'
});

// setup

var googlemaps = require('com.moshemarciano.googleMaps');
googlemaps.licenseKey("YOUR API KEY HERE");

var map = googlemaps.createGoogleMap({
	width: 300,
	height:390,
	top:60
});

map.setCamera ({
	latitude:51.43580627441406,
	longitude:-0.14256912469863892,
	zoom:9,
	bearing:0,
	viewingAngle:0
});

//map.traffic = false;
//map.myLocation = true;
//map.myLocationButton = true;
//map.compassButton = true;

map.customInfoWindow = false;


Ti.API.info("license:" + googlemaps.openSourceLicenseInfo);

// see below

var customIcon;
var infoWindow;
var infoWindowLabel;

// override map behavior of camera move
// when a marker is tapped

//map.cameraMoveOnMarkerTap = true;


// add markers

var marker = googlemaps.createMarker({
	title:      "Hello",
	snippet:    "World!",
	userData:   123,
	animated:   true,
	tintColor:  "green",
	location:   {latitude:51.60614700317383, longitude:-0.3897615075111389}
});

var marker2 = googlemaps.createMarker({
	title:      "Marker 2",
	snippet:    "Hi!",
	userData:   456,
	animated:   true,
	location:   {latitude:51.444366455078125, longitude:-0.20848709344863892},
	icon:       "icon.png" // loaded from your project resources folder
});

// use helper function to create a custom view as a marker
createCustomIcon("blue");


var marker3 = googlemaps.createMarker({
	title:      "Custom",
	snippet:    "Icon",
	animated:   true,
	iconView:   customIcon, // custom view as a map marker
	location:   {latitude:51.69614700317383, longitude:-0.2597615075111389}
});


marker.zIndex = 2;
marker.rotation = 90;
marker.flat = true;
marker.draggable = true;

map.addMarker(marker);
map.addMarker(marker2);
map.addMarker(marker3);

// add polylines

var baseLat = 51.43580627441406;
var baseLong = -0.14256912469863892;
var offset = 0.3;

var polyline1 = googlemaps.createPolyline({
	path:[baseLat - offset, baseLong, baseLat, baseLong - offset],
	color:"yellow",
	width:10
});


var polyline2 = googlemaps.createPolyline({
	path:[baseLat + offset, baseLong, baseLat, baseLong + offset],
	color:"green",
	width:10
});



var polyline3 = googlemaps.createPolyline({
	path:[baseLat + offset, baseLong, baseLat, baseLong - offset],
	color:"red",
	width:10
});



var polyline4 = googlemaps.createPolyline({
	path:[baseLat - offset, baseLong, baseLat, baseLong + offset],
	color:"blue",
	width:10
});



var polyline5 = googlemaps.createPolyline({
	path:[baseLat - offset, baseLong + 0.1, baseLat, baseLong + offset + 0.1],
	color:"magenta",
	width:10
});


map.addPolyline(polyline1);
map.addPolyline(polyline2);
map.addPolyline(polyline3);
map.addPolyline(polyline4);

map.addPolyline(polyline5);
map.removePolyline(polyline5);

// polygons

newYorkPath =  [42.5142, -79.7624,
                42.7783, -79.0672,
                42.8508, -78.9313,
                42.9061, -78.9024,
                42.9554, -78.9313,
                42.9584, -78.9656,
                42.9886, -79.0219,
                43.0568, -79.0027,
                43.0769, -79.0727,
                43.1220, -79.0713,
                43.1441, -79.0302,
                43.1801, -79.0576,
                43.2482, -79.0604,
                43.2812, -79.0837,
                43.4509, -79.2004,
                43.6311, -78.6909,
                43.6321, -76.7958,
                43.9987, -76.4978,
                44.0965, -76.4388,
                44.1349, -76.3536,
                44.1989, -76.3124,
                44.2049, -76.2437,
                44.2413, -76.1655,
                44.2973, -76.1353,
                44.3327, -76.0474,
                44.3553, -75.9856,
                44.3749, -75.9196,
                44.3994, -75.8730,
                44.4308, -75.8221,
                44.4740, -75.8098,
                44.5425, -75.7288,
                44.6647, -75.5585,
                44.7672, -75.4088,
                44.8101, -75.3442,
                44.8383, -75.3058,
                44.8676, -75.2399,
                44.9211, -75.1204,
                44.9609, -74.9995,
                44.9803, -74.9899,
                44.9852, -74.9103,
                45.0017, -74.8856,
                45.0153, -74.8306,
                45.0046, -74.7633,
                45.0027, -74.7070,
                45.0007, -74.5642,
                44.9920, -74.1467,
                45.0037, -73.7306,
                45.0085, -73.4203,
                45.0109, -73.3430,
                44.9874, -73.3547,
                44.9648, -73.3379,
                44.9160, -73.3396,
                44.8354, -73.3739,
                44.8013, -73.3324,
                44.7419, -73.3667,
                44.6139, -73.3873,
                44.5787, -73.3736,
                44.4916, -73.3049,
                44.4289, -73.2953,
                44.3513, -73.3365,
                44.2757, -73.3118,
                44.1980, -73.3818,
                44.1142, -73.4079,
                44.0511, -73.4367,
                44.0165, -73.4065,
                43.9375, -73.4079,
                43.8771, -73.3749,
                43.8167, -73.3914,
                43.7790, -73.3557,
                43.6460, -73.4244,
                43.5893, -73.4340,
                43.5655, -73.3969,
                43.6112, -73.3818,
                43.6271, -73.3049,
                43.5764, -73.3063,
                43.5675, -73.2582,
                43.5227, -73.2445,
                43.2582, -73.2582,
                42.9715, -73.2733,
                42.8004, -73.2898,
                42.7460, -73.2664,
                42.4630, -73.3708,
                42.0840, -73.5095,
                42.0218, -73.4903,
                41.8808, -73.4999,
                41.2953, -73.5535,
                41.2128, -73.4834,
                41.1011, -73.7275,
                41.0237, -73.6644,
                40.9851, -73.6578,
                40.9509, -73.6132,
                41.1869, -72.4823,
                41.2551, -72.0950,
                41.3005, -71.9714,
                41.3108, -71.9193,
                41.1838, -71.7915,
                41.1249, -71.7929,
                41.0462, -71.7517,
                40.6306, -72.9465,
                40.5368, -73.4628,
                40.4887, -73.8885,
                40.5232, -73.9490,
                40.4772, -74.2271,
                40.4861, -74.2532,
                40.6468, -74.1866,
                40.6556, -74.0547,
                40.7618, -74.0156,
                40.8699, -73.9421,
                40.9980, -73.8934,
                41.0343, -73.9854,
                41.3268, -74.6274,
                41.3583, -74.7084,
                41.3811, -74.7101,
                41.4386, -74.8265,
                41.5075, -74.9913,
                41.6000, -75.0668,
                41.6719, -75.0366,
                41.7672, -75.0545,
                41.8808, -75.1945,
                42.0013, -75.3552,
                42.0003, -75.4266,
                42.0013, -77.0306,
                41.9993, -79.7250,
                42.0003, -79.7621,
                42.1827, -79.7621,
                42.5146, -79.7621];

var polygon = googlemaps.createPolygon({
   path: newYorkPath,
   title:"New York State",
   color:"black",
   fillColor:"rgba(255,0,255,0.3)",    // purple color with 30% opacity
   width:2,
   tappable:true,
});

map.addPolygon(polygon);
//map.removePolygon(polygon);

// Circles

var circle = googlemaps.createCircle({
	radius:4000,
	location: {latitude:51.28580627441406, longitude:-0.12056912469863892},
	color:"black",
	fillColor:"yellow",
	tappable:true,
	title:"myCircle",
	width:2
});

map.addCircle(circle);
//map.removeCircle(circle);

// listen to events on map

map.addEventListener('tapAtCoordinate',function(e){
	Ti.API.info("map event : tapAtCoordinate =>" + JSON.stringify(e));
                   //  alert(map.mapType);
                     
});

map.addEventListener('changeCameraPosition',function(e){
	Ti.API.info("map event : changeCameraPosition =>" + JSON.stringify(e));
});

map.addEventListener('longPressAtCoordinate',function(e){
	Ti.API.info("map event : longPressAtCoordinate =>" + JSON.stringify(e));
});

map.addEventListener('tapMarker',function(e){
	Ti.API.info("map event : tapMarker =>" + JSON.stringify(e));
	             
	//if (map.selectedMarker == marker2)
	{
//		Ti.API.info("map event : selectedMarker is Marker2");
	}

	if (e.marker == marker) {
//		alert("marker user data : " + e.userData);
	} else if (e.marker == marker3) {
//		createCustomIcon("green");
//		marker3.iconView = customIcon;
	}
});

map.addEventListener('tapInfoWindowOfMarker',function(e){
	alert("Tapped Marker info window");

	Ti.API.info("map event : tapInfoWindowOfMarker =>" + JSON.stringify(e));
});


map.addEventListener('draggingMarker',function(e){
    Ti.API.info("map event : draggingMarker =>" + JSON.stringify(e));
});

map.addEventListener('dragMarkerBegin',function(e){
    Ti.API.info("map event : dragMarkerBegin =>" + JSON.stringify(e));
});

map.addEventListener('dragMarkerEnd',function(e){
    Ti.API.info("map event : dragMarkerEnd =>" + JSON.stringify(e));
});



map.addEventListener('tapOverlay',function(e){
	Ti.API.info("map event : tapOverlay =>" + JSON.stringify(e));

	if ( (e.overlayType == "polygon") && (e.title == "New York State") )
		Ti.API.info("NY Polygon tapped : " + e.title);
	else
		Ti.API.info("Polygon tapped : " + e.title);
});

// sample UI buttons

var btnHybrid = Titanium.UI.createButton({
	title:"Hybrid",
	height:24,
	top:10,
	width:60,
	left:0
});

var btnNormal = Titanium.UI.createButton({
	title:"Normal",
	height:24,
	top:10,
	width:60,
	left:65
});

var btnCamera = Titanium.UI.createButton({
	title:"Animate",
	height:24,
	top:10,
	width:60,
	left:130
});

var btnRemove = Titanium.UI.createButton({
	title:"Remove",
	height:24,
	top:10,
	width:60,
	left:195
});

var btn3D = Titanium.UI.createButton({
	title:"3D",
	height:24,
	top:10,
	width:60,
	left:260
});

var btnPolygon = Titanium.UI.createButton({
	title:"Polygon",
	height:24,
	top:35,
	width:60,
	left:0
});

var btnZoomIn = Titanium.UI.createButton({
	title:"ZoomIn",
	height:24,
	top:35,
	width:60,
	left:65
});

var btnSetTarget = Titanium.UI.createButton({
	title:"Target",
	height:24,
	top:35,
	width:60,
	left:130
});

var btnFitBounds = Titanium.UI.createButton({
	title:"Bounds",
	height:24,
	top:35,
	width:60,
	left:195
});

var btnDemo = Titanium.UI.createButton({
	title:"demo",
	height:24,
	top:35,
	width:60,
	left:260
});


// button events

btnNormal.addEventListener('click', function(e) {
	map.mapType = "normal";
});

btnHybrid.addEventListener('click', function(e) {
	map.mapType = "hybrid";
});

btnRemove.addEventListener('click', function(e) {
	map.removeMarker(marker);
	marker = null;
});

btnCamera.addEventListener('click', function(e) {
	map.animateToCameraPosition ({
		latitude:51.444366455078125,
		longitude:-0.20848709344863892,
		zoom:14,
		bearing:0
	});
});

btnPolygon.addEventListener('click', function(e) {
	map.animateToCameraPosition ({
		latitude:42.5142,
		longitude:-79.7624,
		zoom:5,
		bearing:0
	});
});


btn3D.addEventListener('click', function(e) {
	map.animateToViewingAngle(45);
});

btnZoomIn.addEventListener('click', function(e) {
	map.zoomIn();
	map.traffic = false;
});

btnSetTarget.addEventListener('click', function(e) {
	map.setTarget({
		latitude:48.898581,
	    longitude:2.2649,
	    zoom:7
	});
	map.traffic = true;
});

btnFitBounds.addEventListener('click', function(e) {
	map.fitBounds({
		NElatitude:48.898581,
		NElongitude:2.2649,
		SWlatitude:48.815907,
		SWlongitude:2.416306,
		padding:0
	});
});

var isInDemo = false;
var demoInterval;

btnDemo.addEventListener('click', function(e) {                      
	if (!isInDemo) {
		isInDemo = true;
		btnDemo.title = "stop";
	} else {
		btnDemo.title = "demo";
		clearInterval(demoInterval);
		isInDemo = false;
		return;
	}

	var cur_zoom = 20;
	var cur_bearing = 0;
	var cur_viewingAngle = 0;

	function updateCamera(){
		cur_zoom = Math.max(cur_zoom - 0.1, 17.5);
		cur_bearing += 10;
		cur_viewingAngle += 10;

		map.animateToCameraPosition ({
			latitude:-37.809487,
			longitude:144.965699,
			zoom:cur_zoom,
			bearing:cur_bearing,
			viewingAngle: cur_viewingAngle
		});
	}

	demoInterval = setInterval(function(){updateCamera()}, 250);
});



win.add(btnRemove);
win.add(btnCamera);
win.add(btnNormal);
win.add(btnHybrid);
win.add(btn3D);
win.add(btnPolygon);
win.add(btnZoomIn);
win.add(btnSetTarget);
win.add(btnFitBounds);
win.add(btnDemo);
 
win.add(map);

win.open();

// helper function to show how to create
// a view that will function as a custom marker

function createCustomIcon(backgroundColor) {
    
    customIcon = null;
    
    customIcon = Ti.UI.createView({
		width: 30,
		height: 30,
		backgroundColor:backgroundColor,
	});
    
    customIcon.add(Ti.UI.createLabel({
		color: "white",
		text: "8",
		width: 45,
		height: 30,
		top:0,
		font:{fontSize:20, fontWeight:'bold'},
		textAlign:'center'
	}));
}


// sample on how to use custom info window
// uncomment to test

// helper function to show how to create
// a view that will function as a custom marker

/*

function createInfoWindow() {
    
    infoWindow = null;
    
    infoWindow = Ti.UI.createView({
		width: 120,
		height: 80,
		backgroundColor:"red",
	});

	infoWindowLabel = Ti.UI.createLabel({
		color: "white",
		text: "Custom",
		width: 100,
		height: 80,
		top:0,
		font:{fontSize:20, fontWeight:'bold'},
		textAlign:'center'
	});

	infoWindow.add(infoWindowLabel);
	return infoWindow;
}

infoWindowLabel = null;
infoWindow = createInfoWindow();

*/

// add your own callback to the module
// the callback will be called every time
// the user taps on a marker, if this callback
// is not defined, the default infoWindow will
// be shown

// this is EXPERIMENTAL and thus has limitations:
// 
// you can't create views or do any fancy UI 
// stuff inside the callback other than update
// your pre-created view. this is due to some
// weird inter-thread issues between Titanium
// and iOS UI. if you do, your app will crash
// 
// also, after the callback a 'tapMarker' event
// will fire, if you need to handle it as well
// make sure not to do any blocking UI stuff, such
// as alert('hi') in the event handler or it might 
// make the map unresponsive. 

/*

 
map.InfoWindowCallback = function (e) {
      
   if (e.marker == marker) {
		infoWindow.backgroundColor = "red";
		infoWindowLabel.text = "Marker 1";
   } else if (e.marker == marker2) {
		infoWindow.backgroundColor = "magenta";
		infoWindowLabel.text = "Marker 2";
   } else if (e.marker == marker3) {
		infoWindow.backgroundColor = "blue";
		infoWindowLabel.text = "Marker 3";
   }
   
   return infoWindow;
};

*/




