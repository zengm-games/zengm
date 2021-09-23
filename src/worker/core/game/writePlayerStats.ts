import { bySport, isSport, PHASE } from "../../../common";
import { player } from "..";
import { idb } from "../../db";
import { g, helpers, local, lock, logEvent, random } from "../../util";
import type { Conditions, GameResults, Player } from "../../../common/types";
import stats from "../player/stats";
import maxBy from "lodash-es/maxBy";

const gameOrWeek = bySport({ default: "game", football: "week" });

const doInjury = async (
	p: any,
	p2: Player,
	healthRank: number,
	pidsInjuredOneGameOrLess: Set<number>,
	injuryTexts: string[],
	conditions: Conditions,
) => {
	p2.injury = player.injury(healthRank);

	// Is this a reinjury or not?
	let reaggravateExtraDays;
	if (p.injury.playingThrough) {
		if (
			p2.injury.gamesRemaining < p.injury.gamesRemaining ||
			Math.random() < 0.33
		) {
			// Reaggravate previous injury
			reaggravateExtraDays = random.randInt(1, 10);
			p2.injury.gamesRemaining = p.injury.gamesRemaining + reaggravateExtraDays;
			p2.injury.type = p.injury.type;
		}
	}

	// So it gets written to box score... save the old injury (if playing through injury
	if (p.injury.playingThrough) {
		p.injuryAtStart = {
			type: p.injury.type,
			gamesRemaining: p.injury.gamesRemaining,
		};
	}
	p.injury = {
		type: p2.injury.type,
		gamesRemaining: p2.injury.gamesRemaining,
		newThisGame: true,
	};

	if (p2.injury.gamesRemaining <= 1) {
		pidsInjuredOneGameOrLess.add(p2.pid);
	}

	if (!p2.injuries) {
		// Not sure why this is needed, but some users had problems
		p2.injuries = [];
	}
	p2.injuries.push({
		season: g.get("season"),
		games: p2.injury.gamesRemaining,
		type: p2.injury.type,
	});
	let stopPlay = false;
	const injuryText = `${p.pos} <a href="${helpers.leagueUrl([
		"player",
		p2.pid,
	])}">${p2.firstName} ${p2.lastName}</a> - ${p2.injury.type}, ${
		p2.injury.gamesRemaining - 1
	} ${p2.injury.gamesRemaining - 1 === 1 ? gameOrWeek : `${gameOrWeek}s`}`;

	if (g.get("userTid") === p2.tid) {
		if (p2.injury.gamesRemaining > 1) {
			injuryTexts.push(injuryText);
		}

		stopPlay =
			g.get("stopOnInjury") &&
			p2.injury.gamesRemaining > g.get("stopOnInjuryGames") &&
			!local.autoPlayUntil;
	}

	const playoffs = g.get("phase") === PHASE.PLAYOFFS;

	let injuryLength = "short";
	if (p2.injury.gamesRemaining >= bySport({ default: 10, football: 4 })) {
		injuryLength = "medium";
	} else if (
		p2.injury.gamesRemaining >= bySport({ default: 20, football: 8 })
	) {
		injuryLength = "long";
	}

	let score;
	// 0 to 25, where 0 is role player and 25 is star
	let playerQuality = helpers.bound(p2.valueNoPotFuzz - 50, 0, 25);
	if (isSport("football")) {
		playerQuality -= 7;
	}

	if (playerQuality <= 0) {
		if (playoffs && injuryLength !== "short") {
			// Bad player, playoffs, medium/long injury
			score = 10;
		} else {
			// Bad player, regular season or short injury
			score = 0;
		}
	} else {
		if (playoffs) {
			if (playerQuality > 10 || injuryLength === "medium") {
				// Good player or medium injury in playoffs
				score = 20;
			} else {
				// Mediocre player, short injury in playoffs
				score = 10;
			}
		} else {
			if (playerQuality > 10 && injuryLength === "long") {
				// Good player, long injury
				score = 20;
			} else if (playerQuality > 10 || injuryLength === "medium") {
				// Good player or medium injury
				score = 10;
			} else {
				// Mediocre player, short injury
				score = 0;
			}
		}
	}

	if (p2.injury.gamesRemaining === 1) {
		// Never really care about single game injuries much
		score = 0;
	}

	p2.injury.score = score;

	logEvent(
		{
			type: "injured",
			text: `${p.pos} <a href="${helpers.leagueUrl(["player", p2.pid])}">${
				p2.firstName
			} ${p2.lastName}</a> ${
				reaggravateExtraDays === undefined
					? "was injured"
					: "reaggravated his injury"
			}! (${p2.injury.type}, out for ${p2.injury.gamesRemaining} ${
				p2.injury.gamesRemaining === 1 ? gameOrWeek : `${gameOrWeek}s`
			})`,
			showNotification: false,
			pids: [p2.pid],
			tids: [p2.tid],
			score,
		},
		conditions,
	);

	// Some chance of a loss of athleticism from serious injuries
	// 100 game injury: 67% chance of losing between 0 and 10 of spd, jmp, endu
	// 50 game injury: 33% chance of losing between 0 and 5 of spd, jmp, endu

	let ratingsLoss = false;
	const gamesRemainingNormalized = bySport({
		football: p2.injury.gamesRemaining * 3,
		default: p2.injury.gamesRemaining,
	});

	if (
		gamesRemainingNormalized > 25 &&
		Math.random() < gamesRemainingNormalized / 82 &&
		!p2.ratings.at(-1).locked
	) {
		ratingsLoss = true;
		let biggestRatingsLoss = 20;

		// Small chance of horrible things
		if (biggestRatingsLoss === 10 && Math.random() < 0.01) {
			biggestRatingsLoss = 50;
		}

		player.addRatingsRow(p2, undefined, p2.injuries.length - 1);
		const r = p2.ratings.length - 1;

		// New ratings row
		p2.ratings[r].spd = player.limitRating(
			p2.ratings[r].spd - random.randInt(1, biggestRatingsLoss),
		);
		p2.ratings[r].endu = player.limitRating(
			p2.ratings[r].endu - random.randInt(1, biggestRatingsLoss),
		);
		const rating = bySport({
			basketball: "jmp",
			football: "thp",
			hockey: undefined,
		});
		if (rating) {
			p2.ratings[r][rating] = player.limitRating(
				p2.ratings[r][rating] - random.randInt(1, biggestRatingsLoss),
			);
		}

		// Update ovr and pot
		await player.develop(p2, 0);

		const r2 = p2.ratings.length - 2; // Prev ratings row

		// Bound pot - can't go up after injury!
		if (p2.ratings[r].pot > p2.ratings[r2].pot) {
			p2.ratings[r].pot = p2.ratings[r2].pot;
		}

		if (p2.ratings[r].pots) {
			for (const pos of Object.keys(p2.ratings[r].pots)) {
				if (p2.ratings[r].pots[pos] > p2.ratings[r2].pots[pos]) {
					p2.ratings[r].pots[pos] = p2.ratings[r2].pots[pos];
				}
			}
		}

		p2.injuries.at(-1).ovrDrop = p2.ratings[r2].ovr - p2.ratings[r].ovr;
		p2.injuries.at(-1).potDrop = p2.ratings[r2].pot - p2.ratings[r].pot;
	}

	return {
		ratingsLoss,
		stopPlay,
	};
};

