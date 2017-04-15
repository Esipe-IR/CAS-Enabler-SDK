const UPEMSDK_API:string = "UPEM-Api";
const UPEMSDK_VAULT: string = "UPEM-Vault";

interface Config {
  baseURL: string;
  scope: string;
  iframe: string;
  token: string;
  debug: boolean;
}

interface PostMessage {
  type: string;
  code: number;
  scope: string;
  data: any;
  error: any;
}

class UPEMSDK {
  $config: Config;
  $callback: Object;

  constructor(userConfig: Config) {
    var defaultConfig: Config = {
      baseURL: "https://perso-etudiant.u-pem.fr/~vrasquie/u",
      scope: null,
      iframe: null,
      token: null,
      debug: false
    }

    this.$config = (<any>Object).assign(defaultConfig, userConfig);
    this.$callback = {};

    this._setupIframe();
    this._setupListener();
    this._debug("INIT", this);
  }

  _setupIframe(): void {
    if (this.$config.iframe) {
      var iframe: HTMLIFrameElement = <HTMLIFrameElement> document.getElementById(this.$config.iframe);
      
      if (!iframe) throw new Error("No <iframe> element was find with id : " + this.$config.iframe);
      
      iframe.src = this.$config.baseURL + "/connect";
      iframe.style.border = "none";
      iframe.style.width = "200px";
      iframe.style.height = "70px";
    }
  }

  _setupListener(): void {
    var self: UPEMSDK = this;

    window.addEventListener("message", function(event) {
      if (!event.data || !event.data.type || event.data.scope !== self.$config.scope) {
        return self._debug("=> Event Message (ERROR)", event);
      }

      self._debug("=> Event Message (RECEIVE)", event);
      self._debug("=> Event Message (DATA)", event.data);

      if (typeof self.$callback[event.data.type] === "function") {
        self.$callback[event.data.type](event.data);
        self.$callback[event.data.type] = null; 
      }
    });
  }

  _debug(action: string, extra: any) {
    if (this.$config.debug) {
      console.log("UPEM SDK", " - " + action + " - ", extra);
    }
  }

  _ajax(uri: string, callback: (obj: Object, err: String) => void) {
    var x: XMLHttpRequest = new XMLHttpRequest(); 

    var url: string = this.$config.baseURL + "/api" + uri;
    var self: UPEMSDK = this;

    x.responseType = 'json';
    x.onreadystatechange = function (oEvent) {
      if (x.readyState === 4) {
        if (x.status === 200) {
          self._debug("AJAX Success", x.response);
          callback(x.response, null);
        } else {
          self._debug("AJAX Error", x.statusText);
          callback(null, x.statusText);
        }
      }
    }

    this._debug("AJAX Request", {url: url, token: this.$config.token});
    x.open("GET", url);
    x.setRequestHeader('token', this.$config.token);
    x.send();
  }

  _post(type: string, data: any) {
    var msg: PostMessage = {
      type: type,
      code: 0,
      scope: this.$config.scope,
      data: data,
      error: null
    }

    window.postMessage(msg, "*");
  }

  _reset() {
    if (this.$config.scope === UPEMSDK_VAULT) {
      this._post("reset", null);
    }
  }

  isApi() {
    this.$config.scope = UPEMSDK_API;
  }

  isVault() {
    this.$config.scope = UPEMSDK_VAULT;
  }

  onConnect(callback: (data: PostMessage) => void) {
    var self: UPEMSDK = this;

    this.$callback["receiveToken"] = function(data: PostMessage) {
      if (data.error !== null || data.code !== 0) {
        return callback(data);
      }

      self.$config.token = data.data;
      callback(data);
    };

    if (this.$config.scope === UPEMSDK_VAULT) {
      this._post("handshake", null);
    }
  }

  getUser(callback: (data: Object, err: string) => void) {
    if (!this.$config.token) throw new Error("config.token is undefined. User is maybe not connected yet");
    this._ajax("/me", callback);
  }

  getLdapUser(callback: (data: Object, err: string) => void) {
    if (!this.$config.token) throw new Error("config.token is undefined. User is maybe not connected yet");  
    this._ajax("/me/ldap", callback);
  }

  getDayEvents(callback: (data: Object, err: string) => void) {
    if (!this.$config.token) throw new Error("config.token is undefined. User is maybe not connected yet");  

    var curr: Date = new Date();
    var date: string = (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear();

    this._ajax("/calendar/events" + "?date=" + date + "detail=" + 7, callback);
  }

  getWeekEvents(callback: (data: Object, err: string) => void) {
    if (!this.$config.token) throw new Error("config.token is undefined. User is maybe not connected yet");  

    var c: Date = new Date();
    var f: Date = new Date(c.getFullYear(), c.getMonth(), c.getDate() + (c.getDay() == 0 ? -6 : 1) - c.getDay());
    var l: Date = new Date(c.getFullYear(), c.getMonth(), c.getDate() + (c.getDay() == 0 ? 0 : 7) - c.getDay());

    var startDate: string = (f.getMonth() + 1) + "/" + f.getDate() + "/" + f.getFullYear();
    var endDate: string = (l.getMonth() + 1) + "/" + l.getDate() + "/" + l.getFullYear();

    this._ajax("/calendar/events" + "?startDate=" + startDate + "&endDate=" + endDate + "&detail=" + 7, callback);
  }
}
