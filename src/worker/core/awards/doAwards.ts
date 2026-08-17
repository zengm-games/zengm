import type {
	Awards2,
	Conditions,
	PlayerAwardBuiltIn,
} from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import { idb } from "../../db/index.ts";
import { groupByUnique } from "../../../common/utils.ts";
import {
	leagueLeaders,
	saveAwardsByPlayer,
	teamAwards,
	type AwardsByPlayer,
} from "./awards.ts";
import { processAwards } from "./processAwards.ts";

type ProcessAwardsReturn = Awaited<ReturnType<typeof processAwards>>;

const getAwardsByPlayer = (
	realizedAwards: ProcessAwardsReturn["realizedAwards"],
	players: ProcessAwardsReturn["players"],
) => {
	const playersByPid = groupByUnique(players, "pid");
	const awardsByPlayer: AwardsByPlayer = [];
	for (const { award, index } of realizedAwards) {
		const common: Pick<
			PlayerAwardBuiltIn,
			"group" | "index" | "name" | "shortName"
		> = {
			name: award.name,
			shortName: award.shortName,
			index,
		};

		if (award.group && award.group.type !== "playoffSeries") {
			common.group = award.group;
		}

		const statRange = award.statRange ?? "regularSeason";

		if (award.numTeams === undefined) {
			for (const [i, pTemp] of award.winner.entries()) {
				if (!pTemp) {
					continue;
				}
				const { pid } = pTemp;
				const extra: {
					mvp?: true;
					roy?: true;
				} = {};
				if (award.mvp) {
					extra.mvp = true;
				}
				if (award.roy) {
					extra.roy = true;
				}

				const p = playersByPid[pid]!;

				const tid = p.currentStats[statRange]?.tid;
				if (tid === undefined) {
					continue;
				}

				awardsByPlayer.push({
					pid,
					tid,
					name: p.name,
					award: {
						...common,
						...extra,
						rank: i + 1, // Rank in "voting"
					},
				});
			}
		} else {
			for (const [i, team] of award.winner.entries()) {
				for (const pTemp of team) {
					if (!pTemp) {
						continue;
					}
					const { pid } = pTemp;
					const p = playersByPid[pid]!;

					const tid = p.currentStats[statRange]?.tid;
					if (tid === undefined) {
						continue;
					}

					awardsByPlayer.push({
						pid,
						tid,
						name: p.name,
						award: {
							...common,
							rank: i + 1, // Team number
							numTeams: award.numTeams,
						},
					});
				}
			}
		}
	}

	return awardsByPlayer;
};

const NUM_PLAYERS_TO_STORE_PER_INDIVIDUAL_AWARD = 5;

export const doAwards = async (conditions: Conditions) => {
	const season = g.get("season");

	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: [
				"won",
				"lost",
				"tied",
				"otl",
				"wonDiv",
				"lostDiv",
				"tiedDiv",
				"otlDiv",
				"wonConf",
				"lostConf",
				"tiedConf",
				"otlConf",
				"winp",
				"pts",
				"playoffRoundsWon",
				"abbrev",
				"region",
				"name",
				"cid",
				"did",
			],
			stats: ["pts", "oppPts", "gp"],
			season,
			showNoStats: true,
		},
		"noCopyCache",
	);
	const bestRecords = await teamAwards(teams);

	const { players, realizedAwards } = await processAwards({
		awards: g.get("awards"),
		numPlayersPerIndividualAward: NUM_PLAYERS_TO_STORE_PER_INDIVIDUAL_AWARD,
		season,
		statOverridesByMatchup: undefined,
	});

	const awardsByPlayer = [
		...getAwardsByPlayer(realizedAwards, players),
		...(await leagueLeaders(players, season)),
	];

	await saveAwardsByPlayer(awardsByPlayer, conditions, season);

	const awards: Awards2 = {
		season,
		...bestRecords,
		awards: realizedAwards.map((x) => x.award),
	};
	console.log("awards", awards);
	await idb.cache.awards.put(awards);
};
