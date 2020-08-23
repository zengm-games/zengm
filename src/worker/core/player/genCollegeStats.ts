import genCollegeStatsBasketball from "./genCollegeStats.basketball";

const genCollegeStats = (ratings: any) => {
	if (process.env.SPORT === "football") {
		return { pts: 0, reb: 0, ast: 0 };
	}
	return genCollegeStatsBasketball(ratings);
};

export default genCollegeStats;