const writePlayerStats = async (
	results: GameResults[],
	conditions: Conditions,
) => {
	const injuryTexts: string[] = [];
	const pidsInjuredOneGameOrLess = new Set<number>();
	let stopPlay = false;

	const playoffs = g.get("phase") === PHASE.PLAYOFFS;

	for (const result of results) {
		const allStarGame = result.team[0].id === -1 && result.team[1].id === -2;

		const winningTeam =
			result.team[0].stat.pts > result.team[1].stat.pts
				? 0
				: result.team[0].stat.pts < result.team[1].stat.pts
				? 1
				: undefined;

		const qbgResults = new Map<number, "W" | "L" | "OTL" | "T">();
		if (isSport("football") || isSport("hockey")) {
			const otl = result.overtimes > 0 && g.get("otl", "current");

			for (let i = 0; i < result.team.length; i++) {
				let maxStat = 0;
				let id;

				const stat = isSport("football") ? "pss" : "sv";

				for (const p of result.team[i].player) {
					if (p.stat[stat] > maxStat) {
						id = p.id;
						maxStat = p.stat[stat];
					}
				}

				if (id !== undefined) {
					let qbgResult: "W" | "L" | "OTL" | "T";
					if (winningTeam === undefined) {
						qbgResult = "T";
					} else if (winningTeam === i) {
						qbgResult = "W";
					} else if (otl) {
						qbgResult = "OTL";
					} else {
						qbgResult = "L";
					}

					qbgResults.set(id, qbgResult);
				}
			}
		}

		for (let i = 0; i < result.team.length; i++) {
			const t = result.team[i];
			let goaliePID: number | undefined;

			// This needs to be before checkStatisticalFeat
			if (isSport("hockey")) {
				const goalies = t.player.filter((p: any) => p.stat.gpGoalie === 1);

				// As in NHL, shutout only is credited if a single goalie plays the whole game
				if (goalies.length === 1 && goalies[0].stat.ga === 0) {
					goalies[0].stat.so = 1;
				}

				// Goalie who played the most minutes counts towards numConsecutiveGamesG, the rest get reset. Would be nice to have this use the same criteria as qbgResults, but 99.99% of the time they'll be the same.
				const goalie = maxBy(goalies, (p: any) => p.stat.min);
				if (goalie) {
					goaliePID = goalie.id;
				}

				// Check for gwG/gwA - can only be done by looking at complete scoring log for the game, since we're looking for the goal that is one more than what the losing team had in the game
				if (winningTeam === i) {
					const j = i === 0 ? 1 : 0;
					const winningGoalScore = result.team[j].stat.pts + 1;
					let currentScore = 0;
					for (const event of result.scoringSummary) {
						if (event.type === "goal" && event.t === i) {
							currentScore += 1;
							if (currentScore === winningGoalScore) {
								const scorer = t.player.find(
									(p: any) => p.id === event.pids[0],
								);
								scorer.stat.gwG += 1;

								const assisterPIDs = event.pids.slice(1);
								const assisters = t.player.filter((p: any) =>
									assisterPIDs.includes(p.id),
								);
								for (const assister of assisters) {
									assister.stat.gwA += 1;
								}
							}
						}
					}
				}
			}

			for (const p of t.player) {
				// Only need to write stats if player got minutes, except for minAvailable in BBGM
				const updatePlayer =
					(isSport("hockey") && p.pos === "G") ||
					isSport("basketball") ||
					p.stat.min > 0;
				if (!updatePlayer) {
					continue;
				}

				// In theory this could be used by checkStatisticalFeat, but wouldn't really make sense because that scales the cutoff by game length
				if (isSport("basketball")) {
					let numDoubles = 0;
					let numFives = 0;
					const doubleStats = ["pts", "ast", "stl", "blk", "trb"];
					for (const stat of doubleStats) {
						const value =
							stat === "trb" ? p.stat.orb + p.stat.drb : p.stat[stat];
						if (value >= 5) {
							numFives += 1;
							if (value >= 10) {
								numDoubles += 1;
							}
						}
					}

					if (numDoubles >= 2) {
						p.stat.dd = 1;
						t.stat.dd += 1;
						if (numDoubles >= 3) {
							p.stat.td = 1;
							t.stat.td += 1;
							if (numDoubles >= 4) {
								p.stat.qd = 1;
								t.stat.qd += 1;
							}
						}
					}
					if (numFives >= 5) {
						p.stat.fxf = 1;
						t.stat.fxf += 1;
					}
				}

				player.checkStatisticalFeat(p.id, t.id, p, result, conditions);

				const p2 = await idb.cache.players.get(p.id);
				if (!p2) {
					throw new Error("Invalid pid");
				}

				if (isSport("hockey")) {
					if (p2.pid === goaliePID) {
						if (p2.numConsecutiveGamesG === undefined) {
							p2.numConsecutiveGamesG = 0;
						}
						p2.numConsecutiveGamesG += 1;
					} else if (p2.numConsecutiveGamesG !== undefined) {
						p2.numConsecutiveGamesG = 0;
					}
				}

				if (!allStarGame) {
					let ps = p2.stats.at(-1);

					// This should never happen, but sometimes does
					if (
						!ps ||
						ps.tid !== t.id ||
						ps.playoffs !== playoffs ||
						ps.season !== g.get("season")
					) {
						await player.addStatsRow(p2, playoffs);
						ps = p2.stats.at(-1);
					}

					// Update stats
					if (p.stat.min > 0) {
						for (const key of Object.keys(p.stat)) {
							if (ps[key] === undefined) {
								ps[key] = 0;
							}

							if (isSport("football") && key.endsWith("Lng")) {
								if (p.stat[key] > ps[key]) {
									ps[key] = p.stat[key];
								}
							} else {
								ps[key] += p.stat[key];
							}
						}

						ps.gp += 1;

						if (isSport("football") || isSport("hockey")) {
							const result = qbgResults.get(p.id);
							if (result) {
								const key = isSport("football") ? `qb${result}` : `g${result}`;
								if (ps[key] === undefined) {
									ps[key] = 0;
								}
								ps[key] += 1;
							}
						}

						for (const key of stats.max) {
							const stat = key.replace("Max", "");

							let value;
							if (isSport("basketball") && stat === "2p") {
								value = p.stat.fg - p.stat.tp;
							} else if (isSport("basketball") && stat === "2pa") {
								value = p.stat.fga - p.stat.tpa;
							} else if (isSport("basketball") && stat === "trb") {
								value = p.stat.drb + p.stat.orb;
							} else if (isSport("basketball") && stat === "gmsc") {
								value = helpers.gameScore(p.stat);
							} else if (isSport("hockey") && stat === "g") {
								value = p.stat.evG + p.stat.ppG + p.stat.shG;
							} else if (isSport("hockey") && stat === "a") {
								value = p.stat.evA + p.stat.ppA + p.stat.shA;
							} else {
								value = p.stat[stat];
							}

							if (value !== undefined) {
								// !ps[key] is for upgraded leagues
								if (!ps[key] || value > ps[key][0]) {
									ps[key] = [value, result.gid];
								}
							}
						}
					}

					if (
						ps.minAvailable !== undefined &&
						!p.injured &&
						p.injury.gamesRemaining === 0
					) {
						ps.minAvailable += t.stat.min / 5;
					}
				}

				const injuredThisGame = p.newInjury;

				let ratingsLoss = false;

				if (injuredThisGame) {
					const output = await doInjury(
						p,
						p2,
						t.healthRank,
						pidsInjuredOneGameOrLess,
						injuryTexts,
						conditions,
					);
					ratingsLoss = output.ratingsLoss;

					if (output.stopPlay && !stopPlay) {
						await lock.set("stopGameSim", true);
						stopPlay = true;
					}
				}

				// Player value depends on ratings and regular season stats, neither of which can change in the playoffs (except for severe injuries)
				if (
					p.stat.min > 0 &&
					(g.get("phase") !== PHASE.PLAYOFFS || ratingsLoss)
				) {
					await player.updateValues(p2);
				}

				await idb.cache.players.put(p2);
			}
		}
	}

	return {
		injuryTexts,
		pidsInjuredOneGameOrLess,
		stopPlay,
	};
};

export default writePlayerStats;
