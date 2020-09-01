import { idb, iterate } from "../db";
import { g, helpers, processPlayersHallOfFame } from "../util";
import type { UpdateEvents, Player } from "../../common/types";

type InfoTemp = {
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

const valueStatNames =
	process.env.SPORT === "basketball" ? ["ows", "dws"] : ["av"];

const reducer = (
	type: "college" | "country" | "jerseyNumbers",
	infos: { [key: string]: InfoTemp | undefined },
	p: Player,
) => {
	let name;
	if (type === "college") {
		name = p.college && p.college !== "" ? p.college : "None";
	} else if (type === "jerseyNumbers") {
		name = helpers.getJerseyNumber(p, "mostCommon");
		if (name === undefined) {
			return;
		}
	} else {
		name = helpers.getCountry(p);
	}

	if (!infos[name]) {
		infos[name] = {
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

	const info = infos[name] as InfoTemp;
	info.numPlayers += 1;
	if (p.tid >= 0) {
		info.numActivePlayers += 1;
	}
	if (p.hof) {
		info.numHof += 1;
	}

	let valueStat = 0;
	let gp = 0;
	for (const stats of p.stats) {
		// No real reason to discard playoff stats. This just makes it consistet with usage of careerStats for the best player
		if (!stats.playoffs) {
			gp += stats.gp;
			for (const valueStatName of valueStatNames) {
				valueStat += stats[valueStatName];
			}
		}
	}

	info.gp += gp;
	info.valueStat += valueStat;
	if (valueStat >= info.best.valueStat) {
		info.best = {
			p,
			valueStat,
		};
	}
};

export const genView = (type: "college" | "country" | "jerseyNumbers") => {
	return async (inputs: unknown, updateEvents: UpdateEvents) => {
		// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
		if (updateEvents.includes("firstRun")) {
			const valueStat = process.env.SPORT === "basketball" ? "ws" : "av";
			const stats =
				process.env.SPORT === "basketball"
					? ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"]
					: ["keyStats", "av"];

			const infosTemp: { [key: string]: InfoTemp } = {};
			await iterate(
				idb.league.transaction("players").store,
				undefined,
				undefined,
				p => {
					reducer(type, infosTemp, p);
				},
			);

			const infos = await Promise.all(
				Object.entries(infosTemp).map(async ([name, info]) => {
					const p = await idb.getCopy.playersPlus(info.best.p, {
						attrs: [
							"pid",
							"name",
							"draft",
							"retiredYear",
							"statsTids",
							"hof",
							"jerseyNumber",
							"watch",
						],
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
				challengeNoRatings: g.get("challengeNoRatings"),
				infos,
				stats,
				userTid: g.get("userTid"),
				valueStat,
			};
		}
	};
};

export default genView("college");
