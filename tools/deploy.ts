import { deploy } from "./lib/deploy.ts";
import { getSport } from "./lib/getSport.ts";

await deploy(getSport());
