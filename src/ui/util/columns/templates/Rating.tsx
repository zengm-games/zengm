import type { Player } from "../../../../common/types";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) => {
	const key = c.ratings[0] ?? false;
	return key && key in p.ratings ? p.ratings[key].toString() : "";
};
