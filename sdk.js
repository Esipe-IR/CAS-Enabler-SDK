var CASEnablerSDK = function(userconfig) {
    var defaultconfig = {
        baseUrl: null,
        uid: null,
        callbackName: "cas_callback",
        callbackFn: this._callback,
        isJsonp: false,
        popupHeight: 200,
        popupWidth: 700,
        debug: false
    };

    this.$config = Object.assign(defaultconfig, userconfig);
    window[this.$config.callbackName] = this.$config.callbackFn;

    if (this.$config.debug) {
        this._debug("Init", this.$config);
    }
}

CASEnablerSDK.prototype._debug = function _debug(action, extra) {
    console.log("CASEnabler SDK - Action: " + action + ";", extra);
}

CASEnablerSDK.prototype.setConfig = function setConfig(config) {
    this.$config = Object.assign(this.$config, config);
    window[this.$config.callbackName] = this.$config.callbackFn;

    if (this.$config.debug) {
        this._debug("Set config", this.$config);
    }
}

CASEnablerSDK.prototype.auth = function auth() {
    var uri = "/auth";
    this._popup(this.$config.baseUrl + uri, "CAS Authenticator");
}

CASEnablerSDK.prototype.token = function token() {
    var url = this.$config.baseUrl + "/api/service/" + this.$config.uid + "/token";

    if (this.$config.isJsonp) {
        return this._jsonp(url);
    }

    return this._ajax(url);
}

CASEnablerSDK.prototype.verify = function verify(token) {
    var url = this.$config.url + "/api/service/" + this.$config.uid + "/token/" + token;

    if (this.$config.isJsonp) {
        return this._jsonp(url);
    }

    return this._ajax(url);
}

CASEnablerSDK.prototype._callback = function _callback(response) {
    alert("Got a callback");
    console.log(response);
}

CASEnablerSDK.prototype._jsonp = function _jsonp(url) {
    url = url + "?callback=" + this.$config.callbackName;

    if (this.$config.debug) {
        this._debug("Call jsonp", url);
    }

    var s = document.createElement('script');
    s.setAttribute('src', url);
    document.body.appendChild(s);
}

CASEnablerSDK.prototype._ajax = function _ajax(url) {
    if (this.$config.debug) {
        this._debug("Call jsonp", url);
    }

    //TODO: Ajax
}

CASEnablerSDK.prototype._popup = function _popup(url, title) {
    var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (this.$config.popupWidth / 2)) + dualScreenLeft;
    var top = ((height / 2) - (this.$config.popupHeight / 2)) + dualScreenTop;

    var newWindow = window.open(
        url, 
        title, 
        'scrollbars=yes, width=' + this.$config.popupWidth + ', height=' + this.$config.popupHeight + ', top=' + top + ', left=' + left
    );

    if (window.focus) {
        newWindow.focus();
    }
}
