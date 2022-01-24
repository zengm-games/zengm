import type { Player } from "../../../../common/types";
import { helpers } from "../../index";
import type { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol) =>
	helpers.formatCurrency(p.mood.user.contractAmount / 1000, "M");
