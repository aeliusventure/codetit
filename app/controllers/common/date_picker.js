var _args = arguments[0] || {};

var _parentView, _selfView;

// イベントハンドラ登録
// 決定ボタン
$.submitButton.addEventListener('click', function() {
    showHideSelfView(false);
    Ti.API.error($.picker.value);
    $.trigger('select', $.picker.value);
});

// キャンセルボタン
$.cancelButton.addEventListener('click', function() {
    showHideSelfView(false);
    $.trigger('cancel');
});

/**
 * [PUBLIC]表示する
 */
$.show = function(parentView, initDate) {
    _parentView = parentView;
    if (!_selfView) {
        _selfView = $.getView();
    }

    // 初期日付設定
    initDate = initDate || new Date();
    $.picker.value = initDate;

    // 表示
    showHideSelfView(true);
}

/**
 * 自身の表示・非表示
 */
function showHideSelfView(toShow) {
    var showAnime = Ti.UI.createAnimation({
        opacity: 1,
        duration: 250,
    });
    var hideAnime = Ti.UI.createAnimation({
        opacity: 0,
        duration: 250,
    });

    if (toShow) {
        _selfView.opacity = 0;
        _parentView.add(_selfView);
        _selfView.animate(showAnime);
    } else {
        _selfView.animate(hideAnime, function() {
            _selfView.opacity = 0;
            _parentView.remove(_selfView);
        });
    }
}
