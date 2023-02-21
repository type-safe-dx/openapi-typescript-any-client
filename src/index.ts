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
  
export const operationIdToPath = {
  ${[...operationIdToSchemaInfo.entries()]
    .map(([operationId, { path }]) => `${operationId}: "${path}"`)
    .join(",\n  ")}
} as const

export const operationIdToMethod = {
  ${[...operationIdToSchemaInfo.entries()]
    .map(([operationId, { method }]) => `${operationId}: "${method}"`)
    .join(",\n  ")}
} as const

export type OperationIds = keyof operations

export type OperationIdToResponseBody<OpId extends OperationIds> = Get<operations[OpId], ["requestBody", "content", "application/json"]>

type Func<OpId extends OperationIds> = (
  params: Get<operations[OpId], ["parameters"]> &
    OperationIdToResponseBody<OpId> extends never
      ? {}
      : {
          body: OperationIdToResponseBody<OpId>
        }
) => Promise<
  Get<operations[OpId], ["responses", "200", "content", "application/json"]>
>

type Fetchers = {
  ${[...operationIdToSchemaInfo.entries()]
    .map(
      ([operationId, { path, summary, description }]) => `/**
   * @path ${path}${summary ? `\n   * @summary ${summary}` : ""}${
     description ? `\n   * @description ${description}` : ""
   }
   */
  ${operationId}: Func<"${operationId}">`,
    )
    .join(",\n\n  ")}
}

export const createFetcher = (
  ownFetcher: (
    path: string,
    param: {
      method: "get" | "post" | "put" | "patch" | "delete" | "option" | "head"
      query?: Record<string, unknown>
      body?: Record<string, unknown>
    }
  ) => Promise<unknown>
) =>
  new Proxy(
    {},
    {
      get: (_, operationId: keyof operations) => {
        return (params: {
          path?: Record<string, unknown>
          query?: Record<string, unknown>
          body?: Record<string, unknown>
        }) => {
          return ownFetcher(
            operationIdToPath[operationId].replace(
              /\\{\\w+\\}/g,
              (_, key) => (params.path as any)[key]
            ),
            {
              method: operationIdToMethod[operationId],
              query: params.query,
              body: params.body,
            }
          )
        }
      },
    }
  ) as Fetchers
`;
}
