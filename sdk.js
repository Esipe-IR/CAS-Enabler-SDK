var UPEMSDK_API = "UPEM-Api";
var UPEMSDK_VAULT = "UPEM-Vault";

var UPEMSDK = function(config) {
  var dc = {
    baseUrl: "https://perso-etudiant.u-pem.fr/~vrasquie/u",
    scope: null,
    iframe: null,
    debug: false
  };

  this.$config = Object.assign(dc, config);
  this.$callback = {};    
  
  if (this.$config.iframe) {
    var iframe = document.getElementById(this.$config.iframe);
    if (!iframe) throw new Error("No <iframe> element was find with id : " + this.$config.iframe);
  
    iframe.src = this.$config.baseUrl + "/connect";
    iframe.style = "border:none;width:200px;height:70px;";
  }

  var self = this;
  window.addEventListener("message", function(event) {
    if (
      !event.data.type
      || event.data.scope !== self.$config.scope
    ) {
      return self._debug("Event Message (ERROR)", event);
    }

    self._debug("Event Message (RECEIVE)", event);

    return self.receiveMessage(event);
  });

  this._debug("INIT", this);
}

UPEMSDK.prototype._debug = function _debug(action, extra) {
  if (this.$config.debug) {
    console.log("UPEM SDK", " - " + action + " - ", extra);
  }
}

UPEMSDK.prototype._ajax = function _ajax(uri, token, callback) {
  var x = new XMLHttpRequest();
  var url = this.$config.baseUrl + "/api" + uri;
  var self = this;

  x.responseType = 'json';
  x.onreadystatechange = function (oEvent) {
    if (x.readyState === 4) {
      if (x.status === 200) {
        self._debug("Ajax success", x.response);
        callback(x.response, null);
      } else {
        self._debug("Ajax error", x.statusText);        
        callback(null, x.statusText);
      }
    }
  }

  x.open("GET", url);
  x.setRequestHeader('token', token);
  x.send();
}

UPEMSDK.prototype._post = function _post(type, data) {
  window.postMessage({type: type, scope: this.$config.scope, data: data}, "*");
}

UPEMSDK.prototype._reset = function _reset() {
  if (this.$config.scope === UPEMSDK_VAULT) {
    this._post("reset");
  }
}

UPEMSDK.prototype.isApi = function isApi() {
  this.$config.scope = UPEMSDK_API;
}

UPEMSDK.prototype.isVault = function isVault() {
  this.$config.scope = UPEMSDK_VAULT;
}

UPEMSDK.prototype.onConnect = function onConnect(callback) {  
  var self = this;
  this.$callback["receiveToken"] = function(data) {
    self.$config.token = data;
    callback(data);
  };

  if (this.$config.scope === UPEMSDK_VAULT) {
    this._post("handshake");
  }
}

UPEMSDK.prototype.getUser = function getUser(callback) {
  if (!this.$config.token) throw new Error("config.token is undefined. User maybe not connected yet");

  this._ajax("/me", this.$config.token, function(x) {
    callback(x.data);
  });
}

UPEMSDK.prototype.getLdapUser = function getLdapUser(callback) {
  if (!this.$config.token) throw new Error("config.token is undefined. User maybe not connected yet");  
  
  this._ajax("/me/ldap", this.$config.token, function(x) {
    callback(x.data);
  });  
}

UPEMSDK.prototype.getCalendar = function getCalendar(callback) {
  if (!this.$config.token) throw new Error("config.token is undefined. User maybe not connected yet");  

  this._ajax("/", this.$config.token, function(x) {
    callback(x.data);
  });
}

UPEMSDK.prototype.receiveMessage = function receiveMessage(event) {
  this._debug("Event DATA", event.data);

  if (typeof this.$callback[event.data.type] == "function") {
    this.$callback[event.data.type](event.data.data);
    this.$callback[event.data.type] = null; 
  }
}
