var args = arguments[0] || {};
var data = args.data;

// タイトル
$.title.text = data.title;

// ファイル OR テキスト
if (data.text) {
    $.license.text = data.text;
} else if (data.file) {
    var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, data.file);
    if (file.exists()) {
        $.license.text = file.read().text;
    }
}
