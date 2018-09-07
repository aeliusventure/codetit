var args = arguments[0] || {};
var navWin = args.navWin;

// 引数
var args = arguments[0] || {};

var prefectures = Alloy.createCollection('prefecture');
var cities = Alloy.createCollection('city');
var rivers = Alloy.createCollection('river');

// 画面構築
$.window.addEventListener('open', getLocalGarbageDumps);

// アイテムクリック時ハンドラ
$.listView.addEventListener('itemclick', function(e) {
    var item = e.section.getItemAt(e.itemIndex);
    var gd = item.garbageDump;

    // 元画面へ
    $.trigger('select', { garbageDump: gd });
});

/**
 * ごみ情報（ローカル保存分）を取得する
 */
function getLocalGarbageDumps() {
    var collection = Alloy.createCollection('garbage_dump');
    collection.comparator = function(model) {
        return model.get('local_id') * -1;
    }
    collection.fetch();

    buildScreen(collection);
}

/**
 * 取得したごみ情報を元に画面を構築する
 */
function buildScreen(collection) {
    var rows = [];

    // 必要な情報を取得
    prefectures.fetch();
    cities.fetch();
    rivers.fetch();

    collection.each(function(model) {
        // 場所情報
        var prefecture = prefectures.get(model.get('prefecture_id'));
        var city = cities.get(model.get('city_id'));
        var river = rivers.get(model.get('river_id'));

        rows.push({
            template: 'rowTemplate',
            image: {
                image: model.get('image1') ? model.get('image1') : Alloy.Globals.UI.NO_IMAGE_FILE,
            },
            updated_at: {
                text: model.get('updated_at'),
            },
            place: {
                text: 
                    (prefecture ? prefecture.get('name') : '') + 
                    (city ? city.get('name') : '') + 
                    (river ? river.get('name') : ''),
            },
            garbageDump: model.toJSON()
        });

    });

    $.listView.sections[0].items = rows;
}
