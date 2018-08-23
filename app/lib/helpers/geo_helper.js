// Titanium 設定
Ti.Geolocation.purpose = '現在位置を取得します';

var HttpClient = require('/http_client');

//
// Geo Helper
//
function GeoHelper() {
    var _self = _.clone(Backbone.Events);

    // 現在地
    var currentRegion;

    /**
     * 位置情報サービスが有効か検査する
     */
    _self.enableLocation = function() {
        // Locationが無効の場合はチェックイン不可
        return Ti.Geolocation.locationServicesEnabled;
    };

    /**
     * 現在地を取得する
     */
    _self.getCurrentPosition = function(callback) {
        Ti.Geolocation.getCurrentPosition(function(e) {
            if (e.error) {
                Ti.API.error('Error: ' + e.error);
                callback(false, '現在地の取得に失敗しました。時間をおいてやり直してみてください');
            } else {
                // 現在地を保存
                currentRegion = e.coords;
                callback(currentRegion);
            }
        });
    };

    /**
     * 最後に取得した現在地を取得する
     */
    _self.getLastCurrentRegion = function() {
        return currentRegion;
    }

    /**
     * 現住所を取得する
     */
    _self.getAddress = function(lat, lng, callback) {
        var http = HttpClient.create();

        http.on('load', function(e) {
            var data = e.data;
            var result = false;
            if (data.status === 'OK') {
                result = resolveAddress(data);

                Ti.API.trace('逆GEOからの住所コンポーネント取得');
                Ti.API.trace(result);
            }

            if (result === false) {
                callback('住所が取得できませんでした');
            } else {
                callback(result);
            }
        });
        http.on('error', function(error) {
            callback('住所取得でエラーが発生しました：' + error.error);
        });

        var url = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=true&language=ja';
        url = Alloy.Globals.Util.addUrlParam(url, 'latlng', lat + ',' + lng);
        http.getJson(url);
    }

    return _self;

    //
    // PRIVATE
    //

    /**
     * Google Geo Codeing の返却形式から必要な情報のみを取得する
     */
    function resolveAddress(data) {
        if (!data.results || !_.isArray(data.results)) {
            return false;
        }

        var addressObj = data.results[0];
        if (!addressObj.address_components || !_.isArray(addressObj.address_components)) {
            return false;
        }

        // 県 => addressObj.address_components[n].types[] === administrative_area_level_1
        // 市1 => addressObj.address_components[n].types[] === locality
        // 市2 => addressObj.address_components[n].types[] === locality
        Ti.API.trace('Google 逆GEO 回答1件目');
        Ti.API.trace(addressObj);
        try {
            var result = {
                address: addressObj.formatted_address
            };

            for (var i = addressObj.address_components.length - 1; i >= 0; i--) {
                if (addressObj.address_components[i].types && _.isArray(addressObj.address_components[i].types)) {
                    for (var j = 0; j < addressObj.address_components[i].types.length; j++) {
                        if (addressObj.address_components[i].types[j] === 'administrative_area_level_1') {
                            // 県
                            result.pref = addressObj.address_components[i].long_name;
                        } else if (addressObj.address_components[i].types[j] === 'locality') {
                            // 市町村（多分）
                            if (result.city1) {
                                result.city2 = addressObj.address_components[i].long_name;
                            } else {
                                result.city1 = addressObj.address_components[i].long_name;
                            }
                        }
                    }
                }
            }

            return result;
        } catch(e) {
            Ti.API.error('逆GEO解析で例外発生: ' + e.message);
            return false;
        }
    }
}

exports.create = GeoHelper;
