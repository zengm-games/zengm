const isSport = (sport: "football" | "basketball") => {
	return sport === process.env.SPORT;
};

export default isSport;
