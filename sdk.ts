interface Config {
  baseURL: string;
  scope: string;
  token: string;
  debug: boolean;
};

interface PostMessage {
  type: string;
  code: number;
  scope: string;
  src: string;
  data: any;
  error: string;
};

const UPEMSDK_API:string = "UPEM-Api";
const UPEMSDK_VAULT: string = "UPEM-Vault";

const ACTIONS: any = {
  RCV_DEFAULT: "receiveDefault",
  RCV_CONNECT: "receiveConnect",
  RCV_DISCONNECT: "receiveDisconnect",
  CONNECT: "askConnect",
  RESET: "askReset"
};

class UPEMSDK {
  private _c: Config;
  private _f: Object;
  private _callback: Object;

  /**
   * Creates an instance of UPEMSDK.
   * @param {Config} userConfig 
   * 
   * @memberOf UPEMSDK
   */
  constructor(userConfig: Config) {
    let defaultConfig: Config = {
      baseURL: "https://perso-etudiant.u-pem.fr/~vrasquie/core",
      scope: null,
      token: null,
      debug: false
    }

    let c: Config = (<any>Object).assign(defaultConfig, userConfig);
    this._c = (<any>Object).freeze(c);

    this._setupReceiver();
    this._debug("INIT", this);
  }

  _setupReceiver(): void {
    var self: UPEMSDK = this;

    this._callback = {};
    this._f = {
      [ACTIONS.RCV_CONNECT]: function(msg: PostMessage) {
        self._receiveConnect(msg);
      },
      [ACTIONS.RCV_DISCONNECT]: function(msg: PostMessage) {
        self._receiveDisconnect(msg);
      },
      [ACTIONS.RCV_DEFAULT]: function(msg: PostMessage) {
        self._receiveDefault(msg);
      }
    };

    window.addEventListener("message", function(event: MessageEvent) {
      let msg: PostMessage = event.data;

      if (!msg || !msg.type || msg.scope !== self._c.scope) {
        return self._debug("=> Event Message (ERROR)", event);
      }

      if (msg.src == document.URL) {
        return;
      }

      self._debug("=> Event Message (RECEIVE)", msg);

      if (typeof self._f[msg.type] === "function") {
        return self._f[msg.type](msg);
      }

      self._debug("** Type is not a valid function", {type: msg.type, f: self._f});
      self._f[ACTIONS.RCV_DEFAULT](msg);
    });
  }

  _receiveConnect(msg: PostMessage): void {
    if (this._isValid(msg)) {
      this._setToken(msg.data);
    }

    this._receiveDefault(msg);
  }

  _receiveDisconnect(msg: PostMessage): void {
    this._setToken(null);
    this._receiveDefault(msg);
  }

  _receiveDefault(msg: PostMessage): void {
    if (typeof this._callback[msg.type] === "function") {
      return this._callback[msg.type](msg);
    }
    
    this._debug("** Type is not a valid callback", {type: msg.type, callback: this._callback});
  }

  _debug(action: string, extra: any): void {
    if (this._c.debug) {
      console.log("UPEM SDK", " - " + action + " - ", extra);
    }
  }

  _ajax(uri: string, callback: (obj: PostMessage, err: String) => void): void {
    var x: XMLHttpRequest = new XMLHttpRequest(); 

    var url: string = this._c.baseURL + "/api" + uri;
    var self: UPEMSDK = this;

    this._debug("___ AJAX Request", {url: url, token: this.getToken()});

    x.responseType = 'json';
    x.onreadystatechange = function (oEvent) {
      if (x.readyState !== 4) {
        return;
      }

      let err: string = x.statusText;

      if (x.status === 200) {
        if (self._isValid(x.response)) {
          self._debug("___ AJAX Success", x.response);
          return callback(x.response, null);
        }

        if (x.response.code === 4) {
          self.disconnect();
        }

        err = x.response.error;
      }
        
      self._debug("___ AJAX Error", x.response);
      callback(null, err);
    }
    
    x.open("GET", url);
    x.setRequestHeader("Token", this.getToken());
    x.send();
  }

  _post(type: string, data: any): void {
    var msg: PostMessage = {
      type: type,
      code: 0,
      scope: this._c.scope,
      src: document.URL,
      data: data,
      error: null
    }

    window.postMessage(msg, "*");
  }

  _checkIfConnect(): void {
    if (!this.getToken()) throw new Error("config.token is undefined. User may not be connected yet");
  }

