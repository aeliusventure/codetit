/**
 * Titanium.Network.HTTPClient のWrapper
 * loadまたはerrorイベントを発行するとHTTPClientを空にしてしまうので再利用はできない
 * ※あまりHTTPClientを再利用すると途中で止まってしまうよ！
 */
var HttpClient = function(args) {
    var self = this;
    args = args || {};

    // HTTPClientのタイムアウト（ミリ秒）
    this.httpTimeout = args.httpTimeout || 10000;
    // リトライ回数
    this.retryCount = args.retryCount || 3;
    // リトライまでの待ち時間（ミリ秒）
    this.retryWaitTime = args.retryWaitTime || 3000;
    // バイナリ返却フラグ
    this.isBinary = args.binary || false;
    // JSON返却フラグ（Parseまで行う）
    this.isJson = args.json || false;
    // 現在のリトライ回数
    this.currentRetryCount = 0;

    // リトライ用に保存しておくHttpClient用パラメータ
    this.saveMethod = '';
    this.saveUrl = '';
    this.saveData = null;

    // HTTPClientを生成する
    this.http = Ti.Network.createHTTPClient({
        onload: function(e) {
            self.onloadHandler(e);
        },
        onerror: function(error) {
            self.onerrorHandler(error);
        },
        timeout: this.httpTimeout
    });
}

HttpClient.prototype = _.clone(Backbone.Events);

/**
 * HTTPClient.open のWrapper
 * @param {Object} method
 * @param {Object} url
 * @param {Boolean} isJson 初期はJSON
 */
HttpClient.prototype.open = function(method, url, isJson) {
    // リトライに備えてデータを保存
    this.saveMethod = method;
    this.saveUrl = url;
    this.isJson = isJson === false ? false : true;    // 明示的にfalseが指定された場合のみJSONフラグOFF

    // HTTPClient.openを実行
    this.http.open(method, url);
}

/**
 * JSON取得に特化した HTTPClient.open > HTTPClient.send の Wrapper
 * @param {Object} url
 */
HttpClient.prototype.getJson = function(url) {
    // JSONフラグON
    this.isJson = true;

    // リトライに備えてデータを保存
    this.saveMethod = 'GET';
    this.saveUrl = url;

    // HTTPClient.openを実行
    this.http.open('GET', url);

    // そのままsend発行
    this.send(null);
}

/**
 * HTTPClient.send のWrapper
 * @param {Object} data
 */
HttpClient.prototype.send = function(data) {
    // リトライに備えてデータを保存
    this.saveData = data;

    // HTTPClient.sendを実行
    this.http.send(data || null);
}

/**
 * HttpClientロード時ハンドラ
 * @param {Object} e
 */
HttpClient.prototype.onloadHandler = function(e) {
    // ロードイベントを発行
    if (this.isBinary) {
        this.trigger('load', {data:e.source.responseData});
    } else if (this.isJson) {
        if (e.source.responseText) {
            try {
                this.trigger('load', {data:JSON.parse(e.source.responseText)});
            } catch (error) {
                console.error('[HTTPClient] JSON.parse Error!' + error);
                this.trigger('error', {
                    title: 'データエラー',
                    message: 'サーバーから取得したデータ(JSON)の形式が不正です'
                });
            }
        } else {
            this.trigger('load', {});
        }
    } else {
        this.trigger('load', {data:e.source.responseText});
    }
    this.http = null;
}

/**
 * HttpClientエラー時ハンドラ（リトライ機能付き）
 * @param {Object} error
 */
HttpClient.prototype.onerrorHandler = function(error) {
    var status = error.source.status;
    Ti.API.error('[HTTPClient] Error! URL = ' + this.saveUrl);
    Ti.API.error('[HTTPClient] Error! HTTP Status = ' + status);
    Ti.API.error('[HTTPClient] Error! HTTP StatusText = ' + error.source.statusText);
    Ti.API.error(error);

    // タイムアウトとHTTPステータスが500以上はリトライ試行回数までリトライ
    // ※HttpClientのタイムアウトはhttpStatusで検知できないので0ならそう扱う
    if ((status == 0 || status >= 500) && this.currentRetryCount < this.retryCount) {
        var self = this;
        setTimeout(function() {
            error.source.open(self.saveMethod, self.saveUrl);
            error.source.send(self.saveData);
        }, this.retryWaitTime);

        this.currentRetryCount += 1;
        Ti.API.warn('[HTTPClient] Retry. Retry count = ' + this.currentRetryCount);
    } else {
        // エラーイベントを発行
        var errorTitle, errorMessage;
        switch (status) {
            case 401:
                errorTitle = '認証エラー';
                errorMessage = '認証に失敗しました';
                break;
            default:
                errorTitle = 'ネットワークエラー';
                errorMessage = 'インターネットに接続されていないか、サーバーがダウンしています';
                break;
        }

        this.trigger('error', {
            title: errorTitle,
            message: errorMessage,
            status: status
        });
        this.http = null;
    }
}

/**
 * EXPORTS
 */
exports.create = function(args) {
    return new HttpClient(args);
}
