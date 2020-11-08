import { idb } from "../../db";
import { g, helpers, initUILocalGames, local } from "../../util";
import { unwrap, wrap } from "../../util/g";
import type { GameAttributesLeague } from "../../../common/types";
import { finances, draft, team } from "..";
import gameAttributesToUI from "./gameAttributesToUI";
import { DIFFICULTY } from "../../../common";

const updateMetaDifficulty = async (difficulty: number) => {
	if (local.autoSave) {
		const l = await idb.meta.get("leagues", g.get("lid"));

		if (l) {
			l.difficulty = difficulty;
			await idb.meta.put("leagues", l);
		}
	}
};

const setGameAttributes = async (
	gameAttributes: Partial<GameAttributesLeague>,
) => {
	const toUpdate: (keyof GameAttributesLeague)[] = [];

	if (
		gameAttributes.difficulty !== undefined &&
		gameAttributes.difficulty <= DIFFICULTY.Easy
	) {
		gameAttributes.easyDifficultyInPast = true;
	}

	for (const key of helpers.keys(gameAttributes)) {
		const currentValue = unwrap(g, key);

		if (
			// @ts-ignore
			(gameAttributes[key] === undefined ||
				currentValue !== gameAttributes[key]) &&
			// @ts-ignore
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
			toUpdate.push(key);
		}
	}

	// Will contain the wrapped values too
	const updatedGameAttributes: any = {
		...gameAttributes,
	};

	for (const key of toUpdate) {
		const value = wrap(g, key, gameAttributes[key]);
		updatedGameAttributes[key] = value;

		if (key === "salaryCap") {
			// Adjust budget items for inflation
			if (
				(g as any).salaryCap !== undefined &&
				(g as any).season !== undefined &&
				(g as any).userTids !== undefined
			) {
				const teams = await idb.cache.teams.getAll();
				const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
					"teamSeasonsBySeasonTid",
					[[g.get("season")], [g.get("season"), "Z"]],
				);
				const popRanks = helpers.getPopRanks(teamSeasons);

				const keys: (keyof typeof teams[number]["budget"])[] = [
					"scouting",
					"coaching",
					"health",
					"facilities",
				];

				for (let i = 0; i < teamSeasons.length; i++) {
					const t = teams.find(t => t.tid === teamSeasons[i].tid);
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
						if (t.adjustForInflation !== false) {
							for (const key of keys) {
								const factor =
									helpers.defaultBudgetAmount(t.budget[key].rank, value) /
									helpers.defaultBudgetAmount(t.budget[key].rank);

								t.budget[key].amount =
									Math.round((t.budget[key].amount * factor) / 10) * 10;
							}

							const factor =
								helpers.defaultTicketPrice(t.budget.ticketPrice.rank, value) /
								helpers.defaultTicketPrice(t.budget.ticketPrice.rank);

							t.budget.ticketPrice.amount = parseFloat(
								(t.budget.ticketPrice.amount * factor).toFixed(2),
							);

							updated = true;
						}
					} else {
						team.autoBudgetSettings(t, popRank, value);
					}

					if (updated) {
						await idb.cache.teams.put(t);
					}
				}

				await finances.updateRanks(["budget"]);
			}
		}

		await idb.cache.gameAttributes.put({
			key,
			value,
		});
		g.setWithoutSavingToDB(key, value);

		if (key === "difficulty") {
			await updateMetaDifficulty(g.get(key));
		}
	}

	await gameAttributesToUI(updatedGameAttributes);

	if (toUpdate.includes("userTid")) {
		await initUILocalGames();
	} else if (
		toUpdate.includes("numSeasonsFutureDraftPicks") ||
		toUpdate.includes("challengeNoDraftPicks") ||
		(toUpdate.includes("userTids") && g.get("challengeNoDraftPicks"))
	) {
		await draft.genPicks();
	}
};

export default setGameAttributes;
