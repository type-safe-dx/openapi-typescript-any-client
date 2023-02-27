import { Get } from "../../src"

export interface paths {
  "/users": {
    /** List all users */
    get: operations["listUsers"];
    /** Create an user */
    post: operations["createUser"];
  };
  "/users/{id}": {
    /** Get an user */
    get: operations["getUser"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    User: {
      /**
       * Format: int64 
       * @example 1
       */
      id?: number;
      /** @example john */
      username?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      phone?: string;
      /**
       * Format: int32 
       * @description User Status
       */
      userStatus?: number;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type external = Record<string, never>;

export interface operations {

  listUsers: {
    /** List all users */
    parameters: {
      query: {
        per: number;
        page: number;
      };
    };
    responses: {
      /** @description A paged array of users */
      200: {
        content: {
          "application/json": (components["schemas"]["User"])[];
        };
      };
    };
  };
  createUser: {
    /** Create an user */
    requestBody?: {
      content: {
        "application/json": components["schemas"]["User"];
      };
    };
    responses: {
      /** @description A paged array of users */
      200: {
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
    };
  };
  getUser: {
    /** Get an user */
    parameters: {
      path: {
        id: number;
      };
    };
    responses: {
      /** @description A paged array of users */
      200: {
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
    };
  };
}

export type OperationIds = keyof operations

type HttpMethods = "get" | "post" | "put" | "patch" | "delete" | "option" | "head";

type OmitNeverFromRecord<T extends Record<string, unknown>> = Pick<T, {[K in keyof T]: T[K] extends never ? never : K}[keyof T]>

export const createBaseFetcher = (
  ownFetcher: (
    path: string,
    param: {
      method: HttpMethods;
      body?: Record<string, unknown>;
    }
  ) => Promise<unknown>
) => {
  return <Path extends keyof paths, Method extends HttpMethods>(
    path: Path,
    opts: { method: Method } & OmitNeverFromRecord<{
      path: Get<paths[Path], [Method, "parameters", "path"]>
      query: Get<paths[Path], [Method, "parameters", "query"]>
      body: Get<paths[Path], [Method, "requestBody", "content", "application/json"]>
    }>
  ): Promise<Get<paths[Path], [Method, "responses", 200, "content", "application/json"]>> => {
    return ownFetcher(
      path + ("query" in opts ? `?${new URLSearchParams(opts.query as any)}` : ""),
      { method: opts.method, body: (opts as any).body }
    ) as any;
  };
};

export const createOperationIdFetcher = (
  ownFetcher: (
    path: string,
    param: {
      method: HttpMethods;
      body?: Record<string, unknown>;
    }
  ) => Promise<unknown>
) => {
  const baseFetcher = createBaseFetcher(ownFetcher);
  const f =
    <Path extends keyof paths, Method extends HttpMethods>(p: Path, m: Method) =>
    (...o: keyof OmitNeverFromRecord<{
      query: Get<paths[Path], [Method, "parameters", "query"]>,
      body: Get<paths[Path], [Method, "requestBody", "content", "application/json"]>
    }> extends never ? [] :  [OmitNeverFromRecord<{
      query: Get<paths[Path], [Method, "parameters", "query"]>,
      body: Get<paths[Path], [Method, "requestBody", "content", "application/json"]>
    }>]
    ): Promise<Get<paths[Path], [Method, "responses", 200, "content", "application/json"]>> =>
      baseFetcher(p, { method: m, ...o[0] } as any);

  return {
    listUsers: f("/users", "get"),
    createUser: f("/users", "post"),
    getUser: f("/users/{id}", "get")
  };
};