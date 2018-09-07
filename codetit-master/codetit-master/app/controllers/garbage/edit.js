// 利用するModelなど
var GarbageDumpRemoteModel = Alloy.Globals.Model.getModel('garbage_dump_remote');
var VariableModel = Alloy.Globals.Model.getModel('variable');
var FacebookHelper = require('/helpers/facebook_helper');
var TwitterHelper = require('/helpers/twitter_helper');
var GeoHelper = require('/helpers/geo_helper');

// 定数
var UNSELECT_ID = 0;
var KEY_PREFECTURE_ID = 'key_garbage_dump_prefecture_id';
var KEY_CITY_ID = 'key_garbage_dump_city_id';
var KEY_RIVER_ID = 'key_garbage_dump_river_id';

// 引数
var _args = arguments[0] || {};
var _navWin = _args.navWin;

var _loadingWin = Alloy.Globals.UI.Loading.create($.window);

// 新規？変更？モード
var _isEditMode = _args.garbageDump ? true : false;

// GarbageDump（変更の場合のみ）
var _gdData = _isEditMode ? _args.garbageDump : {};
// 座標
var _region = _args.region || {};
if (_isEditMode) {
    _region.latitude = _gdData.lat;
    _region.longitude = _gdData.lng;
}

// 保存用GarbageDumpID
var _savedGdId = _isEditMode ? _gdData.id : null;
// 子画面から取得したGarbageDumpSmallCategories
var _savedGdSmCatList;

// モデルやマスタ系
var _variableModel = VariableModel.create();
var _dangerValues = _variableModel.getGarbageDangerds();
var _removedValue = _variableModel.getHasRemoveds();
var _prefs = Alloy.createCollection('prefecture');
var _cities = Alloy.createCollection('city');
var _rivers = Alloy.createCollection('river');

// FacebookHelper初期化
var _fbHelper = FacebookHelper.create(Alloy.Globals.config.facebook);
_fbHelper.on('login_error', function(e) {
    Alloy.Globals.UI.Alert.showBanner('', e.message, $.window);
    $.share_facebook.value = false;
});
_fbHelper.on('login_cancel', function() {
    $.share_facebook.value = false;
});
_fbHelper.on('publish_error', function(error) {
    Alloy.Globals.UI.Alert.showAlert('Facebook投稿エラー', error.message);
});

// TwitterHelper初期化
var _twHelper = TwitterHelper.create(Alloy.Globals.config.twitter);
_twHelper.on('login_status_change', function() {
    $.share_twitter.value = _twHelper.isLogined();
});
_twHelper.on('login_error', function(e) {
    Alloy.Globals.UI.Alert.showBanner('', e.message, $.window);
    $.share_twitter.value = false;
});
_twHelper.on('publish_error', function(error) {
    Alloy.Globals.UI.Alert.showAlert('Twitter投稿エラー', error.message);
});

// イベントハンドラ登録
if (OS_IOS) {
    // キャンセルボタン
    $.cancelButton.addEventListener('click', function() {
        _navWin.close();
    });
    // 下書きボタン
    $.goDraftButton.addEventListener('click', showDraft);
}
// 写真追加ボタン
$.addPhoto.addEventListener('click', function() {
    var photoCtl = require('/views/photo_control').create(false);
    photoCtl.on('selectimage', function(e) {
        addImageView(e.image, true);
    });
    photoCtl.openSelectiveDialog(false);
});
// 送信ボタン
$.submitButton.addEventListener('click', onClickSendButton);
// 下書き保存ボタン
$.draftButton.addEventListener('click', onClickDraftButton);
// ごみ詳細情報ボタン
$.goGarbageCategoryButton.addEventListener('click', onClickCategoryButton);
// Facebookシェアスイッチ
$.share_facebook.addEventListener('change', onChangeShareFacebook);
// Twitterシェアスイッチ
$.share_twitter.addEventListener('change', onChangeShareTwitter);
// オプション領域表示/非表示
$.toggleOptButton.addEventListener('click', onClickToggleOptButton);
// 調査日（DatePicker）
$.searched_at.addEventListener('click', onClickSearchedAtField);
// 住所取得
$.getAddressButton.addEventListener('click', onClickGetAddressButton);

