var args = arguments[0] || {};
var navWin = args.navWin;
var userId = args.userId;
var userName = args.userName;

// 利用するモデルなど生成
var GarbageDumpRemoteModel = Alloy.Globals.Model.getModel('garbage_dump_remote');
var variableModel = Alloy.Globals.Model.getModel('variable').create();

// UI共通部品
var loading = Alloy.Globals.UI.Loading.create($.window);
var filter = Alloy.createController('garbage/filter');

// 保存用検索条件
var _savedConditions = {};

// イベントハンドラ割り当て
if (OS_IOS) {
    $.refreshButton.addEventListener('click', function() {
        showGarbageDumps();
    });

    var filter = Alloy.createController('garbage/filter', {});
    $.filterButton.addEventListener('click', function() {
        filter.show($.wrapper);
    });
} else {
    $.showFilter = function() {
        filter.show($.wrapper);
    };
}
$.window.addEventListener('open', function() {
    showGarbageDumps();
});
$.listView.addEventListener('itemclick', function(e) {
    var item = e.section.getItemAt(e.itemIndex);
    showDetailWindow(item.garbageDump);
});

filter.on('go', showGarbageDumps);

// Appステート
Alloy.Globals.State.on('change_garbages', function() {
   showGarbageDumps();
});

// 画面変更
if (OS_IOS && userId) {
    // ユーザーID指定の場合はリフレッシュ機能無し＆TabBarなし
    $.window.title = userName + 'のタイムライン';
    $.window.leftNavButton = null;
    $.window.applyProperties({
        tabBarHidden: true,
    });
}

/**
 * [PUBLIC]ごみ情報を取得(更新)する
 */
function showGarbageDumps(conditions) {
    conditions = conditions || _savedConditions;

    loading.show();
    var gdRemoteModel = GarbageDumpRemoteModel.create();
    gdRemoteModel.on('loaded', function(e) {
        buildScreen(e.garbage_dumps);
        loading.hide();
    });
    gdRemoteModel.on('error', function(error) {
        loading.hide();
        Alloy.Globals.UI.Alert.showBanner(error.title, error.message, $.window);
    });

    // 検索条件
    conditions['timeline'] = true;
    if (userId) {
        conditions['user_id'] = userId;
    }
    gdRemoteModel.getGarbageDumps(conditions);

    // 検索条件を保存
    _savedConditions = conditions;
}
$.showGarbageDumps = showGarbageDumps;

/**
 * 取得したごみ情報を元に画面を構築する
 */
function buildScreen(garbageDumps) {
    var gdItems = [];
    var rivers = Alloy.createCollection('river');
    rivers.fetch();

    for (var i = 0; i < garbageDumps.length; i++) {
        var gd = garbageDumps[i];
        var river = rivers.get(gd['river_id']);

        gdItems.push({
            template: 'rowTemplate',
            image: {
                image: gd['image1_url'] ? Alloy.Globals.Util.getUrl(gd['image1_url']) : Alloy.Globals.UI.NO_IMAGE_FILE,
            },
            river_name: {
                text: river ? river.get('name') : '',
            },
            searched_at: {
                text: gd['searched_at'],
            },
            garbage_type: {
                text: variableModel.getGarbageTypeName(gd['garbage_type']) + ' / ごみのランク ' + gd['garbage_density']
            },
            danger_mark: {
                text: gd['garbage_dengared'] === 1 ? Alloy.Globals.UI.font.fontAwesome.icon('fa-exclamation-triangle') + '危険物有' : '',
            },
            garbageDump: gd,
        });
    };
    $.listView.sections[0].items = gdItems;
}

/**
 * 明細画面を表示する
 */
function showDetailWindow(garbageDump) {
    var createNavWin = false;
    if (!OS_IOS && !navWin) {
        navWin = require('/views/nav_window').createNavWindow();
        createNavWin = true;
    }
    var controller = Alloy.createController(
        'garbage/detail', { garbageDump: garbageDump, navWin: navWin });
    if (OS_IOS) {
        Alloy.Globals.UI.indexTabGroup.getActiveTab().open(controller.getView());
    } else {
        if (createNavWin) {
            navWin.open(controller.getView(), { modal: true });
        } else {
            navWin.openChildWindow(controller.getView());
        }
    }
}
