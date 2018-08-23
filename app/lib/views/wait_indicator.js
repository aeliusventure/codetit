function LoadingIndicator(_targetView) {
	var self = {};
	_targetView = _targetView || {};	// iOSでのみ利用

	/**
	 * Ti SDK 3.3.0 から AndroidのWindow表示がとても重たくなってしまい、表示が不自然になったので
	 * iOSと同じViewによるLoading表現へ切替る
	 */
	if (OS_IOS || true) {
		var _wait, _container, _wrapper;

		// ActivityIndicatorを生成
		_wait = Ti.UI.createActivityIndicator({
			style: OS_IOS ? Ti.UI.iPhone.ActivityIndicatorStyle.PLAIN : Ti.UI.ActivityIndicatorStyle.BIG,
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			color: '#fff',
			font: {fontSize: 18},
		});

		// Container
		_container = Ti.UI.createView({
			backgroundColor: OS_IOS ? '#666' : 'transparent',
			width: OS_IOS ? 50 : 75,
			height: OS_IOS ? 50 : 75,
			borderRadius: OS_IOS ? 5 : 0,
		});
		_container.add(_wait);

		// 表示開始
		self.show = function() {
			// Wrapper
			_wrapper = Ti.UI.createView({
				zIndex: 100,
				width: _targetView.size.width,
				height: _targetView.size.height,
				backgroundColor: '#5000',
			});
			_wrapper.add(_container);
			_targetView.add(_wrapper);
			_wait.show();
		};

		// 表示終了
		self.hide = function() {
			_wait.hide();
			if (_wrapper) {
				_wrapper.remove(_container);
				_targetView.remove(_wrapper);
				_wrapper = null;
			}
		};
	} else {
		var _loading = Alloy.createWidget("nl.fokkezb.loading");
		self.show = function() {
			_loading.show(' ', false);
		};
		self.hide = function() {
			_loading.hide();
		};
	}

	return self;
}
exports.create = LoadingIndicator;
