var args = arguments[0] || {};
var navWin = args.navWin;
var forNewUser = args.for_newuser;

var loading = Alloy.Globals.UI.Loading.create($.window);

// 画面表示設定
if (forNewUser) {
	$.window.title = 'ユーザー新規登録';
	$.password.hintText = 'パスワードを入力してください';
	$.wrapper.remove($.passwordWarnLabel1);
	$.password_confirmation.hintText = 'パスワード(確認)を入力してください';
	$.wrapper.remove($.passwordWarnLabel2);
	$.registerButton.title = '登録する';
} else {
	$.window.title = 'ユーザー編集';
	$.password.hintText = 'パスワード変更しない場合は空白にしてください';
	$.passwordWarnLabel1.visible = true;
	$.password_confirmation.hintText = 'パスワード変更しない場合は空白にしてください';
	$.passwordWarnLabel2.visible = true;
	$.registerButton.title = '編集する';

	// 現在のデータを設定
	var userModel = Alloy.Globals.Model.getModel('user').create();
	var user = userModel.getUser();
	$.email.value = user.email;
	$.nick_name.value = user.nick_name;
}

// フォーカス制御
$.window.addEventListener('click', function(e) {
	if (e.source !== $.email && e.source !== $.password
		&& e.source !== $.password_confirmation && e.source !== $.nick_name) {
		$.email.blur();
		$.password.blur();
		$.password_confirmation.blur();
		$.nick_name.blur();
	}
});
$.email.addEventListener('return', function() {
	$.password.focus();
});
$.password.addEventListener('return', function() {
	$.password_confirmation.focus();
});
$.password_confirmation.addEventListener('return', function() {
	$.nick_name.focus();
});
$.nick_name.addEventListener('return', function() {
	$.nick_name.blur();
});

// イベントハンドラ
if (OS_IOS) {
	$.navCancelButton.addEventListener('click', function() {
		navWin.close();
	});
}
$.registerButton.addEventListener('click', goRegister);

/**
 * ユーザー登録
 */
function goRegister() {
	var viewFn = function(inProgress) {
		if (inProgress) {
			// 処理中View
			$.registerButton.enabled = false;
			loading.show();
		} else {
			// 非処理中View
			loading.hide();
			$.registerButton.enabled = true;
		}
	}

	// 処理中Viewへ
	viewFn(true);

	// 情報まとめ
	var userInfo = {
		email: $.email.value,
		password: $.password.value,
		password_confirmation: $.password_confirmation.value,
		nick_name: $.nick_name.value,
	};

	// ユーザー登録
	var userModel = Alloy.Globals.Model.getModel('user').create();
	userModel.on('register_ok', function(e) {
		if (forNewUser) {
			// 登録OKで新規登録ならログインも行う
			userModel.on('login_ok', function(ee) {
				viewFn(false);
				Alloy.Globals.State.trigger('change_login_state');
				navWin.close();
			});
			userModel.on('login_ng', function(error) {
				viewFn(false);
				Alloy.Globals.UI.Alert.showBanner('', error.message, $.window);
			});
			userModel.login(userInfo.email, userInfo.password);
		} else {
			viewFn(false);
			Alloy.Globals.UI.Alert.showAlert('', e.message, function() {
				navWin.close();
			});
		}
	});
	userModel.on('register_ng', function(error) {
		viewFn(false);
		Alloy.Globals.UI.Alert.showBanner('', error.message, $.window);
	});
	userModel.register(userInfo, forNewUser);
}
