function FacebookHelper(_args) {
	var _self = _.clone(Backbone.Events);

	var KEY_IS_LOGINED = 'facebook_is_logined';
	var KEY_IS_SHARE_LASTTIME = 'facebook_is_share_lasttime';
	var KEY_PUBLISH_PERMISSION = 'facebook_publish_permission';

	// Facebook設定
	var _fb = require('facebook');
	_fb.appid = _args.appid;
	_fb.permissions = ['read_stream'];
	_fb.initialize();
	//_fb.forceDialogAuth = !OS_IOS;

	// Facebookイベントハンドラ
	_fb.addEventListener('login', onLogin);
	_fb.addEventListener('logout', onLogout);

	// 動作設定
	var _isDryRun = _args.dry_run || false;

	/**
	 * ログイン
	 */
	_self.login = function() {
		_fb.authorize();
	};

	/**
	 * ログアウト
	 */
	_self.logout = function() {
		_fb.logout();
	};

	/**
	 * ログイン済みか検査
	 */
	_self.isLogined = function() {
		if (Ti.App.Properties.getString(KEY_IS_LOGINED, false)) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * 前回投稿したか設定する
	 */
	_self.setIsShareLastTime = function(value) {
		if (value) {
			Ti.App.Properties.setString(KEY_IS_SHARE_LASTTIME, 'YES');
		} else {
			Ti.App.Properties.setString(KEY_IS_SHARE_LASTTIME, null);
		}
	};

	/**
	 * 前回投稿したか取得する
	 */
	_self.getIsShareLastTime = function() {
		if (Ti.App.Properties.getString(KEY_IS_SHARE_LASTTIME, false)) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Publish Permission request || publish_actions
	 */
	function requestPublishPermission() {
		if (Ti.App.Properties.getString(KEY_IS_LOGINED, false)) {
			if (!Ti.App.Properties.getBool(KEY_PUBLISH_PERMISSION, false)) {
				_fb.requestNewPublishPermissions(['publish_actions'], _fb.AUDIENCE_FRIENDS, function(e) {
					if (e.success) {
						Ti.App.Properties.setBool(KEY_PUBLISH_PERMISSION, true);
					}
				});
			}
		}
	};

	/**
	 * 写真を投稿する
	 */
	_self.publish = function(message, image) {
		// 権限あるかログインできてるか確認
		_fb.authorize();

		var data = {
			message : message,
		};

		// 画像有無を確認
		if (image && image.mimeType && image.mimeType.indexOf('image/') >= 0) {
			data['source'] = image;
		}

		var afterFn = function(e) {
			if (e.success) {
				_self.trigger('publish_success');
			} else {
				var msg = e.error || '原因不明のエラー';
				if (e.code == 5) {
					msg = 'Facebookに投稿が受け付けられませんでした（同じ内容の投稿や過剰投稿の可能性があります）';
				}
				_self.trigger('publish_error', {
					message : msg
				});
			}
		};

		// 投稿
		if (_isDryRun) {
			// DryRun
			var msg = data.message;
			if (data['source']) {
				msg += ':' + data['source'].mimeType;
			}
			Ti.API.trace('Dry Run for Share Facebook');
			Ti.API.trace(msg);
		} else {
			if (data['source']) {
				// 画像を投稿
				_fb.requestWithGraphPath('me/photos', data, 'POST', afterFn);
			} else {
				// フィードを投稿
				_fb.requestWithGraphPath('me/feed', data, 'POST', afterFn);
			}
		}
	};

	//
	// PRIVATE
	//
	function onLogin(e) {
		Ti.API.info('nLogin | facebook_helper : ' + JSON.stringify(e));
		if (e.success) {
			// プロパティへOAuthTokenを保存
			Ti.API.trace('Facebook Loged In Success');
			Ti.App.Properties.setString(KEY_IS_LOGINED, 'YES!LOGINED!');
			_self.trigger('login_success');
			requestPublishPermission();
		} else if (e.error) {
			Ti.API.error('[Facebook Login Error] ' + e.code + ': ' + e.error);
			_self.trigger('login_error', {
				message : e.error
			});
		} else if (e.cancelled) {
			Ti.API.trace('Facebook Login Canceled');
			_self.trigger('login_cancel');
		}
	};

	function onLogout(e) {
		Ti.API.trace('Facebook Logout');

		// プロパティのOAuthTokenを削除
		Ti.App.Properties.setString(KEY_IS_LOGINED, '');
		Ti.App.Properties.setBool(KEY_PUBLISH_PERMISSION, false);
	};

	return _self;
}

exports.create = FacebookHelper;