// フォーカス制御
$.wrapper.addEventListener('click', function(e) {
    // テキスト入力からフォーカスを外す
    if (e.source !== $.name && e.source !== $.searched_length 
            && e.source !== $.comment) {
        $.name.blur();
        $.searched_length.blur();
        $.comment.blur();        
    }
});

// モードによる画面切り替え
if (_isEditMode) {
    // 編集モード時は下書き系ボタンを削除
    if (OS_IOS) {
        $.window.rightNavButton = null;
    }
    $.wrapper.remove($.draftButtonContainer);
}

// Window開始時に処理開始
$.window.addEventListener('open', function() {
    buildScreen();
});

/**
 * 画面構築
 */
function buildScreen(fromDraft) {
    // タイトル
    if (ENV_DEV) { $.window.title = _isEditMode ? _gdData.id : $.window.title; }

    // 写真追加
    if (_isEditMode || fromDraft) {
        // 下書きからの復帰時は既存写真を削除
        if (fromDraft) {
            clearImage();
        }

        var isAddedPhoto = false;
        for (var i = 1; i < 5; i++) {
            // 写真追加：編集モード時は画像URL, 下書きからの復帰時は画像バイナリ
            if (_isEditMode) {
                if (_gdData['image' + i + '_url']) {
                    addImageView(Alloy.Globals.Util.getUrl(_gdData['image' + i + '_url']));
                    isAddedPhoto = true;
                }
            } else {
                if (_gdData['image' + i]) {
                    addImageView(_gdData['image' + i], true);
                    isAddedPhoto = true;
                }
            }
        }
        if (!isAddedPhoto) {
            addImageView(Alloy.Globals.UI.NO_IMAGE_FILE);
        }
    } else {
        addImageView(Alloy.Globals.UI.NO_IMAGE_FILE);
    }

    // ごみのランクドロップダウン
    var garbageDensities = _variableModel.getGarbageDensities();
    $.garbage_density.init($.getView());
    $.garbage_density.choices = convertVariablesToCombo(garbageDensities, $.garbage_density.hintText);
    $.garbage_density.id = _isEditMode || fromDraft ? _gdData.garbage_density : 1;

    // ごみの種別ドロップダウン
    var garbageTypes = _variableModel.getGarbageTypes();
    $.garbage_type.init($.getView());
    $.garbage_type.choices = convertVariablesToCombo(garbageTypes, $.garbage_type.hintText);
    $.garbage_type.id = _isEditMode || fromDraft ? _gdData.garbage_type : 1;

    // 危険物
    if (_isEditMode || fromDraft) {
        $.garbage_danger.value = _gdData.garbage_dengared == _dangerValues[0][0] ? true : false;
    }

    // 県・市町村・河川ドロップダウン
    if (!fromDraft) {
        $.pref.on('change', onChangePref);
    }
    _prefs.fetch();
    $.pref.init($.getView());
    $.pref.choices = convertCollectionToCombo(_prefs, $.pref.hintText);
    
    if (_isEditMode || fromDraft) {
        // 編集モード時は場所と河川も設定
        $.pref.id = _gdData.prefecture_id;
        onChangePref({ id: _gdData.prefecture_id });
        _.defer(function() {
            $.city.id = _gdData.city_id;
            $.river.id = _gdData.river_id;
        });
    }

    // 調査地点の名称
    $.name.value = _gdData.name || '';

    // 調査日
    $.searched_at.value = _isEditMode || fromDraft ? _gdData.searched_at : Alloy.Globals.Util.formatDate();

    // 予想投棄時期ドロップダウン
    var timeThrownAways = _variableModel.getTimeThrownAways();
    $.time_thrown_away.init($.getView());
    $.time_thrown_away.choices = convertVariablesToCombo(timeThrownAways, $.time_thrown_away.hintText);
    $.time_thrown_away.id = _isEditMode || fromDraft ? _gdData.time_thrown_away : null;

    // 右岸左岸ドロップダウン
    var whichRiverSides = _variableModel.getWhichRiverSides();
    $.which_river_side.init($.getView());
    $.which_river_side.choices = convertVariablesToCombo(whichRiverSides, $.which_river_side.hintText);
    $.which_river_side.id = _isEditMode || fromDraft ? _gdData.which_river_side : null;

    // 距離
    $.searched_length.value = _gdData.searched_length || '';

    // コメント
    $.comment.value = _gdData.comment || '';

    // 調査後回収
    if (_isEditMode || fromDraft) {
        $.has_removed.value = _gdData.has_removed ? true : false;
    }

    // Facebook連携有無
    if (_isEditMode) {
        $.share_facebook.enabled = false;
        $.share_facebook.value = false;
    } else if (_fbHelper.isLogined() && _fbHelper.getIsShareLastTime()) {
        $.share_facebook.value = true;
    }

    // Twitter連携有無
    if (_isEditMode) {
        $.share_twitter.enabled = false;
        $.share_twitter.value = false;
    } else if (_twHelper.isLogined() && _twHelper.getIsShareLastTime()) {
        $.share_twitter.value = true;
    }

    // 新規登録時は画面構築完了後にカメラ表示
    if (!_isEditMode && !ENV_DEV) {
        var delayMsec = OS_IOS ? 500 : 750;
        _.delay(function() {
            var photoCtl = require('/views/photo_control').create(false);
            photoCtl.on('selectimage', function(e) {
                addImageView(e.image, true);
            });
            photoCtl.takePhoto(true);
        }, delayMsec);
    }
}

