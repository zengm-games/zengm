import {
	getPlayers,
	getTopPlayers,
	saveAwardsByPlayer,
} from "../season/awards";
import { g } from "../../util";
import type {
	AllStars,
	Conditions,
	PlayerFiltered,
	AllStarPlayer,
} from "../../../common/types";

const NUM_ALL_STARS = 2 * (process.env.SPORT === "football" ? 40 : 12);

const create = async (conditions: Conditions) => {
	const allStars: AllStars = {
		season: g.get("season"),
		teamNames: ["", ""],
		teams: [[], []],
		remaining: [],
		finalized: false,
	};
	const players = await getPlayers(g.get("season"));

	const score = (p: PlayerFiltered) =>
		process.env.SPORT === "football"
			? p.currentStats.av
			: p.currentStats.ewa + p.currentStats.ws;

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

	return allStars;
};

export default create;
