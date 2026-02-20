import { idb } from "../../db/index.ts";
import {
	defaultInjuries,
	defaultTragicDeaths,
	g,
	helpers,
	initUILocalGames,
	local,
} from "../../util/index.ts";
import { wrap } from "../../util/g.ts";
import type { GameAttributesLeague } from "../../../common/types.ts";
import { draft, team } from "../index.ts";
import gameAttributesToUI from "./gameAttributesToUI.ts";
import { unwrapGameAttribute } from "../../../common/index.ts";
import { getAutoTicketPriceByTid } from "../game/attendance.ts";
import goatFormula from "../../util/goatFormula.ts";
import updateMeta from "./updateMeta.ts";
import { initDefaults } from "../../util/loadNames.ts";
import { gameAttributesKeysOtherSports } from "../../../common/defaultGameAttributes.ts";
import { disableCola, initializeCola } from "../draft/cola.ts";

const updateMetaDifficulty = async (difficulty: number) => {
	await updateMeta({
		difficulty,
	});
};

const setGameAttributes = async (
	gameAttributes: Partial<GameAttributesLeague>,
	{
		skipDraftGenPicks,
	}: {
		skipDraftGenPicks?: boolean;
	} = {},
) => {
	const toUpdate = new Set<keyof GameAttributesLeague>();

	if (
		gameAttributes.difficulty !== undefined &&
		Object.hasOwn(g, "lowestDifficulty") &&
		gameAttributes.difficulty < g.get("lowestDifficulty")
	) {
		gameAttributes.lowestDifficulty = gameAttributes.difficulty;
	}

	if (gameAttributes.injuries) {
		// Test if it's the same as default
		if (
			JSON.stringify(gameAttributes.injuries) ===
			JSON.stringify(defaultInjuries)
		) {
			gameAttributes.injuries = undefined;
		}
	}

	if (gameAttributes.tragicDeaths) {
		// Test if it's the same as default
		if (
			JSON.stringify(gameAttributes.tragicDeaths) ===
			JSON.stringify(defaultTragicDeaths)
		) {
			gameAttributes.tragicDeaths = undefined;
		}
	}

	// Test if it's the same as default
	if (gameAttributes.goatFormula === goatFormula.DEFAULT_FORMULA) {
		gameAttributes.goatFormula = undefined;
	}
	if (gameAttributes.goatSeasonFormula === goatFormula.DEFAULT_FORMULA_SEASON) {
		gameAttributes.goatSeasonFormula = undefined;
	}

	for (const key of helpers.keys(gameAttributes)) {
		if (gameAttributesKeysOtherSports.has(key)) {
			continue;
		}

		const currentValue = unwrapGameAttribute(g, key);

		if (
			(gameAttributes[key] === undefined ||
				currentValue !== gameAttributes[key]) &&
			!Number.isNaN(gameAttributes[key])
		) {
			// No needless update for arrays - this matters for wrapped values like numGamesPlayoffSeries so it doesn't create an extra entry every year!
			if (Array.isArray(gameAttributes[key])) {
				if (
					JSON.stringify(gameAttributes[key]) === JSON.stringify(currentValue)
				) {
					continue;
				}
			}
			toUpdate.add(key);
		}
	}

	// Will contain the wrapped values too
	const updatedGameAttributes: any = {
		...gameAttributes,
	};

	for (const key of toUpdate) {
		const value = wrap(g, key, gameAttributes[key]);
		updatedGameAttributes[key] = value;

		await idb.cache.gameAttributes.put({
			key,
			value,
		});
		g.setWithoutSavingToDB(key, value);
	}

	await gameAttributesToUI(updatedGameAttributes);

	if (toUpdate.has("salaryCap")) {
		// Adjust budget items for inflation
		if (
			(g as any).salaryCap !== undefined &&
			(g as any).season !== undefined &&
			(g as any).userTids !== undefined
		) {
			const value = updatedGameAttributes.salaryCap;

			const teams = await idb.cache.teams.getAll();
			const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
				"teamSeasonsBySeasonTid",
				[[g.get("season")], [g.get("season"), "Z"]],
			);
			const popRanks = helpers.getPopRanks(teamSeasons);

			for (const [i, teamSeason] of teamSeasons.entries()) {
				const t = teams.find((t) => t.tid === teamSeason.tid);
				const popRank = popRanks[i];
				if (popRank === undefined || t === undefined) {
					continue;
				}

				let updated = false;

				if (
					g.get("userTids").includes(t.tid) &&
					!local.autoPlayUntil &&
					!g.get("spectator")
				) {
					if (t.adjustForInflation) {
						if (t.autoTicketPrice !== false) {
							t.budget.ticketPrice = await getAutoTicketPriceByTid(t.tid);
						} else {
							const factor =
								helpers.defaultTicketPrice(popRank, value) /
								helpers.defaultTicketPrice(popRank);

							t.budget.ticketPrice = helpers.localeParseFloat(
								(t.budget.ticketPrice * factor).toFixed(2),
							);
						}

						updated = true;
					}
				} else {
					await team.resetTicketPrice(t, popRank, value);
					updated = true;
				}

				if (updated) {
					await idb.cache.teams.put(t);
				}
			}
		}
	}

	if (toUpdate.has("draftType")) {
		if (updatedGameAttributes.draftType === "cola") {
			await initializeCola();
		} else {
			await disableCola();
		}
	}

	if (toUpdate.has("difficulty")) {
		await updateMetaDifficulty(g.get("difficulty"));
	}

	if (toUpdate.has("userTid")) {
		await initUILocalGames();
	}

	if (
		!skipDraftGenPicks &&
		(toUpdate.has("numSeasonsFutureDraftPicks") ||
			toUpdate.has("challengeNoDraftPicks") ||
			toUpdate.has("numDraftRounds") ||
			toUpdate.has("forceHistoricalRosters") ||
			(toUpdate.has("userTids") && g.get("challengeNoDraftPicks")))
	) {
		await draft.genPicks();
	}

	// Reset playerBioInfo caches
	if (toUpdate.has("playerBioInfo")) {
		local.playerBioInfo = undefined;
		await initDefaults({
			force: true,
		});
	}
};

export default setGameAttributes;
