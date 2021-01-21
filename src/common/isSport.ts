const isSport = (sport: "basketball" | "football" | "hockey") => {
	return sport === process.env.SPORT;
};

export default isSport;
