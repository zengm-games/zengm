import isSport from "./isSport";
import type { GameAttributesLeagueWithHistory } from "./types";

// Ideally all upgrade stuff would be here, because this also gets called before showing the setting screen when importing a league... maybe some day!
const simpleGameAttributesUpgrade = (
	gameAttributes: GameAttributesLeagueWithHistory,
	version: number | undefined,
) => {
	if ((gameAttributes as any).hardCap !== undefined) {
		gameAttributes.salaryCapType = (gameAttributes as any).hardCap
			? "hard"
			: "soft";
		delete (gameAttributes as any).hardCap;
	}

	if (!isSport("basketball") && (version === undefined || version <= 51)) {
		if (gameAttributes.pace === 100) {
			gameAttributes.pace = 1;
		}
	}

	if (typeof gameAttributes.challengeThanosMode === "boolean") {
		gameAttributes.challengeThanosMode = gameAttributes.challengeThanosMode
			? 20
			: 0;
	}

	if (gameAttributes.repeatSeason && !gameAttributes.repeatSeason.type) {
		(gameAttributes.repeatSeason as any).type = "playersAndRosters";
	}
};

export default simpleGameAttributesUpgrade;
