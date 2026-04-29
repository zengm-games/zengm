import type {
	GameAttributes,
	GameAttributesLeague,
	GameAttributesLeagueWithHistory,
	GameAttributeWithHistory,
} from "../../common/types.ts";
import { PHASE } from "../../common/constants.ts";
import { actualPhase } from "./actualPhase.ts";
import { gameAttributeHasHistory } from "../../common/gameAttributeHasHistory.ts";
import helpers from "./helpers.ts";
import { last } from "../../common/utils.ts";

// This will get filled by values from IndexedDB
const g: GameAttributes & {
	get: <T extends keyof GameAttributesLeague>(
		key: T,
		season?: number | "current",
	) => GameAttributesLeague[T];
	getRaw: <T extends keyof GameAttributesLeague>(
		key: T,
	) => GameAttributesLeagueWithHistory[T];
	setWithoutSavingToDB: <T extends keyof GameAttributesLeague>(
		key: T,
		value: GameAttributesLeague[T] | GameAttributesLeagueWithHistory[T],
	) => void;
} = {
	lid: undefined,

	get: (key, season = Infinity) => {
		if (Object.hasOwn(g, key)) {
			// @ts-expect-error
			const gameAttribute = g[key];

			if (gameAttributeHasHistory(gameAttribute)) {
				// Return value from row with highest starting season that is still <= the current season
				const season2 = season === "current" ? (g as any).season : season;

				// Should never need to check gameAttribute[0].value unless there is no matching season, which should never happen
				return (
					gameAttribute.findLast((x) => season2 >= x.start)?.value ??
					gameAttribute[0].value
				);
			}

			if (key === "allStarGame" && typeof gameAttribute === "boolean") {
				if (gameAttribute) {
					// Old default, back when it was a boolean and not customizable
					return 0.7;
				}

				return null;
			}

			return gameAttribute;
		}

		throw new Error(`Attempt to get g.${key} while it is not already set`);
	},

	getRaw: (key) => {
		if (Object.hasOwn(g, key)) {
			// @ts-expect-error
			const gameAttribute = g[key];

			if (key === "allStarGame" && typeof gameAttribute === "boolean") {
				if (gameAttribute) {
					// Old default, back when it was a boolean and not customizable
					return 0.7;
				}

				return null;
			}

			return gameAttribute;
		}

		throw new Error(`Attempt to get g.${key} while it is not already set`);
	},

	setWithoutSavingToDB: (key, value) => {
		// Should this error when setting a key that doesn't exist, like setting a value form GameAttributesLeague when not in a league? Maybe, but need a way to initialize it first.
		// @ts-expect-error
		g[key] = value;
	},
};

export const wrapNewValueIfCurrentlyWrapped = <
	T extends keyof GameAttributesLeague,
>(
	gameAttributes: any,
	key: T,
	value: GameAttributesLeague[T],
	override?: {
		season: number;
		phase: number;
	},
) => {
	const gameAttribute = gameAttributes[key];

	if (!gameAttributeHasHistory(gameAttribute)) {
		return value;
	}

	const cloned = helpers.deepCopy(gameAttribute) as GameAttributeWithHistory<
		GameAttributesLeague[T]
	>;

	const latestRow = last(cloned);

	let currentSeason;
	let phase;

	if (override) {
		currentSeason = override.season;
		phase = override.phase;
	} else {
		currentSeason =
			gameAttributes.season !== undefined
				? gameAttributes.season
				: g.get("season");

		phase = actualPhase(
			gameAttributes.phase ?? g.get("phase"),
			g.get("nextPhase"),
		);
	}

	if (key === "userTid") {
		// For userTid, final update for current season happens in newPhaseBeforeDraft, where it's still PHASE.PLAYOFFS
		if (phase > PHASE.PLAYOFFS) {
			currentSeason += 1;
		}
	} else if (key === "numGames") {
		// For userTid, apply to next regular season
		if (phase >= PHASE.REGULAR_SEASON) {
			currentSeason += 1;
		}
	} else {
		// Currently this applies to confs, divs, numGamesPlayoffSeries, and numPlayoffByes, which all can only be changed for this season before the playoffs. For otl/ties/tiebreakers it might be better to do this for REGULAR_SEASON too, but that'd also be confusing for people who don't see the change immediately happen.
		if (phase >= PHASE.PLAYOFFS) {
			currentSeason += 1;
		}
	}

	// This mutates, but the result supposed to be updated immediately anyway, so whatever
	if (latestRow.start === currentSeason) {
		latestRow.value = value;
	} else {
		cloned.push({
			start: currentSeason,
			value,
		});
	}

	return cloned;
};

export default g;
