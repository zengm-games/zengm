import { idb } from "../../db";
import { g } from "../../util";

/**
 * Update team strategies (contending or rebuilding) for every team in the league.
 *
 * Basically.. switch to rebuilding if you're old and your success is fading, and switch to contending if you have a good amount of young talent on rookie deals and your success is growing.
 *
 * @memberOf core.team
 * @return {Promise}
 */
const updateStrategies = async () => {
	const teams = await idb.cache.teams.getAll();

	for (const t of teams) {
		if (t.tid === g.get("userTid") || t.disabled) {
			continue;
		}

		// Change in wins
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsBySeasonTid",
			[g.get("season"), t.tid],
		);
		if (!teamSeason) {
			continue;
		}
		const teamSeasonOld = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsBySeasonTid",
			[g.get("season") - 1, t.tid],
		);
		const won = teamSeason.won;
		const dWon = teamSeasonOld ? won - teamSeasonOld.won : 0;

		// Young stars
		const playersAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			t.tid,
		);
		const players = await idb.getCopies.playersPlus(playersAll, {
			season: g.get("season"),
			tid: t.tid,
			attrs: ["age", "value", "contract"],
			stats: ["min"],
		});
		let youngStar = 0; // Default value

		let numerator = 0; // Sum of age * mp

		let denominator = 0; // Sum of mp

		for (let i = 0; i < players.length; i++) {
			numerator += players[i].age * players[i].stats.min;
			denominator += players[i].stats.min;

			// Is a young star about to get a pay raise and eat up all the cap after this season?
			if (
				players[i].value > 65 &&
				players[i].contract.exp === g.get("season") + 1 &&
				players[i].contract.amount <= 5 &&
				players[i].age <= 25
			) {
				youngStar += 1;
			}
		}

		const age = numerator / denominator; // Average age, weighted by minutes played

		const score =
			0.8 * dWon +
			(won - g.get("numGames") / 2) +
			5 * (26 - age) +
			youngStar * 20;
		let updated = false;

		if (score > 20 && t.strategy === "rebuilding") {
			t.strategy = "contending";
			updated = true;
		} else if (score < -20 && t.strategy === "contending") {
			t.strategy = "rebuilding";
			updated = true;
		}

		if (updated) {
			await idb.cache.teams.put(t);
		}
	}
};

export default updateStrategies;
