import { bySport } from "../../../common";
import statsBaseball from "./stats.baseball";
import statsBasketball from "./stats.basketball";
import statsFootball from "./stats.football";
import statsHockey from "./stats.hockey";

const stats = bySport<unknown>({
	baseball: statsBaseball,
	basketball: statsBasketball,
	football: statsFootball,
	hockey: statsHockey,
}) as {
	derived: string[];
	max: string[];
	raw: string[];
	byPos?: string[];
};
export default stats;
