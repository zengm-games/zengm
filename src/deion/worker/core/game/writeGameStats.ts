import { PHASE } from "../../../common";
import { saveAwardsByPlayer } from "../season/awards";
import { idb } from "../../db";
import { g, helpers, logEvent } from "../../util";
import {
	Conditions,
	Game,
	GameResults,
	LogEventType,
} from "../../../common/types";

const allStarMVP = async (
	game: Game,
	allStars: any,
	conditions: Conditions,
) => {
	let mvp;
	let maxScore = -Infinity; // Find MVP

	for (const t of game.teams) {
		const wonBonus = game.won.tid === t.tid ? 8 : 0;

		for (const p of t.players) {
			const score = helpers.gameScore(p) + p.pts / 2 + wonBonus;

			if (score > maxScore) {
				mvp = p;
				maxScore = score;
			}
		}
	}

	if (!mvp) {
		return;
	}

	const p = await idb.cache.players.get(mvp.pid); // Needed for real tid

	if (!p) {
		return;
	}

	if (allStars) {
		allStars.mvp = {
			pid: p.pid,
			tid: p.tid,
			name: `${p.firstName} ${p.lastName}`,
		}; // Will be saved later
	}

	// Save to clutchPlays (attached to ASG box score) and also store/notify normally
	if (!game.clutchPlays) {
		return;
	}

	game.clutchPlays.push(
		`<a href="${helpers.leagueUrl(["player", mvp.pid])}">${
			mvp.name
		}</a> (<a href="${helpers.leagueUrl([
			"roster",
			g.get("teamAbbrevsCache")[p.tid],
			g.get("season"),
		])}">${g.get("teamAbbrevsCache")[p.tid]}</a>) won the All-Star MVP award.`,
	);
	await saveAwardsByPlayer(
		[
			{
				pid: mvp.pid,
				tid: p.tid,
				name: mvp.name,
				type: "All-Star MVP",
			},
		],
		conditions,
	);
};