/**
 * 県ドロップダウン変更時
 */
function onChangePref(e) {
    if (_.isNull(e.id) || _.isUndefined(e.id)) {
        return;
    }

    // 市町村ドロップダウンを変更する
    _cities.fetchByPrefecture(e.id);
    $.city.init($.getView());
    $.city.id = null;
    $.city.choices = convertCollectionToCombo(_cities, $.city.hintText);

    // 河川ドロップダウンを変更する
    _rivers.fetchByPrefecture(e.id);
    $.river.init($.getView());
    $.river.id = null;
    $.river.choices = convertCollectionToCombo(_rivers, $.river.hintText);
}

/**
 * 送信ボタンクリック時
 */
function onClickSendButton() {
    _loadingWin.show();

    // 画面を閉じるメソッド
    var closeFn = function(delay) {
        _.delay(function() {
            _navWin.close();
        }, (delay || 1500));
    }

    // 画面から値を取得
    var gdData = getGarbageDumpFromScreen();

    // まずはローカルへ下書き保存
    var gdModel = saveLocalGarbageDump(gdData);
    if (gdModel === false) {
        _loadingWin.hide();
        return;
    }

    // サーバー送信時に関係ない列が入ってるとエラーになるので削除
    if (gdData['local_id']) {
        delete gdData['local_id'];
    }

    // ネットワーク未接続時はここで終了
    if (!Ti.Network.online) {
        Alloy.Globals.UI.Alert.showBanner('',
            'ネットワークに接続されていません。\n内容は下書きに保存されます', $.window);
        closeFn();
        return;
    }

    // リモートへ保存
    var remoteGdModel = GarbageDumpRemoteModel.create();
    remoteGdModel.on('success', function(e) {
        _loadingWin.hide();
        Alloy.Globals.UI.createToast({
            text: '登録しました',
            view: $.window
        });

        // ローカルデータを削除する
        gdModel.destroy();

        // サーバーから取得したIDを補完
        gdData.id = e.gd_id;

        // Facebookへ投稿
        if ($.share_facebook.value) {
            shareFacebook(gdData);
        }

        // Twitterへ投稿
        if ($.share_twitter.value) {
            shareTwitter(gdData);
        }

        // イベント発行
        Alloy.Globals.State.trigger('change_garbages');

        closeFn(OS_IOS ? 1500 : 3000);
    });
    remoteGdModel.on('error', function(error) {
        _loadingWin.hide();
        Alloy.Globals.UI.Alert.showBanner(
            error.title, '送信エラーが発生しました。内容は下書きに保存されます\n(' + error.message + ')', $.window);
        closeFn(OS_IOS ? 1500 : 5000);
    });
    remoteGdModel.saveGarbageDump(gdData, _isEditMode);
}

/**
 * 下書きボタンクリック時
 */
function onClickDraftButton() {
    // 画面から値を取得
    var gdData = getGarbageDumpFromScreen();

    // ローカルへ保存（Validate不要）
    saveLocalGarbageDump(gdData, true);

    Alloy.Globals.UI.createToast({
        text: '下書きに保存しました',
        view: $.window
    });

    _.delay(function() {
        _navWin.close();
    }, 1500);
}

