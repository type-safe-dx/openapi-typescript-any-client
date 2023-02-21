import { expect, test } from "vitest";
import generate from ".";

test("generate should match snapshot", async () => {
  expect(await generate({ schemaFilePath: "./test/fixtures/openapi.yaml" })).toMatchSnapshot();
});
