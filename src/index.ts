import yaml from "yaml";
import fs from "fs";
import openapiTS, { OpenAPITSOptions } from "openapi-typescript";

export default async function generate({
  schemaFilePath,
  openApiTsOption,
}: { schemaFilePath: string; openApiTsOption?: OpenAPITSOptions }) {
  const schema = yaml.parse(fs.readFileSync(schemaFilePath, "utf-8"));

  const operationIdToPathWithMethod: Map<string, { path: string; method: string }> = new Map();
  for (const path in schema.paths) {
    for (const method in schema.paths[path]) {
      const { operationId } = schema.paths[path][method];
      if (operationId) {
        operationIdToPathWithMethod.set(operationId, { path, method });
      } else {
        console.error(`Missing operationId for paths.${path}.${method}`);
        process.exit(1);
      }
    }
  }

  return `\
${await openapiTS(schema, openApiTsOption)}
  
export const operationIdToPath = {
  ${[...operationIdToPathWithMethod.entries()]
    .map(([operationId, { path }]) => `${operationId}: "${path}"`)
    .join(",\n")}
} as const

export const operationIdToMethod = {
  ${[...operationIdToPathWithMethod.entries()]
    .map(([operationId, { method }]) => `${operationId}: "${method}"`)
    .join(",\n")}
} as const

export const createFetcher = (
  ownFetcher: (
    path: string,
    param: {
      method: "get" | "post" | "put" | "patch" | "delete" | "option" | "head"
      query?: Record<string, unknown>
      body?: Record<string, unknown>
    }
  ) => Promise<any>
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
              (_, key) => params.path?.[key]
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
  ) as {
    [OpId in keyof operations]: (
      params: Get<operations[OpId], "parameters"> &
        (Get<
          operations[OpId],
          "requestBody.content.application/json"
        > extends unknown
          ? {}
          : {
              body: Get<
                operations[OpId],
                "requestBody.content.application/json"
              >
            })
    ) => Promise<
      Get<operations[OpId], "responses.200.content.application/json">
    >
  }
`;
}
