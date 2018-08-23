var args = arguments[0] || {};
var navWin = args.navWin;

var loading = Alloy.Globals.UI.Loading.create($.window);
loading.show();

// ライセンスファイル
var licenseFiles = []
licenseFiles.push({
    title: 'Appcelerator Titanium Mobile',
    file: 'TITANIUM_LICENSE.txt',
});
if (OS_IOS) {
    licenseFiles.push({
        title: 'Google Map SDK for iOS',
        text: require('com.moshemarciano.googleMaps').openSourceLicenseInfo,
    });
    licenseFiles.push({
        title: 'Google Maps for iOS module',
        file: 'GOOGLE_MAP_IOS_MODULE_LICENSE.txt',
    });
}
licenseFiles.push({
    title: 'codebird-js',
    file: 'CODEBIRD_JS.txt',
});
licenseFiles.push({
    title: 'Toast-style Notification Widget',
    file: 'TOAST_WIDGET_LICENSE.txt',
});
licenseFiles.push({
    title: 'Alloy combobox widget',
    file: 'ALLOY_COMBOBOX_WIDGET_LICENSE.txt',
});
licenseFiles.push({
    title: 'Button widget',
    file: 'BUTTON_WIDGET_LICENSE.txt',
});
licenseFiles.push({
    title: 'Loading widget',
    file: 'LOADING_WIDGET_LICENSE.txt',
});

// 画面構築
$.window.addEventListener('open', function() {
    var wrapper = $.wrapper;
    for (var i = 0; i < licenseFiles.length; i++) {
        var itemController =
            Alloy.createController('info/software_license_item', { data: licenseFiles[i] });
        wrapper.add(itemController.getView());
    };
    loading.hide();
});
