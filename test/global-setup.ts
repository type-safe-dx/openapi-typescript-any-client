import generate from "../src";
import fs from "node:fs";

export default async function globalSetup() {
  fs.writeFileSync(
    "./test/generated/generated.ts",
    await generate({ schemaFilePath: "./test/fixtures/openapi.yaml" }),
  );
}
