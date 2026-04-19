import { getSport } from "../lib/getSport.ts";
import { build } from "./build.ts";
import { generateVersionNumber } from "./generateVersionNumber.ts";

await build(getSport(), generateVersionNumber());
