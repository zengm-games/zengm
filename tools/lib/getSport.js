const SPORTS = ["basketball", "football", "hockey"];

const getSport = () => {
	if (SPORTS.includes(process.env.SPORT)) {
		return process.env.SPORT;
	}
	if (process.env.SPORT === undefined) {
		return "basketball";
	}
	throw new Error(`Invalid SPORT: ${process.env.SPORT}`);
};

module.exports = getSport;
