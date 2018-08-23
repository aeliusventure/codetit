var args = arguments[0] || {};
var navWin;

// leftNavButtonをキャンセル
if (OS_IOS) {
    $.window.leftNavButton = Ti.UI.createView();
}

// イベントハンドラ割り当て
if (OS_IOS) {
    $.infoButton.addEventListener('click', showInfoWindow);
}
$.connect_facebook.addEventListener('change', changeFbStatus);
$.connect_twitter.addEventListener('change', changeTwStatus);
$.goMyselfMapButton.addEventListener('click', showUserMap);
$.goMyselfTimelineButton.addEventListener('click', showUserTimeline);
$.goEditProfileButton.addEventListener('click', showUserEdit);
$.logoutButton.addEventListener('click', doLogout);

// Facebook初期化
var _fbHelper = require('/helpers/facebook_helper').create(Alloy.Globals.config.facebook);
_fbHelper.on('login_error', function(e) {
    Alloy.Globals.UI.Alert.showBanner('', e.message, $.window);
    $.connect_facebook.value = false;
});
_fbHelper.on('login_cancel', function() {
    $.connect_facebook.value = false;
});

// TwitterHelper初期化
var _twHelper = require('/helpers/twitter_helper').create(Alloy.Globals.config.twitter);
_twHelper.on('login_status_change', function() {
    $.connect_twitter.value = _twHelper.isLogined();
});
_twHelper.on('login_error', function(e) {
    Alloy.Globals.UI.Alert.showBanner('', e.message, $.window);
    $.connect_twitter.value = false;
});

// 画面情報設定
var userModel = Alloy.Globals.Model.getModel('user').create();
var user = userModel.getUser();

$.email.text = user.email;
$.nick_name.text = user.nick_name;
$.connect_facebook.value = _fbHelper.isLogined();
$.connect_twitter.value = _twHelper.isLogined();

/**
 * 情報Windowを表示する（ここにくるのはiOSのみ）
 */
function showInfoWindow() {
    var controller = Alloy.createController('info/home', { navWin: navWin });
    Alloy.Globals.UI.indexTabGroup.getActiveTab().open(controller.getView());
}

/**
 * Facebook ステータスを変更する
 */
function changeFbStatus(e) {
    if (e.value) {
        _fbHelper.login();
    } else {
        _fbHelper.logout();
    }
}

/**
 * Twitter ステータスを変更する
 */
function changeTwStatus(e) {
    if (e.value) {
        _twHelper.login();
    } else {
        _twHelper.logout();
    }
}

/**
 * ユーザー編集画面を表示する
 */
function showUserEdit() {
    // ModalWindowでユーザー編集画面を開く
    var modalNavWin = require('/views/nav_window').createNavWindow();
    var controller = Alloy.createController('user/edit', { navWin: modalNavWin, for_newuser: false });
    modalNavWin.open(controller.getView(), { modal: true });
}

/**
 * 地図画面表示（現在のユーザーデータのみ）
 */
function showUserMap() {
    var userModel = Alloy.Globals.Model.getModel('user').create();
    var user = userModel.getUser();

    var controller = Alloy.createController('garbage/map', { userId: user.id, userName: user.nick_name });
    Alloy.Globals.UI.indexTabGroup.getActiveTab().open(controller.getView());
}

/**
 * タイムライン画面表示（現在のユーザーデータのみ）
 */
function showUserTimeline() {
    var userModel = Alloy.Globals.Model.getModel('user').create();
    var user = userModel.getUser();

    var controller = Alloy.createController('garbage/timeline', { userId: user.id, userName: user.nick_name });
    Alloy.Globals.UI.indexTabGroup.getActiveTab().open(controller.getView());
}

/**
 * ログアウトする
 */
function doLogout() {
    var userModel = Alloy.Globals.Model.getModel('user').create();
    userModel.on('logout', function(e) {
        _fbHelper.logout();
        _twHelper.logout();        
        Alloy.Globals.State.trigger('change_login_state');
    });
    userModel.logout();
}
