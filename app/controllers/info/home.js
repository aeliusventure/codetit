var args = arguments[0] || {};
var navWin = args.navWin;

// バージョン番号
$.version.text = 'v' + Ti.App.version;

$.listView.addEventListener('itemclick', function(e) {
    var item = e.section.getItemAt(e.itemIndex);
    var action = item.properties.action;

    if (action === 'tutorial') {
        openWeb('チュートリアル', Alloy.CFG.url_turoial);
    } else if (action === 'agreement') {
        var controller = Alloy.createController('user/agreement');
        if (OS_IOS) {
            Alloy.Globals.UI.indexTabGroup.getActiveTab().open(controller.getView());
        } else {
            navWin.openChildWindow(controller.getView());
        }
    } else if (action === 'license') {
        var controller = Alloy.createController('info/software_license');
        if (OS_IOS) {
            Alloy.Globals.UI.indexTabGroup.getActiveTab().open(controller.getView());
        } else {
            navWin.openChildWindow(controller.getView());
        }
    } else if (action === 'about_us') {
        openWeb('運営団体', Alloy.CFG.url_about_us);
    }
});

//
// 指定されたURLを開く
//
function openWeb(title, url) {
    if (OS_IOS) {
        var webCtl = Alloy.createController('common/web', {title:title,url: url});
        Alloy.Globals.UI.indexTabGroup.getActiveTab().open(webCtl.getView());
    } else {
        // PDFなら確認ダイアログを表示する
        if (/.+\.pdf$/.test(url)) {
            Alloy.Globals.UI.Alert.showSelectAlert(
                'PDFを開きます',
                'この情報はPDFで提供されています。開く・またはダウンロードしてよろしいですか？',
                function() {
                    Ti.Platform.openURL(url);
                }
            );
        } else {
            Ti.Platform.openURL(url);
        }
    }
}
