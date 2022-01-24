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

const MIN_PLAYERS_CONTEST = 2;

const create = async (conditions: Conditions) => {
	const allStars: AllStars = {
		season: g.get("season"),
		teamNames: ["", ""],
		teams: [[], []],
		remaining: [],
		finalized: false,
	};
	const players = await getPlayers(g.get("season"));

	// 12 per team, for a default league
	const NUM_ALL_STARS = 2 * (g.get("minRosterSize") + 2);

	const score = (p: PlayerFiltered) =>
		bySport({
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
	let healthyCount = 0;

	for (const p of sortedPlayers) {
		const obj: AllStarPlayer = {
			pid: p.pid,
			tid: p.tid,
			name: p.name,
		};

		if (p.injury.gamesRemaining === 0) {
			healthyCount += 1;
		} else {
			obj.injured = true;
		}

		allStars.remaining.push(obj);

		if (healthyCount >= NUM_ALL_STARS) {
			break;
		}
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

	// Pick two captains
	for (const team of allStars.teams) {
		const ind = allStars.remaining.findIndex(({ pid }) => {
			const p = players.find(p2 => p2.pid === pid);
			return p.injury.gamesRemaining === 0;
		});
		team.push(allStars.remaining[ind]);
		allStars.remaining.splice(ind, 1);
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
				p => p.ratings.at(-1).hgt,
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
					orderedByHeight.at(shortIndexes[0]).pid,
					orderedByHeight.at(shortIndexes[1]).pid,
				],
				pidsTall: [
					orderedByHeight[longIndexes[0]].pid,
					orderedByHeight[longIndexes[1]].pid,
				],
			};
		}

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

	return allStars;
};

export default create;
