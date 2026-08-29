import fastDeepEqual from "fast-deep-equal";
import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import type {
	AwardInfoIndividual,
	Conditions,
	DistributiveOmit,
	PlayerAward,
	PlayerAwardBuiltIn,
	PlayerFiltered,
	PlayerStatType,
} from "../../../common/types.ts";
import addAward from "../player/addAward.ts";
import { formatPlayerAwardName } from "../../../common/awards.ts";
import { getGroupPrefix } from "./prefixes.ts";
import getLeaderRequirements from "../season/getLeaderRequirements.ts";
import {
	GamesPlayedCache,
	playerMeetsCategoryRequirements,
} from "../../views/leaders.ts";
import { leaderAwardCategories } from "../../../common/awards.ts";
import { groupByUnique } from "../../../common/utils.ts";
import type { processAwards } from "./processAwards.ts";
import { bySport } from "../../../common/sportFunctions.ts";

export type AwardByPlayer = {
	pid: number;
	tid: number;
	name: string;
	award: DistributiveOmit<PlayerAward, "season">;
};

export const saveAwardsByPlayer = async (
	awardsByPlayer: AwardByPlayer[],
	conditions: Conditions,
	season: number = g.get("season"),
	logEvents: boolean = true,
	allStarGID?: number,
) => {
	if (awardsByPlayer.length === 0) {
		return;
	}

	// None of this stuff needs to block, it's just notifications
	for (const p of awardsByPlayer) {
		let text = `<a href="${helpers.leagueUrl(["player", p.pid])}">${
			p.name
		}</a> (<a href="${helpers.leagueUrl([
			"roster",
			`${g.get("teamInfoCache")[p.tid]?.abbrev}_${p.tid}`,
			g.get("season"),
		])}">${g.get("teamInfoCache")[p.tid]?.abbrev}</a>) `;
		let score;

		if (p.award.type?.includes("Leader")) {
			text += `led the league in ${p.award.type
				.replace("League ", "")
				.replace(" Leader", "")
				.toLowerCase()}.`;
			score = 10;
		} else if (p.award.type === "All-Star") {
			text += "made the All-Star team.";
			score = 10;
		} else if (p.award.type === "All-Star MVP") {
			text += `won the <a href="${helpers.leagueUrl([
				"game_log",
				"special",
				season,
				allStarGID,
			])}">All-Star MVP</a> award.`;
			score = 10;
		} else if (p.award.type === "Slam Dunk Contest Winner") {
			text += "won the slam dunk contest.";
			score = 10;
		} else if (p.award.type === "Three-Point Contest Winner") {
			text += "won the three-point contest.";
			score = 10;
		} else if (p.award.type === undefined && p.award.numTeams !== undefined) {
			// Team awards - arguably should have formatAwardNamePrefix here too, idk
			const groupPrefix = getGroupPrefix(p.award, season);
			text += `made the ${formatPlayerAwardName(p.award, { groupPrefix })}.`;
			score = 10;
		} else {
			if (p.award.type !== undefined || p.award.rank === 1) {
				const groupPrefix =
					p.award.type === undefined
						? getGroupPrefix(p.award, season)
						: undefined;
				text += `won the ${formatPlayerAwardName(p.award, { groupPrefix })} award.`;
				score = 20;
			}
		}

		if (logEvents && score !== undefined) {
			logEvent(
				{
					type: "award",
					text,
					showNotification: false,
					pids: [p.pid],
					tids: [p.tid],
					score,
				},
				conditions,
			);
		}
	}
	const pids = Array.from(
		new Set(awardsByPlayer.map((award) => award.pid)),
	).filter((x) => x != undefined);
	for (const pid of pids) {
		let p = await idb.cache.players.get(pid);
		if (!p) {
			p = await idb.getCopy.players(
				{
					pid,
				},
				"noCopyCache",
			);
		}

		if (p && pid != undefined) {
			for (const awardByPlayer of awardsByPlayer) {
				if (awardByPlayer.pid === pid) {
					addAward(p, {
						...awardByPlayer.award,
						season,
					});
				}
			}
			await idb.cache.players.put(p);
		}
	}
};

export const deleteAwardsByPlayer = async (
	awardsByPlayer: Pick<AwardByPlayer, "pid" | "award">[],
	season: number,
) => {
	if (awardsByPlayer.length === 0) {
		return;
	}

	const pids = Array.from(new Set(awardsByPlayer.map((award) => award.pid)));
	const players = await idb.getCopies.players(
		{
			pids,
		},
		"noCopyCache",
	);

	const awardsByPid = Object.groupBy(awardsByPlayer, (award) => award.pid);

	for (const p of players) {
		const toDelete = awardsByPid[p.pid];
		if (toDelete) {
			p.awards = p.awards.filter((award) => {
				if (award.season !== season) {
					return true;
				}

				// Delete this award if it matches any of toDelete
				for (const { award: awardToDelete } of toDelete) {
					if (fastDeepEqual({ ...awardToDelete, season }, award)) {
						return false;
					}
				}

				return true;
			});
			await idb.cache.players.put(p);
		}
	}
};

export const getLeagueLeaderAwards = async (
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

	const awardsByPlayer: AwardByPlayer[] = [];

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

export const getAwardsByPlayer = (
	realizedAwards: ProcessAwardsReturn["realizedAwards"][number],
	players: {
		name: string;
		pid: number;
	}[],
) => {
	const playersByPid = groupByUnique(players, "pid");
	const awardsByPlayer: AwardByPlayer[] = [];
	for (const [index, award] of realizedAwards.entries()) {
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
				if (pTemp?.pid === undefined) {
					continue;
				}
				const { pid, tid } = pTemp;
				const extra: {
					actAs?: AwardInfoIndividual["actAs"];
				} = {};
				if (award.actAs !== undefined) {
					extra.actAs = award.actAs;
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
					if (pTemp?.pid === undefined) {
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
