var UserModel = Alloy.Globals.Model.getModel('user');
var HttpClient = require('/http_client');

/**
 * GarbageDumpModel
 */
function GarbageDumpModel() {
    var _self = _.clone(Backbone.Events);
    var _userModel = UserModel.create();

    /**
     * ごみ情報を取得する
     */
    _self.getGarbageDump = function(id) {
        var http = HttpClient.create();

        http.on('load', function(e) {
            var garbage_dump = e.data;
            // 緯度経度補完
            garbage_dump['latitude'] = garbage_dump['lat'];
            garbage_dump['longitude'] = garbage_dump['lng'];
            // ごみのレベルを変換
            garbage_dump['garbage_density'] = convertGarbageDensity(garbage_dump['garbage_density']);

            _self.trigger('loaded', { garbage_dump: garbage_dump });
        });
        http.on('error', function(error) {
            _self.trigger('error', { title: error.title, message: error.message });
        });

        var url = Alloy.Globals.Util.getUrl('/api/v1/garbage_dumps.json');
        url = Alloy.Globals.Util.addUrlPath(url, id);

        http.open('GET', url);
        http.send();
    };

    /**
     * ごみ情報一覧を取得する
     */
    _self.getGarbageDumps = function(conditions) {
        var http = HttpClient.create();

        http.on('load', function(e) {
            var garbage_dumps = e.data;
            for (var i = 0; i < garbage_dumps.length; i++) {
                // 緯度経度補完
                garbage_dumps[i]['latitude'] = garbage_dumps[i]['lat'];
                garbage_dumps[i]['longitude'] = garbage_dumps[i]['lng'];
                // ごみのレベルを変換
                garbage_dumps[i]['garbage_density'] = convertGarbageDensity(garbage_dumps[i]['garbage_density']);
            };
            _self.trigger('loaded', { garbage_dumps: garbage_dumps });
        });
        http.on('error', function(error) {
            _self.trigger('error', { title: error.title, message: error.message });
        });

        var url = Alloy.Globals.Util.getUrl('/api/v1/garbage_dumps.json');

        if (conditions['area']) {
            var area = conditions['area'];
            Ti.API.info('area==========> ' + JSON.stringify(area));
            url = Alloy.Globals.Util.addUrlParam(url, 'near_right_lat', area.nearRightLat);
            url = Alloy.Globals.Util.addUrlParam(url, 'near_right_lng', area.nearRightLng);
            url = Alloy.Globals.Util.addUrlParam(url, 'far_left_lat', area.farLeftLat);
            url = Alloy.Globals.Util.addUrlParam(url, 'far_left_lng', area.farLeftLng);
        }
        if (conditions['timeline']) {
            url = Alloy.Globals.Util.addUrlParam(url, 'timeline', 1);
        }
        if (conditions['user_id']) {
            url = Alloy.Globals.Util.addUrlParam(url, 'user_id', conditions['user_id']);
        }
        if (conditions['order_density']) {
            url = Alloy.Globals.Util.addUrlParam(url, 'order_density', conditions['order_density']);
        }
        if (conditions['in_created_at_weeks']) {
            url = Alloy.Globals.Util.addUrlParam(url, 'in_created_at_weeks', conditions['in_created_at_weeks']);
        }
        if (conditions['hidden_has_removed']) {
            url = Alloy.Globals.Util.addUrlParam(url, 'hidden_has_removed', conditions['hidden_has_removed']);
        }

        Ti.API.trace('ごみ情報取得URL/Conditions');
        Ti.API.trace(url);
        Ti.API.trace(conditions);

        http.open('GET', url);
        http.send();
    };

    /**
     * ごみ情報を登録する
     *  こちらでは新規 OR 更新は区別していない。サーバー側でIDがあれば更新と扱われる
     */
    _self.saveGarbageDump = function(gd, isEditMode) {
        // データ編集（ValidateはローカルModelで行われている前提）
        var postGdData = {};

        // 新規モードの場合はID不要
        if (!isEditMode) {
            delete gd['id'];
        }
        _.each(gd, function(value, key) {
            // データ詰め替え
            postGdData['garbage_dump[' + key + ']'] = value;
        });

        var http = HttpClient.create();
        http.on('load', function(e) {
            if (e.data.result === true) {
                _self.trigger('success', {gd_id: e.data.gd_id});
            } else {
                _self.trigger('error', {titie: '', message: e.data.message});
            }
        });
        http.on('error', function(error) {
            _self.trigger('error', {title: error.title, message: error.message});
        });

        var url = Alloy.Globals.Util.getUrl('/api/v1/garbage_dump.json');
        url = Alloy.Globals.Util.addUrlParam(url, _userModel.AUTH_TOKEN_KEY, _userModel.getAuthToken());
        http.open('POST', url);
        http.send(postGdData);
    };

    /**
     * ごみ情報を削除する
     */
    _self.deleteGarbageDump = function(id) {
        var http = HttpClient.create();
        http.on('load', function(e) {
            if (e.data.result === true) {
                _self.trigger('success');
            } else {
                _self.trigger('error', {titie: '', message: e.data.message});
            }
        });
        http.on('error', function(error) {
            _self.trigger('error', {title: error.title, message: error.message});
        });

        var url = Alloy.Globals.Util.getUrl('/api/v1/garbage_dump.json');
        url = Alloy.Globals.Util.addUrlPath(url, id);
        url = Alloy.Globals.Util.addUrlParam(url, _userModel.AUTH_TOKEN_KEY, _userModel.getAuthToken());
        http.open('DELETE', url);
        http.send();
    };

    /**
     * ごみ情報の処理済みを変更する
     */
    _self.changeGarbageDumpHasRemoved = function(id, hasRemoved) {
        var http = HttpClient.create();
        http.on('load', function(e) {
            if (e.data.result === true) {
                _self.trigger('success');
            } else {
                _self.trigger('error', {titie: '', message: e.data.message});
            }
        });
        http.on('error', function(error) {
            _self.trigger('error', {title: error.title, message: error.message});
        });

        var url = Alloy.Globals.Util.getUrl('/api/v1/garbage_dump.json');
        url = Alloy.Globals.Util.addUrlPath(url, id);
        url = Alloy.Globals.Util.addUrlParam(url, _userModel.AUTH_TOKEN_KEY, _userModel.getAuthToken());
        url = Alloy.Globals.Util.addUrlParam(url, 'has_removed', hasRemoved ? '1' : '0');
        http.open('PUT', url);
        http.send();        
    }

    return _self;

    //
    // PRIVATE
    //

    /**
     * 受け取ったごみランクをこちらで使い形に変更する
     * 　こちらのアプリ側では、0, 0.25(TT), 0.5(T), 1..10 の数値で扱う
     * 　ただしサーバーからは"TT"や"T"などが戻る場合があるため、その場合は強制的に変更する
     */
    function convertGarbageDensity(garbageDensity) {
        // null や undefined の場合はそのまま返却
        if (_.isNull(garbageDensity) || _.isUndefined(garbageDensity)) {
            return garbageDensity;
        }

        // TT=>0.25, T=>0.5 へ強制変更
        if (garbageDensity == 'TT') {
            return 0.25;
        } else if (garbageDensity == 'T') {
            return 0.5;
        } else {
            // 文字列だった場合は数値型に変換
            if (_.isString(garbageDensity)) {
                var ret = parseFloat(garbageDensity);
                if (isNaN(ret)) {
                    return null;
                } else {
                    return ret;
                }
            } else {
                return garbageDensity;
            }
        }
    }
}

//
// EXPORT
//
exports.create = GarbageDumpModel;
