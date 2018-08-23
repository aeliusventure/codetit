//
// iOS専用
//
// 引数
var args = arguments[0] || {};
var navWin = args.navWin;
var title = args.title;
var url = args.url;

// 画面表示設定
$.window.title = title;
$.webview.url = url;

// 初期は戻る進むボタン非表示
$.back.enabled = false;
$.forward.enabled = false;

// イベントハンドラ登録
$.back.addEventListener('click', function() {
	$.webview.goBack();
});
$.forward.addEventListener('click', function() {
	$.webview.goForward();
});
$.reload.addEventListener('click', function() {
	$.webview.reload();
});

// WebViewイベントリスナ登録
$.webview.addEventListener('beforeload', function() {
	showIndicator(true);
});
$.webview.addEventListener('load', function() {
	showIndicator(false);
	$.back.enabled = $.webview.canGoBack();
	$.forward.enabled = $.webview.canGoForward();
});

function showIndicator(show) {
	$.window.rightNavButton = null;
	if (show) {
		var idc = Ti.UI.createActivityIndicator();
		idc.show();
		$.window.rightNavButton = idc;
	} else {
		$.window.rightNavButton = null;
	}
}
