;
;
var UPEMSDK_API = "UPEM-Api";
var UPEMSDK_VAULT = "UPEM-Vault";
var ACTIONS = {
    RCV_DEFAULT: "receiveDefault",
    RCV_CONNECT: "receiveConnect",
    RCV_DISCONNECT: "receiveDisconnect",
    CONNECT: "askConnect",
    RESET: "askReset"
};
var UPEMSDK = (function () {
    /**
     * Creates an instance of UPEMSDK.
     * @param {Config} userConfig
     *
     * @memberOf UPEMSDK
     */
    function UPEMSDK(userConfig) {
        var defaultConfig = {
            baseURL: "https://perso-etudiant.u-pem.fr/~vrasquie/core",
            scope: null,
            token: null,
            debug: false
        };
        var c = Object.assign(defaultConfig, userConfig);
        this._c = Object.freeze(c);
        this._setupReceiver();
        this._debug("INIT", this);
    }
    UPEMSDK.prototype._setupReceiver = function () {
        var self = this;
        this._callback = {};
        this._f = (_a = {},
            _a[ACTIONS.RCV_CONNECT] = function (msg) {
                self._receiveConnect(msg);
            },
            _a[ACTIONS.RCV_DISCONNECT] = function (msg) {
                self._receiveDisconnect(msg);
            },
            _a[ACTIONS.RCV_DEFAULT] = function (msg) {
                self._receiveDefault(msg);
            },
            _a);
        window.addEventListener("message", function (event) {
            var msg = event.data;
            if (!msg || !msg.type || msg.scope !== self._c.scope) {
                return self._debug("=> Event Message (ERROR)", event);
            }
            if (msg.src == document.URL) {
                return;
            }
            self._debug("=> Event Message (RECEIVE)", msg);
            if (typeof self._f[msg.type] === "function") {
                return self._f[msg.type](msg);
            }
            self._debug("** Type is not a valid function", { type: msg.type, f: self._f });
            self._f[ACTIONS.RCV_DEFAULT](msg);
        });
        var _a;
    };
    UPEMSDK.prototype._receiveConnect = function (msg) {
        if (this._isValid(msg)) {
            this._setToken(msg.data);
        }
        this._receiveDefault(msg);
    };
    UPEMSDK.prototype._receiveDisconnect = function (msg) {
        this._setToken(null);
        this._receiveDefault(msg);
    };
    UPEMSDK.prototype._receiveDefault = function (msg) {
        if (typeof this._callback[msg.type] === "function") {
            return this._callback[msg.type](msg);
        }
        this._debug("** Type is not a valid callback", { type: msg.type, callback: this._callback });
    };
    UPEMSDK.prototype._debug = function (action, extra) {
        if (this._c.debug) {
            console.log("UPEM SDK", " - " + action + " - ", extra);
        }
    };
    UPEMSDK.prototype._ajax = function (uri, callback) {
        var x = new XMLHttpRequest();
        var url = this._c.baseURL + "/api" + uri;
        var self = this;
        this._debug("___ AJAX Request", { url: url, token: this.getToken() });
        x.responseType = 'json';
        x.onreadystatechange = function (oEvent) {
            if (x.readyState !== 4) {
                return;
            }
            var err = x.statusText;
            if (x.status === 200) {
                if (self._isValid(x.response)) {
                    self._debug("___ AJAX Success", x.response);
                    return callback(x.response, null);
                }
                if (x.response.code === 4) {
                    self.disconnect();
                }
                err = x.response.error;
            }
            self._debug("___ AJAX Error", x.response);
            callback(null, err);
        };
        x.open("GET", url);
        x.setRequestHeader("Token", this.getToken());
        x.send();
    };
    UPEMSDK.prototype._post = function (type, data) {
        var msg = {
            type: type,
            code: 0,
            scope: this._c.scope,
            src: document.URL,
            data: data,
            error: null
        };
        window.postMessage(msg, "*");
    };
    UPEMSDK.prototype._checkIfConnect = function () {
        if (!this.getToken())
            throw new Error("config.token is undefined. User may not be connected yet");
    };
    UPEMSDK.prototype._isValid = function (msg) {
        if (msg.error === null && msg.code === 0) {
            return true;
        }
        return false;
    };
    UPEMSDK.prototype._setToken = function (token) {
        if (token === this._c.token)
            return;
        var c = Object.assign({}, this._c, {
            token: token
        });
        this._c = Object.freeze(c);
        if (!token)
            localStorage.removeItem("upem-token");
        else
            localStorage.setItem("upem-token", this._c.token);
    };
    /**
     * Listener on connect
     *
     * @param {(data: PostMessage) => void} callback
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.onConnect = function (callback, force) {
        this._callback[ACTIONS.RCV_CONNECT] = callback;
        if (force && this.getToken())
            this.connect();
    };
    /**
     * Listener on disconnect
     *
     * @param {() => void} callback
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.onDisconnect = function (callback) {
        this._callback[ACTIONS.RCV_DISCONNECT] = callback;
    };
    /**
     * Unregister listener by key
     *
     * @param {string} key
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.unregister = function (key) {
        this._callback[key] = null;
    };
    /**
     * Unregister on connect listener
     *
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.unregisterOnConnect = function () {
        this.unregister(ACTIONS.RCV_CONNECT);
    };
    /**
     * Unregister on disconnect listener
     *
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.unregisterOnDisconnect = function () {
        this.unregister(ACTIONS.RCV_DISCONNECT);
    };
    /**
     * Get Token
     *
     * @returns {string}
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.getToken = function () {
        if (!this._c.token) {
            var lStorage = localStorage.getItem("upem-token");
            if (lStorage) {
                this._setToken(lStorage);
            }
        }
        return this._c.token;
    };
    /**
     * Action - Reset vault
     *
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.resetVault = function () {
        this._post(ACTIONS.RESET, null);
    };
    /**
     * Action - Connect
     *
     * @param {string} token
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.connect = function (token) {
        if (typeof token === "undefined") {
            token = this.getToken();
        }
        this._post(ACTIONS.RCV_CONNECT, token);
    };
    /**
     * Action - Disconnect
     *
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.disconnect = function () {
        this._post(ACTIONS.RCV_DISCONNECT, null);
    };
    /**
     * Action - Ask connect
     *
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.askConnect = function () {
        this._post(ACTIONS.CONNECT, null);
    };
    /**
     * Ajax - Get user
     *
     * @param {(data: PostMessage, err: string) => void} callback
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.getUser = function (callback) {
        this._checkIfConnect();
        this._ajax("/me", callback);
    };
    /**
     * Ajax - Get ldap user
     *
     * @param {(data: PostMessage, err: string) => void} callback
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.getLdapUser = function (callback) {
        this._checkIfConnect();
        this._ajax("/me/ldap", callback);
    };
    /**
     * Ajax - Get events for date
     *
     * @param {string} date
     * @param {(data: PostMessage, err: string) => void} callback
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.getEventsForDate = function (date, callback) {
        this._checkIfConnect();
        this._ajax("/calendar/events?date=" + date, callback);
    };
    /**
     * Ajax - Get events for range
     *
     * @param {string} start
     * @param {string} end
     * @param {(data: PostMessage, err: string) => void} callback
     *
     * @memberOf UPEMSDK
     */
    UPEMSDK.prototype.getEventsForRange = function (start, end, callback) {
        this._checkIfConnect();
        this._ajax("/calendar/events?startDate=" + start + "&endDate=" + end, callback);
    };
    return UPEMSDK;
}());
