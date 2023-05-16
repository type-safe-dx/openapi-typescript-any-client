import yaml from "yaml";
import fs from "fs";
import openapiTS, { OpenAPITSOptions } from "openapi-typescript";
import { name as packageName } from "../package.json";

export type { Get } from "./types";

export default async function generate({
  schemaFilePath,
  openApiTsOption,
}: { schemaFilePath: string; openApiTsOption?: OpenAPITSOptions }) {
  const schema = yaml.parse(fs.readFileSync(schemaFilePath, "utf-8"));

  const operationIdToSchemaInfo: Map<
    string,
    { path: string; method: string; summary?: string; description?: string }
  > = new Map();
  for (const path in schema.paths) {
    for (const method in schema.paths[path]) {
      const { operationId, summary, description } = schema.paths[path][method];
      if (operationId) {
        operationIdToSchemaInfo.set(operationId, { path, method, summary, description });
      } else {
        console.error(`Missing operationId for paths.${path}.${method}`);
        process.exit(1);
      }
    }
  }

  return `\
import { Get } from "${packageName}"

${await openapiTS(schema, { ...openApiTsOption, commentHeader: "" })}
export type OperationIds = keyof operations

type HttpMethods = "get" | "post" | "put" | "patch" | "delete" | "options" | "head";

type OmitNeverFromRecord<T extends Record<string, unknown>> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends never ? never : K;
  }[keyof T]
>;

type FilterPathsByMethod<Method extends HttpMethods> = {
  [P in keyof paths]: Method extends keyof paths[P] ? P : never;
}[keyof paths];

export const createBaseFetcher = (
  ownFetcher: (
    path: string,
    param: {
      method: HttpMethods;
      body?: Record<string, unknown>;
    },
  ) => Promise<unknown>,
) => {
  return new Proxy(
    {},
    {
      get:
        (_, method: HttpMethods) =>
        (path: keyof paths, params: { path: string; query: string; body: Record<string, unknown> }) =>
          ownFetcher(path + (params.query ? \`?\${new URLSearchParams(params.query)}\` : ""), {
            method,
            body: params.body,
          }),
    },
  ) as {
    [Method in HttpMethods]: <Path extends FilterPathsByMethod<Method>>(
      path: Path,
      opts: OmitNeverFromRecord<{
        path: Get<paths[Path], [Method, "parameters", "path"]>;
        query: Get<paths[Path], [Method, "parameters", "query"]>;
        body: Get<paths[Path], [Method, "requestBody", "content", "application/json"]>;
      }>,
    ) => Promise<Get<paths[Path], [Method, "responses", 200, "content", "application/json"]>>;
  };
};

export const createOperationIdFetcher = (
  ownFetcher: (
    path: string,
    param: {
      method: HttpMethods;
      body?: Record<string, unknown>;
    },
  ) => Promise<unknown>,
) => {
  const baseFetcher = createBaseFetcher(ownFetcher);
  const f =
    <Path extends keyof paths, Method extends HttpMethods>(p: Path, m: Method) =>
    (
      ...o: keyof OmitNeverFromRecord<{
        query: Get<paths[Path], [Method, "parameters", "query"]>;
        body: Get<paths[Path], [Method, "requestBody", "content", "application/json"]>;
      }> extends never
        ? []
        : [
            OmitNeverFromRecord<{
              query: Get<paths[Path], [Method, "parameters", "query"]>;
              body: Get<paths[Path], [Method, "requestBody", "content", "application/json"]>;
            }>,
          ]
    ): Promise<Get<paths[Path], [Method, "responses", 200, "content", "application/json"]>> =>
      baseFetcher[m](p as any, o[0] as any);

  return {
    ${[...operationIdToSchemaInfo]
      .map(([operationId, { path, method }]) => `${operationId}: f("${path}", "${method}")`)
      .join(",\n    ")}
  };
};`;
}