  _isValid(msg: PostMessage) {
    if (msg.error === null && msg.code === 0) {
      return true;
    }

    return false;
  }

  _setToken(token: string): void {
    if (token === this._c.token) return;

    let c = (<any>Object).assign({}, this._c, {
      token: token
    });

    this._c = (<any>Object).freeze(c);

    if (!token) localStorage.removeItem("upem-token");
    else localStorage.setItem("upem-token", this._c.token);
  }

  /**
   * Listener on connect
   * 
   * @param {(data: PostMessage) => void} callback 
   * 
   * @memberOf UPEMSDK
   */
  onConnect(callback: (data: PostMessage) => void, force: boolean): void {
    this._callback[ACTIONS.RCV_CONNECT] = callback;
    if (force && this.getToken()) this.connect();
  }

  /**
   * Listener on disconnect
   * 
   * @param {() => void} callback 
   * 
   * @memberOf UPEMSDK
   */
  onDisconnect(callback: () => void): void {
    this._callback[ACTIONS.RCV_DISCONNECT] = callback; 
  }

  /**
   * Unregister listener by key
   * 
   * @param {string} key 
   * 
   * @memberOf UPEMSDK
   */
  unregister(key: string): void {
    this._callback[key] = null;
  }

  /**
   * Unregister on connect listener
   * 
   * 
   * @memberOf UPEMSDK
   */
  unregisterOnConnect() {
    this.unregister(ACTIONS.RCV_CONNECT);
  }

  /**
   * Unregister on disconnect listener
   * 
   * 
   * @memberOf UPEMSDK
   */
  unregisterOnDisconnect() {
    this.unregister(ACTIONS.RCV_DISCONNECT);
  }

  /**
   * Get Token
   * 
   * @returns {string} 
   * 
   * @memberOf UPEMSDK
   */
  getToken(): string {
    if (!this._c.token) {
      let lStorage = localStorage.getItem("upem-token");
      
      if (lStorage) {
        this._setToken(lStorage);
      }
    }

    return this._c.token;
  }

  /**
   * Action - Reset vault
   * 
   * 
   * @memberOf UPEMSDK
   */
  resetVault(): void {
    this._post(ACTIONS.RESET, null);
  }

  /**
   * Action - Connect
   * 
   * @param {string} token 
   * 
   * @memberOf UPEMSDK
   */
  connect(token?: string): void {
    if (typeof token === "undefined") {
      token = this.getToken();
    }

    this._post(ACTIONS.RCV_CONNECT, token);
  }

  /**
   * Action - Disconnect
   * 
   * 
   * @memberOf UPEMSDK
   */
  disconnect(): void {
    this._post(ACTIONS.RCV_DISCONNECT, null);
  }

  /**
   * Action - Ask connect
   * 
   * 
   * @memberOf UPEMSDK
   */
  askConnect(): void {
    this._post(ACTIONS.CONNECT, null);
  }

  /**
   * Ajax - Get user
   * 
   * @param {(data: PostMessage, err: string) => void} callback 
   * 
   * @memberOf UPEMSDK
   */
  getUser(callback: (data: PostMessage, err: string) => void): void {
    this._checkIfConnect();
    this._ajax("/me", callback);
  }

  /**
   * Ajax - Get ldap user
   * 
   * @param {(data: PostMessage, err: string) => void} callback 
   * 
   * @memberOf UPEMSDK
   */
  getLdapUser(callback: (data: PostMessage, err: string) => void): void {
    this._checkIfConnect();
    this._ajax("/me/ldap", callback);
  }

  /**
   * Ajax - Get events for date
   * 
   * @param {string} date 
   * @param {(data: PostMessage, err: string) => void} callback 
   * 
   * @memberOf UPEMSDK
   */
  getEventsForDate(date: string, callback: (data: PostMessage, err: string) => void): void {
    this._checkIfConnect();
    this._ajax("/calendar/events?date=" + date, callback);
  }

  /**
   * Ajax - Get events for range
   * 
   * @param {string} start 
   * @param {string} end 
   * @param {(data: PostMessage, err: string) => void} callback 
   * 
   * @memberOf UPEMSDK
   */
  getEventsForRange(start: string, end: string, callback: (data: PostMessage, err: string) => void): void {
    this._checkIfConnect();
    this._ajax("/calendar/events?startDate=" + start + "&endDate=" + end, callback);
  }
}
