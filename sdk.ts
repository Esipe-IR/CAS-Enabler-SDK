const UPEMSDK_API:string = "UPEM-Api";
const UPEMSDK_VAULT: string = "UPEM-Vault";

interface Config {
  baseURL: string;
  scope: string;
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
      token: null,
      debug: false
    }

    this.$config = (<any>Object).assign(defaultConfig, userConfig);
    this.$callback = {};

    this._setupListener();
    this._debug("INIT", this);
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
      }
    });
  }

  _debug(action: string, extra: any): void {
    if (this.$config.debug) {
      console.log("UPEM SDK", " - " + action + " - ", extra);
    }
  }

  _ajax(uri: string, callback: (obj: Object, err: String) => void): void {
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

  _post(type: string, data: any): void {
    var msg: PostMessage = {
      type: type,
      code: 0,
      scope: this.$config.scope,
      data: data,
      error: null
    }

    window.postMessage(msg, "*");
  }

  _reset(): void {
    if (this.$config.scope === UPEMSDK_VAULT) {
      this._post("reset", null);
    }
  }

  isApi(): void {
    this.$config.scope = UPEMSDK_API;
  }

  isVault(): void {
    this.$config.scope = UPEMSDK_VAULT;
  }

  onConnect(callback: (data: PostMessage) => void): void {
    var self: UPEMSDK = this;

    this.$callback["receiveToken"] = function(data: PostMessage) {
      if (data.error === null && data.code === 0) {
        self.setToken(data.data);
      }

      callback(data);
    };
  }

  setToken(token: string): void {
    this.$config.token = token;
    localStorage.setItem("upem-token", token);
  }

  getToken(): string {
    if (!this.$config.token) {
      return localStorage.getItem("upem-token");
    }

    return this.$config.token;
  }

  tryVaultAuth(): void {
    if (this.$config.scope === UPEMSDK_VAULT) {
      this._post("handshake", null);
    }
  }

  getUser(callback: (data: Object, err: string) => void): void {
    if (!this.getToken()) throw new Error("config.token is undefined. User may not be connected yet");
    this._ajax("/me", callback);
  }

  getLdapUser(callback: (data: Object, err: string) => void): void {
    if (!this.getToken()) throw new Error("config.token is undefined. User may not be connected yet");  
    this._ajax("/me/ldap", callback);
  }

  getDayEvents(callback: (data: Object, err: string) => void): void {
    if (!this.getToken()) throw new Error("config.token is undefined. User may not be connected yet");  

    var curr: Date = new Date();
    var date: string = (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear();

    this._ajax("/calendar/events" + "?date=" + date + "detail=" + 7, callback);
  }

  getWeekEvents(callback: (data: Object, err: string) => void): void {
    if (!this.getToken()) throw new Error("config.token is undefined. User may not be connected yet");  

    var c: Date = new Date();
    var f: Date = new Date(c.getFullYear(), c.getMonth(), c.getDate() + (c.getDay() == 0 ? -6 : 1) - c.getDay());
    var l: Date = new Date(c.getFullYear(), c.getMonth(), c.getDate() + (c.getDay() == 0 ? 0 : 7) - c.getDay());

    var startDate: string = (f.getMonth() + 1) + "/" + f.getDate() + "/" + f.getFullYear();
    var endDate: string = (l.getMonth() + 1) + "/" + l.getDate() + "/" + l.getFullYear();

    this._ajax("/calendar/events" + "?startDate=" + startDate + "&endDate=" + endDate + "&detail=" + 7, callback);
  }
}
