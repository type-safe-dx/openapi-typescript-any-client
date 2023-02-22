import generate from "../src";
import fs from "node:fs";

export default async function () {
  fs.writeFileSync(
    "./test/generated/index.ts",
    await generate({ schemaFilePath: "./test/fixtures/openapi.yaml" }),
  );
}
