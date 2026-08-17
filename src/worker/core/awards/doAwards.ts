import type {
	Awards2,
	Conditions,
	PlayerAwardBuiltIn,
	PlayerFiltered,
	PlayerStatType,
	TeamFiltered,
} from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import { idb } from "../../db/index.ts";
import { groupByUnique } from "../../../common/utils.ts";
import { processAwards } from "./processAwards.ts";
import { saveAwardsByPlayer, type AwardsByPlayer } from "./awardsByPlayer.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import { orderTeams } from "../../util/orderTeams.ts";
import getLeaderRequirements from "../season/getLeaderRequirements.ts";
import {
	GamesPlayedCache,
	playerMeetsCategoryRequirements,
} from "../../views/leaders.ts";
import { leaderAwardCategories } from "../../../common/awards.ts";

export const teamAwards = async (
	teamsUnsorted: TeamFiltered<
		["tid"],
		[
			"winp",
			"pts",
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
			"cid",
			"did",
		],
		["pts", "oppPts", "gp"],
		number
	>[],
) => {
	const teams = await orderTeams(teamsUnsorted, teamsUnsorted);
	if (!teams[0]) {
		throw new Error("No teams found");
	}

	const bestRecord = teams[0].tid;

	const bestRecordConfs: Record<number, number> = {};
	for (const conf of g.get("confs", "current")) {
		const teamsConf = await orderTeams(
			teams.filter((t2) => t2.seasonAttrs.cid === conf.cid),
			teams,
		);
		const t = teamsConf[0];
		if (t) {
			bestRecordConfs[conf.cid] = t.tid;
		}
	}

	const bestRecordDivs: Record<number, number> = {};
	for (const div of g.get("divs", "current")) {
		const teamsDiv = await orderTeams(
			teams.filter((t2) => t2.seasonAttrs.did === div.did),
			teams,
		);
		const t = teamsDiv[0];
		if (t) {
			bestRecordDivs[div.did] = t.tid;
		}
	}

	return {
		bestRecord,
		bestRecordConfs,
		bestRecordDivs,
	};
};

export const leagueLeaders = async (
	players: PlayerFiltered[],
	season: number,
) => {
	const requirements = getLeaderRequirements();
	const statType: PlayerStatType = bySport({
		baseball: "totals",
		basketball: "perGame",
		football: "totals",
		hockey: "totals",
	});

	const gamesPlayedCache = new GamesPlayedCache();
	await gamesPlayedCache.loadSeasons([season], false);

	const awardsByPlayer: AwardsByPlayer = [];

	for (const { stat, name } of leaderAwardCategories) {
		if (!requirements[stat]) {
			throw new Error(`Missing leader requirements for ${stat}`);
		}

		const statInfo = {
			stat,
			...requirements[stat],
		};

		let leaders = [];
		let leaderValue = statInfo.sortAscending ? Infinity : -Infinity;
		for (const p of players) {
			const playerValue = p.currentStats[stat];

			const pass = playerMeetsCategoryRequirements({
				career: false,
				cat: statInfo,
				gamesPlayedCache,
				p,
				playerStats: p.currentStats,
				seasonType: "regularSeason",
				season,
				statType,
			});

			if (pass) {
				if (
					statInfo.sortAscending
						? playerValue < leaderValue
						: playerValue > leaderValue
				) {
					leaders = [p];
					leaderValue = playerValue;
				} else if (playerValue === leaderValue) {
					leaders.push(p);
				}
			}
		}

		for (const p of leaders) {
			awardsByPlayer.push({
				pid: p.pid,
				tid: p.tid,
				name: p.name,
				award: { type: name },
			});
		}
	}

	return awardsByPlayer;
};

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

		if (award.numTeams === undefined) {
			for (const [i, pTemp] of award.winner.entries()) {
				if (!pTemp) {
					continue;
				}
				const { pid, tid } = pTemp;
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
					const { pid, tid } = pTemp;
					const p = playersByPid[pid]!;

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
