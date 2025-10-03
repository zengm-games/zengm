import {
	getBestPlayerBoxScore,
	isSport,
	PHASE,
} from "../../../common/index.ts";
import { saveAwardsByPlayer } from "../season/awards.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import type {
	Conditions,
	Game,
	GameResults,
	LocalStateUI,
	LogEventType,
	PlayoffSeries,
} from "../../../common/types.ts";
import { headToHead, season } from "../index.ts";
import getWinner from "../../../common/getWinner.ts";
import formatScoreWithShootout from "../../../common/formatScoreWithShootout.ts";

const allStarMVP = async (
	game: Game,
	allStars: any,
	conditions: Conditions,
) => {
	let mvp;

	// Why special case for basketball? No real reason, but it was there before the other sports and seems to work better than getBestPlayer because efficiency gets factored into gmSc.
	if (isSport("basketball")) {
		let maxScore = -Infinity;

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
	} else {
		for (const t of game.teams) {
			if (game.won.tid === t.tid) {
				const output = getBestPlayerBoxScore(t.players);
				if (output) {
					mvp = output.p;
				}
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
		g.get("season"),
		true,
		game.gid,
	);
};

export const findSeries = (
	playoffSeries: PlayoffSeries,
	tid0: number,
	tid1: number,
) => {
	const isValidSeries = (s: (typeof playoffSeries.series)[number][number]) => {
		// Here and below, can't assume series and game have same home/away, because for series "home" means home court advantage in series, but for game it means this individual game.
		if (s.home.tid === tid0 && s.away?.tid === tid1) {
			return true;
		}
		if (s.home.tid === tid1 && s.away?.tid === tid0) {
			return true;
		}

		return false;
	};

	if (playoffSeries.currentRound === -1 && playoffSeries.playIns) {
		// Play-in tournament
		for (const playIn of playoffSeries.playIns) {
			const series = playIn.find(isValidSeries);
			if (series) {
				return series;
			}
		}
	} else {
		// Regular playoffs
		const roundSeries = playoffSeries.series[playoffSeries.currentRound]!;
		return roundSeries.find(isValidSeries);
	}
};

const getPlayoffInfos = async (game: Game) => {
	if (g.get("phase") !== PHASE.PLAYOFFS) {
		return {};
	}

	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (!playoffSeries) {
		return {};
	}

	const series = findSeries(
		playoffSeries,
		game.teams[0].tid,
		game.teams[1].tid,
	);

	if (!series || !series.away) {
		return {};
	}

	const first =
		series.home.tid === game.teams[0].tid ? series.home : series.away;
	const second =
		series.home.tid === game.teams[0].tid ? series.away : series.home;

	const winner = getWinner(game.teams);
	const firstWon = winner === 0 ? 1 : 0;
	const secondWon = winner === 1 ? 1 : 0;

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

	const numGamesToWinSeries =
		playoffSeries.currentRound === -1
			? 1
			: helpers.numGamesToWinSeries(
					g.get("numGamesPlayoffSeries", "current")[playoffSeries.currentRound],
				);

	return {
		currentRound: playoffSeries.currentRound,
		numGamesToWinSeries,
		playoffInfos,
	};
};

export const gameSimToBoxScore = async (results: GameResults, att: number) => {
	const gameStats: Game = {
		gid: results.gid,
		day: results.day,
		att,
		clutchPlays: [],
		numPlayersOnCourt: results.numPlayersOnCourt,
		season: g.get("season"),
		numPeriods: g.get("numPeriods"),
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
				otl: results.team[0].otl,
				players: [],
				pts: 0, // Will be filled in as a team stat later
			},
			{
				tid: results.team[1].id,
				ovr: results.team[1].ovr,
				won: results.team[1].won,
				lost: results.team[1].lost,
				tied: results.team[1].tied,
				otl: results.team[1].otl,
				players: [],
				pts: 0, // Will be filled in as a team stat later
			},
		],
	};
	if (results.forceWin !== undefined) {
		gameStats.forceWin = results.forceWin;
	}
	if (results.neutralSite) {
		gameStats.neutralSite = true;
	}
	const playoffs = g.get("phase") === PHASE.PLAYOFFS;
	if (playoffs) {
		gameStats.playoffs = true;
	}

	const allStarGame = results.team[0].id === -1 && results.team[1].id === -2;
	let allStars;

	if (allStarGame) {
		allStars = await idb.cache.allStars.get(g.get("season"));
	}

	for (const t of [0, 1] as const) {
		for (const key of Object.keys(results.team[t].stat)) {
			(gameStats.teams[t] as any)[key] = results.team[t].stat[key];
		}

		if (results.team[t].playerFeat) {
			gameStats.teams[t].playerFeat = true;
		}

		for (const p0 of results.team[t].player) {
			// In basketball, players who didn't play are shown in box score. In other sports, they aren't. So only save box score stats for players who actually played
			if (!isSport("basketball")) {
				if (p0.stat.gp === 0) {
					continue;
				}
			}

			const p: Record<string, any> = {};

			for (const key of Object.keys(p0.stat)) {
				p[key] = p0.stat[key];
			}

			p.name = p0.name;
			p.pos = p0.pos;
			p.pid = p0.id;
			p.skills = helpers.deepCopy(p0.skills);
			p.injury = {
				type: p0.injury.type,
				gamesRemaining: p0.injury.gamesRemaining,
			};
			if (p0.injury.newThisGame) {
				p.injury.newThisGame = true;
			}
			if (p0.injury.playingThrough) {
				p.injury.playingThrough = true;
			}
			if (p0.injuryAtStart) {
				p.injuryAtStart = p0.injuryAtStart;
			}
			p.jerseyNumber = p0.jerseyNumber;

			if (isSport("baseball")) {
				p.seasonStats = p0.seasonStats;

				// These are either integers or undefined
				const baseballMaybeKeys = ["battingOrder", "subIndex"];
				for (const key of baseballMaybeKeys) {
					const value = p0[key];
					if (value !== undefined) {
						p[key] = value;
					}
				}
			}

			gameStats.teams[t].players.push(p);
		}
	}

	// Store some extra junk to make box scores easy
	const otl = gameStats.overtimes > 0 && g.get("otl", "current");
	const winner = getWinner([results.team[0].stat, results.team[1].stat]);
	const [tw, tl] = winner === 0 ? ([0, 1] as const) : ([1, 0] as const);
	gameStats.won.tid = results.team[tw].id;
	gameStats.lost.tid = results.team[tl].id;
	gameStats.won.pts = results.team[tw].stat.pts;
	gameStats.lost.pts = results.team[tl].stat.pts;
	gameStats.won.sPts = results.team[tw].stat.sPts;
	gameStats.lost.sPts = results.team[tl].stat.sPts;
	const tied = winner === -1;

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
			if (otl) {
				(gameStats.teams[tl] as any).otl += 1;
			} else {
				(gameStats.teams[tl] as any).lost += 1;
			}
		}
	}

	const { currentRound, numGamesToWinSeries, playoffInfos } =
		await getPlayoffInfos(gameStats);
	if (playoffInfos) {
		gameStats.teams[0].playoffs = playoffInfos[0];
		gameStats.teams[1].playoffs = playoffInfos[1];
		gameStats.numGamesToWinSeries = numGamesToWinSeries;
	}

	// We want text at the beginning, because adding game information is redundant when attached to the box score. Later notify about events
	for (const clutchPlay of results.clutchPlays) {
		// @ts-expect-error
		gameStats.clutchPlays.push(`${clutchPlay.text}.`);
	}

	return {
		allStarGame,
		allStars,
		currentRound,
		gameStats,
		numGamesToWinSeries,
		playoffInfos,
		playoffs,
		tied,
		tl,
		tw,
	};
};

