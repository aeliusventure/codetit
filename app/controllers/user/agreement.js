var args = arguments[0] || {};
var navWin = args.navWin;
var forNewUser = args.for_newuser;

var loading = Alloy.Globals.UI.Loading.create($.window);

// 新規ユーザー用以外なら次へボタンを非表示
if (!forNewUser) {
	$.wrapper.remove($.bottomContainer);
	var style = $.createStyle({
		classes: ['licenseContainerFull']
	});
	$.licenseContainer.applyProperties(style);
} else {
	$.nextButton.addEventListener('click', goNext);
}

// 利用規約URL
$.licenseContainer.url = Alloy.CFG.url_agreement;

/**
 * 次へ
 */
function goNext() {
    var controller = Alloy.createController('user/edit', { navWin: navWin, for_newuser: forNewUser });
    navWin.openChildWindow(controller.getView());
}
