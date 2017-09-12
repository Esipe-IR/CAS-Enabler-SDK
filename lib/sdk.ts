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

const RCV_TOKEN = "rcv::token";
const GRAPH_URL = "/graphql";
const METHOD = {
  POST: "POST",
  GET: "GET"
};

export class UPEMSDK {
  private config: Config;
  private callback: Object;

  /**
   * Creates an instance of UPEMSDK.
   *
   * @param {Config} userConfig
   * @memberof UPEMSDK
   */
  constructor(userConfig: Config) {
    const defaultConfig: Config = {
      baseURL: "https://perso-etudiant.u-pem.fr/~vrasquie/api",
      debug: false
    };

    const c: Config = (<any>Object).assign(defaultConfig, userConfig);
    const self: UPEMSDK = this;

    this.config = (<any>Object).freeze(c);
    this.callback = {};

    window.addEventListener("message", function(event: MessageEvent) {
      let msg: PostMessage = event.data;

      if (!msg.type) {
        return self.log("<= EventMessage (RcvError - No Type)", event);
      }

      if (msg.src == document.URL) {
        return self.log("=> EventMessage (Send)", msg);
      }

      self.log("<= Event Message (RCV)", msg);

      if (typeof self.callback[msg.type] === "function") {
        return self.callback[msg.type](msg.data);
      }
    });

    this.log("INIT", this);
  }

  /**
   * Log an action
   *
   * @param {string} action
   * @param {any} extra
   * @memberof UPEMSDK
   */
  log(action: string, extra: any): void {
    if (this.config.debug) {
      console.log("UPEM SDK", " - " + action + " - ", extra);
    }
  }

  /**
   * Call an http endpoint
   *
   * @param {HttpConfig} config 
   * @param {CALLBACK} callback 
   * @memberof UPEMSDK
   */
  call(config: HttpConfig, callback: CALLBACK) {
    const xhr = new XMLHttpRequest();
    xhr.open(config.method, config.url, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";

    const self: UPEMSDK = this;
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4 && xhr.status == 200) {
        self.log("CALL", xhr.response);
        callback(xhr.response.data, xhr.response.errors);
      }
    };

    xhr.send(config.params);
  }

  /**
   * Get JSON representation of query and variables
   *
   * @param {any} query 
   * @param {Object} [variables] 
   * @returns JSON
   * @memberof UPEMSDK
   */
  getParams(query: string, variables?: Object) {
    return JSON.stringify({
      query: query,
      variables: variables
    });
  }

  /**
   * Get HTTP Config
   *
   * @param {string} params
   * @param {*} headers
   * @memberof UPEMSDK 
   */
  getHttpConfig(params: string, headers?: any) {
    return {
      url: this.config.baseURL + GRAPH_URL,
      method: METHOD.POST,
      params: params,
      headers: headers
    };
  }

  /**
   * On token change
   *
   * @param {(msg) => void} callback
   * @memberof UPEMSDK
   */
  onToken(callback: (msg) => void): void {
    if (typeof callback !== "function")
      throw new Error("callback should be a function");
    this.callback[RCV_TOKEN] = callback;
  }

  /**
   * Get ADE projects
   *
   * @param {CALLBACK} callback 
   * @memberof UPEMSDK
   */
  getProjects(callback: CALLBACK) {
    const graph = `query {
      projects {
        id
        name
      }
    }`;

    const params = this.getParams(graph);

    this.call(this.getHttpConfig(params), callback);
  }

  /**
   * Get ADE resources
   *
   * @param {number} projectId 
   * @param {CALLBACK} callback 
   * @memberof UPEMSDK
   */
  getResources(projectId: number, callback: CALLBACK) {
    const graph = `query($projectId: Int!) {
      resources(projectId: $projectId) {
        id
        name
      }
    }`;

    const params = this.getParams(graph, {
      projectId
    });

    this.call(this.getHttpConfig(params), callback);
  }

  /**
   * Get ADE resource by id
   * 
   * @param {number} projectId 
   * @param {number} id
   * @param {CALLBACK} callback 
   * @memberof UPEMSDK
   */
  getResource(projectId: number, id: number, callback: CALLBACK) {
    const graph = `query($projectId: Int!, $id: Int!) {
      resource(projectId: $projectId, id: $id) {
        id
        name
        category
      }
    }`;

    const params = this.getParams(graph, {
      projectId,
      id
    });

    this.call(this.getHttpConfig(params), callback);
  }

  /**
   * Get ADE resource with events
   *
   * @param {number} projectId 
   * @param {number} id 
   * @param {string} startDate 
   * @param {string} endDate 
   * @param {CALLBACK} callback 
   */
  getResourceWithEvents(
    projectId: number,
    id: number,
    startDate: string,
    endDate: string,
    callback: CALLBACK
  ) {
    const graph = `query($projectId: Int!, $id: Int!, $startDate: String!, $endDate: String!) {
      resource(projectId: $projectId, id: $id) {
        id
        name
        category
        events(projectId: $projectId, startDate: $startDate, endDate: $endDate) {
          id
          name
          startHour
          endHour
          instructor
          classroom
          class
          date
          color
        }
      }
    }`;

    const params = this.getParams(graph, {
      projectId,
      id,
      startDate,
      endDate
    });

    this.call(this.getHttpConfig(params), callback);
  }

  /**
   * Get ADE events
   *
   * @param {number} projectId 
   * @param {number} resource 
   * @param {string} startDate 
   * @param {string} endDate 
   * @param {CALLBACK} callback 
   * @memberof UPEMSDK
   */
  getEvents(
    projectId: number,
    resource: number,
    startDate: string,
    endDate: string,
    callback: CALLBACK
  ) {
    const graph = `query(
      $projectId: Int!,
      $resource: Int!,
      $startDate: String!,
      $endDate: String!
    ) {
      events(
        projectId: $projectId,
        resources: $resource,
        startDate: $startDate,
        endDate: $endDate
      ) {
        id
        name
        startHour
        endHour
        instructor
        classroom
        class
        date
        color
      }
    }`;

    const params = this.getParams(graph, {
      projectId,
      resource,
      startDate,
      endDate
    });

    this.call(this.getHttpConfig(params), callback);
  }

  /**
   * Get ADE user
   *
   * @param {CALLBACK} callback 
   * @memberof UPEMSDK
   */
  getUser(callback: CALLBACK) {
    const graph = `query {
      user {
        uid
      }
    }`;

    const params = this.getParams(graph);

    this.call(this.getHttpConfig(params), callback);
  }

  /**
   * Get custom graph
   *
   * @param {string} graph 
   * @param {*} variables 
   * @param {CALLBACK} callback 
   * @memberof UPEMSDK
   */
  getGraph(graph: string, variables: any, callback: CALLBACK) {
    const url = this.config.baseURL + GRAPH_URL;
    const params = this.getParams(graph, variables);

    this.call(this.getHttpConfig(params), callback);
  }
}