/**
 * ごみ詳細情報ボタンクリック時
 */
function onClickCategoryButton() {
    var controller = Alloy.createController('garbage/category', {
        navWin: _navWin,
        // 既に更新済みのデータがあればそれを優先
        gdsc: _savedGdSmCatList || _gdData.garbage_dumps_small_categories,
    });
    var controllerWindow = controller.getView();
    controller.on('register', function(e) {
        _navWin.closeChildWindow(controllerWindow);
        // 画面データを一時保管
        _savedGdSmCatList = e.garbage_dumps_small_category;
    });
    _navWin.openChildWindow(controllerWindow);
}

/**
 * Facebookシェア変更時ハンドラ
 */
function onChangeShareFacebook(e) {
    _fbHelper.setIsShareLastTime(e.value);
    if (e.value && !_fbHelper.isLogined()) {
        _fbHelper.login();
    }
}

/**
 * Twitterシェア変更時ハンドラ
 */
function onChangeShareTwitter(e) {
    _twHelper.setIsShareLastTime(e.value);
    if (e.value && !_twHelper.isLogined()) {
        _twHelper.login();
    }
}

/**
 * オプション領域表示非表示ボタンハンドラ
 */
function onClickToggleOptButton() {
    var props1, props2;
    // オプション領域のOpen/Close
    if ($.optionContainer.visible) {
        props1 = {
            height: 0,
            visible: false,
        };
        props2 = { text: Alloy.Globals.UI.font.fontAwesome.icon('fa-plus-square-o') };
    } else {
        props1 = {
            height: Ti.UI.SIZE,
            visible: true,
        };
        props2 = { text: Alloy.Globals.UI.font.fontAwesome.icon('fa-minus-square-o') };
    }
    $.optionContainer.applyProperties(props1);
    $.toggleOptBtnMarkLabel.applyProperties(props2);

    // オプション情報を開いて、且つまだ都道府県・河川名が設定されていなければ、前回に
    // 選択した値を設定する
    var savedPrefectureId = Ti.App.Properties.getString(KEY_PREFECTURE_ID, null);
    var savedCityId = Ti.App.Properties.getString(KEY_CITY_ID, null);
    var savedRiverId = Ti.App.Properties.getString(KEY_RIVER_ID, null);

    if (!$.pref.id && savedPrefectureId !== null) {
        $.pref.id = savedPrefectureId;
        onChangePref({ id: savedPrefectureId });
        _.defer(function() {
            if (!$.city.id && savedCityId !== null) {
                $.city.id = savedCityId;
            }
            if (!$.river.id && savedRiverId !== null) {
                $.river.id = savedRiverId;
            }            
        });
    }
}

/**
 * 調査日付Fieldクリック時ハンドラ
 */
function onClickSearchedAtField(e) {
    var selectedDate = new Date();
    if ($.searched_at.value) {
        selectedDate = new Date($.searched_at.value);
    }

    var datePicker = Alloy.createController('common/date_picker');
    datePicker.on('select', function(e) {
        $.searched_at.value = Alloy.Globals.Util.formatDate(e);
    });
    datePicker.show($.window, selectedDate);
}

/**
 * 住所取得ボタンクリック時ハンドラ
 */
function onClickGetAddressButton() {
    var geoHelper = GeoHelper.create();
    geoHelper.getAddress(_region.latitude, _region.longitude, function(result) {
        if (!result) {
            Alloy.Globals.UI.Alert.showAlert('', '住所の取得に失敗しました');
            return;
        }

        // 合致する県と市が無かった場合は住所を表示する
        var showAddressFn = function() {
            Alloy.Globals.UI.Alert.showAlert('取得した住所が合致しませんでした', result.address);
        }

        // 県(pref)は選択肢がひとつだけだが、市は2つある(city1, city2)。
        // city1のみ, city1+city2, city2のみの3パターンで、市町村に合致するのがないか探す
        var matchPref = false;
        _.each($.pref.choices, function(value1, key1, list1) {
            if (list1[key1]['title'] === result.pref) {
                $.pref.id = key1;
                matchPref = true;

                // 県変更処理
                onChangePref({ id: key1 });

                // 一瞬あけないとAndroidでうまくいかない
                _.defer(function() {
                    var matchCity = false;
                    // 市を合致させる
                    _.each($.city.choices, function(value2, key2, list2) {
                        var title = list2[key2]['title'];
                        if (title === result.city1 
                                || title === result.city1 + result.city2 || title === result.city2) {
                            $.city.id = key2;
                            matchCity = true;
                        }
                    });
                    if (!matchCity) {
                        showAddressFn();
                    }
                });
            }
        });

        if (!matchPref) {
            showAddressFn();
        }
    });
}

