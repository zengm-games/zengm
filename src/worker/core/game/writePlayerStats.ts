import { PHASE } from "../../../common";
import { player } from "..";
import { idb } from "../../db";
import { g, helpers, local, lock, logEvent, random } from "../../util";
import type { Conditions, GameResults, Player } from "../../../common/types";
import stats from "../player/stats";

const gameOrWeek = process.env.SPORT === "basketball" ? "game" : "week";

const doInjury = async (
	p: any,
	p2: Player,
	healthRank: number,
	pidsInjuredOneGameOrLess: Set<number>,
	injuryTexts: string[],
	conditions: Conditions,
) => {
	p2.injury = player.injury(healthRank);
	p.injury = helpers.deepCopy(p2.injury); // So it gets written to box score

	if (p2.injury.gamesRemaining <= 1) {
		pidsInjuredOneGameOrLess.add(p2.pid);
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
	if (
		p2.injury.gamesRemaining >= (process.env.SPORT === "basketball" ? 10 : 4)
	) {
		injuryLength = "medium";
	} else if (
		p2.injury.gamesRemaining >= (process.env.SPORT === "basketball" ? 20 : 8)
	) {
		injuryLength = "long";
	}

	let score;
	// 0 to 25, where 0 is role player and 25 is star
	let playerQuality = helpers.bound(p2.valueNoPotFuzz - 50, 0, 25);
	if (process.env.SPORT === "football") {
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
			} ${p2.lastName}</a> was injured! (${p2.injury.type}, out for ${
				p2.injury.gamesRemaining
			} ${p2.injury.gamesRemaining === 1 ? gameOrWeek : `${gameOrWeek}s`})`,
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
	const gamesRemainingNormalized =
		process.env.SPORT === "basketball"
			? p2.injury.gamesRemaining
			: p2.injury.gamesRemaining * 3;

	if (
		gamesRemainingNormalized > 25 &&
		Math.random() < gamesRemainingNormalized / 82 &&
		!p2.ratings[p2.ratings.length - 1].locked
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
		p2.ratings[r].spd = helpers.bound(
			p2.ratings[r].spd - random.randInt(1, biggestRatingsLoss),
			1,
			100,
		);
		p2.ratings[r].endu = helpers.bound(
			p2.ratings[r].endu - random.randInt(1, biggestRatingsLoss),
			1,
			100,
		);
		const rating = process.env.SPORT === "basketball" ? "jmp" : "thp";
		p2.ratings[r][rating] = helpers.bound(
			p2.ratings[r][rating] - random.randInt(1, biggestRatingsLoss),
			1,
			100,
		);

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

		p2.injuries[p2.injuries.length - 1].ovrDrop =
			p2.ratings[r2].ovr - p2.ratings[r].ovr;
		p2.injuries[p2.injuries.length - 1].potDrop =
			p2.ratings[r2].pot - p2.ratings[r].pot;
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
		const allStarGame = result.team[0].id === -1 && result.team[1].id === -2; // Find QBs, for qbW, qbL, qbT

		const qbResults = new Map<number, "qbW" | "qbL" | "qbT">();

		if (process.env.SPORT === "football") {
			for (let i = 0; i < result.team.length; i++) {
				let maxPss = 0;
				let id;

				for (const p of result.team[i].player) {
					if (p.stat.pss > maxPss) {
						id = p.id;
						maxPss = p.stat.pss;
					}
				}

				if (id !== undefined) {
					let qbResult: "qbW" | "qbL" | "qbT";
					const j = i === 0 ? 1 : 0;
					if (result.team[i].stat.pts > result.team[j].stat.pts) {
						qbResult = "qbW";
					} else if (result.team[i].stat.pts < result.team[j].stat.pts) {
						qbResult = "qbL";
					} else {
						qbResult = "qbT";
					}

					qbResults.set(id, qbResult);
				}
			}
		}

		for (const t of result.team) {
			for (const p of t.player) {
				// Only need to write stats if player got minutes, except for minAvailable in BBGM
				if (process.env.SPORT !== "basketball" && p.stat.min === 0) {
					continue;
				}

				player.checkStatisticalFeat(p.id, t.id, p, result, conditions);

				const p2 = await idb.cache.players.get(p.id);
				if (!p2) {
					throw new Error("Invalid pid");
				}

				if (!allStarGame) {
					let ps = p2.stats[p2.stats.length - 1]; // This should never happen, but sometimes does (actually it might not, after putting stats back in player object)

					if (!ps || ps.tid !== t.id || ps.playoffs !== playoffs) {
						await player.addStatsRow(p2, playoffs);
						ps = p2.stats[p2.stats.length - 1];
					}

					// Since index is not on playoffs, manually check
					if (ps.playoffs !== playoffs) {
						throw new Error(`Missing playoff stats for player ${p.id}`);
					}

					// Update stats
					if (p.stat.min > 0) {
						for (const key of Object.keys(p.stat)) {
							if (!ps.hasOwnProperty(key)) {
								throw new Error(`Missing key "${key}" on ps`);
							}

							if (process.env.SPORT === "football" && key.endsWith("Lng")) {
								if (p.stat[key] > ps[key]) {
									ps[key] = p.stat[key];
								}
							} else {
								ps[key] += p.stat[key];
							}
						}

						ps.gp += 1;

						if (process.env.SPORT === "football") {
							const stat = qbResults.get(p.id);
							if (stat) {
								ps[stat] += 1;
							}
						}

						for (const key of stats.max) {
							const stat = key.replace("Max", "");

							let value;
							if (stat === "2p") {
								value = p.stat.fg - p.stat.tp;
							} else if (stat === "2pa") {
								value = p.stat.fga - p.stat.tpa;
							} else if (stat === "trb") {
								value = p.stat.drb + p.stat.orb;
							} else if (stat === "gmsc") {
								value = helpers.gameScore(p.stat);
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

				const injuredThisGame = p.injured && p.injury.type === "Healthy"; // Injury crap - assign injury type if player does not already have an injury in the database

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
