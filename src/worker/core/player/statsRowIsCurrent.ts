import type { PlayerStats } from "../../../common/types";
import { g } from "../../util";

const statsRowIsCurrent = (
	ps: PlayerStats | undefined,
	tid: number,
	playoffs: boolean,
) => {
	return (
		ps &&
		ps.tid === tid &&
		ps.playoffs === playoffs &&
		ps.season === g.get("season")
	);
};

export default statsRowIsCurrent;
