// 引数
var args = arguments[0] || {};
var navWin = args.navWin;
var gdId = args.garbageDump.id;

// 利用Model初期化
var val = Alloy.Globals.Model.getModel('variable').create();
var userModel = Alloy.Globals.Model.getModel('user').create();
var GarbageDumpRemoteModel = Alloy.Globals.Model.getModel('garbage_dump_remote');
var prefectures = Alloy.createCollection('prefecture');
var cities = Alloy.createCollection('city');
var rivers = Alloy.createCollection('river');

// MapHelperを作成
var mapHelper = require('/helpers/map_helper').create({
    ioskey: Alloy.Globals.config.map.ios_key,
});
// LoadingView
var loading = Alloy.Globals.UI.Loading.create($.window);

// イベントハンドラ登録
$.toggleOptButton.addEventListener('click', onClickToggleOptButton);
$.reportSpam.addEventListener('click', onClickReportSpam);
$.window.addEventListener('open', initData);

// データが更新されたら内容再読み込み
// iOSのみ。Androidは明細,編集Windowの両方が閉じる
// ただし削除時はやらない
var inDelete = false;
if (OS_IOS) {
    Alloy.Globals.State.on('change_garbages', function() {
        if (!inDelete) {
            _.delay(initData, 500);
        }
    });
}

/**
 * データを初期化する
 */
function initData() {
    loading.show();

    prefectures.fetch();
    cities.fetch();
    rivers.fetch();

    var gdRemoteModel = GarbageDumpRemoteModel.create();
    gdRemoteModel.on('loaded', function(e) {
        buildScreen(e.garbage_dump);
        loading.hide();
    });
    gdRemoteModel.on('error', function(error) {
        loading.hide();
        Alloy.Globals.UI.Alert.showBanner(error.title, error.message, $.window);
    });
    gdRemoteModel.getGarbageDump(gdId);
}

/**
 * 画面を構築
 */
function buildScreen(gd) {
    // タイトル
    if (ENV_DEV) { $.window.title = gd.id; }

    // データ編集
    gd.user = gd.user || {};
    var prefecture = prefectures.get(gd.prefecture_id);
    var city = cities.get(gd.city_id);
    var river = rivers.get(gd.river_id);

    // データ設定
    $.garbage_density_name.text = val.getGarbageDensityName(gd.garbage_density);
    $.garbage_type_name.text = val.getGarbageTypeName(gd.garbage_type);
    $.garbage_dengared_name.text = val.getGarbageDangerdName(gd.garbage_dengared);
    $.address.text = (prefecture ? prefecture.get('name') : '') + '' + (city ? city.get('name') : '');
    $.river.text = river ? river.get('name') : '';
    $.name.text = gd.name;
    $.searched_at.text = gd.searched_at;
    $.time_thrown_away_name.text = val.getTimeThrownAwayName(gd.time_thrown_away);
    $.which_river_side_name.text = val.getWhichRiverSideName(gd.which_river_side);
    $.searched_length.text = (gd.searched_length || '') + 'm';
    $.comment.text = gd.comment;
    $.has_removed_name.text = val.getHasRemovedName(gd.has_removed);
    $.user_name.text = gd.user.nick_name || '';

    $.goGarbageCategoryButton.addEventListener('click', function() {
        onGarbageCategory(gd);
    });

    // ログインしていればゴミ回収ボタンは表示する
    if (!userModel.isLogined()) {
        $.wrapper.remove($.removeGdButtonContainer);
    } else {
        $.removeGdButtonContainer.setVisible(true);
        changeRemoveGdButton(gd.has_removed);
        $.removeGdButton.addEventListener('click', function() {
            doChangeGdHasRemoved(gd)
        });
    }

    // 自分が登録ユーザーの場合のみ編集削除ボタン表示
    if (!userModel.isLogined() || userModel.getUser().id != gd.user_id) {
        $.wrapper.remove($.editButtonContainer);
        $.wrapper.remove($.deleteButtonContainer);
    } else {
        $.editButtonContainer.setVisible(true);
        $.deleteButtonContainer.setVisible(true);

        $.editButtonContainer.addEventListener('click', function() {
            goEdit(gd);
        });
        $.deleteButton.addEventListener('click', doDelete);
    }

    loading.hide();

    // 写真設定（1枚も存在しなければNoImageを表示）
    // ※なーんかimageがロードし終わらないとLoadingが完了にならないので、写真は最後に設定してみる
    var images = [];
    var imageStyle = $.createStyle({
        classes: ['garbageImage'],
    });
    for (var i = 1; i < 5; i++) {
        if (gd['image' + i + '_url']) {
            var image = Ti.UI.createImageView({
                image: Alloy.Globals.Util.getUrl(gd['image' + i + '_url'])
            });
            image.applyProperties(imageStyle);
            images.push(image);
        }
    }
    if (images.length === 0) {
        var image = Ti.UI.createImageView({
            image: Alloy.Globals.UI.NO_IMAGE_FILE,
        });
        image.applyProperties(imageStyle);
        images.push(image);
    }
    $.imageContainer.views = images;

    // ミニマップ設定
    mapHelper.addMiniMap($.mapContainer, {
        latitude: gd.latitude,
        longitude: gd.longitude,
        zoom: 16,
    });

    // マーカー設定
    var mapController = Alloy.createController('garbage/map');
    gd.pinImage = mapController.getPinImage(gd);
    var marker = mapHelper.createMarker(gd, '', '');
    mapHelper.showMarkers([marker]);
}

