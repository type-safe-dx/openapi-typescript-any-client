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

<table>
<thead>
<tr>
<th>path pattern</th>
<th>operationId pattern</th>
</tr>
</thead>
<tbody>
<tr>
<td>

```ts
// fetcher.ts
import { createBaseFetcher } from "./generated";

// standard fetch
export const fetcher = createBaseFetcher((path, { method, body }) =>
  fetch("http://localhost:3000" + path, {
    method,
    body: JSON.stringify(body),
  }).then((res) => res.json())
);

// axios
export const fetcher = createBaseFetcher((path, { method, body }) =>
  axios({
    baseURL: "http://localhost:3000",
    url: path,
    method,
    data: body,
  }).then((res) => res.data)
);

// ky
export const fetcher = createBaseFetcher((path, { method, body }) =>
  ky(path, {
    prefixUrl: "http://localhost:3000",
    url: path,
    method,
    json: body,
  }).json()
);
```

</td>
<td>

```ts
// fetcher.ts
import { createOperationIdFetcher } from "./generated";

// standard fetch
export const fetcherObj = createOperationIdFetcher((path, { method, body }) =>
  fetch("http://localhost:3000" + path, {
    method,
    body: JSON.stringify(body),
  }).then((res) => res.json())
);

// axios
export const fetcherObj = createOperationIdFetcher((path, { method, body }) =>
  axios({
    baseURL: "http://localhost:3000",
    url: path,
    method,
    data: body,
  }).then((res) => res.data)
);

// ky
export const fetcherObj = createOperationIdFetcher((path, { method, body }) =>
  ky(path, {
    prefixUrl: "http://localhost:3000",
    url: path,
    method,
    json: body,
  }).json()
);
```

</td>

</tbody>
</table>

### Use the `fetcher` created above (It's type-safe!)

<table>
<thead>
<tr>
<th>path pattern</th>
<th>operationId pattern</th>
</tr>
</thead>
<tbody>
<tr>
<td>

```ts
const res = await fetcher("/users", {
  method: "get",
  query: { per: 10, page: 0 },
});
```

</td>
<td>

```ts
// `listUsers` comes from operationId
// in your OpenAPI schema
const res = await fetcherObj.listUsers({
  query: { per: 10, page: 0 },
});
```

</td>

</tbody>
</table>
