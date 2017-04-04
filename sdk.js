var UPEMConnectSDK = function(userconfig) {
    var defaultconfig = {
        baseUrl: "http://perso-etudiant.u-pem.fr/~vrasquie/cas",
        iframe: "upem_connect",
        popupHeight: 400,
        popupWidth: 800,
        debug: false
    };

    this.$config = Object.assign(defaultconfig, userconfig);
    this._debug("Init", this.$config);
}

UPEMConnectSDK.prototype.init = function init(callback) {
    var iframe = document.getElementById(this.$config.iframe);
    if (!iframe) return;

    var self = this;
    iframe.src = this.$config.baseUrl + "/connect";
    iframe.style = "border: none;width: 200px;height:70px;";

    window.addEventListener("message", function(event) {
        //if (event.origin != window.document.URL) return;

        var data = event.data;
        if (!data) {}
        if (!data.token) {}

        var usr = self.extractUsr(data.token);
        if (!usr) {}
        
        callback(data, usr);
    });
}

UPEMConnectSDK.prototype.extractUsr = function extractUsr(token) {
    try {
        var json = JSON.parse(atob(token.split(".")[1]));
        return JSON.parse(atob(json.usr));
    } catch(e) {
        return null;
    }
}

UPEMConnectSDK.prototype._popup = function _popup(url, title) {
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

UPEMConnectSDK.prototype._debug = function _debug(action, extra) {
    if (this.$config.debug) {
        console.log("CASEnabler SDK - " + action + " - ", extra);
    }
}
