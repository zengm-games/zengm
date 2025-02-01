import { deploy } from "./lib/deploy.ts";
import { SPORTS } from "./lib/getSport.ts";

for (const sport of SPORTS) {
	process.env.SPORT = sport;
	await deploy();
}
