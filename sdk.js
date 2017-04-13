/* UPEM SDK */
var UPEMSDK = function(config) {
  var dc = {
    baseUrl: "http://perso-etudiant.u-pem.fr/~vrasquie/cas",
    debug: false
  };

  this.$config = Object.assign(dc, config);
  this._debug("UPEMSDK", "INIT", this);
}

UPEMSDK.prototype.api = function api() {
  return new UPEMApiSDK(this);
}

UPEMSDK.prototype.connect = function connect(config) {
  return new UPEMConnectSDK(this, config);
}

UPEMSDK.prototype.vault = function vault(config) {
  return new UPEMVaultSDK(this, config);
}

UPEMSDK.prototype._debug = function _debug(ctx, action, extra) {
  if (this.$config.debug) {
    console.log(ctx, " - " + action + " - ", extra);
  }
}

/* UPEM API */
var UPEMApiSDK = function(parent) {
  this._block = false;
  this._mutex = [];
  this._parent = parent;
  this._parent._debug("UPEMApiSDK", "INIT", this);
}

UPEMApiSDK.prototype.getToken = function getToken(callback) {
  var self = this;
  this._mutex.push(callback);

  if (!this._block) {
    this._block = true;  

    this._ajax("/token", null, function(x) {
      self.token = x.data;

      self._mutex.forEach(function(call) {
        call(self.token);
      }, this);
    });
  }
}

UPEMApiSDK.prototype.getUser = function getUser(callback) {
  if (!this._checkToken("getUser", callback)) return;

  this._ajax("/me", this.token, function(x) {
    callback(x.data);
  });
}

UPEMApiSDK.prototype.getLdapUser = function getLdapUser(callback) {
  if (!this._checkToken("getLdapUser", callback)) return;
  
  this._ajax("/me/ldap", this.token, function(x) {
    callback(x.data);
  });  
}

UPEMApiSDK.prototype.getCalendar = function getCalendar(callback) {
  if (!this._checkToken("getCalendar", callback)) return;

  this._ajax("/", this.token, function(x) {
    callback(x.data);
  });
}

UPEMApiSDK.prototype._checkToken = function _checkToken(fn, callback) {
  if (!this.token) {
    var self = this;
    
    this.getToken(function() { 
      self[fn](callback);
    });

    return false;
  }

  return true;
}

UPEMApiSDK.prototype._ajax = function _ajax(uri, token, callback) {
  var x = new XMLHttpRequest();
  var url = this._parent.$config.baseUrl + "/api" + uri;
  var self = this;

  x.responseType = 'json';
  x.onreadystatechange = function (oEvent) {
    if (x.readyState === 4) {
      if (x.status === 200) {
        self._parent._debug("UPEMApiSDK", "Ajax success", x.response);
        callback(x.response, null);
      } else {
        self._parent._debug("UPEMApiSDK", "Ajax error", x.statusText);        
        callback(null, x.statusText);
      }
    }
  }

  x.open("GET", url);
  x.setRequestHeader('token', token);
  x.send();
}

/* UPEM Connect */
var UPEMConnectSDK = function(parent, config) {
  if (!config.iframe) throw new Error("config.iframe is required");
  if (!config.callback) throw new Error("config.callback is required");

  var dc = {
    iframe: null
  };

  this._parent = parent;
  this.$config = Object.assign(dc, config);

  var iframe = document.getElementById(this.$config.iframe);
  if (!iframe) throw new Error("No <iframe> element was find with id : " + this.$config.iframe);
  iframe.src = this._parent.$config.baseUrl + "/connect";
  iframe.style = "border:none;width:200px;height:70px;";

  var self = this;
  window.addEventListener("message", function(event) {
    if (!event.data) {
      return self._parent._debug("UPEMConnectSDK", "Event Message (ERROR)", event);
    }

    self._parent._debug("UPEMConnectSDK", "Event Message (RECEIVE)", event);
    self.$config.callback(event.data.data);
  });

  this._parent._debug("UPEMConnectSDK", "INIT", this);
}

/* UPEM Vault */
var UPEMVaultSDK = function(parent, config) {
  if (!config.target) throw new Error("config.target is required");

  var dc = {
    target: null,
    scope: "UPEM-Vault"
  };

  this._parent = parent;
  this.$config = Object.assign(dc, config);

  this.$fn = {
    receiveDefault: this.receiveDefault,
    ref: this
  };
  this.$callback = {};
  var self = this;
  window.addEventListener("message", function(event) {
    if (
      !event.data
      || !event.data.type
      || !event.data.target
      || event.data.target !== self.$config.target
    ) {
      return self._parent._debug("UPEMVaultSDK", "Event Message (ERROR)", event);urn;
    }

    self._parent._debug("UPEMVaultSDK", "Event Message (RECEIVE)", event);

    if (!self.$fn[event.data.type]) {
      return self.$fn["receiveDefault"](event);
    }

    return self.$fn[event.data.type](event);
  });

  this._parent._debug("UPEMVaultSDK", "INIT", this);
}

UPEMVaultSDK.prototype.reset = function reset() {
  this._post("reset", this.$config.scope, this.$config.target);
}

UPEMVaultSDK.prototype.getHandshake = function getHandshake(callback) {
  this.$callback["receiveHandshake"] = callback;
  this._post("getHandshake", this.$config.scope, this.$config.target);
}

UPEMVaultSDK.prototype.getToken = function getToken(callback) {
  this.$callback["receiveToken"] = callback;
  this._post("getToken", this.$config.scope, this.$config.target);
}

UPEMVaultSDK.prototype.getUser = function gettUser(callback) {
  this.$callback["receiveUser"] = callback;
  this._post("getUser", this.$config.scope, this.$config.target);
}

UPEMVaultSDK.prototype.receiveDefault = function receiveDefault(event) {
  this.ref._parent._debug("UPEMVaultSDK", "Event DATA", event.data);

  if (typeof this.ref.$callback[event.data.type] == "function") {
    this.ref.$callback[event.data.type](event.data.data);
  }

  this.ref.$callback[event.data.type] = null;
}

UPEMVaultSDK.prototype._post = function _post(type, scope, target, data) {
  window.postMessage({type: type, scope: scope, target: target, data: data}, "*");
}
