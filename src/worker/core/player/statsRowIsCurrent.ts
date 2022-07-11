import type { PlayerStats } from "../../../common/types";
import { g } from "../../util";

const statsRowIsCurrent = (
	ps: PlayerStats | undefined,
	tid: number,
	playoffs: boolean,
) => {
	// ps.tid < 0 is for All-Star game, to show current season stats from their real team
	return (
		ps &&
		(ps.tid === tid || tid < 0) &&
		ps.playoffs === playoffs &&
		ps.season === g.get("season")
	);
};

export default statsRowIsCurrent;
