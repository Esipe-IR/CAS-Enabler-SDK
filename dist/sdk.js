var UPEMSDK_API = "UPEM-Api";
var UPEMSDK_VAULT = "UPEM-Vault";
var UPEMSDK = (function () {
    function UPEMSDK(userConfig) {
        var defaultConfig = {
            baseURL: "https://perso-etudiant.u-pem.fr/~vrasquie/u",
            scope: null,
            iframe: null,
            token: null,
            debug: false
        };
        this.$config = Object.assign(defaultConfig, userConfig);
        this.$callback = {};
        this._setupIframe();
        this._setupListener();
        this._debug("INIT", this);
    }
    UPEMSDK.prototype._setupIframe = function () {
        if (this.$config.iframe) {
            var iframe = document.getElementById(this.$config.iframe);
            if (!iframe)
                throw new Error("No <iframe> element was find with id : " + this.$config.iframe);
            iframe.src = this.$config.baseURL + "/connect";
            iframe.style.border = "none";
            iframe.style.width = "200px";
            iframe.style.height = "70px";
        }
    };
    UPEMSDK.prototype._setupListener = function () {
        var self = this;
        window.addEventListener("message", function (event) {
            if (!event.data.type || event.data.scope !== self.$config.scope) {
                return self._debug("=> Event Message (ERROR)", event);
            }
            self._debug("=> Event Message (RECEIVE)", event);
            self._debug("=> Event Message (DATA)", event.data);
            if (typeof self.$callback[event.data.type] === "function") {
                self.$callback[event.data.type](event.data);
                self.$callback[event.data.type] = null;
            }
        });
    };
    UPEMSDK.prototype._debug = function (action, extra) {
        if (this.$config.debug) {
            console.log("UPEM SDK", " - " + action + " - ", extra);
        }
    };
    UPEMSDK.prototype._ajax = function (uri, callback) {
        var x = new XMLHttpRequest();
        var url = this.$config.baseURL + "/api" + uri;
        var self = this;
        x.responseType = 'json';
        x.onreadystatechange = function (oEvent) {
            if (x.readyState === 4) {
                if (x.status === 200) {
                    self._debug("AJAX Success", x.response);
                    callback(x.response, null);
                }
                else {
                    self._debug("AJAX Error", x.statusText);
                    callback(null, x.statusText);
                }
            }
        };
        this._debug("AJAX Request", { url: url, token: this.$config.token });
        x.open("GET", url);
        x.setRequestHeader('token', this.$config.token);
        x.send();
    };
    UPEMSDK.prototype._post = function (type, data) {
        var msg = {
            type: type,
            code: 0,
            scope: this.$config.scope,
            data: data,
            error: null
        };
        window.postMessage(msg, "*");
    };
    UPEMSDK.prototype._reset = function () {
        if (this.$config.scope === UPEMSDK_VAULT) {
            this._post("reset", null);
        }
    };
    UPEMSDK.prototype.isApi = function () {
        this.$config.scope = UPEMSDK_API;
    };
    UPEMSDK.prototype.isVault = function () {
        this.$config.scope = UPEMSDK_VAULT;
    };
    UPEMSDK.prototype.onConnect = function (callback) {
        var self = this;
        this.$callback["receiveToken"] = function (data) {
            if (data.error !== null || data.code !== 0) {
                return callback(data);
            }
            self.$config.token = data.data;
            callback(data);
        };
        if (this.$config.scope === UPEMSDK_VAULT) {
            this._post("handshake", null);
        }
    };
    UPEMSDK.prototype.getUser = function (callback) {
        if (!this.$config.token)
            throw new Error("config.token is undefined. User is maybe not connected yet");
        this._ajax("/me", callback);
    };
    UPEMSDK.prototype.getLdapUser = function (callback) {
        if (!this.$config.token)
            throw new Error("config.token is undefined. User is maybe not connected yet");
        this._ajax("/me/ldap", callback);
    };
    UPEMSDK.prototype.getDayEvents = function (callback) {
        if (!this.$config.token)
            throw new Error("config.token is undefined. User is maybe not connected yet");
        var curr = new Date();
        var date = (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear();
        this._ajax("/calendar/events" + "?date=" + date + "detail=" + 7, callback);
    };
    UPEMSDK.prototype.getWeekEvents = function (callback) {
        if (!this.$config.token)
            throw new Error("config.token is undefined. User is maybe not connected yet");
        var c = new Date();
        var f = new Date(c.getFullYear(), c.getMonth(), c.getDate() + (c.getDay() == 0 ? -6 : 1) - c.getDay());
        var l = new Date(c.getFullYear(), c.getMonth(), c.getDate() + (c.getDay() == 0 ? 0 : 7) - c.getDay());
        var startDate = (f.getMonth() + 1) + "/" + f.getDate() + "/" + f.getFullYear();
        var endDate = (l.getMonth() + 1) + "/" + l.getDate() + "/" + l.getFullYear();
        this._ajax("/calendar/events" + "?startDate=" + startDate + "&endDate=" + endDate + "&detail=" + 7, callback);
    };
    return UPEMSDK;
}());
