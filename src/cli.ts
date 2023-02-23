#!/usr/bin/env node

import cac from "cac";
import generate from ".";
import { version } from "../package.json";
import fs from "fs";

const cli = cac("openapi-typescript-any-client");

cli
  .version(version)
  .command("<schemaFilePath>")
  .example("openapi-typescript-any-client ./openapi.yaml")
  // These options originally from https://github.com/drwpow/openapi-typescript/blob/3ffb475d15352ebc1dd2f823b01d3ae8b18ef68b/bin/cli.js
  .option("--output, -o <output>", "Specify output file (default: stdout)")
  .option("--export-type, -t <exportType>", '(optional) Export "type" instead of "interface"')
  .option(
    "--immutable-types <immutableTypes>",
    "(optional) Generates immutable types (readonly properties and readonly array)",
  )
  .option(
    "--additional-properties <additionalProperties>",
    '(optional) Allow arbitrary properties for all schema objects without "additionalProperties: false"',
  )
  .option(
    "--default-non-nullable <defaultNonNullable>",
    "(optional) If a schema object has a default value set, don’t mark it as nullable",
  )
  .option(
    "--support-array-length <supportArrayLength>",
    "(optional) Generate tuples using array minItems / maxItems",
  )
  .option(
    "--path-params-as-types <pathParamsAsTypes>",
    "(optional) Substitute path parameter names with their respective types",
  )
  .option("--alphabetize <alphabetize>", "(optional) Sort types alphabetically")
  .action(async (schemaFilePath, args) => {
    const generated = await generate({
      schemaFilePath,
      openApiTsOption: args,
    });

    if (args.output) fs.writeFileSync(args.output, generated);
    else console.log(generated);
  });

cli.help();
cli.parse();
