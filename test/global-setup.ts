import generate from "../src";
import fs from "node:fs";
import { name as packageName } from "../package.json";

export default async function () {
  const generated = await generate({ schemaFilePath: "./test/fixtures/openapi.yaml" });
  fs.writeFileSync("./test/generated/index.ts", generated.replace(packageName, "../../src"));
}
