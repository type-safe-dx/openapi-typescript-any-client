import axios from "axios";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { createBaseFetcher, createOperationIdFetcher } from ".";

const baseURL = "http://localhost:3000";

const baseFetcher = createBaseFetcher((path, { method, body }) =>
  axios({ baseURL, url: path, method, data: body }).then((res) => res.data),
);

const fetcherObj = createOperationIdFetcher((path, { method, body }) =>
  axios({ baseURL, url: path, method, data: body }).then((res) => res.data),
);

describe("listUsers", () => {
  const server = setupServer();
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const dummyUsers = [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
  ];

  const requestSpy = vi.fn<{ url: string; method: string }[]>();
  server.events.on("request:start", (req) =>
    requestSpy({ url: req.url.toString(), method: req.method }),
  );

  beforeEach(() => {
    server.use(
      rest.get(`${baseURL}/users`, (_req, res, ctx) => {
        return res(ctx.json(dummyUsers));
      }),
    );
    requestSpy.mockClear();
  });

  test("createBaseFetcher", async () => {
    const res = await baseFetcher.get("/users", { query: { per: 10, page: 0 } });

    expect(res).toStrictEqual(dummyUsers);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "http://localhost:3000/users?per=10&page=0",
        method: "GET",
      }),
    );
    expectTypeOf(res).toMatchTypeOf<
      {
        id?: number | undefined;
        username?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
        phone?: string | undefined;
        userStatus?: number | undefined;
      }[]
    >();
  });

  test("createOperationIdFetcher", async () => {
    const res = await fetcherObj.listUsers({ query: { per: 10, page: 0 } });

    expect(res).toStrictEqual(dummyUsers);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "http://localhost:3000/users?per=10&page=0",
        method: "GET",
      }),
    );
    expectTypeOf(res).toMatchTypeOf<
      {
        id?: number | undefined;
        username?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        email?: string | undefined;
        password?: string | undefined;
        phone?: string | undefined;
        userStatus?: number | undefined;
      }[]
    >();
  });
});
