import { PHASE } from "../../../common";
import { saveAwardsByPlayer } from "../season/awards";
import { idb } from "../../db";
import { g, helpers, logEvent, toUI } from "../../util";
import type {
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
			g.get("teamInfoCache")[p.tid]?.abbrev,
			g.get("season"),
		])}">${
			g.get("teamInfoCache")[p.tid]?.abbrev
		}</a>) won the All-Star MVP award.`,
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

const getPlayoffInfos = async (game: Game) => {
	if (g.get("phase") !== PHASE.PLAYOFFS) {
		return {};
	}

	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	const roundSeries = playoffSeries
		? playoffSeries.series[playoffSeries.currentRound]
		: undefined;

	if (!roundSeries) {
		return {};
	}

	const series = roundSeries.find(s => {
		if (!s.away) {
			return false;
		}

		// Here and below, can't assume series and game have same home/away, because for series "home" means home court advantage in series, but for game it means this individual game.
		if (s.home.tid === game.teams[0].tid && s.away.tid === game.teams[1].tid) {
			return true;
		}
		if (s.home.tid === game.teams[1].tid && s.away.tid === game.teams[0].tid) {
			return true;
		}

		return false;
	});

	if (!series || !series.away) {
		return {};
	}

	const first =
		series.home.tid === game.teams[0].tid ? series.home : series.away;
	const second =
		series.home.tid === game.teams[0].tid ? series.away : series.home;

	const firstWon = game.teams[0].pts > game.teams[1].pts ? 1 : 0;
	const secondWon = game.teams[1].pts > game.teams[0].pts ? 1 : 0;

	const playoffInfos = [
		{
			seed: first.seed,
			won: first.won + firstWon,
			lost: second.won + secondWon,
		},
		{
			seed: second.seed,
			won: second.won + secondWon,
			lost: first.won + firstWon,
		},
	] as const;

	const numGamesToWinSeries = playoffSeries
		? helpers.numGamesToWinSeries(
				g.get("numGamesPlayoffSeries", "current")[playoffSeries.currentRound],
		  )
		: undefined;

	return {
		currentRound: playoffSeries ? playoffSeries.currentRound : undefined,
		numGamesToWinSeries,
		playoffInfos,
	};
};

const writeGameStats = async (
	results: GameResults,
	att: number,
	conditions: Conditions,
) => {
	const playoffs = g.get("phase") === PHASE.PLAYOFFS;

	const gameStats: Game = {
		gid: results.gid,
		att,
		clutchPlays: [],
		numPlayersOnCourt: results.numPlayersOnCourt,
		season: g.get("season"),
		playoffs,
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
		teams: [
			{
				tid: results.team[0].id,
				ovr: results.team[0].ovr,
				won: results.team[0].won,
				lost: results.team[0].lost,
				tied: results.team[0].tied,
				players: [],
			},
			{
				tid: results.team[1].id,
				ovr: results.team[1].ovr,
				won: results.team[1].won,
				lost: results.team[1].lost,
				tied: results.team[1].tied,
				players: [],
			},
		],
	};
	if (results.forceWin !== undefined) {
		gameStats.forceWin = results.forceWin;
	}

	const allStarGame = results.team[0].id === -1 && results.team[1].id === -2;
	let allStars;

	if (allStarGame) {
		allStars = await idb.cache.allStars.get(g.get("season"));
	}

	for (let t = 0; t < 2; t++) {
		for (const key of Object.keys(results.team[t].stat)) {
			(gameStats.teams[t] as any)[key] = results.team[t].stat[key];
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
			gameStats.teams[t].players[p].jerseyNumber =
				results.team[t].player[p].jerseyNumber;
		}
	}

	// Store some extra junk to make box scores easy
	const [tw, tl] =
		results.team[0].stat.pts > results.team[1].stat.pts ? [0, 1] : [1, 0];
	gameStats.won.tid = results.team[tw].id;
	gameStats.lost.tid = results.team[tl].id;
	gameStats.won.pts = results.team[tw].stat.pts;
	gameStats.lost.pts = results.team[tl].stat.pts;
	const tied = results.team[0].stat.pts === results.team[1].stat.pts;

	if (g.get("phase") < PHASE.PLAYOFFS) {
		if (
			tied &&
			gameStats.teams[0].tied !== undefined &&
			gameStats.teams[1].tied !== undefined
		) {
			gameStats.teams[0].tied += 1;
			gameStats.teams[1].tied += 1;
		} else {
			(gameStats.teams[tw] as any).won += 1;
			(gameStats.teams[tl] as any).lost += 1;
		}
	}

	const {
		currentRound,
		numGamesToWinSeries,
		playoffInfos,
	} = await getPlayoffInfos(gameStats);
	if (playoffInfos) {
		gameStats.teams[0].playoffs = playoffInfos[0];
		gameStats.teams[1].playoffs = playoffInfos[1];
		gameStats.numGamesToWinSeries = numGamesToWinSeries;
	}

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
				[
					"roster",
					`${g.get("teamInfoCache")[otherTid]?.abbrev}_${otherTid}`,
					g.get("season"),
				],
			)}">${g.get("teamInfoCache")[otherTid]?.name}`;
		} else if (results.team[tw].id === g.get("userTid")) {
			text = `<span style="color: green; font-weight: bold; padding-right: 3px">W</span> Your team defeated the <a href="${helpers.leagueUrl(
				[
					"roster",
					`${g.get("teamInfoCache")[results.team[tl].id]?.abbrev}_${
						results.team[tl].id
					}`,
					g.get("season"),
				],
			)}">${g.get("teamInfoCache")[results.team[tl].id]?.name}`;
		} else {
			text = `<span style="color: red; font-weight: bold; padding-right: 8px">L</span> Your team lost to the <a href="${helpers.leagueUrl(
				[
					"roster",
					`${g.get("teamInfoCache")[results.team[tw].id]?.abbrev}_${
						results.team[tw].id
					}`,
					g.get("season"),
				],
			)}">${g.get("teamInfoCache")[results.team[tw].id]?.name}`;
		}

		text += `</a> <a href="${helpers.leagueUrl([
			"game_log",
			`${g.get("teamInfoCache")[g.get("userTid")]?.abbrev}_${g.get("userTid")}`,
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

	// Save finals and semifinals, for news feed
	const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;
	const playoffsByConference = g.get("confs", "current").length === 2;
	if (
		numGamesToWinSeries !== undefined &&
		currentRound !== undefined &&
		currentRound >= numPlayoffRounds - 2 &&
		playoffInfos
	) {
		const round =
			currentRound >= numPlayoffRounds - 1
				? "finals"
				: playoffsByConference
				? "conference finals"
				: "semifinals";
		let score = round === "finals" ? 20 : 10;
		const gameNum = playoffInfos[0].won + playoffInfos[0].lost;
		const gameNumText = numGamesToWinSeries > 1 ? ` game ${gameNum} of` : "";
		let leadText = "";
		if (numGamesToWinSeries > 1) {
			if (playoffInfos[tw].won === playoffInfos[tw].lost) {
				leadText = `, evening the series at ${playoffInfos[tw].won}-${playoffInfos[tw].lost}`;
			} else if (playoffInfos[tw].won === numGamesToWinSeries) {
				leadText = `, winning the series ${playoffInfos[tw].won}-${playoffInfos[tw].lost}`;
				score = 20; // For winning semifinals
			} else if (playoffInfos[tw].won === playoffInfos[tw].lost + 1) {
				leadText = `, taking a ${playoffInfos[tw].won}-${playoffInfos[tw].lost} series lead`;
			} else if (playoffInfos[tw].won > playoffInfos[tw].lost) {
				leadText = `, extending their ${playoffInfos[tw].won}-${playoffInfos[tw].lost} series lead`;
			} else {
				leadText = `, closing their ${playoffInfos[tw].won}-${playoffInfos[tw].lost} series deficit`;
			}
		}

		const text = `The <a href="${helpers.leagueUrl([
			"roster",
			`${g.get("teamInfoCache")[results.team[tw].id]?.abbrev}_${
				results.team[tw].id
			}`,
			g.get("season"),
		])}">${
			g.get("teamInfoCache")[results.team[tw].id]?.name
		}</a> defeated the <a href="${helpers.leagueUrl([
			"roster",
			`${g.get("teamInfoCache")[results.team[tl].id]?.abbrev}_${
				results.team[tl].id
			}`,
			g.get("season"),
		])}">${
			g.get("teamInfoCache")[results.team[tl].id]?.name
		}</a> <a href="${helpers.leagueUrl([
			"game_log",
			`${g.get("teamInfoCache")[g.get("userTid")]?.abbrev}_${g.get("userTid")}`,
			g.get("season"),
			results.gid,
		])}">${results.team[tw].stat.pts}-${
			results.team[tl].stat.pts
		}</a> in${gameNumText} the ${round}${leadText}.`;

		// Await needed so this happens before the updatePlayoffSeries event
		await logEvent(
			{
				type: "playoffs",
				text,
				tids: [results.team[tw].id, results.team[tl].id],
				showNotification: false,
				score,
			},
			conditions,
		);
	}

	if (
		results.team[0].id === g.get("userTid") ||
		results.team[1].id === g.get("userTid") ||
		allStarGame
	) {
		await toUI("mergeGames", [
			[
				{
					forceWin: results.forceWin,
					gid: results.gid,
					teams: [
						{
							ovr: results.team[0].ovr,
							pts: results.team[0].stat.pts,
							tid: results.team[0].id,
							playoffs: gameStats.teams[0].playoffs,
						},
						{
							ovr: results.team[1].ovr,
							pts: results.team[1].stat.pts,
							tid: results.team[1].id,
							playoffs: gameStats.teams[1].playoffs,
						},
					],
				},
			],
		]);
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

		let endPart = "";
		if (allStarGame) {
			endPart = `${tied ? "tie" : won ? "win" : "loss"} in the All-Star Game`;
		} else {
			endPart = `${tied ? "tie with" : won ? "win over" : "loss to"} the ${
				g.get("teamInfoCache")[results.team[indOther].id]?.name
			}`;

			if (currentRound !== undefined && playoffInfos) {
				const round =
					currentRound >= numPlayoffRounds - 1
						? "finals"
						: currentRound >= numPlayoffRounds - 2
						? playoffsByConference
							? "conference finals"
							: "semifinals"
						: `${helpers.ordinal(currentRound + 1)} round of the playoffs`;

				const gameNum = playoffInfos[0].won + playoffInfos[0].lost;
				const numGamesThisRound = g.get("numGamesPlayoffSeries", "current")[
					currentRound
				];

				if (numGamesThisRound > 1) {
					const numGamesToWinSeries = helpers.numGamesToWinSeries(
						numGamesThisRound,
					);
					if (playoffInfos[indTeam].won === numGamesToWinSeries) {
						endPart += `, winning the ${round} ${playoffInfos[indTeam].won}-${playoffInfos[indTeam].lost}`;
					} else if (playoffInfos[indTeam].lost === numGamesToWinSeries) {
						endPart += `, losing the ${round} ${playoffInfos[indTeam].lost}-${playoffInfos[indTeam].won}`;
					} else {
						endPart += ` during game ${gameNum} of the ${round}`;
					}
				} else {
					endPart += ` in the ${round}`;
				}
			}
		}

		clutchPlay.text += ` in ${
			results.team[indTeam].stat.pts.toString().charAt(0) === "8" ? "an" : "a"
		} <a href="${helpers.leagueUrl([
			"game_log",
			allStarGame
				? "special"
				: `${g.get("teamInfoCache")[results.team[indTeam].id]?.abbrev}_${
						results.team[indTeam].id
				  }`,
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

		const eventScore = won ? (playoffs ? 20 : 10) : 0;

		logEvent(
			{
				type: "playerFeat",
				...clutchPlay,
				score: eventScore,
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
