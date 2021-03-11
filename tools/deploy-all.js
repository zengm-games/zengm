const deploy = require("./lib/deploy");

const sports = ["basketball", "football", "hockey"];

(async () => {
	for (const sport of sports) {
		process.env.SPORT = sport;
		await deploy();
	}
})();