/**
 * オプション領域表示非表示ボタンハンドラ
 */
function onClickToggleOptButton() {
    var props1, props2;
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
}

/**
 * ごみ詳細情報を表示
 */
function onGarbageCategory(gd) {
    var controller = Alloy.createController('garbage/category', {
        navWin: navWin,
        gdsc: gd.garbage_dumps_small_categories,
        isReadOnly: true,
    });
    if (OS_IOS) {
        Alloy.Globals.UI.indexTabGroup.getActiveTab().open(controller.getView());
    } else {
        navWin.openChildWindow(controller.getView());
    }
}

/**
 * ごみ情報を編集する
 */
function goEdit(gd) {
    if (OS_IOS) {
        navWin = require('/views/nav_window').createNavWindow();
    }
    var controller = Alloy.createController('garbage/edit', {
        garbageDump: gd,
        navWin: navWin,
    });
    if (OS_IOS) {
        navWin.open(controller.getView(), { modal:true });
    } else {
        navWin.openChildWindow(controller.getView());
    }
}

/**
 * ごみ情報を削除する
 */
function doDelete() {
    // 削除処理
    var deleteFn = function() {
        loading.show();
        var remoteGdModel = GarbageDumpRemoteModel.create();
        remoteGdModel.on('success', function() {
            loading.hide();
            Alloy.Globals.UI.createToast({
                text: '削除しました',
                view: $.window
            });

            _.delay(function() {
                if (OS_IOS) {
                    Alloy.Globals.UI.indexTabGroup.getActiveTab().close($.getView());
                } else {
                    navWin.closeChildWindow($.getView());
                }
            }, 2500);

            // イベント発行
            inDelete = true;    // 削除フラグを立てて'change_garbages'によって自画面が再読み込みされるのを防ぐ。だって消したから無いもんね。
            Alloy.Globals.State.trigger('change_garbages');
        });
        remoteGdModel.on('error', function(error) {
            loading.hide();
            Alloy.Globals.UI.Alert.showBanner(
                error.title, error.message, $.window);
        });
        remoteGdModel.deleteGarbageDump(gdId);
    };

    // 削除確認ダイアログ
    Alloy.Globals.UI.Alert.showSelectAlert(
        '削除確認', '本当に削除してもよろしいですか？\nこの操作は取り消せません', deleteFn);
}

/**
 * ごみ処理済みを変更する
 */
function doChangeGdHasRemoved(gd) {
    loading.show();
    var remoteGdModel = GarbageDumpRemoteModel.create();
    remoteGdModel.on('success', function() {
        gd.has_removed = !gd.has_removed;

        loading.hide();
        Alloy.Globals.UI.createToast({
            text: gd.has_removed ? '処理済みにしました' : '未処理にしました',
            view: $.window
        });

        // 画面更新
        $.has_removed_name.text = val.getHasRemovedName(gd.has_removed);
        changeRemoveGdButton(gd.has_removed);
    });
    remoteGdModel.on('error', function(error) {
        loading.hide();
        Alloy.Globals.UI.Alert.showBanner(error.title, error.message, $.window); 
    });
    remoteGdModel.changeGarbageDumpHasRemoved(gd.id, !gd.has_removed);
}

/**
 * ごみ処理済みボタンの変更
 */
function changeRemoveGdButton(hasRemoved) {
    if (hasRemoved) {
        $.removeGdButton.title = 'ごみを未処理にする';
    } else {
        $.removeGdButton.title = 'ごみを処理済みにする';
    }
}

/**
 * 不適切な投稿として報告
 */
function onClickReportSpam() {
    var emailDialog = Titanium.UI.createEmailDialog();
    emailDialog.subject = "[ごみマップアプリ]不適切な投稿の報告";
    emailDialog.toRecipients = ['hozugawa.development@gmail.com'];
    emailDialog.messageBody = 'ごみマップに不適切な投稿がありました。調査してください。\n\n' +
                              'ID = ' + gdId + '\n';
    emailDialog.open();
}