/**
 * ローカルSQLiteへGarbageDumpデータを保存する
 */
function saveLocalGarbageDump(gdData, skipValidate) {
    var data = _.clone(gdData);

    // 更新モード時は同じIDのデータをを消しておく
    if (_isEditMode) {
        var collection = Alloy.createCollection('garbage_dump');
        collection.destroyDuplicate(data.id);
    }

    // 下書きで保存した際のlocal_idが存在すれば削除しておく
    if (data.local_id) {
        var collection = Alloy.createCollection('garbage_dump');
        collection.fetch();
        var model = collection.get(data.local_id);
        if (model) {
            model.destroy();
        }
    }

    // 登録日時と更新日時を設定
    if (!_isEditMode) {
        data['created_at'] = Alloy.Globals.Util.getNowDbDateTime();
    }
    data['updated_at'] = Alloy.Globals.Util.getNowDbDateTime();

    var model = Alloy.createModel('garbage_dump');
    if (skipValidate === true) {
        model.save(data, { silent: true });
        return model;
    } else {
        model.on('error', function(model, error) {
            Alloy.Globals.UI.Alert.showBanner('', error, $.window);
        });
        if (model.set(data)) {
            model.save();
            return model;
        } else {
            return false;
        }
    }
}

/**
 * 画面からGarbageDumpデータを取得する
 */
function getGarbageDumpFromScreen() {
    // 保存用データを作成
    var gdData = {
        id: _savedGdId || null,
        lat: _region.latitude || null,
        lng: _region.longitude || null,
        prefecture_id: $.pref.id || null,
        city_id: $.city.id || null,
        river_id: $.river.id || null,
        name: $.name.value || null,
        searched_at: $.searched_at.value,
        garbage_type: $.garbage_type.id || null,
        garbage_density: $.garbage_density.id || -1,    // これだけ値=0があるので
        garbage_dengared: $.garbage_danger.value ? _dangerValues[0][0] : _dangerValues[1][0],
        time_thrown_away: $.time_thrown_away.id || null,
        which_river_side: $.which_river_side.id || null,
        searched_length: $.searched_length.value || null,
        comment: $.comment.value.toString().replace(/\n/g, ' ') || null,    // 改行があるとWebが動かなくなる...／(^o^)＼ﾅﾝﾃｺｯﾀｲ
        has_removed: $.has_removed.value ? _removedValue[1][0] : _removedValue[0][0],
    };

    // 写真を取得
    var imageViews = $.imageContainer.views;
    for (var i = 0; i < imageViews.length; i++) {
        // imageプロパティが文字列ならURLとみなして変更なしとする
        if (!_.isString(imageViews[i].image)) {
            gdData['image' + (i + 1)] = imageViews[i].image;
            Ti.API.debug('Image' + (i + 1) + "'s mimeType = " + gdData['image' + (i + 1)].mimeType);
        }
    };

    // GarbageDumpSmallCategoryはJSON文字列にして保存
    var gdSmCatData = [];
    if (_savedGdSmCatList) {
        gdSmCatData = _savedGdSmCatList;
    } else if (_gdData.garbage_dumps_small_categories) {
        gdSmCatData = _gdData.garbage_dumps_small_categories;
    }
    gdData['garbage_dumps_small_categories'] = JSON.stringify(gdSmCatData);

    // 下書き保存された際のIDがあれば追加する
    gdData.local_id = _gdData.local_id;

    if (ENV_DEV) {
        Ti.API.trace('画面から取得したごみデータ');
        Ti.API.trace(gdData);
    }

    // 場所と河川を前回情報としてプロパティへ保存
    Ti.App.Properties.setString(KEY_PREFECTURE_ID, gdData.prefecture_id);
    Ti.App.Properties.setString(KEY_CITY_ID, gdData.city_id);
    Ti.App.Properties.setString(KEY_RIVER_ID, gdData.river_id);

    return gdData;
}

