import { NegotiateButtons } from "../../../components";
import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) => (
	<NegotiateButtons
		capSpace={vars.capSpace}
		disabled={vars.gameSimInProgress}
		minContract={vars.minContract}
		spectator={vars.spectator}
		p={p}
		willingToNegotiate={p.mood.user.willing}
	/>
);
