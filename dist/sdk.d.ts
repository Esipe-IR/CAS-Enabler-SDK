export interface Config {
    baseURL: string;
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
export interface HttpConfig {
    url: string;
    method: string;
    params: any;
    headers?: any;
}
export declare type CALLBACK = (data: any, errors: any) => void;
export declare class UPEMSDK {
    private config;
    private callback;
    constructor(userConfig: Config);
    log(action: string, extra: any): void;
    call(config: HttpConfig, callback: CALLBACK): void;
    getParams(query: string, variables?: Object): string;
    onToken(callback: (msg) => void): void;
    getProjects(callback: CALLBACK): void;
    getResources(projectId: number, callback: CALLBACK): void;
    getResource(projectId: number, id: number, callback: CALLBACK): void;
    getResourceWithEvents(projectId: number, id: number, startDate: string, endDate: string, callback: CALLBACK): void;
    getEvents(projectId: number, resource: number, startDate: string, endDate: string, callback: CALLBACK): void;
    getUser(callback: CALLBACK): void;
    getGraph(graph: string, variables: any, callback: CALLBACK): void;
}
