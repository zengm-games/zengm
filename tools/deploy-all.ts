import { deploy } from "./lib/deploy.ts";
import { SPORTS } from "./lib/getSport.ts";
import { generateVersionNumber } from "./build/generateVersionNumber.ts";

const versionNumber = generateVersionNumber();

for (const sport of SPORTS) {
	await deploy(sport, versionNumber);
}
