export default class CASEnablerSDK {
    constructor() {
        this.$url = $url;
        this.$uid = $uid;
        this.$options = $options;

        this._init();
    }

    _debug(action, extra) {
        console.log("CASEnabler SDK - Action: " + action + ";", extra);
    }

    _init() {
        var options = Object.assign({
            callbackName: "cas_callback",
            callbackFn: this._callback,
            isJsonp: false,
            popupHeight: 200,
            popupWidth: 700,
            debug: false
        }, this.$options);

        this.$options = options;
        window[this.$options.callbackName] = this.$options.callbackFn;

        if (this.$options.debug) {
            this._debug("Set options", this.$options);
        }
    }

    auth() {
        var uri = "/auth";
        this._popup(this.$url + uri, "CAS Authenticator");
    }

    token() {
        var uri = "/api/service/" + this.$uid + "/token";

        if (this.$options.isJsonp) {
            return this._jsonp(uri);
        }

        return this._ajax(uri);
    }

    verify(token) {
        var uri = "/api/service/" + this.$uid + "/token/" + token;

        if (this.$options.isJsonp) {
            return this._jsonp(uri);
        }

        return this._ajax(uri);
    }

    _callback(response) {
        console.log(response);
    }

    _jsonp(uri) {
        var url = this.$url + uri + "?callback=" + this.$options.callbackName;

        if (this.$options.debug) {
            this._debug("Call jsonp", url);
        }

        var s = document.createElement('script');
        s.setAttribute('src', url);
        document.body.appendChild(s);
    }

    _ajax(uri) {
        var url = this.$url + uri;

        if (this.$options.debug) {
            this._debug("Call ajax", url);
        }

        //TODO: Ajax
    }

     _popup(url, title) {
        var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
        var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

        var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

        var left = ((width / 2) - (this.$options.popupWidth / 2)) + dualScreenLeft;
        var top = ((height / 2) - (this.$options.popupHeight / 2)) + dualScreenTop;

        var newWindow = window.open(
            url,
            title,
            'scrollbars=yes, width=' + this.$options.popupWidth + ', height=' + this.$options.popupHeight + ', top=' + top + ', left=' + left
        );

        if (window.focus) {
            newWindow.focus();
        }
    }
}
