var _args = arguments[0] || {};
var _parentView;
var _selfView;

var CHECK_MARK = Alloy.Globals.UI.font.fontAwesome.icon('fa-check');

// 初期設定
// ソート順
$.sortNewChkLabel.text = CHECK_MARK;
$.sortRankChkLabel.text = '';

// 表示期間
$.week1ChkLabel.text = '';
$.week2ChkLabel.text = '';
$.week4ChkLabel.text = '';
$.weekAllChkLabel.text = CHECK_MARK;

// 回収済み非表示
$.hiddenRemovedChkLabel.text = '';

// 決定ボタン
$.submitButton.addEventListener('click', function() {
    showHideFilterView(false);
    $.trigger('go', getConditions());
});

// キャンセルボタン
$.cancelButton.addEventListener('click', function() {
    showHideFilterView(false);
    $.trigger('cancel');
});

// イベントハンドラ登録
addButtonEventHander();

/**
 * [PUBLIC]フィルター表示
 */
$.show = function(parentView) {
    _parentView = parentView;
    _selfView = $.getView();
    showHideFilterView(true);
}

// イベントハンドラ設定
function addButtonEventHander() {
    $.sortNewBtn.addEventListener('click', function() {
        $.sortNewChkLabel.text = CHECK_MARK;
        $.sortRankChkLabel.text = '';
    });
    $.sortRankBtn.addEventListener('click', function() {
        $.sortNewChkLabel.text = '';
        $.sortRankChkLabel.text = CHECK_MARK;
    });
    $.week1Btn.addEventListener('click', function() {
        $.week1ChkLabel.text = CHECK_MARK;
        $.week2ChkLabel.text = '';
        $.week4ChkLabel.text = '';
        $.weekAllChkLabel.text = '';
    });
    $.week2Btn.addEventListener('click', function() {
        $.week1ChkLabel.text = '';
        $.week2ChkLabel.text = CHECK_MARK;
        $.week4ChkLabel.text = '';
        $.weekAllChkLabel.text = '';
    });
    $.week4Btn.addEventListener('click', function() {
        $.week1ChkLabel.text = '';
        $.week2ChkLabel.text = '';
        $.week4ChkLabel.text = CHECK_MARK;
        $.weekAllChkLabel.text = '';
    });
    $.weekAllBtn.addEventListener('click', function() {
        $.week1ChkLabel.text = '';
        $.week2ChkLabel.text = '';
        $.week4ChkLabel.text = '';
        $.weekAllChkLabel.text = CHECK_MARK;
    });
    $.hiddenRemovedBtn.addEventListener('click', function() {
        $.hiddenRemovedChkLabel.text = $.hiddenRemovedChkLabel.text ? '' : CHECK_MARK;
    });
}

// フィルター条件取得
function getConditions() {
    var cond = {};

    // ソート順
    if ($.sortRankChkLabel.text) {
        cond['order_density'] = true;
    }

    // 表示期間
    if ($.week1ChkLabel.text) {
        cond['in_created_at_weeks'] = 1;
    } else if ($.week2ChkLabel.text) {
        cond['in_created_at_weeks'] = 2;
    } else if ($.week4ChkLabel.text) {
        cond['in_created_at_weeks'] = 4;
    }

    // 回収済み非表示
    if ($.hiddenRemovedChkLabel.text) {
        cond['hidden_has_removed'] = true;
    }

    return cond;
}

// 表示非表示
function showHideFilterView(toShow) {
    var showAnime = Ti.UI.createAnimation({
        opacity: 0.95,
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