const writeGameStats = async (
	results: GameResults,
	att: number,
	conditions: Conditions,
) => {
	const gameStats: Game = {
		gid: results.gid,
		att,
		clutchPlays: [],
		season: g.get("season"),
		playoffs: g.get("phase") === PHASE.PLAYOFFS,
		overtimes: results.overtimes,
		won: {
			tid: 0,
			pts: 0,
		},
		lost: {
			tid: 0,
			pts: 0,
		},
		scoringSummary: results.scoringSummary,
		teams: [{}, {}],
	};
	gameStats.teams[0].tid = results.team[0].id;
	gameStats.teams[0].players = [];
	gameStats.teams[1].tid = results.team[1].id;
	gameStats.teams[1].players = [];
	const allStarGame = results.team[0].id === -1 && results.team[1].id === -2;
	let allStars;

	if (allStarGame) {
		allStars = await idb.cache.allStars.get(g.get("season"));
	}

	for (let t = 0; t < 2; t++) {
		for (const key of Object.keys(results.team[t].stat)) {
			gameStats.teams[t][key] = results.team[t].stat[key];
		}

		for (let p = 0; p < results.team[t].player.length; p++) {
			gameStats.teams[t].players[p] = {};

			for (const key of Object.keys(results.team[t].player[p].stat)) {
				gameStats.teams[t].players[p][key] =
					results.team[t].player[p].stat[key];
			}

			gameStats.teams[t].players[p].name = results.team[t].player[p].name;
			gameStats.teams[t].players[p].pos = results.team[t].player[p].pos;
			gameStats.teams[t].players[p].pid = results.team[t].player[p].id;
			gameStats.teams[t].players[p].skills = helpers.deepCopy(
				results.team[t].player[p].skills,
			);
			gameStats.teams[t].players[p].injury = helpers.deepCopy(
				results.team[t].player[p].injury,
			);
		}
	}

	// Store some extra junk to make box scores easy
	const [tw, tl] =
		results.team[0].stat.pts > results.team[1].stat.pts ? [0, 1] : [1, 0];
	gameStats.won.tid = results.team[tw].id;
	gameStats.lost.tid = results.team[tl].id;
	gameStats.won.pts = results.team[tw].stat.pts;
	gameStats.lost.pts = results.team[tl].stat.pts;
	const tied = results.team[0].stat.pts === results.team[1].stat.pts; // Event log

	if (
		results.team[0].id === g.get("userTid") ||
		results.team[1].id === g.get("userTid")
	) {
		let text;

		if (tied) {
			const otherTid =
				results.team[0].id === g.get("userTid")
					? results.team[1].id
					: results.team[0].id;
			text = `<span style="color: yellow; font-weight: bold; padding-right: 8px">T</span> Your team tied the <a href="${helpers.leagueUrl(
				["roster", g.get("teamAbbrevsCache")[otherTid], g.get("season")],
			)}">${g.get("teamNamesCache")[otherTid]}`;
		} else if (results.team[tw].id === g.get("userTid")) {
			text = `<span style="color: green; font-weight: bold; padding-right: 3px">W</span> Your team defeated the <a href="${helpers.leagueUrl(
				[
					"roster",
					g.get("teamAbbrevsCache")[results.team[tl].id],
					g.get("season"),
				],
			)}">${g.get("teamNamesCache")[results.team[tl].id]}`;
		} else {
			text = `<span style="color: red; font-weight: bold; padding-right: 8px">L</span> Your team lost to the <a href="${helpers.leagueUrl(
				[
					"roster",
					g.get("teamAbbrevsCache")[results.team[tw].id],
					g.get("season"),
				],
			)}">${g.get("teamNamesCache")[results.team[tw].id]}`;
		}

		text += `</a> <a href="${helpers.leagueUrl([
			"game_log",
			g.get("teamAbbrevsCache")[g.get("userTid")],
			g.get("season"),
			results.gid,
		])}">${results.team[tw].stat.pts}-${results.team[tl].stat.pts}</a>.`;
		let type: LogEventType =
			results.team[tw].id === g.get("userTid") ? "gameWon" : "gameLost";

		if (tied) {
			type = "gameTied";
		}

		logEvent(
			{
				type,
				text,
				saveToDb: false,
				tids: [results.team[0].id, results.team[1].id],
			},
			conditions,
		);
	} else if (results.team[0].id === -1 && results.team[1].id === -2) {
		if (allStars) {
			const text = `${allStars.teamNames[tw]} ${tied ? "tied" : "defeated"} ${
				allStars.teamNames[tl]
			} <a href="${helpers.leagueUrl([
				"game_log",
				"special",
				g.get("season"),
				results.gid,
			])}">${results.team[tw].stat.pts}-${
				results.team[tl].stat.pts
			} in the All-Star Game</a>.`;
			const type = tied ? "gameTied" : "gameWon";
			logEvent(
				{
					type,
					text,
					saveToDb: false,
					tids: [g.get("userTid")],
				},
				conditions,
			);
		}
	}

	for (const clutchPlay of results.clutchPlays) {
		// We want text at the beginning, because adding game information is redundant when attached to the box score
		// @ts-ignore
		gameStats.clutchPlays.push(`${clutchPlay.text}.`);
		const indTeam = clutchPlay.tids[0] === results.team[0].id ? 0 : 1;
		const indOther = indTeam === 0 ? 1 : 0;
		const won = indTeam === tw;
		const score = won
			? `${results.team[indTeam].stat.pts}-${results.team[indOther].stat.pts}`
			: `${results.team[indOther].stat.pts}-${results.team[indTeam].stat.pts}`;
		const endPart = allStarGame
			? `${won ? "win" : "loss"} in the All-Star Game`
			: `${won ? "win over" : "loss to"} the ${
					g.get("teamNamesCache")[results.team[indOther].id]
			  }`;
		clutchPlay.text += ` in ${
			results.team[indTeam].stat.pts.toString().charAt(0) === "8" ? "an" : "a"
		} <a href="${helpers.leagueUrl([
			"game_log",
			allStarGame
				? "special"
				: g.get("teamAbbrevsCache")[results.team[indTeam].id],
			g.get("season"),
			results.gid,
		])}">${score}</a> ${endPart}.`;

		if (allStars) {
			// Fix team ID to actual team, not All-Star team
			const entry = allStars.teams[indTeam].find(
				p => p.pid === clutchPlay.pids[0],
			);

			if (entry) {
				clutchPlay.tids = [entry.tid];
				clutchPlay.showNotification = entry.tid === g.get("userTid");
			}
		}

		logEvent(
			{
				type: "playerFeat",
				...clutchPlay,
			},
			conditions,
		);
	}

	if (allStarGame) {
		await allStarMVP(gameStats, allStars, conditions);

		if (allStars) {
			allStars.gid = results.gid;
			allStars.score = [results.team[0].stat.pts, results.team[1].stat.pts];
			allStars.overtimes = results.overtimes;
			await idb.cache.allStars.put(allStars);
		}
	}

	await idb.cache.games.add(gameStats);
};

export default writeGameStats;
