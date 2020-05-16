import { idb } from "../../db";
import { g, toUI, helpers, initUILocalGames, local } from "../../util";
import { unwrap, wrap } from "../../util/g";
import type { GameAttributesLeague } from "../../../common/types";
import { finances } from "..";

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
	const updated: any = {
		...gameAttributes,
	};

	for (const key of toUpdate) {
		const value = wrap(g, key, gameAttributes[key]);
		updated[key] = value;

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

				for (let i = 0; i < teams.length; i++) {
					const t = teams[i];
					console.log(t.region, t.name);
					const popRank = popRanks[i];
					if (popRank === undefined) {
						continue;
					}

					if (g.get("userTids").includes(t.tid)) {
						if (t.adjustForInflation !== false) {
							// This won't perfectly keep pace, because a higher currentRank would be needed to maintain a higher rank, and a lower currentRank would be needed to maintain lower.
							// Better - find out what popRank would be needed to obtain the current rank in each budget item
							const currentRank = g.get("numTeams") / 2;

							const factor =
								helpers.defaultBudgetAmount(currentRank, value) /
								helpers.defaultBudgetAmount(currentRank);
							t.budget.coaching.amount =
								Math.round((t.budget.coaching.amount * factor) / 10) * 10;
							t.budget.facilities.amount =
								Math.round((t.budget.facilities.amount * factor) / 10) * 10;
							t.budget.health.amount =
								Math.round((t.budget.health.amount * factor) / 10) * 10;
							t.budget.scouting.amount =
								Math.round((t.budget.scouting.amount * factor) / 10) * 10;

							t.budget.ticketPrice.amount = parseFloat(
								(
									(t.budget.ticketPrice.amount *
										helpers.defaultTicketPrice(currentRank, value)) /
									helpers.defaultTicketPrice(currentRank)
								).toFixed(2),
							);
						}
					} else {
						const defaultTicketPrice = helpers.defaultTicketPrice(
							popRank,
							value,
						);
						const defaultBudgetAmount = helpers.defaultBudgetAmount(
							popRank,
							value,
						);

						if (t.budget.ticketPrice.amount !== defaultTicketPrice) {
							t.budget.ticketPrice.amount = defaultTicketPrice;
						}

						const keys: (keyof typeof t["budget"])[] = [
							"scouting",
							"coaching",
							"health",
							"facilities",
						];

						for (const key of keys) {
							if (t.budget[key].amount !== defaultBudgetAmount) {
								t.budget[key].amount = defaultBudgetAmount;
							}
						}
					}

					await idb.cache.teams.put(t);
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

	await toUI("setGameAttributes", [updated]);

	if (toUpdate.includes("userTid")) {
		await initUILocalGames();
	}
};

export default setGameAttributes;