const writeGameStats = async (
	results: GameResults,
	att: number,
	conditions: Conditions,
) => {
	const {
		allStarGame,
		allStars,
		currentRound,
		gameStats,
		numGamesToWinSeries,
		playoffInfos,
		playoffs,
		tied,
		tl,
		tw,
	} = await gameSimToBoxScore(results, att);

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
		])}">${formatScoreWithShootout(results.team[tw].stat, results.team[tl].stat)}</a>.`;

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
			])}">${formatScoreWithShootout(results.team[tw].stat, results.team[tl].stat)} in the All-Star Game</a>.`;
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
	const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));
	if (
		numGamesToWinSeries !== undefined &&
		currentRound !== undefined &&
		currentRound >= numPlayoffRounds - 2 &&
		currentRound >= 0 &&
		playoffInfos
	) {
		const finals = currentRound >= numPlayoffRounds - 1;
		if (finals) {
			gameStats.finals = true;
		}

		const round = helpers.playoffRoundName({
			currentRound,
			numPlayoffRounds,
			playoffsByConf,
			season: g.get("season"),
		}).name;
		let score = currentRound === numPlayoffRounds - 1 ? 20 : 10;
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
		])}">${formatScoreWithShootout(results.team[tw].stat, results.team[tl].stat)}</a> in${gameNumText} the ${round}${leadText}.`;

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

	let gameToUi: LocalStateUI["games"][number] | undefined;
	if (
		results.team[0].id === g.get("userTid") ||
		results.team[1].id === g.get("userTid") ||
		allStarGame
	) {
		gameToUi = {
			forceWin: results.forceWin,
			gid: results.gid,
			overtimes: results.overtimes,
			numPeriods: g.get("numPeriods"),
			teams: [
				{
					ovr: results.team[0].ovr,
					pts: results.team[0].stat.pts,
					sPts: results.team[0].stat.sPts,
					tid: results.team[0].id,
					playoffs: gameStats.teams[0].playoffs,
				},
				{
					ovr: results.team[1].ovr,
					pts: results.team[1].stat.pts,
					sPts: results.team[1].stat.sPts,
					tid: results.team[1].id,
					playoffs: gameStats.teams[1].playoffs,
				},
			],
		};
	}

	for (const clutchPlay of results.clutchPlays) {
		const indTeam = clutchPlay.tids[0] === results.team[0].id ? 0 : 1;
		const indOther = indTeam === 0 ? 1 : 0;
		const won = indTeam === tw;
		const score = won
			? formatScoreWithShootout(
					results.team[indTeam].stat,
					results.team[indOther].stat,
				)
			: formatScoreWithShootout(
					results.team[indOther].stat,
					results.team[indTeam].stat,
				);

		let endPart = "";
		if (allStarGame) {
			endPart = `${tied ? "tie" : won ? "win" : "loss"} in the All-Star Game`;
		} else {
			endPart = `${tied ? "tie with" : won ? "win over" : "loss to"} the ${
				g.get("teamInfoCache")[results.team[indOther].id]?.name
			}`;

			if (currentRound !== undefined && playoffInfos) {
				const round = helpers.playoffRoundName({
					currentRound,
					numPlayoffRounds,
					playoffsByConf,
					season: g.get("season"),
				}).name;

				const gameNum = playoffInfos[0].won + playoffInfos[0].lost;
				const numGamesThisRound =
					currentRound === -1
						? 1
						: g.get("numGamesPlayoffSeries", "current")[currentRound]!;

				if (numGamesThisRound > 1) {
					const numGamesToWinSeries =
						helpers.numGamesToWinSeries(numGamesThisRound);
					if (playoffInfos[indTeam].won === numGamesToWinSeries) {
						endPart += `, winning the ${round}${
							numGamesToWinSeries > 1
								? ` ${playoffInfos[indTeam].won}-${playoffInfos[indTeam].lost}`
								: ""
						}`;
					} else if (playoffInfos[indTeam].lost === numGamesToWinSeries) {
						endPart += `, losing the ${round}${
							numGamesToWinSeries > 1
								? ` ${playoffInfos[indTeam].lost}-${playoffInfos[indTeam].won}`
								: ""
						}`;
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
				(p) => p.pid === clutchPlay.pids[0],
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
			if (results.team[0].stat.sPts !== undefined) {
				allStars.sPts = [results.team[0].stat.sPts, results.team[0].stat.sPts];
			}
			allStars.overtimes = results.overtimes;
			await idb.cache.allStars.put(allStars);
		}
	}

	let seriesWinner: number | undefined;
	if (playoffInfos && playoffInfos[tw].won === numGamesToWinSeries) {
		seriesWinner = gameStats.won.tid;
	}
	await headToHead.addGame({
		tids: [gameStats.won.tid, gameStats.lost.tid],
		pts: [gameStats.won.pts, gameStats.lost.pts],
		sPts:
			gameStats.won.sPts === undefined
				? undefined
				: [gameStats.won.sPts, gameStats.lost.sPts!],
		overtime: gameStats.overtimes > 0,
		playoffRound: currentRound,
		seriesWinner,
	});

	await idb.cache.games.put(gameStats);

	return gameToUi;
};

export default writeGameStats;
