export interface Config {
  baseURL: string;
  scope: string;
  debug?: boolean;
};

export interface PostMessage {
  type: string;
  code: number;
  scope: string;
  src: string;
  data: any;
  error: string;
};

export interface GraphMessage {
  query: string;
  variables?:string;
}

export const API: string = "UPEM-Api";
export const VAULT: string = "UPEM-Vault";

const RCV_TOKEN = "rcv::token";
const ASK_CONNECT = "ask::connect";
const ASK_RESET = "ask::reset";

export class SDK {
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
      debug: false
    }

    let c: Config = (<any>Object).assign(defaultConfig, userConfig);
    this._c = (<any>Object).freeze(c);

    this._setupReceiver();
    this._log("INIT", this);
  }

  _log(action: string, extra: any): void {
    if (this._c.debug) {
      console.log("UPEM SDK", " - " + action + " - ", extra);
    }
  }

  _setupReceiver(): void {
    var self: SDK = this;

    this._callback = {};
    this._f = {
      [RCV_TOKEN]: function(msg: PostMessage) {
        self.setToken(msg.data);
        self.token();
      }
    };

    window.addEventListener("message", function(event: MessageEvent) {
      let msg: PostMessage = event.data;

      if (!msg || !msg.type || msg.scope !== self._c.scope) {
        return self._log("<= Event Message (RCV - ERROR)", event);
      }

      if (msg.src == document.URL) {
        return self._log("=> Event Message (SEND)", msg);
      }

      self._log("<= Event Message (RCV)", msg);

      if (typeof self._f[msg.type] === "function") {
        return self._f[msg.type](msg);
      }
    });
  }

  _isValid(msg: PostMessage): boolean {
    if (msg.error === null && msg.code === 0) {
      return true;
    }

    return false;
  }

  _ajax(data: GraphMessage, callback: (msg) => void): void {
    var x: XMLHttpRequest = new XMLHttpRequest(); 
    var url: string = this._c.baseURL + "/graphql";
    var self: SDK = this;

    this._log("=> AJAX Request", {url: url, token: this.getToken()});

    x.responseType = 'json';
    x.onreadystatechange = function (oEvent) {
      if (x.readyState !== 4) {
        return;
      }

      self._log("<= AJAX Response", x.response);
      
      if (x.response.errors && x.response.errors[0].message === "Invalid token") {
        self.setToken(null);
        self.token();
      }

      callback(x.response);
    }
    
    x.open("POST", url);
    x.setRequestHeader("Authorization", this.getToken());
    x.setRequestHeader("Content-Type", "application/json");
    x.send(JSON.stringify(data));
  }

  _createMsg(type: string, data?: any, code?: number, scope?: string, src?: string, error?: string): PostMessage {
    return {
      type: type,
      data: data ? data : null,
      code: code ? code : 0,
      scope: scope ? scope : this._c.scope,
      src: src ? src : this._c.baseURL,
      error: error ? error : null
    };
  }

  _post(msg: PostMessage): void {
    window.postMessage(msg, "*");
  }

  /**
   * On token change
   *
   * @param {(msg) => void} callback
   * @param {boolean} force 
   */
  onToken(callback: (msg) => void): SDK {
    if (typeof callback !== "function") throw new Error("callback should be a function");
    if (this._callback[RCV_TOKEN]) throw new Error("onToken already defined");
    this._callback[RCV_TOKEN] = callback;
    
    return this;
  }

  /**
   * Force to execute on token
   * 
   * @memberOf SDK
   */
  token(): void {
     this._callback[RCV_TOKEN](this.getToken());
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
   * @memberOf UPEMSDK
   */
  unregisterOnToken(): void {
    this.unregister(RCV_TOKEN);
  }

  /**
   * Get Token
   * 
   * @returns {string} 
   * 
   * @memberOf UPEMSDK
   */
  getToken(): string {
    return localStorage.getItem("upem-token");
  }

  /**
   * Set Token
   *
   * @param {string} token
   *
   * @memberOf UPEMSDK
   */
  setToken(token: string): void {
    if (!token) localStorage.removeItem("upem-token");
    else localStorage.setItem("upem-token", token);
  }

  /**
   * Action - Reset vault
   * 
   * @memberOf UPEMSDK
   */
  resetVault(): void {
    this._post(this._createMsg(ASK_RESET));
  }

  /**
   * Action - Ask connect
   * 
   * @memberOf UPEMSDK
   */
  askConnect(): void {
    this._post(this._createMsg(ASK_CONNECT));
  }

  /**
   * Ajax - Get graph
   * 
   * @param {string} graph 
   * @param {(msg) => void} callback 
   * 
   * @memberOf UPEMSDK
   */
  getGraph(graph: string, callback: (msg) => void) {
    if (typeof callback !== "function") throw new Error("callback should be a function");

    var msg: GraphMessage = {
      query: graph
    };

    this._ajax(msg, callback);
  }

  /**
   * Ajax - Get user
   * 
   * @param {(msg) => void} callback 
   * 
   * @memberOf UPEMSDK
   */
  getUser(callback: (msg) => void): void {
    if (!this.getToken()) throw new Error("config.token is undefined. User may not be connected yet");
    
    var graph = `query {
      user {
        uid
        name
        lastname
        email
        class
      }
    }`;

    this.getGraph(graph, callback);
  }
}
