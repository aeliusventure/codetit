//
// Application Settings
//
Alloy.Globals.config = {
    server: Alloy.CFG.server,
    defaultLat: 38,
    defaultLng: 137,
    defaultZoom: 5,         // Google Map for iOS
    defaultLatDelta: 16.2,  // Android Map
    defaultLngDelta: 15.8,  // Android Map
    map: {
        ios_key: Ti.App.Properties.getString('ios.googlemap.key'),
    },
    facebook: {
        dry_run: Alloy.CFG.sns_dry_run,
        appid: Ti.App.Properties.getString('ti.facebook.appid'),
    },
    twitter: {
        dry_run: Alloy.CFG.sns_dry_run,
        apikey: Ti.App.Properties.getString('twitter.apikey'),
        apisecret: Ti.App.Properties.getString('twitter.apisecret'),
    },
}

//
// UI
//
Alloy.Globals.UI = {};

// Loading
Alloy.Globals.UI.Loading = require('/views/wait_indicator');

// Alert
Alloy.Globals.UI.Alert = require('/views/alert');

// Toast
Alloy.Globals.UI.createToast = function(args) {
    Alloy.createWidget("com.mcongrove.toast", null, {
        text: args.text,
        duration: args.duration || 2500,
        view: args.view,
        close: true,
    });
};

// Display Width
if (OS_IOS) {
    Alloy.Globals.UI.displayWidth = Ti.Platform.displayCaps.platformWidth;
} else {
    Alloy.Globals.UI.displayWidth = Ti.Platform.displayCaps.platformWidth + 'px';
}

// No Image File
Alloy.Globals.UI.NO_IMAGE_FILE = '/images/no_image.png';

// Iconic Font
Alloy.Globals.UI.font = {};
Alloy.Globals.UI.font.fontAwesome = new (require('/IconicFont'))({ font: '/FontAwesome' });
// Alloy.Globals.UI.font.ligatureSymbols = new (require('/IconicFont'))({ font: '/LigatureSymbols' });

// Tabgroup（後から設定する）
Alloy.Globals.UI.indexTabGroup;

//
// Utils
//
Alloy.Globals.Util = require('/utils');

/**
 * サーバーURLを追加する
 * @param  {string} path
 * @return {string}
 */
Alloy.Globals.Util.getUrl = function(path) {
    return Alloy.Globals.Util.addServerUrl(path, Alloy.Globals.config.server);
}

//
// Models
//
Alloy.Globals.Model = {};

/**
 * Modelを取得する
 * @param  {string} modelName
 * @return {object}
 */
Alloy.Globals.Model.getModel = function(modelName) {
    return require('/models/' + modelName + '_model');
}

//
// State
//
Alloy.Globals.State = _.clone(Backbone.Events);
