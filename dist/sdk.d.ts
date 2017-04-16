export interface Config {
    baseURL: string;
    scope: string;
    token?: string;
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
export declare const UPEMSDK_API: string;
export declare const UPEMSDK_VAULT: string;
export declare class UPEMSDK {
    private _c;
    private _f;
    private _callback;
    constructor(userConfig: Config);
    _setupReceiver(): void;
    _receiveConnect(msg: PostMessage): void;
    _receiveDisconnect(msg: PostMessage): void;
    _receiveDefault(msg: PostMessage): void;
    _debug(action: string, extra: any): void;
    _ajax(uri: string, callback: (obj: PostMessage, err: String) => void): void;
    _post(type: string, data: any, src?: string): void;
    _checkIfConnect(): void;
    _isValid(msg: PostMessage): boolean;
    _setToken(token: string): void;
    onConnect(callback: (msg: PostMessage) => void, force: boolean): void;
    onDisconnect(callback: (msg: PostMessage) => void): void;
    unregister(key: string): void;
    unregisterOnConnect(): void;
    unregisterOnDisconnect(): void;
    getToken(): string;
    resetVault(): void;
    connect(token?: string): void;
    disconnect(): void;
    askConnect(): void;
    getUser(callback: (data: PostMessage, err: string) => void): void;
    getLdapUser(callback: (data: PostMessage, err: string) => void): void;
    getEventsForDate(date: string, callback: (data: PostMessage, err: string) => void): void;
    getEventsForRange(start: string, end: string, callback: (data: PostMessage, err: string) => void): void;
}
