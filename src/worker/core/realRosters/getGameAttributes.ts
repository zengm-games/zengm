import { PHASE } from "../../../common";
import type {
	GameAttributesLeague,
	GetLeagueOptions,
} from "../../../common/types";
import { FIRST_SEASON_WITH_ALEXNOOB_ROSTERS } from "./getLeague";

type MyGameAttributes = Partial<GameAttributesLeague> &
	Pick<GameAttributesLeague, "confs" | "divs">;

const getGameAttributes = (
	initialGameAttributes: any,
	options: GetLeagueOptions,
) => {
	if (options.type === "real") {
		const gameAttributes: Record<string, unknown> = {
			maxRosterSize: 17,
			gracePeriodEnd: options.season + 2,
			...initialGameAttributes,
		};

		if (
			options.season >= FIRST_SEASON_WITH_ALEXNOOB_ROSTERS &&
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
			maxRosterSize: 17,
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

		return gameAttributes as MyGameAttributes;
	}

	throw new Error("Should not happen");
};

export default getGameAttributes;
