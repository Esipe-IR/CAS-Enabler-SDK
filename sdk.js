var CASEnablerSDK = function(userconfig) {
    var defaultconfig = {
        baseUrl: "http://perso-etudiant.u-pem.fr/~vrasquie/cas",
        publicUid: null,
        popupHeight: 400,
        popupWidth: 800,
        debug: false
    };

    this.$config = Object.assign(defaultconfig, userconfig);

    if (!this.$config.publicUid) {
        throw new Error("publicUid is a mandatory parameter for CAS Enabler SDK");
    }

    this._debug("Init", this.$config);
}

CASEnablerSDK.prototype.connect = function connect(callback) {
    var url = this.$config.baseUrl + "/service/" + this.$config.publicUid + "/connect";
    var popup = this._popup(url, "CAS Authenticator");

    var $chan = Channel.build({
        window: popup,
        origin: "*",
        scope: "CAS.Scope"
    });

    this._debug("Init Chan", $chan);

    var self = this;
    $chan.bind("connect", function(transaction, token) {
        self._debug("Chan connect", token);
        if (typeof callback === "function") callback(token, null);
        return 1;
    });

    $chan.bind("error", function(transaction, error) {
        self._debug("Chan error", error);
        if (typeof callback === "function") callback(null, error);
        return 1;
    });
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

    return newWindow;
}

CASEnablerSDK.prototype._debug = function _debug(action, extra) {
    if (this.$config.debug) {
        console.log("CASEnabler SDK - " + action + " - ", extra);
    }
}
