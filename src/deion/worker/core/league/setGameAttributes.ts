import { idb } from "../../db";
import { g, toUI, helpers, initUILocalGames, local } from "../../util";
import { unwrap, wrap } from "../../util/g";
import type { GameAttributesLeague } from "../../../common/types";
import { finances, trade } from "..";

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

					if (g.get("userTids").includes(t.tid)) {
						if (t.adjustForInflation !== false || local.autoPlaySeasons > 0) {
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
							updated = true;
						}

						for (const key of keys) {
							if (t.budget[key].amount !== defaultBudgetAmount) {
								t.budget[key].amount = defaultBudgetAmount;
								updated = true;
							}
						}
					}

					if (updated) {
						await idb.cache.teams.put(t);
					}
				}

				await finances.updateRanks(["budget"]);
			}
		} else if (key === "userTid") {
			await trade.clear();
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
