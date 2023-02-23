# openapi-typescript-any-client

> Create type-safe fetcher with any fetch client, such as axios, ky and so on.

[![codecov](https://codecov.io/gh/KoichiKiyokawa/openapi-typescript-any-client/branch/main/graph/badge.svg?token=KBPSYME8M7)](https://codecov.io/gh/KoichiKiyokawa/openapi-typescript-any-client)

![demo](https://user-images.githubusercontent.com/40315079/220818384-0d7701f3-6883-4de1-96c7-7f56c3aa6333.gif)

## Usage

### Install

```bash
npm i -D @kiyoshiro/openapi-typescript-any-client
```

### Generate code

```bash
openapi-typescript-any-client ./openapi.yaml -o generated.ts
```

### Define your own fetcher with the generated code

```ts
// fetcher.ts
import { createFetcher } from "./generated";

// standard fetch
export const fetcher = createFetcher((path, { method, body }) =>
  fetch("http://localhost:3000" + path, { method, body: JSON.stringify(body) }).then((res) =>
    res.json()
  )
);

// axios
export const fetcher = createFetcher((path, { method, body }) =>
  axios({ baseURL: "http://localhost:3000", url: path, method, data: body }).then((res) => res.data)
);

// ky
export const fetcher = createFetcher((path, { method, body }) =>
  ky(path, { prefixUrl: "http://localhost:3000", url: method, json: body }).json()
);
```

### Use the `fetcher` created above

```ts
// `listUsers` comes from operationId in your OpenAPI schema
const res = await fetcher.listUsers({ query: { per: 10, page: 0 } });
```
