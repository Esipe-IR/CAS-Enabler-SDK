var CASEnbalerSDK = function($url, $uid, $options) {
    this.url = $url;
    this.uid = $uid;
    this.options = $options;
    this.callback = "call_enabler_callback";
    window[this.callback] = this._callback;
}

CASEnbalerSDK.prototype.error = function error(type) {
    if (this.options["errorFn"] && typeof this.options["errorFn"] === "function") {
        this.options["errorFn"](type);
    }
}

CASEnbalerSDK.prototype.auth = function auth() {
    var uri = "/auth";
    this._popup(this.url + uri, "CAS Authenticator");
}

CASEnbalerSDK.prototype.allow = function allow() {
    var uri = "/service/" + this.uid + "/allow";
    this._popup(this.url + uri, "CAS Allower");
}

CASEnablerSDK.prototype.call = function call() {
    var uri = "/service/" + this.uid + "/call";

    if (this.options.isJsonp) {
        return this._jsonp(uri);
    }

    return this._ajax(uri);
}

CASEnbalerSDK.prototype._callback = function _callback(response) {
    if (!response.status && response.code === 1) {
        return this.error("NOT::CONNECTED");
    }

    if (!data.status && data.code === 3) {
        return this.error("NOT::ALLOWED");
    }

    if (data.status) {
        var serviceData = JSON.parse(data.data);

        if (this.options["callbackFn"] && typeof this.options["callbackFn"] === "function") {
            this.options['callbackFn'](serviceData);
        }
    }

    return this.error("UNDEFINED");
}

CASEnbalerSDK.prototype._jsonp = function _jsonp(uri) {
    var url = this.url + uri + "?callback=" + this.callback;
}

CASEnbalerSDK.prototype._ajax = function _ajax(uri) {
    var url = this.url + uri;
}

CASEnbalerSDK.prototype._popup = function _popup(url, title) {
    var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (this.options["popupWidth"] / 2)) + dualScreenLeft;
    var top = ((height / 2) - (this.options["popupHeight"] / 2)) + dualScreenTop;

    var newWindow = window.open(
        url, 
        title, 
        'scrollbars=yes, width=' + this.options["popupWidth"] + ', height=' + this.options["popupHeight"] + ', top=' + top + ', left=' + left
    );

    if (window.focus) {
        newWindow.focus();
    }
}
