var UPEMConnectSDK = function(userconfig) {
    var defaultconfig = {
        baseUrl: "http://perso-etudiant.u-pem.fr/~vrasquie/cas",
        popupHeight: 400,
        popupWidth: 800,
        debug: false
    };

    this.$config = Object.assign(defaultconfig, userconfig);
    this._debug("Init", this.$config);
}

UPEMConnectSDK.prototype.connect = function connect(callback) {
    var url = this.$config.baseUrl + "/connect";
    var popup = this._popup(url, "UPEM Connect");

    window.addEventListener("message", function(event) {
        //if (event.origin !== self.baseUrl)
            //return;

        var data = event.data;
        if (!data) {}
        if (!data.token) {}

        //Check token and decrypt
        
        callback(data.token, data.code);
    });
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
