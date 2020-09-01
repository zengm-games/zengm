import autoPlay from "./autoPlay";
import { local, toUI, g } from "../../util";
import type { Conditions } from "../../../common/types";

const initAutoPlay = async (conditions: Conditions) => {
	const result = await toUI(
		"autoPlayDialog",
		[g.get("season"), !!g.get("repeatSeason")],
		conditions,
	);

	if (!result) {
		return false;
	}

	const season = parseInt(result.season, 10);
	const phase = parseInt(result.phase, 10);

	if (
		season > g.get("season") ||
		(season === g.get("season") && phase > g.get("phase"))
	) {
		local.autoPlayUntil = {
			season,
			phase,
		};
		autoPlay(conditions);
	} else {
		return false;
	}
};

export default initAutoPlay;
