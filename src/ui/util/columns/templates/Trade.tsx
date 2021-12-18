import type { Player } from "../../../../common/types";
import { NegotiateButtons } from "../../../components";
import { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp, vars: object) => (
	<button
		className="btn btn-light-bordered btn-xs"
		disabled={p.untradable}
		onClick={() => vars.handleTrade(p)}
	>
		{vars.showTradeFor ? "Trade For" : "Trade Away"}
	</button>
);
