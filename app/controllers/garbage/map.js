var args = arguments[0] || {};
var navWin = args.navWin;
var userId = args.userId;
var userName = args.userName;

// Define using model
var GarbageDumpRemoteModel = Alloy.Globals.Model.getModel('garbage_dump_remote');
var userModel = Alloy.Globals.Model.getModel('user').create();
var valiableModel = Alloy.Globals.Model.getModel('variable').create();

// 定数
var DISABLE_POSITION_MSG = '現在位置情報を取得できませんでした。\nごみ情報を登録するためには、現在位置情報をONにする必要があります。';

// フィルター
var filter = Alloy.createController('garbage/filter');

// 保存用検索条件
var _savedConditions = {};

// MapHelperを作成
var mapHelper = require('/helpers/map_helper').create({
    latitude: Alloy.Globals.config.defaultLat,
    longitude: Alloy.Globals.config.defaultLng,
    zoom: Alloy.Globals.config.defaultZoom,
    latDelta: Alloy.Globals.config.defaultLatDelta,
    lngDelta: Alloy.Globals.config.defaultLngDelta,
    ioskey: Alloy.Globals.config.map.ios_key,
});

// MapHelperのイベントListen
mapHelper.on('positionchanged', function(e) {
    showGarbageDumps({ area: e.position });
});
mapHelper.on('markerselected', showGarbageDetail);

// Mapを生成して画面へ設定
mapHelper.addMap($.mapContainer, getInfoWindowView());

// GeoHelper
var geoHelper = require('/helpers/geo_helper').create();

// イベントハンドラ
if (OS_IOS) {
    // 更新ボタン
    $.refreshButton.addEventListener('click', function() {
        showGarbageDumps(null, true);
    });
    $.filterButton.addEventListener('click', function() {
        filter.show($.mapContainer);
    });
} else {
    $.showFilter = function() {
       filter.show($.mapContainer);
    }
}
$.registerBtn.addEventListener('click', goRegister);

filter.on('go', function(conditions) {
    showGarbageDumps(conditions, true);
});

// Appステート
Alloy.Globals.State.on('change_garbages', function() {
   showGarbageDumps(null, true);
});

// 画面変更
if (userId) {
    // ユーザーID指定モードの場合は新規ごみ登録機能&リフレッシュ機能なし＆TabBarなし
    $.window.title = userName + 'のマップ';
    $.mapContainer.remove($.registerBtn);
    if (OS_IOS) {
        $.window.leftNavButton = null;
        $.window.applyProperties({
            tabBarHidden: true,
        });
    }
}

// 画面構築
$.window.addEventListener('open', buildScreen);

/**
 * 画面構築処理
 */
function buildScreen() {
    // locationServiceの有無を確認
    if (!geoHelper.enableLocation()) {
        Alloy.Globals.UI.Alert.showBanner('', DISABLE_POSITION_MSG, $.window);
    }

    // 初回起動時は強制的にイベントを発火させる
    _.defer(mapHelper.foreceFirePositionChanged, 500);
}

/**
 * [PUBLIC]ごみ情報一覧を取得して表示
 */
function showGarbageDumps(conditions, forceRefresh) {
    conditions = conditions || _savedConditions;

    // GabageDumpModelからMarker情報を呼び出し
    var garbageDumpRemoteModel = GarbageDumpRemoteModel.create();
    garbageDumpRemoteModel.on('loaded', function(e) {
        // Markerを作成する
        var markers = [];
        for (var i = 0; i < e.garbage_dumps.length; i++) {
            // ピン画像を補完
            var gd = e.garbage_dumps[i];
            gd.pinImage = getPinImage(gd);

            var marker = mapHelper.createMarker(
                gd, valiableModel.getGarbageTypeName(gd.garbage_type),
                'ごみのランク:' + valiableModel.getGarbageDensityShortName(gd.garbage_density));
            markers.push(marker);
        };

        // Markerを地図上に表示
        mapHelper.showMarkers(markers, forceRefresh);
    });
    garbageDumpRemoteModel.on('error', function(error) {
        Alloy.Globals.UI.Alert.showBanner(error.title, error.message, $.window);
    });

    // 検索条件
    if (!conditions['area']) {
        var savedPosition = mapHelper.getSavedPosition();
        conditions['area'] = savedPosition;
    }
    if (userId) {
        conditions['user_id'] = userId;
    }

    // 検索実行
    garbageDumpRemoteModel.getGarbageDumps(conditions);

    // 検索した検索条件を保存
    _savedConditions = conditions;
}
$.showGarbageDumps = showGarbageDumps;

/**
 * ごみ詳細情報を表示する
 */
function showGarbageDetail(e) {
    var gdData = e.gd;

    Ti.API.trace('マーカータップ時情報');
    Ti.API.trace(gdData);

    // 地図を現在地へ移動する
    mapHelper.setPosition({
        latitude: gdData.latitude,
        longitude: gdData.longitude,
    });

    var createNavWin = false;
    if (!OS_IOS && !navWin) {
        navWin = require('/views/nav_window').createNavWindow();
        createNavWin = true;
    }
    var controller = Alloy.createController(
        'garbage/detail', { garbageDump: gdData, navWin: navWin });
    if (OS_IOS) {
        Alloy.Globals.UI.indexTabGroup.getActiveTab().open(controller.getView());
    } else {
        if (createNavWin) {
            navWin.open(controller.getView(), { modal: true });
        } else {
            navWin.openChildWindow(controller.getView());
        }
    }
}

