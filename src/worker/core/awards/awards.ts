import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import type {
	Award2,
	Conditions,
	DistributiveOmit,
	PlayerAward,
	PlayerAwardBuiltIn,
	PlayerFiltered,
	PlayerStatType,
	TeamFiltered,
} from "../../../common/types.ts";
import addAward from "../player/addAward.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import { orderTeams } from "../../util/orderTeams.ts";
import getLeaderRequirements from "../season/getLeaderRequirements.ts";
import {
	GamesPlayedCache,
	playerMeetsCategoryRequirements,
} from "../../views/leaders.ts";
import { formatPlayerAwardName } from "../../../common/awards.ts";

export type AwardsByPlayer = {
	pid: number;
	tid: number;
	name: string;
	award: DistributiveOmit<PlayerAward, "season">;
}[];

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

export const leaderAwardCategories = bySport({
	baseball: [
		{
			name: "League HR Leader",
			stat: "hr",
		},
		{
			name: "League BA Leader",
			stat: "ba",
		},
		{
			name: "League OPS Leader",
			stat: "ops",
		},
		{
			name: "League RBI Leader",
			stat: "rbi",
		},
		{
			name: "League Runs Leader",
			stat: "r",
		},
		{
			name: "League Stolen Bases Leader",
			stat: "sb",
		},
		{
			name: "League Walks Leader",
			stat: "bb",
		},
		{
			name: "League Wins Leader",
			stat: "w",
		},
		{
			name: "League Strikeouts Leader",
			stat: "soPit",
		},
		{
			name: "League ERA Leader",
			stat: "era",
		},
		{
			name: "League Saves Leader",
			stat: "sv",
		},
		{
			name: "League WAR Leader",
			stat: "war",
		},
	],
	basketball: [
		{
			name: "League Scoring Leader",
			stat: "pts",
		},
		{
			name: "League Rebounding Leader",
			stat: "trb",
		},
		{
			name: "League Assists Leader",
			stat: "ast",
		},
		{
			name: "League Steals Leader",
			stat: "stl",
		},
		{
			name: "League Blocks Leader",
			stat: "blk",
		},
	],
	football: [
		{
			name: "League Passing Leader",
			stat: "pssYds",
		},
		{
			name: "League Rushing Leader",
			stat: "rusYds",
		},
		{
			name: "League Receiving Leader",
			stat: "recYds",
		},
		{
			name: "League Scrimmage Yards Leader",
			stat: "ydsFromScrimmage",
		},
		{
			name: "League Interceptions Leader",
			stat: "defInt",
		},
		{
			name: "League Sacks Leader",
			stat: "defSk",
		},
		{
			name: "League TD Leader",
			stat: "totTD",
		},
	],
	hockey: [
		{
			name: "League Points Leader",
			stat: "pts",
		},
		{
			name: "League Goals Leader",
			stat: "g",
		},
		{
			name: "League Assists Leader",
			stat: "a",
		},
	],
});

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

export const saveAwardsByPlayer = async (
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
	awardsByPlayer: {
		pid: number;
		type: string;
	}[],
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
	for (const p of players) {
		const typesToDelete = awardsByPlayer
			.filter((award) => award.pid === p.pid)
			.map((award) => award.type);
		p.awards = p.awards.filter(
			(award) => award.season != season || !typesToDelete.includes(award.type),
		);
		await idb.cache.players.put(p);
	}
};

export const addSimpleAndTeamAwardsToAwardsByPlayer = () => {};

const getInitials = (string: string) => {
	return (
		string
			.match(/\b\p{L}/gu)
			?.join("")
			.toUpperCase() ?? ""
	);
};

export const getGroupPrefix = (
	award: Pick<Award2, "group"> | Pick<PlayerAwardBuiltIn, "group">,
	season: number,
) => {
	const group = award.group;
	if (group) {
		if (group.type === "conf") {
			const confs = g.get("confs", season);
			const conf = confs.find((conf) => conf.cid === group.cid);
			if (conf) {
				return conf.abbrev ?? getInitials(conf.name);
			}
		} else if (group.type === "div") {
			const divs = g.get("divs", season);
			const div = divs.find((div) => div.did === group.did);
			if (div) {
				return div.abbrev ?? getInitials(div.name);
			}
		}
	}
};

export const formatAwardNamePrefix = (
	award: Pick<Award2, "group" | "name" | "shortName">,
	season: number,
	short?: boolean,
) => {
	const prefix = getGroupPrefix(award, season) ?? "";

	if (short) {
		return `${prefix}${award.shortName}`;
	}

	return `${prefix} ${award.name}`;
};
