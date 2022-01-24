import type { Player } from "../../../../common/types";
import { helpers } from "../../index";
import type { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol) =>
	helpers.formatCurrency(p.contract.amount, "M") +
	(c.options?.format == "full" ? ` thru ${p.contract.exp}` : "");
