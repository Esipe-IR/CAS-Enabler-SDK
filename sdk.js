var UPEMConnectSDK = function(userconfig) {
    var defaultconfig = {
        baseUrl: "http://perso-etudiant.u-pem.fr/~vrasquie/cas",
        iframe: "upem_connect",
        debug: false
    };

    this.$config = Object.assign(defaultconfig, userconfig);
    this._debug("Init", this.$config);
}

UPEMConnectSDK.prototype.init = function init(callback) {
    var iframe = document.getElementById(this.$config.iframe);
    if (!iframe) return this._debug("Error", "No iframe with " + this.$config.iframe);

    var self = this;
    iframe.src = this.$config.baseUrl + "/connect";
    iframe.style = "border: none;width: 200px;height:70px;";

    window.addEventListener("message", function(event) {
        var data = event.data;
        self._debug("Listener message", data);

        if (!data) return self._debug("Error", "No data");
        if (!data.token) return self._debug("Error", "No token");
        if (typeof callback != "function") return self._debug("Error", "Callback not a function");

        callback(data);
    });
}

UPEMConnectSDK.prototype.extractUser = function extractUser(token) {
    try {
        var json = JSON.parse(atob(token.split(".")[1]));
        return JSON.parse(atob(json.usr));
    } catch(e) {
        return null;
    }
}

UPEMConnectSDK.prototype._debug = function _debug(action, extra) {
    if (this.$config.debug) {
        console.log("CASEnabler SDK - " + action + " - ", extra);
    }
}
