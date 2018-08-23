// OSに応じたMapModuleを定義
var MapModule;
if (OS_IOS) {
    MapModule = require('com.moshemarciano.googleMaps');
} else {
    MapModule = require('ti.map');
}

/**
 * 定数
 */
var POSITION_SAVE_KEY = 'latest_position';
var CHECK_INTERVAL_POSITION_CHANGE = 500;

//
// MapHelper
//
function MapHelper(args) {
    var _self = _.clone(Backbone.Events);
    var _map,
        _targetView,
        _existingMarkers = {},
        _latestPosition = null,
        _latestPositionTime = null,
        _watchTimer = null,
        _isWatchChangePosition = false,
        _inProcShowMarker = false,
        _lastTapMarker;

    // iOSはGoogleMapのキー設定
    if (OS_IOS) {
        MapModule.licenseKey(args.ioskey);
    }
    
    // for Android
    var _androidIsCompleteLoading = false;

    // 初期表示位置
    var _defaultPosition = {
        // 名古屋城だぎゃー
        latitude: args.latitude || 36.566435,
        // 名古屋城だぎゃー
        longitude: args.longitude || 137.662092,
        // Google Map for iOS
        zoom: typeof args.zoom === 'undefined' ? 5 : args.zoom,
        // Android Map
        latitudeDelta: args.latDelta || 16.2,
        longitudeDelta: args.lngDelta || 15.8,
    };

    /**
     * 地図を作成して指定Viewへ追加する
     */
    _self.addMap = function(targetView) {
        _targetView = targetView;

        // 地図変更イベントの監視開始
        _self.startChangePositionDispatcher();

        if (OS_IOS) {
            _map = MapModule.createGoogleMap();
            _map.setCamera(_self.getSavedPosition());

            // 設定
            _map.zoomGestures = true;
            _map.scrollGestures = true;
            _map.tiltGestures = false;
            _map.rotateGestures = false;
            _map.myLocation = true;
            _map.myLocationButton = true;
            _map.compassButton = true;

            // イベント登録
            _map.addEventListener('changeCameraPosition', changePositionHandlerIOS);
            _map.addEventListener('tapMarker', function(e) {
                _lastTapMarker = e.marker;
            });
            _map.addEventListener('tapInfoWindowOfMarker', tapMarkerHandlerIOS);

        } else {
            _map = MapModule.createView();
            _self.setPosition();

            // 設定
            _map.userLocation = true;

            // イベント登録
            _map.addEventListener('regionchanged', changePositionHandlerAndroid);
            _map.addEventListener('click', tapMarkerHandlerAndroid);

            // Andoridは視点移動メソッドがAfterCompleteとBeforeで違うのでフラグ持つ
            var onCompleteFn = function() {
                _map.removeEventListener('complete', onCompleteFn);
                _androidIsCompleteLoading = true;
            };
            _map.addEventListener('complete', onCompleteFn);
        }

        // 地図を追加
        targetView.add(_map);
    }

    /**
     * 現在の地図の状態で、強制的に positionchanged イベントを発火する
     * ※画面初期起動時にどうしても positionchange イベントが発火しないので仕方なく
     */
    _self.foreceFirePositionChanged = function() {
        if (OS_IOS) {
            // GoogleMapモジュールにvisibleRegion(nearRightなど)を取得するメソッドがなかった
            // 仕方ないので1ポイントだけ動かして強制的にイベントを発行させることにした
            _map.scrollBy(1, 1);
        } else {
            changePositionHandlerAndroid(_map.getRegion());
        }
    }

    /**
     * 地図位置変更イベントの監視を開始する
     */
    _self.startChangePositionDispatcher = function() {
        _isWatchChangePosition = true;
        if (!_watchTimer) {
            _watchTimer = setInterval(checkChangePosition, CHECK_INTERVAL_POSITION_CHANGE);
        }
    }

    /**
     * 地図位置変更イベントの監視を終了する
     */
    _self.stopChangePositionDispatcher = function() {
        _isWatchChangePosition = false;
        _latestPosition = null;
        _latestPositionTime = null;
        clearInterval(_watchTimer);
        _watchTimer = null;
    }

    /**
     * 地図を指定された範囲へ移動（表示）する
     * @param Object position
     */
    _self.setPosition = function(position) {
        position = position || _self.getSavedPosition();
        _.defaults(position, _self.getSavedPosition()); // Zoomレベルなどを補完

        if (OS_IOS) {
            _map.animateToCameraPosition(position);
        } else {
            if (_androidIsCompleteLoading) {
                position['animate'] = true;
                _map.setLocation(position);
            } else {
                _map.setRegion(position);
            }
        }
    }

    /**
     * マーカー（Annotation/Marker）を作成する
     */
    _self.createMarker = function(args, title, subTitle) {
        var marker;
        if (OS_IOS) {
            marker = MapModule.createMarker({
                id: args.id,
                gd: args,
                location: {
                    latitude: args.latitude,
                    longitude: args.longitude
                },
                icon: args.pinImage,
                title: title,
                snippet: subTitle,
            });
        } else {
            marker = MapModule.createAnnotation({
                id: args.id,
                gd: args,
                latitude: args.latitude,
                longitude: args.longitude,
                image: args.pinImage,
                title: title,
                subtitle: subTitle,
            });
        }
        return marker;
    }

    /**
     * マーカー(s)を表示する。既に表示されているマーカーは無視する
     */
    _self.showMarkers = function(markers, forceRefresh) {
        Ti.API.trace('map_helper: showMarkers START');
        // 既に他のスレッドで実行中ならやらない
        if (_inProcShowMarker) {
            return;
        } else {
            _inProcShowMarker = true;
        }
        Ti.API.trace('map_helper: showMarkers ACTUALLY START');

        // 強制リフレッシュONなら表示されているマーカーを全消去
        try {
            if (forceRefresh) {
                _.each(_existingMarkers, function(marker, id) {
                    if (marker) {
                        if (OS_IOS) {
                            _map.removeMarker(marker);
                        } else {
                            _map.removeAnnotation(marker);
                        }
                    }
                });
                _existingMarkers = {};
            }

            for (var i = 0; i < markers.length; i++) {
                // 既に表示されているMarkerは無視
                if (!_existingMarkers[markers[i].id]) {
                    if (OS_IOS) {
                        _map.addMarker(markers[i]);
                    } else {
                        _map.addAnnotation(markers[i]);
                    }
                    // 既に表示されているMarkerに追加
                    _existingMarkers[markers[i].id] = markers[i];
                } else {
                    // Ti.API.trace('Avoid add duplicate marker id = ' + markers[i].id);
                }
            };
        } catch (e) {
            Ti.API.error(e);
        } finally {
            _inProcShowMarker = false;
        }
    }

    /**
     * 現在の表示範囲を保存する
     */
    _self.savePosition = function(position) {
        Ti.App.Properties.setObject(POSITION_SAVE_KEY, position);
    }

    /**
     * 保存した表示範囲を取得する
     */
    _self.getSavedPosition = function() {
        return Ti.App.Properties.getObject(POSITION_SAVE_KEY, _defaultPosition);
    }

    /**
     * 読み込み専用地図を作成して指定Viewへ追加する
     */
    _self.addMiniMap = function(targetView, position) {
        if (OS_IOS) {
            _map = MapModule.createGoogleMap();
            _map.setCamera(position);

            // 設定
            _map.zoomGestures = true;
            _map.scrollGestures = true;
            _map.tiltGestures = false;
            _map.rotateGestures = false;
            _map.myLocation = false;
            _map.myLocationButton = false;
            _map.compassButton = false;
        } else {
            _map = MapModule.createView();
            _map.setRegion(position);

            // 設定
            _map.userLocation = false;
            _map.userLocationButton = false;
            _map.enableZoomControls = false;
            _map.compassEnabled = false;
        }

        // 地図を追加
        targetView.add(_map);
    }

    return _self;

    //
    // PRIVATE
    //
    /**
     * 地図表示位置が変更されていないかチェックする
     */
    function checkChangePosition() {
        var fireEventFn = function() {
            // 表示範囲から外れたMarkerを削除
            removeOutOfRangeMarkers();

            // Deep copy
            var copiedPosition = JSON.parse(JSON.stringify(_latestPosition));
            _latestPosition = null;
            _latestPositionTime = null;

            // イベント発行
            _self.trigger('positionchanged', {position:copiedPosition});

            // Propertyに保存しておく
            _self.savePosition(copiedPosition);
        }

        // 一定時間イベントが発行しなくなったらイベント発射
        if (_isWatchChangePosition && _latestPosition) {
            var currentTime = (new Date()).getTime();
            if (_latestPositionTime
                    && (currentTime - _latestPositionTime) >= CHECK_INTERVAL_POSITION_CHANGE) {
                fireEventFn();
            }
        }
    }

    /**
     * iOS用 地図表示位置変更時イベントハンドラ
     */
    function changePositionHandlerIOS(e) {
        var position = {
            latitude: e.latitude,
            longitude: e.longitude,
            nearRightLat: e["visibleRegion.nearRight.latitude"],
            nearRightLng: e["visibleRegion.nearRight.longitude"],
            farLeftLat: e["visibleRegion.farLeft.latitude"],
            farLeftLng: e["visibleRegion.farLeft.longitude"],
            zoom: e.zoomLevel,
        };

        // 一定時間イベントが発生しなかったら動かすので、最新の位置を保存する
        _latestPosition = position;
        _latestPositionTime = (new Date()).getTime();
    }

    /**
     * Android用 地図表示位置変更時イベントハンドラ
     */
    function changePositionHandlerAndroid(e) {
        // deltaを変換
        var latitude = parseFloat(e.latitude);
        var longitude = parseFloat(e.longitude);
        var latDelta = parseFloat(e.latitudeDelta);
        var lngDelta = parseFloat(e.longitudeDelta);
        var nearRightLat = latitude - latDelta / 2;
        var nearRightLng = longitude + lngDelta / 2;
        var farLeftLat = latitude + latDelta / 2;
        var farLeftLng = longitude - lngDelta / 2;

        var position = {
            latitude: e.latitude,
            longitude: e.longitude,
            nearRightLat: nearRightLat,
            nearRightLng: nearRightLng,
            farLeftLat: farLeftLat,
            farLeftLng: farLeftLng,
            latitudeDelta: e.latitudeDelta,
            longitudeDelta: e.longitudeDelta,
        };

        // 一定時間イベントが発生しなかったら動かすので、最新の位置を保存する
        _latestPosition = position;
        _latestPositionTime = (new Date()).getTime();
    }

    /**
     * iOS用 マーカータップ時イベントハンドラ
     */
    function tapMarkerHandlerIOS(e) {
        _self.trigger('markerselected', {gd: _lastTapMarker.gd});
    }

    /**
     * Android用 マーカータップ時イベントハンドラ
     */
    function tapMarkerHandlerAndroid(e) {
        if (e.clicksource === 'pin') {
            _lastTapMarker = e.annotation;
        } else if (e.clicksource !== null) {
            _self.trigger('markerselected', {gd: _lastTapMarker.gd});
        }
    }

    /**
     * 表示範囲から外れたMarkerを削除する
     */
    function removeOutOfRangeMarkers() {
        if (!_latestPosition) {
            return;
        }

        var markerIdList = _.keys(_existingMarkers);
        for (var i = 0; i < markerIdList.length; i++) {
            var markerId = markerIdList[i];
            var marker = _existingMarkers[markerId];

            if (!marker) {
                continue;
            }

            var markerLat, markerLng;
            if (OS_IOS) {
                markerLat = parseFloat(marker.location.latitude);
                markerLng = parseFloat(marker.location.longitude);
            } else {
                markerLat = parseFloat(marker.latitude);
                markerLng = parseFloat(marker.longitude);
            }

            if (_latestPosition.nearRightLat <= markerLat && markerLat <= _latestPosition.farLeftLat &&
                _latestPosition.farLeftLng <= markerLng && markerLng <= _latestPosition.nearRightLng) {
                // console.debug('Marker is in map view id = ' + marker.id);
            } else {
                // console.debug('Remove marker id = ' + marker.id);
                if (OS_IOS) {
                    _map.removeMarker(marker);
                } else {
                    _map.removeAnnotation(marker);
                }
                marker = null;
                _existingMarkers[markerId] = null;
            }
        };
    }
}

exports.create = MapHelper;

/**
 * マップを利用できるか検査する（Android用）
 * ここでfalseが戻った場合、地図を表示させるとアプリが落ちるので注意すること
 */
exports.checkCanUseMap = function() {
    if (OS_IOS) {
        return true;    // iOSは検査不要
    } else {
        var rc = MapModule.isGooglePlayServicesAvailable();
        if (rc !== MapModule.SUCCESS) {
            Alloy.Globals.UI.Alert.showAlert(
                "Google Play開発者サービス エラー",
                "地図の表示に必要な「Google Play開発者サービス ライブラリ」が端末にインストールされていませんでした。\nPlayストアからインストールして、もう一度起動してください",
                function() {
                    Ti.Platform.openURL("https://play.google.com/store/apps/details?id=com.google.android.gms");
                }
            );
            return false;
        } else {
            return true;
        }
    }
};
