import statsBasketball from "./stats.basketball";
import statsFootball from "./stats.football";

const stats = ((process.env.SPORT === "football"
	? statsFootball
	: statsBasketball) as unknown) as {
	derived: string[];
	max: string[];
	raw: string[];
};
export default stats;
