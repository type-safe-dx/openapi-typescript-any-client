import axios from "axios";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { createFetcher } from ".";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const baseURL = "http://localhost:3000";

test("listUsers", async () => {
  const dummyUsers = [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
  ];
  const h = rest.get(`${baseURL}/users`, (_req, res, ctx) => {
    return res(ctx.json(dummyUsers));
  });
  server.use(h);

  const fetcher = createFetcher((path, { method, body }) =>
    axios({ baseURL, url: path, method, data: body }).then((res) => res.data),
  );
  const res = await fetcher.listUsers({ query: { per: 10, page: 0 } });

  expect(res).toStrictEqual(dummyUsers);
});