/**
 * ごみ登録表示前の処理（ログイン済みチェックなど）
 */
function goRegister() {
    // ログイン済みかチェックする
    if (userModel.isLogined()) {
        showRegister();
    } else {
        showLogin(showRegister);
    }
}

/**
 * ごみ登録を表示する
 */
function showRegister(modalNavWin) {
    // locationServiceがOFFなら登録できない
    if (!geoHelper.enableLocation()) {
        Alloy.Globals.UI.Alert.showBanner('', DISABLE_POSITION_MSG, $.window);
        return;
    }
    geoHelper.getCurrentPosition(function(region, errorMsg) {
        if (region === false) {
            Alloy.Globals.UI.Alert.showBanner('', errorMsg, $.window);
            return;
        }

        // 地図を現在地へ移動する
        mapHelper.setPosition(region);

        // ModalWindowでごみ情報登録画面を開く
        _.defer(function() {
            var isCreateNabWin = false;
            if (!modalNavWin) {
                modalNavWin = require('/views/nav_window').createNavWindow();
                isCreateNabWin = true;
            }
            var controller = Alloy.createController('garbage/edit', {
                navWin: modalNavWin,
                region: region,
            });

            if (isCreateNabWin) {
                modalNavWin.open(controller.getView(), { modal:true });
            } else {
                modalNavWin.openChildWindow(controller.getView());
            }
        });
    });
}

/**
 * ログインを表示する
 * @param  {Function} callback ログイン完了後に実行する関数
 */
function showLogin(callback) {
    var title = '登録にはログインが必要です';
    var msg = 'マイページタブのログイン画面へ移動しますか？';

    Alloy.Globals.UI.Alert.showSelectAlert(title, msg, function() {
        Alloy.Globals.State.trigger('request_move_my_page');
    });
}

/**
 * [PUBLIC]地図上に表示するピン画像を取得
 */
function getPinImage(gd) {
    // 標準は散乱ごみの1
    var fileNmType = 'm', fileNmDensity = '1', fileNmDanger = 'm';

    // GarbageTypeから
    if (gd.garbage_type == 2) {
        fileNmType = 'w';
    } else if (gd.garbage_type == 3) {
        fileNmType = 'd';
    }

    // GarbageDensityから
    if (gd.garbage_density == 0) {
        fileNmDensity = '0';
    } else if (2 <= gd.garbage_density && gd.garbage_density <= 10) {
        fileNmDensity = gd.garbage_density + '';
    }

    // GarbageDangerから
    if (gd.garbage_dengared == 1) {
        fileNmDanger = 'd';
    }

    return '/images/markers/' +
        fileNmType + fileNmDanger + '_' + fileNmDensity + '.png';
}
$.getPinImage = getPinImage;

/**
 * 【使ってない】
 * InfoWindowViewを取得する
 * ※この段階では空で作成しておき内容は表示時に設定する
 */
function getInfoWindowView() {
    // iOS用のGoogleMap CustomeInfoWindowの仕様か否か、幅高さなどを絶対指定しないと
    // 表示されないので注意すること。なんでだよ...面倒だなぁ。
    // しかもこれのせいでTiShadowが使えなくなったし。まじで困る。
    var container = Ti.UI.createView({
        backgroundColor: '#fff',
        width: 200, height: 70,
        layout: 'composite',
    });
    var imageView = Ti.UI.createImageView({
        image: null,
        defaultImage: Alloy.Globals.UI.NO_IMAGE_FILE,
        backgroundColor: '#f0f',
        top: 5, left: 5,
        width: 60, height: 60,
    });
    var garbageTypeLabel = Ti.UI.createLabel({
        text: "",
        top: 5, left: 70,
        width: 115, height: 35,
        font: {fontSize:16, fontWeight:'bold'},
        color: "#333",
    });
    var garbageLebelLabel = Ti.UI.createLabel({
        text: '',
        bottom: 5, left: 70,
        width: 115, height: 30,
        font: {fontSize:14, fontWeight:'normal'},
        color: "#333",
    });

    var arrowLabel = Ti.UI.createLabel({
        center: {x: 190, y: 35},
        width: 10, height: 10,
        font: {fontFamily: Alloy.Globals.UI.font.fontAwesome.fontfamily},
        text: Alloy.Globals.UI.font.fontAwesome.icon('fa-angle-right'),
    });

    container.add(imageView);
    container.add(garbageTypeLabel);
    container.add(garbageLebelLabel);
    container.add(arrowLabel);

    // To Accessible Components.
    container.gd = null;
    container.imageView = imageView;
    container.garbageTypeLabel = garbageTypeLabel;
    container.garbageLebelLabel = garbageLebelLabel;

    return container;
}

/**
 * 【使ってない】
 * InfoWindowへ値を設定する
 */
function setInfoWindowValue(e) {
    e.infoWindow.gd = e.gd;
    e.infoWindow.imageView.image = Alloy.Globals.Util.getUrl(e.gd.image1_url);
    e.infoWindow.garbageTypeLabel.text = valiableModel.getGarbageTypeName(e.gd.garbage_type);
    e.infoWindow.garbageLebelLabel.text = 'ごみのランク:' + valiableModel.getGarbageDensityShortName(e.gd.garbage_density);
}
