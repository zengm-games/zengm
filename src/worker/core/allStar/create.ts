import {
	getPlayers,
	getTopPlayers,
	saveAwardsByPlayer,
} from "../season/awards";
import { g, random } from "../../util";
import type {
	AllStars,
	Conditions,
	PlayerFiltered,
	AllStarPlayer,
} from "../../../common/types";
import { bySport, isSport } from "../../../common";
import { idb } from "../../db";
import orderBy from "lodash-es/orderBy";
import type { PlayerRatings } from "../../../common/types.basketball";
import range from "lodash-es/range";
import { groupBy } from "../../../common/groupBy";
import { getPosByGpF } from "../season/doAwards.baseball";

const MIN_PLAYERS_CONTEST = 2;

const create = async (conditions: Conditions) => {
	const allStars: AllStars = {
		season: g.get("season"),
		teamNames: ["", ""],
		teams: [[], []],
		remaining: [],
		finalized: false,
		type: "top",
	};
	const players = await getPlayers(g.get("season"));

	const allStarNum = g.get("allStarNum");

	const score = (p: PlayerFiltered) =>
		bySport({
			baseball: p.currentStats.war,
			football: p.currentStats.av,
			basketball: 2.5 * p.currentStats.ewa + p.currentStats.ws,
			hockey: p.currentStats.ps,
		});

	const sortedPlayers = getTopPlayers(
		{
			amount: Infinity,
			score,
		},
		players,
	);

	let allStarType = g.get("allStarType");
	const confs = g.get("confs");
	if (!isSport("basketball") && allStarType === "draft") {
		allStarType = "byConf";
	}
	if (allStarType === "byConf" && confs.length !== 2) {
		allStarType = "top";
	}

	let healthyPids = new Set();
	let pickedAllStars = false;

	const pickAllStars = (
		candidates: typeof sortedPlayers,
		numTeams: 1 | 2,
	): boolean => {
		const numPlayersNeeded = numTeams * allStarNum;
		let count = 0;

		const addPlayer = (p: (typeof candidates)[number]) => {
			const obj: AllStarPlayer = {
				pid: p.pid,
				tid: p.tid,
				name: p.name,
			};

			const healthy = p.injury.gamesRemaining === 0;

			if (healthy) {
				healthyPids.add(p.pid);
				count += 1;
			} else {
				obj.injured = true;
			}

			allStars.remaining.push(obj);

			return healthy;
		};

		const pickAllStarsByPosition = (
			positionCounts: Record<string, number>,
			noPlayersBeyondPositionCounts?: boolean,
		) => {
			const positions = [];
			for (const [pos, numPlayers] of Object.entries(positionCounts)) {
				for (let i = 0; i < numPlayers; i++) {
					positions.push(pos);
				}
			}

			// If we need more than the default positions, they should be random
			random.shuffle(positions);

			const playersByPos = groupBy(candidates, p => {
				if (isSport("baseball")) {
					// Find actual played position based on highest gpF value
					return getPosByGpF(p.currentStats.gpF);
				}

				return p.ratings.at(-1).pos;
			});

			let failed = false;

			while (count < numPlayersNeeded && !failed) {
				for (const pos of positions) {
					// Take 2 players from every position, if we're doing 2 teams at once, because they will alternate as selected for teams
					for (let i = 0; i < numTeams; i++) {
						if (!playersByPos[pos] || playersByPos[pos].length === 0) {
							failed = true;
						} else {
							let foundHealthyPlayer = false;
							while (!foundHealthyPlayer) {
								const p = playersByPos[pos].shift();
								if (!p) {
									failed = true;
									break;
								}
								foundHealthyPlayer = addPlayer(p);
							}
						}
					}

					if (count >= numPlayersNeeded) {
						break;
					}
				}

				// For baseball, we don't want to use this function for our bench, so only go through positionCounts once and then stop
				if (noPlayersBeyondPositionCounts) {
					break;
				}
			}

			return !failed;
		};

		return bySport({
			baseball: () => {
				pickAllStarsByPosition(
					{
						C: 1,
						"1B": 1,
						"2B": 1,
						"3B": 1,
						SS: 1,
						LF: 1,
						CF: 1,
						RF: 1,
						P: 8,
					},
					true,
				);

				// Fill out with best non-pitchers, regardless of position
				if (count < numPlayersNeeded) {
					const pidsUsed = new Set(allStars.remaining.map(p => p.pid));
					const remainingCandidates = candidates.filter(p => {
						if (pidsUsed.has(p.pid)) {
							return false;
						}

						const pos = getPosByGpF(p.currentStats.gpF);
						if (pos === "P") {
							return false;
						}

						return true;
					});

					for (const p of remainingCandidates) {
						addPlayer(p);

						if (count >= numPlayersNeeded) {
							// Success!
							return true;
						}
					}
				}

				return false;
			},
			basketball: () => {
				for (const p of candidates) {
					addPlayer(p);

					if (count >= numPlayersNeeded) {
						// Success!
						return true;
					}
				}

				// Didn't find enough players
				return false;
			},
			football: () =>
				pickAllStarsByPosition({
					QB: 3,
					RB: 3,
					WR: 5,
					TE: 2,
					OL: 6,
					DL: 6,
					LB: 5,
					S: 4,
					CB: 4,
					K: 1,
					P: 1,
				}),
			hockey: () =>
				pickAllStarsByPosition({
					C: 4,
					W: 8,
					D: 6,
					G: 2,
				}),
		})();
	};

	if (allStarType === "byConf") {
		// Try byConf, but if it fails, fall back on top
		const cidsByTid: Record<number, number> = {};
		const teams = await idb.cache.teams.getAll();
		for (const t of teams) {
			cidsByTid[t.tid] = t.cid;
		}

		const grouped = groupBy(
			sortedPlayers.filter(p => p.tid >= 0),
			p => cidsByTid[p.tid],
		);

		// Sorting is to make sure lowest cid is first
		const groupedPlayers = orderBy(
			Object.entries(grouped),
			row => row[0],
			"asc",
		).map(row => row[1]);

		let numSuccess = 0;

		if (groupedPlayers.length === 2) {
			for (const confPlayers of groupedPlayers) {
				const success = pickAllStars(confPlayers, 1);
				if (success) {
					numSuccess += 1;
				} else {
					numSuccess = 0;
					break;
				}
			}
		}

		if (numSuccess === 2) {
			pickedAllStars = true;
		} else {
			// Reset if it failed to find enough players, don't do it by conf
			allStarType = "top";
			healthyPids = new Set();
			allStars.remaining = [];
		}
	}

	if (!pickedAllStars) {
		pickAllStars(sortedPlayers, 2);
	}

	// Do awards first, before picking captains, so remaining has all players
	const awardsByPlayer = allStars.remaining.map((p: any) => {
		return {
			pid: p.pid,
			tid: p.tid,
			name: p.name,
			type: "All-Star",
		};
	});
	await saveAwardsByPlayer(awardsByPlayer, conditions);

	const assignTopPlayerToTeam = (team: (typeof allStars)["teams"][number]) => {
		const ind = allStars.remaining.findIndex(({ pid }) => healthyPids.has(pid));
		team.push(allStars.remaining[ind]);
		allStars.remaining.splice(ind, 1);
	};

	if (allStarType === "draft") {
		// Pick two captains
		for (const team of allStars.teams) {
			assignTopPlayerToTeam(team);
		}

		// @ts-expect-error
		allStars.teamNames = allStars.teams.map(teamPlayers => {
			const captainPID = teamPlayers[0].pid;
			const p = players.find(p2 => p2.pid === captainPID);
			return `Team ${p.firstName}`;
		});

		if (allStars.teamNames[0] === allStars.teamNames[1]) {
			allStars.teamNames[1] += " 2";
		}
	} else if (allStarType === "byConf") {
		// First half of allStars.remaining is 1st conference, second half is 2nd conference
		for (let i = 0; i < 2; i++) {
			while (allStars.teams[i].length < allStarNum) {
				assignTopPlayerToTeam(allStars.teams[i]);
			}
		}

		// Order by cid ascending, same as players
		const confNames = orderBy(Object.values(confs), "cid", "asc").map(
			conf => conf.name,
		);
		allStars.teamNames[1] = `${confNames[1]}`;
		allStars.teamNames[0] = `${confNames[0]}`;
	} else {
		// Alternate team assignment when going through list of players, in snake fashion
		const snakeOrder = Math.random() < 0.5 ? [0, 1, 1, 0] : [1, 0, 0, 1];
		let i = 0;
		while (
			allStars.teams[0].length + allStars.teams[1].length <
			healthyPids.size
		) {
			const teamIndex = snakeOrder[i % snakeOrder.length];
			assignTopPlayerToTeam(allStars.teams[teamIndex]);
			i += 1;
		}

		allStars.teamNames[1] = "All-Stars 1";
		allStars.teamNames[0] = "All-Stars 2";
	}

	allStars.type = allStarType;

	if (isSport("basketball")) {
		const lastYear = await idb.getCopy.allStars(
			{
				season: g.get("season") - 1,
			},
			"noCopyCache",
		);
		let prevWinnerDunk: number | undefined;
		if (lastYear?.dunk?.winner !== undefined) {
			prevWinnerDunk = lastYear.dunk.players[lastYear.dunk.winner].pid;
		}
		let prevWinnerThree: number | undefined;
		if (lastYear?.three?.winner !== undefined) {
			prevWinnerThree = lastYear.three.players[lastYear.three.winner].pid;
		}

		const activePlayers = await idb.cache.players.indexGetAll("playersByTid", [
			0,
			Infinity,
		]);

		if (g.get("allStarDunk")) {
			const dunkers = orderBy(
				activePlayers.filter(p => p.injury.gamesRemaining === 0),
				[
					p => (p.pid === prevWinnerDunk ? 1 : 0),
					p => {
						const ratings = p.ratings.at(-1) as PlayerRatings;
						return ratings.dnk + 2 * ratings.jmp;
					},
				],
				["desc", "desc"],
			)
				.slice(0, g.get("numPlayersDunk"))
				.map(p => ({
					pid: p.pid,
					tid: p.tid,
					name: `${p.firstName} ${p.lastName}`,
				}));

			if (dunkers.length >= MIN_PLAYERS_CONTEST) {
				random.shuffle(dunkers);

				const controlling = [];
				for (let i = 0; i < dunkers.length; i++) {
					if (dunkers[i].tid === g.get("userTid")) {
						controlling.push(i);
					}
				}

				const orderedByHeight = orderBy(
					activePlayers,
					p => p.ratings.at(-1)!.hgt,
					"desc",
				);

				// Don't always take the tallest/shortest, add some randomness
				const numToPickFrom = Math.min(20, orderedByHeight.length);
				const indexes = range(numToPickFrom);
				random.shuffle(indexes);

				// -1 is because we want to turn .at(0) into .at(-1)
				const shortIndexes = [-indexes[0] - 1, -indexes[1] - 1];

				random.shuffle(indexes);
				const longIndexes = [indexes[0], indexes[1]];

				allStars.dunk = {
					players: dunkers,
					rounds: [
						// First round
						{
							dunkers: range(dunkers.length),
							dunks: [],
						},
					],
					controlling,
					pidsShort: [
						orderedByHeight.at(shortIndexes[0])!.pid,
						orderedByHeight.at(shortIndexes[1])!.pid,
					],
					pidsTall: [
						orderedByHeight[longIndexes[0]].pid,
						orderedByHeight[longIndexes[1]].pid,
					],
				};
			}
		}

		if (g.get("allStarThree")) {
			// Half qualify by taking a lot of threes. Half qualify by ratings.
			const numStats = Math.floor(g.get("numPlayersThree") / 2);
			const numRatings = g.get("numPlayersThree") - numStats;

			const shootersStats = orderBy(
				activePlayers.filter(p => p.injury.gamesRemaining === 0),
				[
					p => {
						const stats = p.stats.at(-1);
						return stats.tp;
					},
					p => {
						const ratings = p.ratings.at(-1) as PlayerRatings;
						return ratings.tp;
					},
				],
				["desc", "desc"],
			).slice(0, numStats);

			const shootersRatings = orderBy(
				activePlayers.filter(
					p => p.injury.gamesRemaining === 0 && !shootersStats.includes(p),
				),
				[
					// Include last year's winner here too
					p => (p.pid === prevWinnerThree ? 1 : 0),
					p => {
						const ratings = p.ratings.at(-1) as PlayerRatings;
						return ratings.tp;
					},
				],
				["desc", "desc"],
			).slice(0, numRatings);

			const shooters = [...shootersStats, ...shootersRatings].map(p => ({
				pid: p.pid,
				tid: p.tid,
				name: `${p.firstName} ${p.lastName}`,
			}));

			if (shooters.length >= MIN_PLAYERS_CONTEST) {
				random.shuffle(shooters);

				allStars.three = {
					players: shooters,
					rounds: [
						// First round
						{
							indexes: range(shooters.length),
							results: [
								{
									index: 0,
									racks: [[]],
								},
							],
						},
					],
				};
			}
		}
	}

	return allStars;
};

export default create;
