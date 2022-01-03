import type { Player } from "../../../../common/types";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) => {
	const key: string = c.attrs[0];
	if (!(key in p)) return `${key} not found`;
	return p[key];
};
