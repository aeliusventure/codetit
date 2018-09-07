var _userHomeWindow;
var _mypageTab = $.userTab;
var _isLaunch = true;

// Global領域にTabGroupを設定
Alloy.Globals.UI.indexTabGroup = $.indexTabGroup;

// ユーザーログインステータスを監視
Alloy.Globals.State.on('change_login_state', function() {
    changeViewByUserLogin(true);
});

// マイページへの遷移要求イベント監視
Alloy.Globals.State.on('request_move_my_page', function() {
    $.indexTabGroup.setActiveTab(2);
});

// GoogleMapが利用不可なら処理中断
var mapHelper = require('helpers/map_helper');
if (mapHelper.checkCanUseMap()) {
    // TabGroup開いた後処理
    _.defer(function() {
        changeViewByUserLogin();
        _isLaunch = false;
    });

    // TabGorupを開く
    $.indexTabGroup.open();
} else {
    // 起動不可
}

/**
 * ユーザーログインステータスに合わせた画面変更
 */
function changeViewByUserLogin(moveToMyPageTab) {
    // ログイン済みか検査
    var userModel = Alloy.Globals.Model.getModel('user').create();
    if (userModel.isLogined()) {
        // ユーザーHOME画面を開く
        var controller = Alloy.createController('user/home');
        _userHomeWindow = controller.getView();

        if (OS_IOS) {
            // iOSはそのままTabで開く
            $.indexTabGroup.tabs[2].open(_userHomeWindow);
        } else {
            /**
             * Androidはタブ内に新しいWindowが開けない(!)ため、新しいタブを作ってそこに開く。
             * 新しいタブへ移動したのちに古いタブは削除する
             */
            // タブを作ってタブグループへ追加
            var newMyPageTab = Ti.UI.createTab({
                title: 'マイページ',
                window: _userHomeWindow,
            });
            addMyPageEventListener(newMyPageTab);
            $.indexTabGroup.addTab(newMyPageTab);

            // 現在のタブは消すので移動
            _.delay(function() {
                var moveTab = 0;    // ベースは地図画面へ移動
                if (moveToMyPageTab){
                    moveTab = newMyPageTab;
                }
                $.indexTabGroup.setActiveTab(moveTab);

                // 古いタブを削除
                _.delay(function() {
                    $.indexTabGroup.removeTab(_mypageTab);
                    _mypageTab = newMyPageTab;
                }, 50);
            }, 50);
        }

        // ログインメッセージ
        if (!_isLaunch) {
            _.defer(function() {
                Alloy.Globals.UI.createToast({
                    text: 'ログインしました',
                    view: _userHomeWindow
                });            
            });
        }
    } else {
        // ユーザーHOME画面を閉じる
        if (OS_IOS) {
            if (_userHomeWindow) {
                _userHomeWindow.close();
                userHomeController = null;
            }
        } else {
            // ログインタブを作ってタブグループへ追加
            var login = Alloy.createController('user/login');
            var newMyPageTab = Ti.UI.createTab({
                title: 'マイページ',
                window: login.getView(),
            });
            addMyPageEventListener(newMyPageTab);
            $.indexTabGroup.addTab(newMyPageTab);

            // 現在のタブは消すので移動
            _.delay(function() {
                var moveTab = 0;    // ベースは地図画面へ移動
                if (moveToMyPageTab){
                    moveTab = newMyPageTab;
                }
                $.indexTabGroup.setActiveTab(moveTab);

                // 古いタブを削除
                _.delay(function() {
                    $.indexTabGroup.removeTab(_mypageTab);
                    _mypageTab = newMyPageTab;
                }, 50);
            }, 50);
        }

        // ログアウトメッセージ
        if (!_isLaunch) {
            _.defer(function() {
                Alloy.Globals.UI.createToast({
                    text: 'ログアウトしました',
                    view: $.userLogin.getView(),
                });            
            });
        }
    }
}

//
// for Android
//

// [Andorid] ActionBar MenuItem 作成
if (!OS_IOS) {
    var ITEM_REFRESH = 1;
    var ITEM_FILTER = 2;
    var ITEM_INFO = 3;

    $.indexTabGroup.addEventListener("open", function() {
        var activity = $.indexTabGroup.getActivity();
        activity.onCreateOptionsMenu = function(e) {
            // 更新メニュー
            var refreshItem = e.menu.add({
                itemId: ITEM_REFRESH,
                title: '更新',
                showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS,
                icon: 0x7f020062,
            });
            refreshItem.addEventListener('click', onClickRefreshButton);

            // フィルターメニュー
            var filterItem = e.menu.add({
                itemId: ITEM_FILTER,
                title: 'フィルタ',
                showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS,
                icon: 0x7f020060,
            });
            filterItem.addEventListener('click', onClickFilterButton);

            // 情報メニュー
            var infoItem = e.menu.add({
                itemId: ITEM_INFO,
                title: '情報',
                showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS,
                icon: 0x7f020061,
                // visible: false,
            });
            infoItem.addEventListener('click', onClickInfoButton);
        };
        activity.invalidateOptionsMenu();
    });

    // 地図タブ表示時
    $.mapTab.addEventListener('focus', function() {
        var activity = $.indexTabGroup.getActivity();
        activity.onPrepareOptionsMenu = function(e) {
            var menu = e.menu;
            menu.findItem(ITEM_REFRESH).setVisible(true);
            menu.findItem(ITEM_FILTER).setVisible(true);
            menu.findItem(ITEM_INFO).setVisible(false);
        };
        activity.invalidateOptionsMenu();
    });

    // タイムラインタブ表示時
    $.timelineTab.addEventListener('focus', function() {
        var activity = $.indexTabGroup.getActivity();
        activity.onPrepareOptionsMenu = function(e) {
            var menu = e.menu;
            menu.findItem(ITEM_REFRESH).setVisible(true);
            menu.findItem(ITEM_FILTER).setVisible(true);
            menu.findItem(ITEM_INFO).setVisible(false);
        };
        activity.invalidateOptionsMenu();
    });

    // マイページタブ表示時
    addMyPageEventListener($.userTab);
}

// [Android]マイページタブへのイベントリスナ登録
function addMyPageEventListener(tab) {
    tab.addEventListener('focus', function() {
        var activity = $.indexTabGroup.getActivity();
        activity.onPrepareOptionsMenu = function(e) {
            var menu = e.menu;
            menu.findItem(ITEM_REFRESH).setVisible(false);
            menu.findItem(ITEM_FILTER).setVisible(false);
            menu.findItem(ITEM_INFO).setVisible(true);
        };
        activity.invalidateOptionsMenu();        
    });
}

// [Android]リフレッシュMenuItem
function onClickRefreshButton() {
    var targetWin = $.indexTabGroup.getActiveTab().getWindow();
    if (targetWin === $.map.window) {
        $.map.showGarbageDumps(null, true);
    } else if (targetWin === $.timeline.window) {
        $.timeline.showGarbageDumps();
    }
}

// [Android] フィルタMenuItem
function onClickFilterButton() {
    var targetWin = $.indexTabGroup.getActiveTab().getWindow();
    if (targetWin === $.map.window) {
        $.map.showFilter();
    } else if (targetWin === $.timeline.window) {
        $.timeline.showFilter();
    }
}

// [Android] 情報MenuItem
function onClickInfoButton() {
    var navWin = require('/views/nav_window').createNavWindow();
    var controller = Alloy.createController('info/home', { navWin: navWin });
    navWin.open(controller.getView(), { modal: true });
}
