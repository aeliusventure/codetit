/**
 * ショートカット選択されたら詳細選択へ即座に反映
 * データとしては詳細選択のを使う（詳細選択で一度でも変更したらショートカットへは戻れない）
 */
var args = arguments[0] || {};
var navWin = args.navWin;
var gdsc = args.gdsc || [];
var hasData = args.gdsc ? true : false;
var isReadOnly = args.isReadOnly;

var UNSELECT_ID = 0;

// 画面初期化
initScreen();

// 画面構築
buildScreen();

// 画面カスタマイズ
customizeScreen();

// [Android]初期表示時に下スクロールされた位置にあることへの対処
_.defer(function() {
    $.wrapper1.scrollTo(0, 0);
    $.wrapper2.scrollTo(0, 0);    
});

// イベントハンドラ
$.wrapper1.addEventListener('click', focusControl);
$.wrapper2.addEventListener('click', focusControl);
$.switchBtn1.addEventListener('click', switchEasyAndDetail);
$.switchBtn2.addEventListener('click', switchEasyAndDetail);
$.submitButton1.addEventListener('click', doRegister);
$.submitButton2.addEventListener('click', doRegister);

/**
 * 画面初期化
 */
function initScreen() {
    // 利用するモデル群
    var mdlCats = Alloy.createCollection('middle_category');
    var smlCats = Alloy.createCollection('small_category');
    mdlCats.fetch();

    var valModel = Alloy.Globals.Model.getModel('variable').create();
    var easyInputValues = valModel.getGarbageCategoryShortcuts();
    if (!OS_IOS) {
        if (isReadOnly) {
            easyInputValues[UNSELECT_ID] = { title: '　' };
        } else {
            easyInputValues[UNSELECT_ID] = { title: '選択してください...' };            
        }
    }

    for (var i = 1; i <= 5; i++) {
        // コンボボックス初期化
        $['shortcutValue' + i].init($.getView());
        $['mdlValue' + i].init($.getView());
        $['smlValue' + i].init($.getView());

        // コンボボックス選択肢設定
        $['shortcutValue' + i].choices = easyInputValues;
        $['mdlValue' + i].choices =
            convertCollectionToCombo(mdlCats, $['mdlValue' + i].hintText);

        // コンボボックスイベントハンドラ用関数群
        var getScutValChangeFn = function(index) {
            return function(e) {
                if (e.source.suppressChange) {
                    e.source.suppressChange = false;
                    return;
                }

                Ti.API.warn('ショートカットCombo 変更');
                $['mdlValue' + index].suppressChange = true;
                $['mdlValue' + index].id = easyInputValues[e.id]['mdl_id'];

                smlCats.fetchByMiddleCategory(easyInputValues[e.id]['mdl_id']);
                $['smlValue' + index].choices =
                    convertCollectionToCombo(smlCats, $['smlValue' + index].hintText);
                $['smlValue' + index].suppressChange = true;
                $['smlValue' + index].id = easyInputValues[e.id]['sml_id'];
            }
        };
        var getMdlValChangeFn = function(index) {
            return function(e) {
                if (e.source.suppressChange) {
                    e.source.suppressChange = false;
                    return;
                }

                Ti.API.warn('中分類Combo 変更');
                smlCats.fetchByMiddleCategory(e.id);
                $['smlValue' + index].choices =
                    convertCollectionToCombo(smlCats, $['smlValue' + index].hintText);
            }
        };
        var getSmlValChangeFn = function(index) {
            return function(e) {
                if (e.source.suppressChange) {
                    e.source.suppressChange = false;
                    return;
                }

                Ti.API.warn('小分類Combo 変更');
            }
        };

        // イベント無限連鎖防止用のフラグ
        $['shortcutValue' + i].suppressChange = false;
        $['mdlValue' + i].suppressChange = false;
        $['smlValue' + i].suppressChange = false;

        $['shortcutValue' + i].on('change', getScutValChangeFn(i));
        $['mdlValue' + i].on('change', getMdlValChangeFn(i));
        $['smlValue' + i].on('change', getSmlValChangeFn(i));

        // ごみの数を ショートカット <-> 詳細選択 で同期する
        var getSyncNumScToDetailFn = function(index) {
            return function(e) {
                if (e.source.suppressChange) {
                    e.source.suppressChange = false;
                    return;
                }
                Ti.API.warn('ショートカット 数 変更');
                $['detailNum' + index].suppressChange = true;
                $['detailNum' + index].value = e.source.value;
            }
        };
        var getSyncNumDetailToScFn = function(index) {
            return function(e) {
                if (e.source.suppressChange) {
                    e.source.suppressChange = false;
                    return;
                }
                Ti.API.warn('詳細 数 変更');
                $['shortcutNum' + index].suppressChange = true;
                $['shortcutNum' + index].value = e.source.value;
            }
        };

        // イベント無限連鎖防止用のフラグ
        $['shortcutNum' + i].suppressChange = false;
        $['detailNum' + i].suppressChange = false;

        $['shortcutNum' + i].addEventListener('change', getSyncNumScToDetailFn(i));
        $['detailNum' + i].addEventListener('change', getSyncNumDetailToScFn(i));
    }
}

