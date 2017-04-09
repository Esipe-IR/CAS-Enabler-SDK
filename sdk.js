var UPEMConnectSDK = function(userconfig) {
  var defaultconfig = {
    baseUrl: "http://perso-etudiant.u-pem.fr/~vrasquie/cas",
    id: null,
    iframeId: null,
    vault: "UPEM-Vault",
    debug: false
  };

  this.$config = Object.assign(defaultconfig, userconfig);

  if (!this.$config.id) throw new Error("config.id is required");

  this.$fn = {};
  this.$callback = {};

  this._debug("Create", this);
  this.init();
}

UPEMConnectSDK.prototype.init = function init() {
  this.$fn = {
    receiveDefault: this.receiveDefault,
    ref: this
  };

  var self = this;

  window.addEventListener("message", function(event) {
    if (
      !event.data
      || !event.data.type
      || !event.data.target
      || event.data.target !== self.$config.id
    ) {
      return self._debug("Event Message (ERROR)", event);urn;
    }

    self._debug("Event Message (RECEIVE)", event);

    if (!self.$fn[event.data.type]) {
      return self.$fn["receiveDefault"](event);
    }

    return self.$fn[event.data.type](event);
  });

  this._debug("Init", this);
}

UPEMConnectSDK.prototype.getHandshake = function getHandshake(callback) {
  this.$callback["receiveHandshake"] = callback;
  this._post(window, "getHandshake", this.$config.vault, this.$config.id);
}

UPEMConnectSDK.prototype.getToken = function getToken() {
  this.$callback["receiveToken"] = callback;
  this._post(window, "getToken", this.$config.vault, this.$config.id);
}

UPEMConnectSDK.prototype.getUser = function getUser(callback) {
  this.$callback["receiveUser"] = callback;
  this._post(window, "getUser", this.$config.vault, this.$config.id);
}

UPEMConnectSDK.prototype.receiveDefault = function receiveDefault() {
  console.log(event.data);

  if (typeof this.ref.$callback[event.data.type] == "function") {
    this.ref.$callback[event.data.type](event.data.data);
  }

  this.ref.$callback[event.data.type] = null;
}

UPEMConnectSDK.prototype.connect = function connect(callback) {
  this.$callback["receiveToken"] = callback;

  var iframe = document.getElementById(this.$config.iframeId);
  if (!iframe) throw new Error("No <iframe> element was find with id : " + this.$config.iframeId);

  iframe.src = this.$config.baseUrl + "/connect?target=" + this.$config.id;
  iframe.style = "border:none;width:200px;height:70px;";
}

UPEMConnectSDK.prototype.extractUser = function extractUser(token) {
  try {
    var json = JSON.parse(atob(token.split(".")[1]));
    return JSON.parse(atob(json.usr));
  } catch(e) {
    return null;
  }
}

UPEMConnectSDK.prototype._post = function _post(src, type, scope, target, data) {
  src.postMessage({type: type, scope: scope, target: target, data: data}, "*");
}

UPEMConnectSDK.prototype._debug = function _debug(action, extra) {
  if (this.$config.debug) {
    console.log("CASEnabler SDK - " + action + " - ", extra);
  }
}
