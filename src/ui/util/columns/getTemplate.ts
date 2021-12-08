import * as templates from "./templates";
import type { ColTemp } from "./getCols";
import type { Player } from "../../../common/types";
import type { TableConfig } from "../TableConfig";

export default function (p: Player, c: ColTemp, config: TableConfig) {
	if (c.render) return c.render(p, c, config.vars);
	if (!(c.template in templates)) return "";
	return templates[c.template](p, c, config.vars);
}
