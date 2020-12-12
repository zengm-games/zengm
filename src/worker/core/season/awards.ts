import { PLAYER, PHASE, SIMPLE_AWARDS, AWARD_NAMES } from "../../../common";
import { idb } from "../../db";
import { g, defaultGameAttributes, helpers, logEvent } from "../../util";
import type {
	Conditions,
	PlayerFiltered,
	TeamFiltered,
} from "../../../common/types";

export type AwardsByPlayer = {
	pid: number;
	tid: number;
	name: string;
	type: string;
}[];

export type GetTopPlayersOptions = {
	allowNone?: boolean;
	amount?: number;
	filter?: (a: PlayerFiltered) => boolean;
	score: (a: PlayerFiltered) => number;
};

const getPlayers = async (season: number): Promise<PlayerFiltered[]> => {
	let playersAll;
	if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
		playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersAll = await idb.getCopies.players({
			activeSeason: season,
		});
	}
	let players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"firstName",
			"tid",
			"abbrev",
			"draft",
			"injury",
			"born",
			"watch",
		],
		ratings: ["pos", "season", "ovr", "dovr", "pot", "skills"],
		stats:
			process.env.SPORT === "basketball"
				? [
						"gp",
						"gs",
						"min",
						"pts",
						"trb",
						"ast",
						"blk",
						"stl",
						"per",
						"ewa",
						"ws",
						"dws",
						"ws48",
						"season",
						"abbrev",
						"tid",
						"jerseyNumber",
				  ]
				: [
						"keyStats",
						"av",
						"pntYds",
						"fg",
						"krTD",
						"krYds",
						"prTD",
						"prYds",
						"season",
						"abbrev",
						"tid",
						"jerseyNumber",
				  ],
		fuzz: true,
		mergeStats: true,
	});

	// Only keep players who actually have a stats entry for the latest season
	players = players.filter(
		p => p.stats.length > 0 && p.stats.some((ps: any) => ps.season === season),
	);

	// Add winp, for later
	const teamSeasons = await idb.getCopies.teamSeasons({
		season,
	});
	const teamInfos: Record<
		number,
		{
			winp: number;
		}
	> = {};
	for (const teamSeason of teamSeasons) {
		teamInfos[teamSeason.tid] = {
			winp: helpers.calcWinp(teamSeason),
		};
	}

	// For convenience later
	for (const p of players) {
		p.pos = p.ratings[p.ratings.length - 1].pos;

		p.currentStats = p.stats[p.stats.length - 1];
		for (let i = p.stats.length - 1; i >= 0; i--) {
			if (p.stats[i].season === season) {
				p.currentStats = p.stats[i];
				break;
			}
		}

		// Otherwise it's always the current season
		p.age = season - p.born.year;

		p.teamInfo = teamInfos[p.currentStats.tid];
	}

	return players;
};

const teamAwards = (
	teamsUnsorted: TeamFiltered<
		["tid"],
		["winp", "won", "lost", "tied", "cid", "did", "abbrev", "region", "name"],
		any,
		number
	>[],
) => {
	const teams = helpers.orderByWinp(teamsUnsorted);

	if (teams.length === 0) {
		throw new Error("No teams found");
	}

	const bestRecord = {
		tid: teams[0].tid,
		abbrev: teams[0].seasonAttrs.abbrev,
		region: teams[0].seasonAttrs.region,
		name: teams[0].seasonAttrs.name,
		won: teams[0].seasonAttrs.won,
		lost: teams[0].seasonAttrs.lost,
		tied: g.get("ties", "current") ? teams[0].seasonAttrs.tied : undefined,
	};
	const bestRecordConfs = g.get("confs", "current").map(c => {
		const t = teams.find(t2 => t2.seasonAttrs.cid === c.cid);

		if (!t) {
			return;
		}

		return {
			tid: t.tid,
			abbrev: t.seasonAttrs.abbrev,
			region: t.seasonAttrs.region,
			name: t.seasonAttrs.name,
			won: t.seasonAttrs.won,
			lost: t.seasonAttrs.lost,
			tied: g.get("ties", "current") ? t.seasonAttrs.tied : undefined,
		};
	});
	return {
		bestRecord,
		bestRecordConfs,
	};
};

const leagueLeaders = (
	players: PlayerFiltered[],
	categories: {
		name: string;
		stat: string;
		minValue: number;
	}[],
	awardsByPlayer: AwardsByPlayer,
) => {
	const factor =
		(g.get("numGames") / defaultGameAttributes.numGames) *
		helpers.quarterLengthFactor(); // To handle changes in number of games and playing time

	for (const cat of categories) {
		const p = players
			.filter(p2 => {
				return (
					p2.currentStats[cat.stat] * p2.currentStats.gp >=
						cat.minValue * factor || p2.currentStats.gp >= 70 * factor
				);
			})
			.reduce((maxPlayer, currentPlayer) => {
				return currentPlayer.currentStats[cat.stat] >
					maxPlayer.currentStats[cat.stat]
					? currentPlayer
					: maxPlayer;
			}, players[0]);

		if (p) {
			awardsByPlayer.push({
				pid: p.pid,
				tid: p.tid,
				name: p.name,
				type: cat.name,
			});
		}
	}
};

