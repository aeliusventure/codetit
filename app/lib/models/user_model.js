var HttpClient = require('/http_client');

/**
 * ユーザーModel
 */
function UserModel() {
    var _self = _.clone(Backbone.Events);

    // 定数：認証tokenキー
    _self.AUTH_TOKEN_KEY = 'auth_token';
    // 定数：ユーザー情報キー
    _self.AUTH_USER_INFO_KEY = 'user_info';

    /**
     * ログイン済みか判定する
     */
    _self.isLogined = function() {
        var authToken = _self.getAuthToken();
        if (authToken) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * AuthTokenを取得する
     */
    _self.getAuthToken = function() {
        return Ti.App.Properties.getString(_self.AUTH_TOKEN_KEY, false);
    }

    /**
     * ユーザー情報を取得する
     */
    _self.getUser = function() {
        return Ti.App.Properties.getObject(_self.AUTH_USER_INFO_KEY, null);
    }

    /**
     * ログインする
     * @param  {string} login
     * @param  {string} password
     */
    _self.login = function(login, password) {
        // Validation
        var errorMsg = false;
        if (!login.trim()) {
            errorMsg = 'ログインIDを入力してください';
        } else if (password.toString().length <= 0) {
            errorMsg = 'パスワードを入力してください';
        }
        if (errorMsg !== false) {
            _self.trigger('login_ng', {message: errorMsg});
            return;
        }

        var http = HttpClient.create();
        http.on('load', function(e) {
            if (e.data.result && e.data.auth_token && e.data.user) {
                // AuthToken, ユーザー情報を設定する
                Ti.App.Properties.setString(_self.AUTH_TOKEN_KEY, e.data.auth_token);
                Ti.App.Properties.setObject(_self.AUTH_USER_INFO_KEY, e.data.user);

                _self.trigger('login_ok', {message:'ログインしました'});
            } else {
                _self.trigger('login_ng', {message: e.data.error_message});
            }
        });
        http.on('error', function(error) {
            var errorMsg;
            if (error.status == 401) {
                errorMsg = 'ログインIDまたはパスワードが違います';
            } else {
                errorMsg = error.error;
            }
            _self.trigger('login_ng', {message: errorMsg});
        });

        var postData = {};
        postData['login'] = login;
        postData['password'] = password;

        http.open('POST', Alloy.Globals.Util.getUrl('/api/v1/login.json'));
        http.send(postData);
    }

    /**
     * ログアウトする
     */
    _self.logout = function() {
        var http = HttpClient.create();
        http.on('load', function(e) {
            Ti.App.Properties.setString(_self.AUTH_TOKEN_KEY, null);
            Ti.App.Properties.setObject(_self.AUTH_USER_INFO_KEY, null);
            _self.trigger('logout', {message:'ログアウトしました'});
        });
        http.on('error', function(error) {
            Ti.App.Properties.setString(_self.AUTH_TOKEN_KEY, null);
            Ti.App.Properties.setObject(_self.AUTH_USER_INFO_KEY, null);
            _self.trigger('logout', {message:'ログアウトしました(E)'});
        });

        var url = Alloy.Globals.Util.getUrl('/api/v1/logout.json');
        url = Alloy.Globals.Util.addUrlParam(url, _self.AUTH_TOKEN_KEY, _self.getAuthToken());
        http.open('GET', url, false);
        http.send();
    }

    /**
     * ユーザー登録・編集する
     */
    _self.register = function(userInfo, forNewUser) {
        // Validation
        var errorMsg = _validateUserInfo(userInfo, forNewUser);
        if (errorMsg !== true) {
            _self.trigger('register_ng', { message: errorMsg });
            return;
        }

        // データ編集
        var postData = {};
        postData['user[email]'] = userInfo.email;
        postData['user[password]'] = userInfo.password;
        postData['user[password_confirmation]'] = userInfo.password_confirmation;
        postData['user[nick_name]'] = userInfo.nick_name;

        var http = HttpClient.create();
        http.on('load', function(e) {
            var okMsg = forNewUser ? 'ユーザー登録が完了しました' : 'ユーザー編集が完了しました';
            if (e.data.result && e.data.result === true) {
                _self.trigger('register_ok', { message: okMsg });
            } else {
                _self.trigger('register_ng', { message: e.data.message });
            }

            // 更新の場合は戻ってきたユーザー情報を保存（新規の場合はログインが必要なのでその際に保存している）
            if (!forNewUser && e.data.user) {
                Ti.App.Properties.setObject(_self.AUTH_USER_INFO_KEY, e.data.user);
            }
        });
        http.on('error', function(error) {
            _self.trigger('register_ng', { message: error.message });
        });

        var url = Alloy.Globals.Util.getUrl('/api/v1/user.json');
        var method;
        if (forNewUser) {
            method = 'POST';
        } else {
            method = 'PUT';
            url = Alloy.Globals.Util.addUrlParam(url, _self.AUTH_TOKEN_KEY, _self.getAuthToken());
        }
        http.open(method, url);
        http.send(postData);
    }

    return _self;

    //
    // PRIVATE
    //

    /**
     * ユーザー登録・編集 入力情報を検証する
     */
    function _validateUserInfo(userInfo, forNewUser) {
        // メールアドレス
        if (!userInfo['email'].trim()) {
            return 'メールアドレスを入力してください';
        }

        // パスワード:ユーザー新規登録の場合は必須。編集の場合は入力されていた場合のみチェック
        if (forNewUser) {
            if (userInfo['password'].toString().length <= 0) {
                return 'パスワードを入力してください';
            }
            if (userInfo['password_confirmation'].toString().length <= 0) {
                return 'パスワード(確認)を入力してください';
            }
        }
        if (userInfo['password'].toString().length > 0) {
            if (userInfo['password'].toString() != userInfo['password_confirmation'].toString()) {
                return 'パスワードと確認パスワードが違います';
            }
        }

        // ニックネーム
        if (!userInfo['nick_name'].trim()) {
            return 'ニックネーム(表示名)を入力してください';
        }

        return true;
    }
}

//
// EXPORT
//
exports.create = UserModel;
