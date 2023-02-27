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

type HttpMethods = "get" | "post" | "put" | "patch" | "delete" | "option" | "head";

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
    opts: Get<paths[Path], [Method, "parameters"]> & { method: Method } & (Get<
        paths[Path],
        [Method, "requestBody", "content", "application/json"]
      > extends never
        ? {}
        : { body: Get<paths[Path], [Method, "requestBody", "content", "application/json"]> })
  ): Promise<Get<paths[Path], [Method, "responses", 200, "content", "application/json"]>> => {
    return ownFetcher(
      path + ("query" in opts ? \`?\${new URLSearchParams(opts.query as any)}\` : ""),
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
    (o: (
      Get<paths[Path], [Method, "parameters", "query"]> extends never ? {} : { query: Get<paths[Path], [Method, "parameters", "query"]> }
      ) & (
      Get<paths[Path], [Method, "requestBody", "content", "application/json"]> extends never ? {} : { body: Get<paths[Path], [Method, "requestBody", "content", "application/json"]> }
      )
    ): Promise<Get<paths[Path], [Method, "responses", 200, "content", "application/json"]>> =>
      baseFetcher(p, { method: m, ...o } as any);

  return {
    ${[...operationIdToSchemaInfo]
      .map(([operationId, { path, method }]) => `${operationId}: f("${path}", "${method}")`)
      .join(",\n    ")}
  };
};`;
}