/**
 * Imageを追加する
 */
function addImageView(image, isBinary) {
    var imageViews = $.imageContainer.views;

    // カメラから追加された場合はNO_IMAGEを置き換える
    var isReplacedNoImage = false;
    if (isBinary === true) {
        for (var i = 0; i < imageViews.length; i++) {
            // NoImage画像を探す
            if (imageViews[i].isNoImage) {
                imageViews[i].image = image;
                imageViews[i].isNoImage = false;
                isReplacedNoImage = true;
                $.imageContainer.scrollToView(imageViews[i]);
                break;
            }
        };
    }

    if (isReplacedNoImage === false) {
        var imageView = Ti.UI.createImageView({
            image: image,
            isNoImage: image === Alloy.Globals.UI.NO_IMAGE_FILE,
        });
        imageView.applyProperties($.createStyle({
            classes: ['garbageImage'],
        }));
        imageViews.push(imageView);
        $.imageContainer.views = imageViews;
        if (isBinary === true) {
            $.imageContainer.scrollToView(imageView);
        }
    }
}

/**
 * Imageをクリアする
 */
function clearImage() {
    $.imageContainer.views = [Ti.UI.createImageView({
        image: Alloy.Globals.UI.NO_IMAGE_FILE,
        isNoImage: true,
    })];
}

/**
 * 下書き画面を表示する
 */
function showDraft() {
    var controller = Alloy.createController('garbage/draft', {
        navWin: _navWin,
    });
    var controllerWindow = controller.getView();
    controller.on('select', function(e) {
        _navWin.closeChildWindow(controllerWindow);

        // 下書き画面から取得したごみ情報を保存
        _gdData = e.garbageDump;

        // 画面を構築する
        Ti.API.error('11111111111111111111111111111111111111111111111111');
        buildScreen(true);
        Ti.API.error('2222222222222222222222222222222');

        // 取得したSmallCategoryデータを戻す
        _savedGdSmCatList = JSON.parse(e.garbageDump.garbage_dumps_small_categories);
    });
    _navWin.openChildWindow(controllerWindow);
}

/**
 * DBの内容をComboboxに適した形へ変換する
 */
function convertCollectionToCombo(collection, hintText) {
    var result = {};

    // Androidは空行が無いので追加
    if (!OS_IOS) {
        result[UNSELECT_ID] = {
            title: hintText || '選択してください',
        }
    }

    collection.each(function(item) {
        result[item.get('id')] = {
            title: item.get('name'),
        };
    });
    return result;
}

/**
 * variable_modelの内容をComboboxに適した形へ変換する
 */
function convertVariablesToCombo(variables, hintText, skipBlank) {
    var result = {};

    // Androidは空行が無いので追加
    // if (!OS_IOS && skipBlank !== true) {
    //     result[UNSELECT_ID] = {
    //         title: hintText || '選択してください',
    //     }
    // }

    for (var i = 0; i < variables.length; i++) {
        result[variables[i][0]] = {
            title: variables[i][1],
        };
    };
    return result;
}

/**
 * Facebookへ投稿
 */
function shareFacebook(gd) {
    // 別スレッドでやる
    // _.defer(function() {
        _fbHelper.publish(getSnsShareString(gd), gd.image1);
    // });
    
}

/**
 * Twitterへ投稿
 */
function shareTwitter(gd) {
    // _.defer(function() {
        _twHelper.publish(getSnsShareString(gd), gd.image1);
    // });
}

/**
 * SNSへ投稿する文言を取得
 */
function getSnsShareString(gd) {
    // 投稿内容組み立て
    var str = 'ごみを調査しました。\n';
    str += 'ごみの種類は ' + _variableModel.getGarbageTypeName(gd.garbage_type) + ' でした。\n';
    str += 'ごみの密度は ' + _variableModel.getGarbageDensityName(gd.garbage_density) + ' でした。\n';
    if (gd.has_removed == _removedValue[1][0]) {
        str += '\n調査後にごみは回収しました。';
    }

    str += Alloy.Globals.Util.getUrl('/share/' + gd.id) + ' \n\n';
    str += '~ごみマップ~ #gomimap';

    return str;
}