/**
 * 画面を構築
 */
function buildScreen() {
    // 表示データなし（新規など）の場合はこの処理不要
    if (!hasData || !_.isArray(gdsc) || gdsc.length === 0) {
        return;
    }

    // 変更モードでデータ有りの場合は、ショートカット入力禁止
    $.wrapper1.remove($.switchBtn1);
    $.wrapper2.remove($.switchBtn2);
    hideEasyInput();

    var smCatCollection = Alloy.createCollection('small_category');
    for (var i = 0; i < gdsc.length; i++) {
        var itemIdx = i + 1;
        smCatCollection.fetch();

        // 削除フラグデータもサーバーからやってくるのでここで無視
        if (gdsc[i].delete_flag || !gdsc[i]['small_category_id']) {
            continue;
        }

        // コンボボックス設定
        var smCatModel = smCatCollection.get(gdsc[i]['small_category_id']);
        if (smCatModel) {
            // 詳細
            $['mdlValue' + itemIdx].id = smCatModel.get('middle_category_id');
            smCatCollection.fetchByMiddleCategory(smCatModel.get('middle_category_id'));
            $['smlValue' + itemIdx].choices =
                convertCollectionToCombo(smCatCollection, $['smlValue' + itemIdx].hintText);
            $['smlValue' + itemIdx].id = gdsc[i]['small_category_id'];
        }

        // ごみの数 設定
        $['shortcutNum' + itemIdx].value = gdsc[i]['num_garbage'];
        $['detailNum' + itemIdx].value = gdsc[i]['num_garbage'];
    }
}

/**
 * 画面カスタマイズ
 */
function customizeScreen() {
    // 読み取り専用の場合は全コントロールを変更不可にして、いくつかのボタンを削除する
    if (isReadOnly === true) {
        $.wrapper1.remove($.switchBtn1);
        $.wrapper2.remove($.switchBtn2);
        $.wrapper1.remove($.submitButton1Container);
        $.wrapper2.remove($.submitButton2Container);
        hideEasyInput();
    
        for (var i = 1; i <= 5; i++) {
            $['shortcutValue' + i].enabled = false;
            $['shortcutNum' + i].enabled = false;
            $['mdlValue' + i].enabled = false;
            $['smlValue' + i].enabled = false;
            $['detailNum' + i].enabled = false;
        };
    }
}

/**
 * フォーカスのコントロール
 */
function focusControl(e) {
    // 各TextFieldは bubbleParent = false なので e.source チェック不要
    for (var i = 1; i <= 5; i++) {
        $['shortcutNum' + i].blur();
        $['detailNum' + i].blur();
    };
}

/**
 * ショートカット入力スイッチ画面切り替え
 */
function switchEasyAndDetail(e) {
    // 最初はスライドアニメーションさせてたけどめちゃ重いからやめました...
    if (_.isUndefined(e) || e.source == $.switchBtn1) {
        $.wrapper1.applyProperties({
            left: '-' + Alloy.Globals.UI.displayWidth,
        });
        $.wrapper2.applyProperties({
            left: 0,
        });
    } else {
        $.wrapper1.applyProperties({
            left: 0,
        });
        $.wrapper2.applyProperties({
            left: Alloy.Globals.UI.displayWidth,
        });
    }
}

/**
 * ショートカット入力を隠す
 */
function hideEasyInput() {
    $.wrapper1.applyProperties({
        left: -1,
        width: 0,
    });
    $.wrapper2.applyProperties({
        left: 0,
    });
}

/**
 * DBの内容をComboboxに適した形へ変換する
 */
function convertCollectionToCombo(collection, hintText) {
    var result = {};
    result[UNSELECT_ID] = {
        title: hintText || (isReadOnly ? '　' : '選択してください...'),
    }
    collection.each(function(item) {
        result[item.get('id')] = {
            title: item.get('name'),
        };
    });
    return result;
}

/**
 * 登録
 */
function doRegister() {
    var dataList = [];

    // データを集める
    for (var i = 1; i <= 5; i++) {
        // カテゴリと数のどちらも空ならなにもしない
        var data = {
            small_category_id: $['smlValue' + i].id,
            num_garbage: $['detailNum' + i].value,
        };
        if (!data.small_category_id && !data.num_garbage) {
            continue;
        }

        // 本当はModelでやるべきだけど、該当するModelが無いのでここで直接検証する
        if (!data.small_category_id) {
            Alloy.Globals.UI.Alert.showBanner('', '種類を選択してください', $.window);
            return;
        } else if (!data.num_garbage || !Alloy.Globals.Util.isInteger(data.num_garbage)) {
            Alloy.Globals.UI.Alert.showBanner('', '個数を整数で入力してください', $.window);
            return;
        } else {
            dataList.push(data);
        }
    }

    $.trigger('register', { garbage_dumps_small_category: dataList });
}
