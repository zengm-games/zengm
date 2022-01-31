import * as templates from "./templates";
import type { MetaCol } from "./getCols";
import type { Player } from "../../../common/types";
import type { TableConfig } from "../TableConfig";

export default function (p: Player, c: MetaCol, config: TableConfig) {
	if (c.template === undefined) return;
	else if (typeof c.template === "function")
		return c.template({ p, c, vars: config.vars });
	else if (!(c.template in templates)) return;
	// @ts-ignore
	// eslint-disable-next-line import/namespace
	return templates[c.template]({ p, c, vars: config.vars });
}
