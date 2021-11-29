import * as templates from "./templates";
import type { ColTemp } from "./getCols";
import type { Player } from "../../../common/types";

export default function (p: Player, c: ColTemp, vars: object) {
	if (!(c.template in templates)) return "";
	return templates[c.template](p, c, vars);
}
