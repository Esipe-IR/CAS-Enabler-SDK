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

export const CORE: string = "UPEM-Core";
export const VAULT: string = "UPEM-Vault";

const RCV_TOKEN = "rcv::token";
const ASK_CONNECT = "ask::connect";
const ASK_RESET = "ask::reset";

export class SDK {
  private _c: Config;
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
      scope: CORE,
      debug: false
    };

    let c: Config = (<any>Object).assign(defaultConfig, userConfig);
    this._c = (<any>Object).freeze(c);

    var self: SDK = this;
    this._callback = {};

    window.addEventListener("message", function(event: MessageEvent) {
      let msg: PostMessage = event.data;

      if (!msg.type) {
        return self._log("<= EventMessage (RcvError - No Type)", event);
      }

      if (msg.scope !== self._c.scope) {
        return self._log("<= EventMessage (RcvError - Bad scopre)", event);
      }

      if (msg.src == document.URL) {
        return self._log("=> EventMessage (Send)", msg);
      }

      self._log("<= Event Message (RCV)", msg);

      if (typeof self._callback[msg.type] === "function") {
        return self._callback[msg.type](msg.data);
      }
    });

    this._log("INIT", this);
  }

  _log(action: string, extra: any): void {
    if (this._c.debug) {
      console.log("UPEM SDK", " - " + action + " - ", extra);
    }
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
  onToken(callback: (msg) => void): void {
    if (typeof callback !== "function") throw new Error("callback should be a function");
    this._callback[RCV_TOKEN] = callback;
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
}
