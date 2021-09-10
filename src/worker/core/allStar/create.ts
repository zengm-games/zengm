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
import { NUM_DUNKERS_IN_CONTEST } from "./dunkContest";

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
	await saveAwardsByPlayer(awardsByPlayer, conditions); // Pick two captains

	for (const team of allStars.teams) {
		const ind = allStars.remaining.findIndex(({ pid }) => {
			const p = players.find(p2 => p2.pid === pid);
			return p.injury.gamesRemaining === 0;
		});
		team.push(allStars.remaining[ind]);
		allStars.remaining.splice(ind, 1);
	}

	// @ts-ignore
	allStars.teamNames = allStars.teams.map(teamPlayers => {
		const captainPID = teamPlayers[0].pid;
		const p = players.find(p2 => p2.pid === captainPID);
		return `Team ${p.firstName}`;
	});

	if (allStars.teamNames[0] === allStars.teamNames[1]) {
		allStars.teamNames[1] += " 2";
	}

	if (isSport("basketball")) {
		const lastYear = await idb.getCopy.allStars({
			season: g.get("season") - 1,
		});
		const prevWinnerPid = lastYear?.dunk?.winner;

		const dunkers = orderBy(
			(
				await idb.cache.players.indexGetAll("playersByTid", [0, Infinity])
			).filter(p => p.injury.gamesRemaining === 0),
			[
				p => (p.pid === prevWinnerPid ? 1 : 0),
				p => {
					const ratings = p.ratings.at(-1) as PlayerRatings;
					return ratings.dnk + 2 * ratings.jmp;
				},
			],
			["desc", "desc"],
		)
			.map(p => ({
				pid: p.pid,
				tid: p.tid,
				name: `${p.firstName} ${p.lastName}`,
			}))
			.slice(0, 4);

		if (dunkers.length === 4) {
			random.shuffle(dunkers);

			allStars.dunk = {
				players: dunkers as any,
				rounds: [
					// First round
					{
						dunkers: range(NUM_DUNKERS_IN_CONTEST),
						dunks: [],
					},
				],
			};
		}
	}

	return allStars;
};

export default create;
