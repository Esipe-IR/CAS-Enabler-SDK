/**
 * UPEMConnectSDK - Create object SDK for UPEM connect
 *
 * @param {*} userconfig 
 */
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

/**
 * init - Init SDK
 */
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

/**
 * reset - Reset user's config/rights for SDK
 */
UPEMConnectSDK.prototype.resetVault = function resetVault() {
  this._post("reset", this.$config.vault, this.$config.id);
}

/**
 * getHandshake - Shake if user have install UPEM-Vault
 *
 * @param {function} callback
 */
UPEMConnectSDK.prototype.getVaultHandshake = function getVaultHandshake(callback) {
  this.$callback["receiveHandshake"] = callback;
  this._post("getHandshake", this.$config.vault, this.$config.id);
}

/**
 * getToken - Ask user's token to UPEM-Vault
 *
 * @param {function} callback
 */
UPEMConnectSDK.prototype.getVaultToken = function getVaultToken(callback) {
  this.$callback["receiveToken"] = callback;
  this._post("getToken", this.$config.vault, this.$config.id);
}

/**
 * getUser - Ask user's info to UPEM-Vault
 *
 * @param {function} callback
 */
UPEMConnectSDK.prototype.getVaultUser = function getVaultUser(callback) {
  this.$callback["receiveUser"] = callback;
  this._post("getUser", this.$config.vault, this.$config.id);
}

/**
 * receiveDefault - Receive message and execute the right callback
 *
 * @param {Event} event
 */
UPEMConnectSDK.prototype.receiveDefault = function receiveDefault(event) {
  console.log(event.data);

  if (typeof this.ref.$callback[event.data.type] == "function") {
    this.ref.$callback[event.data.type](event.data.data);
  }

  this.ref.$callback[event.data.type] = null;
}

/**
 * connect - Connect method with IFRAME
 * 
 * @param {function} callback
 */
UPEMConnectSDK.prototype.connect = function connect(callback) {
  this.$callback["receiveToken"] = callback;

  var iframe = document.getElementById(this.$config.iframeId);
  if (!iframe) throw new Error("No <iframe> element was find with id : " + this.$config.iframeId);

  iframe.src = this.$config.baseUrl + "/connect?target=" + this.$config.id;
  iframe.style = "border:none;width:200px;height:70px;";
}

UPEMConnectSDK.prototype._post = function _post(type, scope, target, data) {
  window.postMessage({type: type, scope: scope, target: target, data: data}, "*");
}

UPEMConnectSDK.prototype._debug = function _debug(action, extra) {
  if (this.$config.debug) {
    console.log("CASEnabler SDK - " + action + " - ", extra);
  }
}
