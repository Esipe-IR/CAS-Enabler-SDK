"use strict";
;
;
;
exports.UPEMSDK_API = "UPEM-Api";
exports.UPEMSDK_VAULT = "UPEM-Vault";
var RCV_DEFAULT = "rcv::default";
var RCV_CONNECT = "rcv::connect";
var RCV_DISCONNECT = "rcv::disconnect";
var ASK_CONNECT = "ask::connect";
var ASK_RESET = "ask::reset";
var UPEMSDK = (function () {
    function UPEMSDK(userConfig) {
        var defaultConfig = {
            baseURL: "https://perso-etudiant.u-pem.fr/~vrasquie/core",
            scope: null,
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
            _a[RCV_CONNECT] = function (msg) {
                self._receiveConnect(msg);
            },
            _a[RCV_DISCONNECT] = function (msg) {
                self._receiveDisconnect(msg);
            },
            _a[RCV_DEFAULT] = function (msg) {
                self._receiveDefault(msg);
            },
            _a);
        window.addEventListener("message", function (event) {
            var msg = event.data;
            if (!msg || !msg.type || msg.scope !== self._c.scope) {
                return self._debug("=> Event Message (ERROR)", event);
            }
            if (msg.src == document.URL) {
                return self._debug("<= Event Message (SEND)", msg);
            }
            self._debug("=> Event Message (RECEIVE)", msg);
            if (typeof self._f[msg.type] === "function") {
                return self._f[msg.type](msg);
            }
            self._debug("** Type is not a valid function", { type: msg.type, f: self._f });
            self._f[RCV_DEFAULT](msg);
        });
        var _a;
    };
    UPEMSDK.prototype._receiveConnect = function (msg) {
        if (this._isValid(msg)) {
            this.setToken(msg.data);
        }
        this._receiveDefault(msg);
    };
    UPEMSDK.prototype._receiveDisconnect = function (msg) {
        this.setToken(null);
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
    UPEMSDK.prototype._post = function (type, data, src) {
        var msg = {
            type: type,
            code: 0,
            scope: this._c.scope,
            src: src ? src : document.URL,
            data: data,
            error: null
        };
        window.postMessage(msg, "*");
    };
    UPEMSDK.prototype._check = function (callback) {
        if (!this.getToken())
            throw new Error("config.token is undefined. User may not be connected yet");
        if (typeof callback !== "function")
            throw new Error("callback should be a function");
    };
    UPEMSDK.prototype._isValid = function (msg) {
        if (msg.error === null && msg.code === 0) {
            return true;
        }
        return false;
    };
    UPEMSDK.prototype.onConnect = function (callback, force) {
        this._callback[RCV_CONNECT] = callback;
        if (force && this.getToken())
            this.connect();
    };
    UPEMSDK.prototype.onDisconnect = function (callback) {
        this._callback[RCV_DISCONNECT] = callback;
    };
    UPEMSDK.prototype.unregister = function (key) {
        this._callback[key] = null;
    };
    UPEMSDK.prototype.unregisterOnConnect = function () {
        this.unregister(RCV_CONNECT);
    };
    UPEMSDK.prototype.unregisterOnDisconnect = function () {
        this.unregister(RCV_DISCONNECT);
    };
    UPEMSDK.prototype.getToken = function () {
        return localStorage.getItem("upem-token");
    };
    UPEMSDK.prototype.setToken = function (token) {
        if (!token)
            localStorage.removeItem("upem-token");
        else
            localStorage.setItem("upem-token", token);
    };
    UPEMSDK.prototype.resetVault = function () {
        this._post(ASK_RESET, null);
    };
    UPEMSDK.prototype.connect = function (token) {
        if (typeof token === "undefined") {
            token = this.getToken();
        }
        this._post(RCV_CONNECT, token, "CORE");
    };
    UPEMSDK.prototype.disconnect = function () {
        this._post(RCV_DISCONNECT, null);
    };
    UPEMSDK.prototype.askConnect = function () {
        this._post(ASK_CONNECT, null);
    };
    UPEMSDK.prototype.getUser = function (callback) {
        this._check(callback);
        this._ajax("/me", callback);
    };
    UPEMSDK.prototype.getLdapUser = function (callback) {
        this._check(callback);
        this._ajax("/me/ldap", callback);
    };
    UPEMSDK.prototype.getEvents = function (ctx, callback) {
        this._check(callback);
        if (!ctx.resources) {
            throw new Error("ctx.resources is required");
        }
        var uri = "/calendar/events?resources=" + ctx.resources;
        if (ctx.date) {
            uri += "&date=" + ctx.date;
        }
        if (ctx.startDate) {
            uri += "&startDate=" + ctx.startDate;
        }
        if (ctx.endDate) {
            uri += "&endDate=" + ctx.endDate;
        }
        this._ajax(uri, callback);
    };
    return UPEMSDK;
}());
exports.UPEMSDK = UPEMSDK;
window["UPEMSDK"] = UPEMSDK;
window["UPEMSDK_API"] = exports.UPEMSDK_API;
window["UPEMSDK_VAULT"] = exports.UPEMSDK_VAULT;
