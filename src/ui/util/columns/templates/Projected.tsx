import { Player } from "../../../../common/types";
import { helpers } from "../../index";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) =>
	`${helpers.formatCurrency(p.contractDesired.amount, "M")}`;
