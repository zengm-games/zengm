import { idb, iterate } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { UpdateEvents, Player } from "../../common/types";
import { isAmerican } from "../util/achievements.basketball";
import { PHASE, PLAYER } from "../../common";

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
	type: "college" | "country",
	infos: { [key: string]: InfoTemp },
	p: Player,
) => {
	// Ignore future draft prospects
	if (
		(p.tid === PLAYER.UNDRAFTED && g.get("phase") !== PHASE.FANTASY_DRAFT) ||
		p.tid === PLAYER.UNDRAFTED_FANTASY_TEMP
	) {
		return;
	}

	let name;
	if (type === "college") {
		name = p.college && p.college !== "" ? p.college : "None";
	} else {
		name = p.born.loc && p.born.loc !== "" ? p.born.loc : "None";

		if (isAmerican(name)) {
			name = "USA";
		} else {
			const parts = name.split(", ");
			if (parts.length > 1) {
				name = parts[parts.length - 1];
			}
		}
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

	const info = infos[name];
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

export const genView = (type: "college" | "country") => {
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
