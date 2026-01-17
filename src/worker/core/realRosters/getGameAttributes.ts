import { PHASE, REAL_PLAYERS_INFO } from "../../../common/index.ts";
import type {
	GameAttributesLeague,
	GetLeagueOptions,
} from "../../../common/types.ts";

type MyGameAttributes = Partial<GameAttributesLeague> &
	Pick<
		GameAttributesLeague,
		"confs" | "divs" | "numGames" | "numGamesPlayoffSeries"
	>;

const getGameAttributes = (
	initialGameAttributes: any,
	options: GetLeagueOptions,
) => {
	if (options.type === "real") {
		const gameAttributes: Record<string, unknown> = {
			maxRosterSize: 18,
			...initialGameAttributes,
		};

		if (
			options.season >= REAL_PLAYERS_INFO!.FIRST_SEASON_WITH_ALEXNOOB_ROSTERS &&
			!options.randomDebuts
		) {
			gameAttributes.numSeasonsFutureDraftPicks = 7;
		}

		if (options.phase !== PHASE.PRESEASON) {
			gameAttributes.phase = options.phase;
		}

		return gameAttributes as MyGameAttributes;
	}

	if (options.type === "legends") {
		const gameAttributes: Record<string, unknown> = {
			maxRosterSize: 18,
			aiTradesFactor: 0,
		};

		const ignoreGameAttributes = [
			"salaryCap",
			"luxuryPayroll",
			"minPayroll",
			"minContract",
			"maxContract",
		];
		for (const [key, value] of Object.entries(initialGameAttributes)) {
			if (!ignoreGameAttributes.includes(key)) {
				gameAttributes[key] = value;
			}
		}

		// Random debuts by default
		gameAttributes.randomization = "debuts";

		return gameAttributes as MyGameAttributes;
	}

	throw new Error("Should not happen");
};

export default getGameAttributes;
