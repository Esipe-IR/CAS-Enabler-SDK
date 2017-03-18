export default class CASEnablerSDK {
    constructor(userconfig) {
        this._initConfig(userconfig);
    }

    setConfig(config) {
        this.$config = Object.assign(this.$config, config);
        window[this.$config.callbackName] = this.$config.callbackFn;

        if (this.$config.debug) {
            this._debug("Set config", this.$config);
        }
    }

    connect() {
        var url = this.$config.baseUrl + "/service/" + this.$config.publicUid + "/connect";
        var win = this._popup(url, "CAS Authenticator");

        var chan = Channel.build({
            window: win,
            origin: "*",
            scope: "CAS.Scope"
        });

        this._debug("Init Chan", chan);

        var self = this;
        chan.bind("connect", function(transaction, token) {
            self._debug("Connect", token);
            self.$config.callbackFn(token);
        
            return 1;
        });

        chan.bind("error", function(transaction, error) {
            self._debug("Error", error);

            return 1;
        });
    }

    _initConfig(userconfig) {
        var defaultconfig = {
            baseUrl: "http://perso-etudiant.u-pem.fr/~vrasquie/cas",
            publicUid: null,
            callbackName: "callback",
            callbackFn: function() {},
            popupHeight: 400,
            popupWidth: 800,
            debug: false
        };

        this.$config = Object.assign(defaultconfig, userconfig);
        window[this.$config.callbackName] = this.$config.callbackFn;

        this._debug("Init Config", this.$config);
    }

    _popup(url, title) {
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

        return newWindow;
    }

    _debug(action, extra) {
        if (this.$config.debug) {
            console.log("CASEnabler SDK - Action: " + action + ";", extra);
        }
    }
}
