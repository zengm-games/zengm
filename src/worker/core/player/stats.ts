import { bySport } from "../../../common";
import statsBasketball from "./stats.basketball";
import statsFootball from "./stats.football";

const stats = bySport<unknown>({
	basketball: statsBasketball,
	football: statsFootball,
}) as {
	derived: string[];
	max: string[];
	raw: string[];
};
export default stats;
