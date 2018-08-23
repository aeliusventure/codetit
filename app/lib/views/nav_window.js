//
// iOSとAndroidで使えるっぽくしたNavigationWindow
// 違いは色々ここで吸収したい
// 　iOSはもちろんNavigationWindow
// 　Androidは工夫する（がんばれ）
//
exports.createNavWindow = function() {
	var _self = _.clone(Backbone.Events);
	var _navWin;
	var _windowStack = [];	// Androidのみ開いたWindowを記憶する

	_self.open = function(firstWindow, windowArgs) {
		windowArgs = windowArgs || {};

		if (OS_IOS) {
			// iOS => NavigationWindow
			_navWin = Ti.UI.iOS.createNavigationWindow({
				window: firstWindow
			});
			_navWin.open(windowArgs);
		} else {
			// Android => Windowそのまま
			_windowStack.push(firstWindow);	// Window記憶

			// Androidでmodalオブションは不要
			// ただし子画面なのでActionBarカスタマイズのみ行う
			if (windowArgs.modal) {
				delete windowArgs.modal;
				editWindowAsBackable(firstWindow);
			}
			firstWindow.open(windowArgs);
		}
	}

	_self.openChildWindow = function(childWindow) {
		if (OS_IOS) {
			// iOS
			_navWin.openWindow(childWindow);
		} else {
			// Android: 子画面のActionBarをカスタマイズ
			editWindowAsBackable(childWindow);

			_windowStack.push(childWindow);	// Window記憶
			childWindow.open();
		}
	}

	_self.closeChildWindow = function(childWindow) {
		if (OS_IOS) {
			_navWin.closeWindow(childWindow);
		} else {
			_windowStack.pop();
			childWindow.close();
		}
	}

	_self.close = function() {
		if (OS_IOS) {
			if (_navWin) {
				_navWin.close();
			}
			_navWin = null;
		} else {
			// Android
			for (var i = _windowStack.length - 1; 0 <= i; i--) {
				if (_windowStack[i]) {
					_windowStack[i].close();
				}
			}
			_windowStack = [];
		}

		// closeイベントを発行
		_self.trigger('close');
	}

	_self.getNavigationWindow = function() {
		if (OS_IOS) {
			return _navWin;
		} else {
			return null;
		}
	}

	return _self;

	//
	// PRIVATE
	//

	// [Android専用]子画面向けにActionBarをカスタマイズ
	function editWindowAsBackable(targetWindow) {
		var existFn = function() {};
		if (_.isFunction(targetWindow.activity.onCreateOptionsMenu)) {
			existFn = targetWindow.activity.onCreateOptionsMenu;
		}

		targetWindow.activity.onCreateOptionsMenu = function(e) {
			existFn(e);
			targetWindow.activity.actionBar.displayHomeAsUp = true;
			targetWindow.activity.actionBar.onHomeIconItemSelected = function() {
				targetWindow.close();
			}
		};
	}
}
