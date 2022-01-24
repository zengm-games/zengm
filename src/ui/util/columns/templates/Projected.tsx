import type { Player } from "../../../../common/types";
import { helpers } from "../../index";
import type { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol) =>
	`${helpers.formatCurrency(p.contractDesired.amount, "M")}`;
