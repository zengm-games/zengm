const getSport = () => {
	if (process.env.SPORT === "football" || process.env.SPORT === "basketball") {
		return process.env.SPORT;
	}
	if (process.env.SPORT === undefined) {
		return "basketball";
	}
	throw new Error(`Invalid SPORT: ${process.env.SPORT}`);
};

module.exports = getSport;