const getTopPlayers = (
	{ allowNone, amount, filter, score }: GetTopPlayersOptions,
	playersUnsorted: PlayerFiltered[],
): PlayerFiltered[] => {
	if (playersUnsorted.length === 0) {
		if (allowNone) {
			return [];
		}

		throw new Error("No players");
	}

	const actualFilter = filter ?? (() => true);
	const actualAmount = amount ?? 1;
	const cache: Map<number, number> = new Map();
	const players = playersUnsorted.filter(actualFilter).sort((a, b) => {
		let aScore = cache.get(a.pid);

		if (aScore === undefined) {
			aScore = score(a);
			cache.set(a.pid, aScore);
		}

		let bScore = cache.get(b.pid);

		if (bScore === undefined) {
			bScore = score(b);
			cache.set(b.pid, bScore);
		}

		return bScore - aScore;
	});

	// For the ones returning multiple players (for all league teams), enforce length
	if (
		!allowNone &&
		actualAmount !== Infinity &&
		actualAmount > 1 &&
		players.length < actualAmount
	) {
		throw new Error("Not enough players");
	}

	// If all players are filtered out above (like MIP initial year), then this will return an empty array
	return players.slice(0, actualAmount);
};

const saveAwardsByPlayer = async (
	awardsByPlayer: AwardsByPlayer,
	conditions: Conditions,
	season: number = g.get("season"),
	logEvents: boolean = true,
) => {
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

		if (p.type.includes("Team")) {
			text += `made the ${p.type}.`;
			score = 10;
		} else if (p.type.includes("Leader")) {
			text += `led the league in ${p.type
				.replace("League ", "")
				.replace(" Leader", "")
				.toLowerCase()}.`;
			score = 10;
		} else if (p.type === "All-Star") {
			text += `made the All-Star team.`;
			score = 10;
		} else {
			text += `won the ${p.type} award.`;
			score = 20;
		}

		if (logEvents) {
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
		new Set(awardsByPlayer.map(award => award.pid)),
	).filter(x => x != undefined);
	for (const pid of pids) {
		let p = await idb.cache.players.get(pid);
		if (!p) {
			p = (await idb.getCopy.players({
				pid: pid,
			})) as any;
		}

		if (p && pid != undefined) {
			for (const awardByPlayer of awardsByPlayer) {
				if (awardByPlayer.pid === pid) {
					p.awards.push({
						season,
						type: awardByPlayer.type,
					});
				}
			}
			await idb.cache.players.put(p);
		}
	}
};
const deleteAwardsByPlayer = async (
	awardsByPlayer: AwardsByPlayer,
	season: number,
) => {
	const pids = Array.from(new Set(awardsByPlayer.map(award => award.pid)));
	for (const pid of pids) {
		const p = await idb.cache.players.get(pid);
		if (p) {
			const typesToDelete = awardsByPlayer
				.filter(award => award.pid === p.pid)
				.map(award => award.type);
			p.awards = p.awards.filter(
				award => award.season != season || !typesToDelete.includes(award.type),
			);
			await idb.cache.players.put(p);
		}
	}
};
const addSimpleAndTeamAwardsToAwardsByPlayer = (
	awards: any,
	awardsByPlayer: AwardsByPlayer,
) => {
	for (const key of SIMPLE_AWARDS) {
		const type = AWARD_NAMES[key] as string;
		const award = awards[key];

		if (!award) {
			// e.g. MIP in first season
			continue;
		}

		const { pid, tid, name } = award;
		awardsByPlayer.push({
			pid,
			tid,
			name,
			type,
		});
	}
	const awardsTeams =
		process.env.SPORT === "basketball"
			? (["allRookie", "allLeague", "allDefensive"] as const)
			: (["allRookie", "allLeague"] as const);
	for (const key of awardsTeams) {
		const type = AWARD_NAMES[key] as string;

		if (key === "allRookie") {
			for (const p of awards.allRookie) {
				if (p) {
					const { pid, tid, name } = p;
					awardsByPlayer.push({
						pid,
						tid,
						name,
						type,
					});
				}
			}
		} else {
			for (const level of awards[key]) {
				for (const p of level.players) {
					if (p) {
						const { pid, tid, name } = p;
						awardsByPlayer.push({
							pid,
							tid,
							name,
							type: `${level.title} ${type}`,
						});
					}
				}
			}
		}
	}
};

export {
	getPlayers,
	getTopPlayers,
	leagueLeaders,
	deleteAwardsByPlayer,
	saveAwardsByPlayer,
	addSimpleAndTeamAwardsToAwardsByPlayer,
	teamAwards,
};
