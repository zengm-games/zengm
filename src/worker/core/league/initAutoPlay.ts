import { startAutoPlay } from "./autoPlay.ts";
import { g, logEvent } from "../../util/index.ts";
import type { Conditions, Phase } from "../../../common/types.ts";

// If auto play can't start, tells the user why and returns false
const checkCanAutoPlay = (conditions: Conditions) => {
	if (g.get("gameOver")) {
		logEvent(
			{
				type: "error",
				text: "You can't auto play while you're fired!",
				showNotification: true,
				persistent: true,
				saveToDb: false,
			},
			conditions,
		);
		return false;
	}

	return true;
};

// What the UI's auto play dialog needs, or undefined if auto play can't start
export const getAutoPlayDialogInfo = (conditions: Conditions) => {
	if (!checkCanAutoPlay(conditions)) {
		return;
	}

	return {
		season: g.get("season"),
		forceHistoricalRosters: g.get("forceHistoricalRosters"),
		repeatSeason: g.get("repeatSeason")?.type,
	};
};

// Starts auto play until the season and phase picked in the UI's auto play dialog. Checks again whether auto play can start, since the league might have changed while the dialog was open.
export const initAutoPlay = (
	choice: { season: string; phase: string },
	conditions: Conditions,
) => {
	if (!checkCanAutoPlay(conditions)) {
		return false;
	}

	const season = Number.parseInt(choice.season);
	const phase = Number.parseInt(choice.phase);

	if (
		season > g.get("season") ||
		(season === g.get("season") && phase > g.get("phase"))
	) {
		startAutoPlay(season, phase as Phase, conditions);
	} else {
		return false;
	}
};
