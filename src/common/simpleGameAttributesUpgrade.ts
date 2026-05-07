import { isSport } from "./sportFunctions.ts";
import type {
	GameAttributeWithHistory,
	GameAttributesLeagueWithHistory,
	PlayerContract,
	PlayerInjury,
} from "./types.ts";

type ObsoleteGameAttributes = {
	aiTrades?: boolean;
	autoDeleteOldBoxScores?: boolean;
	disableInjuries?: boolean;
	hardCap?: unknown;
	ties?: boolean | GameAttributeWithHistory<boolean>;
	repeatSeason?: {
		type?: "playersAndRosters";
		startingSeason: number;
		players: Record<
			number,
			{
				tid: number;
				contract: PlayerContract;
				injury: PlayerInjury;
			}
		>;
	};
};

// Ideally all upgrade stuff would be here, because this also gets called before showing the setting screen when importing a league... maybe some day!
const simpleGameAttributesUpgrade = (
	gameAttributes: GameAttributesLeagueWithHistory & ObsoleteGameAttributes,
	version: number | undefined,
) => {
	if (gameAttributes.hardCap !== undefined) {
		gameAttributes.salaryCapType = gameAttributes.hardCap ? "hard" : "soft";
		delete gameAttributes.hardCap;
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
		gameAttributes.repeatSeason.type = "playersAndRosters";
	}

	const ties = gameAttributes.ties;
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
			// Type cast because it doesn't know NonEmptyArray is preserved in Map
			maxOvertimes = ties.map((row) => {
				return {
					start: row.start,
					value: row.value ? 1 : null,
				};
			}) as any;
		}

		gameAttributes.maxOvertimes = maxOvertimes;

		delete gameAttributes.ties;
	}

	const autoDeleteOldBoxScores = gameAttributes.autoDeleteOldBoxScores;
	if (autoDeleteOldBoxScores !== undefined) {
		// If autoDeleteOldBoxScores was true, just let the new default apply. Only override if it was false
		if (autoDeleteOldBoxScores === false) {
			gameAttributes.saveOldBoxScores = {
				pastSeasons: "all",
				pastSeasonsType: "all",
			};
		}

		delete gameAttributes.autoDeleteOldBoxScores;
	}

	const disableInjuries = gameAttributes.disableInjuries;
	if (disableInjuries !== undefined) {
		delete gameAttributes.disableInjuries;

		if (disableInjuries) {
			gameAttributes.injuryRate = 0;
		}
	}

	const aiTrades = gameAttributes.aiTrades;
	if (aiTrades !== undefined) {
		delete gameAttributes.aiTrades;

		if (aiTrades === false && gameAttributes.aiTradesFactor === 1) {
			gameAttributes.aiTradesFactor = 0;
		}
	}
};

export default simpleGameAttributesUpgrade;
