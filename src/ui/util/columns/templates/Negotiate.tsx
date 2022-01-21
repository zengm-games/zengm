import type { Player } from "../../../../common/types";
import { NegotiateButtons } from "../../../components";
import { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp, vars: object) => (
	<NegotiateButtons
		capSpace={vars.capSpace}
		disabled={vars.gameSimInProgress}
		minContract={vars.minContract}
		spectator={vars.spectator}
		p={p}
		willingToNegotiate={p.mood.user.willing}
	/>
);
