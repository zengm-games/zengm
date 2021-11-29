import { Player } from "../../../../common/types";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) => {
	const key: string = c.stats[0].toLowerCase();
	return key in p.stats ? p.stats[key].toFixed(1) : c.name;
};
