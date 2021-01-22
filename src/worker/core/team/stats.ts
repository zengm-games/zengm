import { bySport } from "../../../common";
import statsBasketball from "./stats.basketball";
import statsFootball from "./stats.football";
import statsHockey from "./stats.hockey";

const stats = bySport<unknown>({
	basketball: statsBasketball,
	football: statsFootball,
	hockey: statsHockey,
}) as {
	derived: string[];
	raw: string[];
};
export default stats;
