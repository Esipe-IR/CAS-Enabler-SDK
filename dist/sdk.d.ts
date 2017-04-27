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
export declare const CORE: string;
export declare const VAULT: string;
export declare class SDK {
    private _c;
    private _callback;
    constructor(userConfig: Config);
    _log(action: string, extra: any): void;
    _createMsg(type: string, data?: any, code?: number, scope?: string, src?: string, error?: string): PostMessage;
    _post(msg: PostMessage): void;
    onToken(callback: (msg) => void): void;
    resetVault(): void;
    askConnect(): void;
}
