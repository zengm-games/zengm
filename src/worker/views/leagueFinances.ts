import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { validateSeasonOnly } from "../util/processInputs.ts";

export default defineView({
	id: "leagueFinances",
	processInputs: validateSeasonOnly,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.includes("firstRun") ||
			(inputs.season === g.get("season") &&
				(updateEvents.includes("gameSim") ||
					updateEvents.includes("newPhase"))) ||
			prevInputs?.season !== inputs.season
		) {
			const players = await idb.cache.players.indexGetAll("playersByTid", [
				0,
				Infinity,
			]);

			const teams = (
				await idb.getCopies.teamsPlus(
					{
						attrs: ["tid", "budget", "strategy"],
						seasonAttrs: [
							"att",
							"revenue",
							"profit",
							"cash",
							"payrollOrSalaryPaid",
							"pop",
							"abbrev",
							"tid",
							"region",
							"name",
							"imgURL",
							"imgURLSmall",
							"expenseLevels",
						],
						season: inputs.season,
					},
					"noCopyCache",
				)
			).map((t) => {
				const rosterSpots =
					g.get("maxRosterSize") -
					players.filter((p) => p.tid === t.tid).length;

				return {
					...t,
					rosterSpots,
				};
			});
			return {
				season: inputs.season,
				teams,
			};
		}
	},
});
