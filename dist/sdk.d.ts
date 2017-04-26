export interface Config {
    baseURL: string;
    scope: string;
    debug?: boolean;
}
export interface PostMessage {
    type: string;
    code: number;
    scope: string;
    src: string;
    data: any;
    error: string;
}
export interface GraphMessage {
    query: string;
    variables?: string;
}
export declare const API: string;
export declare const VAULT: string;
export declare class SDK {
    private _c;
    private _f;
    private _callback;
    constructor(userConfig: Config);
    _log(action: string, extra: any): void;
    _setupReceiver(): void;
    _isValid(msg: PostMessage): boolean;
    _ajax(data: GraphMessage, callback: (msg) => void): void;
    _createMsg(type: string, data?: any, code?: number, scope?: string, src?: string, error?: string): PostMessage;
    _post(msg: PostMessage): void;
    onToken(callback: (msg) => void): SDK;
    token(): void;
    unregister(key: string): void;
    unregisterOnToken(): void;
    getToken(): string;
    setToken(token: string): void;
    resetVault(): void;
    askConnect(): void;
    getGraph(graph: string, callback: (msg) => void): void;
    getUser(callback: (msg) => void): void;
}
