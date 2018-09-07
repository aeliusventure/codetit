var Codebird = require("codebird");

function TwitterHelper(_args) {
    var _self = _.clone(Backbone.Events);

    var KEY_TWITTER_ACCESS_TOKEN = 'twitter_access_token';
    var KEY_IS_LOGINED = 'twitter_is_logined';
    var KEY_IS_SHARE_LASTTIME = 'twitter_is_share_lasttime';

    // Twitter設定
    var _cb = new Codebird();
    _cb.setConsumerKey(_args.apikey, _args.apisecret);

    // 動作設定
    var _isDryRun = _args.dry_run || false;

    /**
     * ログイン
     */
    _self.login = function() {
        var tokens = accessToken();
        if (!tokens) {
            // 未ログインなのでログインする
            doLogin();
        }
    };

    /**
     * ログアウト
     */
    _self.logout = function() {
        accessToken('', '');    // 空をAccessTokenへ設定
    };

    /**
     * ログイン済みか検査
     */
    _self.isLogined = function() {
        if (accessToken() === false) {
            return false;
        } else {
            return true;
        }
    };

    /**
     * 前回投稿したか設定する
     */
    _self.setIsShareLastTime = function(value) {
        if (value) {
            Ti.App.Properties.setString(KEY_IS_SHARE_LASTTIME, 'YES');
        } else {
            Ti.App.Properties.setString(KEY_IS_SHARE_LASTTIME, null);
        }
    }

    /**
     * 前回投稿したか取得する
     */
    _self.getIsShareLastTime = function() {
        if (Ti.App.Properties.getString(KEY_IS_SHARE_LASTTIME, false)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 投稿する
     */
    _self.publish = function(message, image) {
        // ログインできてるか確認
        var tokens = accessToken();
        if (tokens === false) {
            _self.trigger('publish_error', { message: '投稿にはログインが必要です' });
            return
        }

        // 送信
        var hasImage = false;
        var data = {
            "status": message,
            // "media[]": "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAB+0lEQVR42mP8//8/Ay0BEwONwagFoxZQDljI0PP8x7/Z93/e+PxXmpMpXp5dh4+ZgYHh0bd/clxYnMuINaMtfvRLgp3RVZwVU+rkuz+eRz+//wXVxcrEkKnEceXTX0dRlhoNTmKDaOvzXwHHv6x9+gtN/M9/hpjTX+GmMzAw/P7HMOnOj+ff//35x/Ds+z9iLfjPwPDt7//QE1/Sz319/RNh3PkPf+58+Yup/t7Xf9p8zFKcTMRa4CLGCrFm1v2fSjs+pJ/7uuvl7w+//yO7HRkUq3GEyrCREMk+kqy2IiyH3/xhYGD48uf/rPs/Z93/yczIwM3CiFU9Hw5xnD4ouvTt4Tf0AP37n+HTb+w+UOBmIs2CICm2R9/+EZlqGRkYzIVYSLMgRIYtUYGdSAsMBFgUuJhIy2iMDAwt2pysjAwLHv78RcgnOcrs5BQVHEyMG579Imi6Nh9zrBxZFgixMW624pXnwldYcTAzLjDhZmUit7AzE2K54c7fp8eF1QhWRobFptwmgiwkF3b//jMwMjJ8+P3/zPs/yx/9Wvr412+MgBJlZ1xsyuOOrbAibMHH3/87b32fce/nR2ypnpuFMVGevU6TQ5SdqKKeEVez5cuf/7te/j727s+9L/++/v3PzcyowM1kIcTiLs7Kz8pIfNnOONouGrVg1AIGAJ6gvN4J6V9GAAAAAElFTkSuQmCC"
        };

        // 画像有無を確認
        if (image && image.mimeType && image.mimeType.indexOf('image/') >= 0) {
            data['media[]'] = image;
            hasImage = true;
        }

        // 投稿
        if (_isDryRun) {
            // DryRun
            var msg = data.status;
            if (hasImage) {
                msg += ':' + data['media[]'].mimeType;
            }
            Ti.API.trace('Dry Run for Share Twitter');
            Ti.API.trace(msg);
        } else {
            var method = 'statuses_update';
            if (hasImage) {
                method = 'statuses_updateWithMedia';
            }

            // Twitterへ投稿
            _cb.setToken(tokens.accessToken, tokens.accessTokenSecret);
            _cb.__call(
                method,
                data,
                function (result, reply) {
                    if (result) {
                        _self.trigger('publish_success');
                    } else {
                        var msg = reply.code + ':' + reply.message || 'Twitterに投稿が受け付けられませんでした（同じ内容の投稿や過剰投稿の可能性があります）';
                        _self.trigger('publish_error', { message: msg });
                    }
                }
            );
        }
    };

    //
    // PRIVATE
    //

    /**
     * アクセストークン・シークレットが入ったObjectを取得・設定する
     * @return {Object|null} falseの場合は未ログイン
     */
    function accessToken(token, tokenSecret) {
        if (_.isUndefined(token) && _.isUndefined(tokenSecret)) {
            var tokens = Ti.App.Properties.getObject(KEY_TWITTER_ACCESS_TOKEN, null);
            if (!tokens || !tokens.accessToken || !tokens.accessTokenSecret) {
                return false;
            } else {
                return tokens;
            }
        } else {
            var tokens = {
                accessToken: token,
                accessTokenSecret: tokenSecret,
            };
            Ti.App.Properties.setObject(KEY_TWITTER_ACCESS_TOKEN, tokens);
        }
    }

    /**
     * ログインする
     */
    function doLogin() {
        Ti.API.debug('################## Incoming doLogin');

        // まずログアウト状態にする
        accessToken('', '');

        // 2回連続でやられた場合に備えてTokenをクリア
        _cb.setToken(null, null);

        // Twitter処理開始
        _cb.__call(
            'oauth_requestToken',
            {oauth_callback: "oob"},
            function (result1, reply1) {
                Ti.API.info('Twitter Token1 Result = ' + result1);
                Ti.API.info('Twitter Token1 = ' + reply1.oauth_token);
                Ti.API.info('Twitter TokenSecret1 = ' + reply1.oauth_token_secret);
                if (result1 !== true) {
                    _self.trigger('login_error', 
                        { message: 'Twitterへのログインでエラーが発生しました (' + reply1.code + ":" + reply1.message + ")" });
                    return;
                }

                // まずは受け取ったTokenをセット
                _cb.setToken(reply1.oauth_token, reply1.oauth_token_secret);

                // Webログインさせる
                _cb.__call(
                    "oauth_authorize",
                    {},
                    function (authUrl) {
                        Ti.API.info('Twitter AUTH_URL = ' + authUrl);

                        // Twitter認証用のWebViewなど
                        var win = Ti.UI.createWindow({
                            backgroundColor: '#fff'
                        });
                        var webView = Ti.UI.createWebView({
                            width: Ti.UI.FILL,
                            top: 0, bottom: 50,
                            url: authUrl,
                        });
                        var closeButton = Ti.UI.createButton({
                            title: '閉じる',
                            bottom: 5,
                            width: '75%',
                            backgroundColor: '#888',
                            color: '#fff',
                        });

                        // Authorizeコールバック
                        var authCallBack = function(e) {
                            // OauthVerifier取得
                            var oauthVerifier = 
                                webView.evalJS('window.document.querySelector(\'kbd[aria-labelledby="code-desc"] > code\').innerHTML');
                            // var oauthVerifier = window.evalJS('document.getElementById("PINFIELD").value');
                            Ti.API.info('Twitter Oauth Verifier = ' + oauthVerifier);

                            if (oauthVerifier) {
                                _cb.__call(
                                    "oauth_accessToken",
                                    {oauth_verifier: oauthVerifier},
                                    function(result2, reply2) {
                                        Ti.API.info('Twitter AccessToken Result = ' + result2);
                                        Ti.API.info('Twitter AccessToken = ' + reply2.oauth_token);
                                        Ti.API.info('Twitter AccessTokenSecret = ' + reply2.oauth_token_secret);
                                        if (result2 !== true) {
                                            _self.trigger('login_error', { message: reply2.message + "(" + reply2.code + ")" });
                                            return;
                                        }

                                        // AccessTokenとSecretを保存
                                        accessToken(reply2.oauth_token, reply2.oauth_token_secret);

                                        // 認証用UIを閉じる
                                        destroyAuthUI();
                                    }
                                );
                            }
                        };

                        // Windowを閉じる
                        var destroyAuthUI = function() {
                            // ステータスチェンジイベント発行
                            _self.trigger('login_status_change');

                            // UIリソースの開放
                            try {
                                closeButton = null;
                                webView.removeEventListener('load', authCallBack);
                                webView = null;
                                win.close();
                                win = null;
                            } catch(e) {}
                        }
                        
                        // WebViewロード時ハンドラ
                        webView.addEventListener('load', authCallBack);

                        // 閉じるボタンハンドラ
                        closeButton.addEventListener('click', destroyAuthUI);

                        // Window閉じるハンドラ
                        win.addEventListener('close', destroyAuthUI)

                        win.add(webView);
                        win.add(closeButton);
                        win.open();
                    }
                );
            }
        );
    }

    return _self;
}

exports.create = TwitterHelper;
