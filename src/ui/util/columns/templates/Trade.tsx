import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) => (
	<button
		className="btn btn-light-bordered btn-xs"
		disabled={p.untradable}
		onClick={() => vars.handleTrade(p)}
	>
		{vars.showTradeFor ? "Trade For" : "Trade Away"}
	</button>
);
