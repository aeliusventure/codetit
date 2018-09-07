/**
 * URL文字列にパスを追加する
 * @param {String} baseUrl 元となるURL
 * @param {String} addPath 追加したいパス
 */
exports.addUrlPath = function(baseUrl, addPath) {
    baseUrl = baseUrl ? baseUrl.toString() : '';
    addPath = addPath ? addPath.toString() : '';

    var isBaseUrlEndOfSlash = baseUrl.substr(baseUrl.length - 1) === '/';
    var isAddPathSlashStart = addPath.substr(0, 1) === '/';
    if (isBaseUrlEndOfSlash && isAddPathSlashStart) {
        return baseUrl + addPath.substr(1);
    } else if (isBaseUrlEndOfSlash || isAddPathSlashStart) {
        return baseUrl + addPath;
    } else {
        return baseUrl + '/' + addPath;
    }
}

/**
 * URL文字列にパラメータを追加する
 * @param {Object} baseUrl
 * @param {Object} key
 * @param {Object} value
 */
exports.addUrlParam = function(baseUrl, key, value) {
    if (baseUrl.indexOf('?') === -1) {
        return baseUrl + '?' + key + '=' + value;
    } else {
        return baseUrl + '&' + key + '=' + value;
    }
}

/**
 * URL文字列にサーバーパスを追加する
 * @param {Object} path
 * @param {Object} server
 */
exports.addServerUrl = function(path, server) {
    if (exports.isAbsoluteUrl(path)) {
        return path;
    } else {
        return exports.addUrlPath(server, path);
    }
}

/**
 * httpまたはhttpsで始まる完結したURLか判定する
 * @param {Object} url
 */
exports.isAbsoluteUrl = function(url) {
    return /^(http|https):\/\/.+/.test(url);
}

/**
 * 長辺を指定サイズ以下にリサイズした値を返却する
 */
exports.adjustImageSize = function(width, height, max) {
    var ratio, newWidth, newHeight;
    if (width > height) {
        ratio = max / width;
        newWidth = max;
        newHeight = height * ratio;
    } else {
        ratio = max / height;
        newWidth = width * ratio;
        newHeight = max;
    }
    return {
        width: newWidth,
        height: newHeight
    };
}

//
// ピクセルからdipへ変換する
//
exports.pxToDp = function(px) {
    return Math.round(parseInt(px) / (Ti.Platform.displayCaps.dpi / 160));
}

//
// dipからピクセルへ変換する
//
exports.dpToPx = function(dp) {
    return Math.round(parseInt(dp) * (Ti.Platform.displayCaps.dpi / 160));
}

//
// YYYY/MM/DDの文字列へ変換
//
exports.formatDate = function(date) {
    date = date || new Date();
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return y + '/' + ('0' + m).slice(-2) + '/' + ('0' + d).slice(-2);
}

//
// YYYY-MM-DD HH:mm:ssを取得
//
exports.getNowDbDateTime = function() {
    var date = new Date();
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();

    return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2) + ' ' +
        ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
}

//
// 正の整数か検査する
//
exports.isInteger = function(value) {
    return /^\d+$/.test(value);
}

//
// 小数点桁数を指定した四捨五入
//
exports.round = function(value, precision) {
    var digit = Math.pow(10, precision);
    var retValue = value * digit;
    retValue = Math.round(retValue);
    retValue = retValue / digit;
    return retValue;
}
