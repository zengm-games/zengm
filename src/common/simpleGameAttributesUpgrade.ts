import { isSport } from "./sportFunctions.ts";
import type {
	GameAttributeWithHistory,
	GameAttributesLeagueWithHistory,
} from "./types.ts";

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

	const ties = (gameAttributes as any).ties as
		| boolean
		| GameAttributeWithHistory<boolean>
		| undefined;
	if (ties !== undefined) {
		let maxOvertimes: GameAttributesLeagueWithHistory["maxOvertimes"];

		if (ties === true || ties === false) {
			maxOvertimes = [
				{
					start: -Infinity,
					value: ties ? 1 : null,
				},
			];
		} else {
			maxOvertimes = ties.map((row) => {
				return {
					start: row.start,
					value: row.value ? 1 : null,
				};
			}) as any;
		}

		gameAttributes.maxOvertimes = maxOvertimes;

		delete (gameAttributes as any).ties;
	}

	const autoDeleteOldBoxScores = (gameAttributes as any)
		.autoDeleteOldBoxScores as boolean | undefined;
	if (autoDeleteOldBoxScores !== undefined) {
		// If autoDeleteOldBoxScores was true, just let the new default apply. Only override if it was false
		if (autoDeleteOldBoxScores === false) {
			gameAttributes.saveOldBoxScores = {
				pastSeasons: "all",
				pastSeasonsType: "all",
			};
		}

		delete (gameAttributes as any).autoDeleteOldBoxScores;
	}

	const disableInjuries = (gameAttributes as any).disableInjuries;
	if (disableInjuries !== undefined) {
		delete (gameAttributes as any).disableInjuries;

		if (disableInjuries) {
			gameAttributes.injuryRate = 0;
		}
	}

	const aiTrades = (gameAttributes as any).aiTrades;
	if (aiTrades !== undefined) {
		delete (gameAttributes as any).aiTrades;

		if (aiTrades === false && gameAttributes.aiTradesFactor === 1) {
			gameAttributes.aiTradesFactor = 0;
		}
	}
};

export default simpleGameAttributesUpgrade;
