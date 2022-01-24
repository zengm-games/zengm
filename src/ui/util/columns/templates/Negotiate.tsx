import type { Player } from "../../../../common/types";
import { NegotiateButtons } from "../../../components";
import { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol, vars: object) => (
	<NegotiateButtons
		capSpace={vars.capSpace}
		disabled={vars.gameSimInProgress}
		minContract={vars.minContract}
		spectator={vars.spectator}
		p={p}
		willingToNegotiate={p.mood.user.willing}
	/>
);
