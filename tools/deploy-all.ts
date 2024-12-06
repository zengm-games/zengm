import deploy from "./lib/deploy.ts";

const sports = ["basketball", "football", "baseball", "hockey"] as const;

for (const sport of sports) {
	process.env.SPORT = sport;
	await deploy();
}
