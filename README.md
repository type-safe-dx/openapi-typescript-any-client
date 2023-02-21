# msw-object

> Reusable msw mock definition.

[![codecov](https://codecov.io/gh/KoichiKiyokawa/msw-object/branch/main/graph/badge.svg?token=NY24WQJELL)](https://codecov.io/gh/KoichiKiyokawa/msw-object)

## Usage

```sh
npm i -D @kiyoshiro/msw-object
```

<table>
<thead>
<th>This library</th>
<th>Original msw</th>
</th>
</thead>
<tbody>
<tr>
<td>

```ts
import {
  defineBaseRestBuilder,
  createRestHandler,
  RestBuilder,
} from "@kiyoshiro/msw-object";
import { setupServer } from "msw";

const baseBuilder = defineBaseRestBuilder({
  basePath: "http://localhost:3000",
  // Set default delay as 500ms
  // It is difficult with original msw!!
  delay: 500,
});

// extends baseBuilder
const userShowBuilder: RestBuilder = {
  ...baseBuilder,
  path: "/users/:id",
  resolve: () => ({ id: 1, name: "user1", age: 10 }),
};

// extends userShowBuilder
const userListBuilder: RestBuilder = {
  ...userShowBuilder,
  path: "/users",
  resolve: () => [userShowBuilder.resolve()],
};

const builders = [userShowBuilder, userListBuilder];
setupServer(...builders.map(createRestHandler));
```

</td>

<td>

```ts
import { rest, setupServer } from "msw";

const userShowHandler = rest.get(
  "http://localhost:3000/users/:id",
  (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ id: 1, name: "user1", age: 10 }),
      ctx.delay(500)
    );
  }
);

// difficult to reuse userShowBuilder 😢
const userListHandler = rest.get(
  "http://localhost:3000/users",
  (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([{ id: 1, name: "user1", age: 10 }]),
      ctx.delay(500)
    );
  }
);

setupServer(userShowHandler, userListHandler);
```

</td>
</tr>
</tbody>
</table>

## Features

TODO...

## Recipes

### Switch the response by request query

```ts
const userListBuilder: RestBuilder = {
  ...baseBuilder,
  resolver: (req) => {
    switch (req.url.searchParams.get("category")) {
      case "follower":
        return [
          /* follower user list */
        ];
      case "follow":
        return [
          /* follow user list */
        ];
    }
  },
};
```

### Inject spy methods in test

```tsx
test("user show page", () => {
  const requestUrlSpy = jest.fn();
  const handler = createRestHandler({
    path: "/users/:id",
    resolver: () => ({ id: 1, name: "user1", age: 10 }),
    // You can specify onRequest hook. It is fired before mock handler return a response.
    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
    onRequest: (req) => {
      requestUrlSpy(req.url.toString());
    },
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  });
  server.use(handler);

  render(<UserShow />);

  expect(requestUrlSpy).toHaveBeenCalledWith("/users/1");
});
```

TODO
