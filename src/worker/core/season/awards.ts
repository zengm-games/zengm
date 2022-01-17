import {
	PLAYER,
	PHASE,
	SIMPLE_AWARDS,
	AWARD_NAMES,
	bySport,
	isSport,
} from "../../../common";
import { idb } from "../../db";
import {
	g,
	defaultGameAttributes,
	helpers,
	logEvent,
	orderTeams,
} from "../../util";
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
		playersAll = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);
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
		stats: bySport({
			basketball: [
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
				"vorp",
				"ws48",
				"season",
				"abbrev",
				"tid",
				"jerseyNumber",
			],
			football: [
				"keyStats",
				"av",
				"pntYds",
				"fg",
				"krTD",
				"krYds",
				"prTD",
				"prYds",
				"pssYds",
				"rusYds",
				"recYds",
				"ydsFromScrimmage",
				"season",
				"abbrev",
				"tid",
				"jerseyNumber",
				"defIntTD",
				"defFmbTD",
				"defSft",
				"defSk",
				"defTck",
				"defInt",
				"defPssDef",
			],
			hockey: [
				"keyStats",
				"g",
				"a",
				"pts",
				"hit",
				"tk",
				"gaa",
				"svPct",
				"ops",
				"dps",
				"gps",
				"ps",
				"season",
				"abbrev",
				"tid",
				"jerseyNumber",
			],
		}),
		fuzz: true,
		mergeStats: true,
	});

	// Only keep players who actually have a stats entry for the latest season
	players = players.filter(
		p => p.stats.length > 0 && p.stats.some((ps: any) => ps.season === season),
	);

	// Add winp, for later
	const teamSeasons = await idb.getCopies.teamSeasons(
		{
			season,
		},
		"noCopyCache",
	);
	const teamInfos: Record<
		number,
		{
			gp: number;
			winp: number;
		}
	> = {};
	for (const teamSeason of teamSeasons) {
		teamInfos[teamSeason.tid] = {
			gp:
				teamSeason.won +
				teamSeason.lost +
				(teamSeason.tied ?? 0) +
				(teamSeason.otl ?? 0),
			winp: helpers.calcWinp(teamSeason),
		};
	}

	// For convenience later
	for (const p of players) {
		p.pos = p.ratings.at(-1).pos;

		p.currentStats = p.stats.at(-1);
		for (let i = p.stats.length - 1; i >= 0; i--) {
			if (p.stats[i].season === season) {
				p.currentStats = p.stats[i];
				break;
			}
		}

		// Otherwise it's always the current season
		p.age = season - p.born.year;

		// Player somehow on an inactive team needs this fallback, should only happen in a weird custom roster
		p.teamInfo = teamInfos[p.currentStats.tid] ?? {
			gp: 0,
			winp: 0,
		};
	}

	// Add fracWS for basketball current season
	if (isSport("basketball")) {
		const totalWS: Record<number, number> = {};
		for (const p of players) {
			if (totalWS[p.currentStats.tid] === undefined) {
				totalWS[p.currentStats.tid] = 0;
			}
			totalWS[p.currentStats.tid] += p.currentStats.ws;
		}

		for (const p of players) {
			p.currentStats.fracWS = Math.min(
				// Inner max is to handle negative totalWS
				p.currentStats.ws / Math.max(totalWS[p.currentStats.tid], 1),

				// In the rare case that a team has very low or even negative WS, don't let anybody have a crazy high fracWS
				0.8,
			);
		}
	}

	return players;
};

const teamAwards = async (
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
			"abbrev",
			"region",
			"name",
		],
		["pts", "oppPts", "gp"],
		number
	>[],
) => {
	const teams = await orderTeams(teamsUnsorted, teamsUnsorted);

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
		otl: g.get("otl", "current") ? teams[0].seasonAttrs.otl : undefined,
	};
	const bestRecordConfs = await Promise.all(
		g.get("confs", "current").map(async c => {
			const teamsConf = await orderTeams(
				teams.filter(t2 => t2.seasonAttrs.cid === c.cid),
				teams,
			);
			const t = teamsConf[0];

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
				otl: g.get("otl", "current") ? t.seasonAttrs.otl : undefined,
			};
		}),
	);

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
	const numGames = g.get("numGames");
	const factor =
		(numGames / defaultGameAttributes.numGames) * helpers.quarterLengthFactor(); // To handle changes in number of games and playing time

	for (const cat of categories) {
		const p = players
			.filter(p2 => {
				// In basketball, everything except gp is a per-game average, so we need to scale them by games played to check against minValue. In other sports, this whole check is unneccessary currently, because the stats are season totals not per game averages.
				let playerValue;
				if (!isSport("basketball")) {
					playerValue = p2.currentStats[cat.stat];
				} else {
					playerValue = p2.currentStats[cat.stat] * p2.currentStats.gp;
				}
				return (
					playerValue >= cat.minValue * factor ||
					p2.currentStats.gp >= 0.85 * numGames
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
			text += "made the All-Star team.";
			score = 10;
		} else if (p.type === "All-Star MVP") {
			text += `won the <a href="${helpers.leagueUrl([
				"game_log",
				"special",
				season,
				allStarGID,
			])}">All-Star MVP</a> award.`;
			score = 10;
		} else if (p.type === "Slam Dunk Contest Winner") {
			text += "won the slam dunk contest.";
			score = 10;
		} else if (p.type === "Three-Point Contest Winner") {
			text += "won the three-point contest.";
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
			p = (await idb.getCopy.players(
				{
					pid: pid,
				},
				"noCopyCache",
			)) as any;
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
	awardsByPlayer: {
		pid: number;
		type: string;
	}[],
	season: number,
) => {
	if (awardsByPlayer.length === 0) {
		return;
	}

	const pids = Array.from(new Set(awardsByPlayer.map(award => award.pid)));
	const players = await idb.getCopies.players(
		{
			pids,
		},
		"noCopyCache",
	);
	for (const p of players) {
		const typesToDelete = awardsByPlayer
			.filter(award => award.pid === p.pid)
			.map(award => award.type);
		p.awards = p.awards.filter(
			award => award.season != season || !typesToDelete.includes(award.type),
		);
		await idb.cache.players.put(p);
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
	const awardsTeams = bySport({
		basketball: ["allRookie", "allLeague", "allDefensive"] as const,
		football: ["allRookie", "allLeague"] as const,
		hockey: ["allRookie", "allLeague"] as const,
	});
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
