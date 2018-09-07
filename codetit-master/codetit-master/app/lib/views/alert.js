/**
 * バナーメッセージを表示する
 * @param {Object} title
 * @param {Object} message
 * @param {Object} window
 */
exports.showBanner = function(title, message, win) {
	// TODO: showBannerがAndroidで動いたり動かなかったり
	// Windowが取得できなければ通常のalert
	if (OS_IOS && win) {
		var container = createMessageContainer(title, message);
		var postLayoutFn = function(e) {
			if (e.source !== container) {
				return;
			}

			// 無限ループ防止
			container.removeEventListener('postlayout', postLayoutFn);

			// 適当に決めていたcontainer.topをheight*-1へ
			var containerHeight = container.size.height;
			container.top = containerHeight * -1;

			// Rolldownアニメーション -> すぐ消す
			var rolldownAnimation = Ti.UI.createAnimation({
				top: 0,
				duration: 250
			});
			container.animate(rolldownAnimation);

			setTimeout(function() {
				var rollupAnimation = Ti.UI.createAnimation({
					top: containerHeight * -1,
					duration: 250
				});
				rollupAnimation.addEventListener('complete', function() {
					win.remove(container);
					container = null;
				});
				container.animate(rollupAnimation);
			}, 3000 + rolldownAnimation.duration);
		}
		container.addEventListener('postlayout', postLayoutFn);

		win.add(container);
	} else {
		exports.showAlert(title, message);
	}
};

/**
 * Alertを表示させる
 * @param {Object} title
 * @param {Object} message
 * @param {Object} callback
 */
exports.showAlert = function(title, message, callback) {
	var alertDialog = Ti.UI.createAlertDialog({
		buttonNames: ['OK'],
		title: title || '',
		message: message
	});
	alertDialog.addEventListener('click', function() {
		if (typeof callback === 'function') {
			callback();
		}
	});
	alertDialog.show();
};

/**
 * はい・いいえの選択肢Alertを表示させる
 * @param {Object} title
 * @param {Object} message
 * @param {Object} callback
 */
exports.showSelectAlert = function(title, message, callback) {
	var alertDialog = Ti.UI.createAlertDialog({
		buttonNames: ['はい', 'いいえ'],
		cancel: 1,
		title: title || '',
		message: message
	});
	alertDialog.addEventListener('click', function(e) {
		if (e.index == 0 && typeof callback === 'function') {
			callback();
		}
	});
	alertDialog.show();
}

//
// PRIVATE
//

// メッセージコンテナ作成
function createMessageContainer(title, message) {
	// タイトルが無かったらメッセージをタイトル欄へ入れる
	var titleFont = {fontSize:16,fontWeight:'bold'};
	var messageFont = {fontSize:14};
	if (!title) {
		title = message;
		message = null;
		titleFont = messageFont;
	}

	var container = Ti.UI.createView({
		top: -9999,	// 最初は隠しておく
		left: 0,
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE,
		opacity: 0.95,
		layout: 'vertical'
	});

	// メッセージコンテナ
	var msgContainer = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE,
		backgroundColor: '#DE2229',
	});

	// エラーマーク
	var errorIcon = Ti.UI.createImageView({
		image: '/images/warn.png',
		top: 17,
		left: 10,
		width: 24,
		height: 19,
		preventDefaultImage: true,
		opacity: 0.9
	});
	msgContainer.add(errorIcon);

	// タイトル・メッセージコンテナ
	var titleMessageContainer = Ti.UI.createView({
		layout: 'vertical',
		top: 15,
		left: 45,
		right: 5,
		height: Ti.UI.SIZE
	});

	// タイトル
	var titleLabel = Ti.UI.createLabel({
		text: title,
		left: 0,
		font: titleFont,
		color: '#fff',
		shadowColor: '#666',
		shadowOffset: {x:0,y:-1}
	});
	titleMessageContainer.add(titleLabel);

	// メッセージ
	if (message) {
		var messageLabel = Ti.UI.createLabel({
			text: message,
			top: 5,
			left: 0,
			font: messageFont,
			color: '#eee'
		});
		titleMessageContainer.add(messageLabel);
	}

	// メッセージ下マージン
	titleMessageContainer.add(Ti.UI.createView({
		width: 1,
		height: 15
	}));

	msgContainer.add(titleMessageContainer);

	// ボーダー
	var msgContainerBorder = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: 1,
		backgroundColor: '#aaa'
	});

	container.add(msgContainer);
	container.add(msgContainerBorder);

	return container;
}
