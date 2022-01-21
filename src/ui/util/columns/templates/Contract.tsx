import type { Player } from "../../../../common/types";
import { helpers } from "../../index";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) =>
	`${helpers.formatCurrency(p.contract.amount, "M")} thru ${p.contract.exp}`;
