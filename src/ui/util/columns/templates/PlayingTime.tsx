import type { Player } from "../../../../common/types";
import type { ColConfig } from "../../../views/Roster/RosterCustomizeColumns";
import PlayingTime from "../../../views/Roster/PlayingTime";

export default (p: Player, c: ColConfig, vars: object) => (
	<PlayingTime p={p} userTid={vars.userTid} />
);
