import deploy from "./lib/deploy.mjs";

const sports = ["football", "hockey", "basketball"] as const;

for (const sport of sports) {
	process.env.SPORT = sport;
	await deploy();
}
