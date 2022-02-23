const isSport = (sport: "baseball" | "basketball" | "football" | "hockey") => {
	return sport === process.env.SPORT;
};

export default isSport;
