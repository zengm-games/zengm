import deploy from "./lib/deploy.js";

const sports = ["basketball", "football", "baseball", "hockey"];

for (const sport of sports) {
	process.env.SPORT = sport;
	await deploy();
}
