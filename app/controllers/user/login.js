var args = arguments[0] || {};
var navWin;

// イベントハンドラ割り当て
if (OS_IOS) {
    $.infoButton.addEventListener('click', showInfoWindow);
}
$.email.addEventListener('return', function() {
    $.password.focus();
});
$.password.addEventListener('return', doLogin);
$.loginButton.addEventListener('click', doLogin);
$.registerButton.addEventListener('click', goUserRegister);
$.wrapper.addEventListener('click', function(e) {
    // TextFieldからフォーカスを外す
    if (e.source !== $.email && e.source !== $.password) {
        $.email.blur();
        $.password.blur();
    }
})

/**
 * ログインを試行する
 */
function doLogin() {
    var userModel = Alloy.Globals.Model.getModel('user').create();
    userModel.on('login_ok', function(e) {
        $.trigger('login_ok', {message:e.message});
        Alloy.Globals.State.trigger('change_login_state');
    });
    userModel.on('login_ng', function(error) {
        Alloy.Globals.UI.Alert.showBanner('', error.message, $.window);
    });
    userModel.login($.email.value, $.password.value);
}

/**
 * ユーザー登録する
 */
function goUserRegister() {
    navWin = require('/views/nav_window').createNavWindow();
    var controller = Alloy.createController('user/agreement', { navWin: navWin, for_newuser: true });
    navWin.open(controller.getView(), { modal: true });
}

/**
 * 情報Windowを表示する
 */
function showInfoWindow() {
    if (!OS_IOS) {
        navWin = require('/views/nav_window').createNavWindow();
    }
    var controller = Alloy.createController('info/home', { navWin: navWin });
    if (OS_IOS) {
        Alloy.Globals.UI.indexTabGroup.getActiveTab().open(controller.getView());
    } else {
        navWin.open(controller.getView(), { modal: true });
    }
}
