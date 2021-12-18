import type { Player } from "../../../../common/types";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) => {
	const key: string = c.stats[0];
	if (!(key in p.stats)) return `${key} not found`;
	const value = p.stats[key];
	return typeof value == "number"
		? value.toFixed(c.options ? c.options.decimals : 1)
		: value;
};
