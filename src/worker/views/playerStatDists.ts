import { PlayerStatType } from "./../../common/types";
import { PHASE, PLAYER, PLAYER_STATS_TABLES } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updatePlayers = async (
	inputs: ViewInput<"playerStatDists">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.season !== state.season ||
		inputs.statType !== state.statType
	) {
		let players;

		if (g.get("season") === inputs.season && g.get("phase") <= PHASE.PLAYOFFS) {
			players = await idb.cache.players.indexGetAll("playersByTid", [
				PLAYER.FREE_AGENT,
				Infinity,
			]);
		} else {
			players = await idb.getCopies.players({
				activeSeason: inputs.season,
			});
		}
		console.log(inputs);
		const stats =
			process.env.SPORT === "basketball"
				? [
						"gp",
						"gs",
						"min",
						"fg",
						"fga",
						"fgp",
						"tp",
						"tpa",
						"tpp",
						"ft",
						"fta",
						"ftp",
						"orb",
						"drb",
						"trb",
						"ast",
						"tov",
						"stl",
						"blk",
						"pf",
						"pts",
						"per",
				  ]
				: PLAYER_STATS_TABLES[inputs.statType].stats.filter(
						stat => stat != "qbRec",
				  );

		players = await idb.getCopies.playersPlus(players, {
			ratings: ["skills"],
			stats,
			season: inputs.season,
		});
		if (process.env.SPORT == "football") {
			const statTable = PLAYER_STATS_TABLES[inputs.statType];
			const onlyShowIf = statTable.onlyShowIf as string[];
			players = players.filter(p => {
				for (const stat of onlyShowIf) {
					if (typeof p["stats"][stat] === "number" && p["stats"][stat] > 0) {
						return true;
					}
				}

				return false;
			});
		}

		const statsAll = players.reduce((memo, p) => {
			for (const stat of Object.keys(p.stats)) {
				if (stat === "playoffs") {
					continue;
				}
				if (memo.hasOwnProperty(stat)) {
					memo[stat].push(p.stats[stat]);
				} else {
					memo[stat] = [p.stats[stat]];
				}
			}

			return memo;
		}, {});

		return {
			numGames: g.get("numGames"),
			season: inputs.season,
			statsAll,
			statType: inputs.statType,
		};
	}
};

export default updatePlayers;
