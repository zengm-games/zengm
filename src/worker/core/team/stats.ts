import { bySport } from "../../../common/index.ts";
import statsBaseball from "./stats.baseball.ts";
import statsBasketball from "./stats.basketball.ts";
import statsFootball from "./stats.football.ts";
import statsHockey from "./stats.hockey.ts";

const stats = bySport<unknown>({
	baseball: statsBaseball,
	basketball: statsBasketball,
	football: statsFootball,
	hockey: statsHockey,
}) as {
	derived: string[];
	raw: string[];
	byPos?: string[];
};
export default stats;
