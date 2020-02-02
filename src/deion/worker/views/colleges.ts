import { idb, iterate } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import { UpdateEvents, Player } from "../../common/types";

type CollegeInfoTemp = {
	numPlayers: number;
	numActivePlayers: number;
	numHof: number;
	gp: number;
	valueStat: number;
	best: {
		valueStat: number;
		p: Player;
	};
};

const valueStatName = process.env.SPORT === "basketball" ? "ewa" : "av";

const reducer = (colleges: { [key: string]: CollegeInfoTemp }, p: Player) => {
	const name = p.college && p.college !== "" ? p.college : "None";

	if (!colleges[name]) {
		colleges[name] = {
			numPlayers: 0,
			numActivePlayers: 0,
			numHof: 0,
			gp: 0,
			valueStat: 0,
			best: {
				valueStat: -Infinity,
				p,
			},
		};
	}

	const college = colleges[name];
	college.numPlayers += 1;
	if (p.tid >= 0) {
		college.numActivePlayers += 1;
	}
	if (p.hof) {
		college.numHof += 1;
	}

	let valueStat = 0;
	let gp = 0;
	for (const stats of p.stats) {
		// No real reason to discard playoff stats. This just makes it consistet with usage of careerStats for the best player
		if (!stats.playoffs) {
			gp += stats.gp;
			valueStat += stats[valueStatName];
		}
	}

	college.gp += gp;
	college.valueStat += valueStat;
	if (valueStat >= college.best.valueStat) {
		college.best = {
			p,
			valueStat,
		};
	}
};

const updateColleges = async (inputs: unknown, updateEvents: UpdateEvents) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun")) {
		const valueStat = process.env.SPORT === "basketball" ? "ws" : "av";
		const stats =
			process.env.SPORT === "basketball"
				? ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"]
				: ["keyStats", "av"];

		const collegesTemp: { [key: string]: CollegeInfoTemp } = {};
		await iterate(
			idb.league.transaction("players").store,
			undefined,
			undefined,
			p => {
				reducer(collegesTemp, p);
			},
		);

		const colleges = await Promise.all(
			Object.entries(collegesTemp).map(async ([name, info]) => {
				const p = await idb.getCopy.playersPlus(info.best.p, {
					attrs: ["pid", "name", "draft", "retiredYear", "statsTids", "hof"],
					ratings: ["ovr", "pos"],
					stats: ["season", "abbrev", "tid", ...stats],
					fuzz: true,
				});

				return {
					name,
					numPlayers: info.numPlayers,
					numActivePlayers: info.numActivePlayers,
					numHof: info.numHof,
					gp: info.gp,
					valueStat: info.valueStat,
					p: processPlayersHallOfFame([p])[0],
				};
			}),
		);

		return {
			colleges,
			stats,
			userTid: g.get("userTid"),
			valueStat,
		};
	}
};

export default updateColleges;
