import deploy from "./lib/deploy.mjs";

const sports = ["football", "hockey", "basketball"];

for (const sport of sports) {
	process.env.SPORT = sport;
	await deploy();
}
