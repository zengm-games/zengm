import { idb } from "../db/index.ts";
import { helpers } from "../util/index.ts";
import type { Player } from "../../common/types.ts";
import { defineView } from "../util/defineView.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { getValueStatsRow } from "../core/player/checkJerseyNumberRetirement.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { extraStats } from "./hallOfFame.ts";
import { processPlayersHallOfFame } from "../util/processPlayersHallOfFame.ts";

type InfoTemp = {
	numPlayers: number;
	numActivePlayers: number;
	numHof: number;
	numRetired: number;
	gp: number;
	displayStat: number;
	valueStat: number;
	best: {
		displayStat: number;
		valueStat: number;
		p: Player;
	};
};

const displayStatNames = bySport({
	baseball: ["war"],
	basketball: ["ows", "dws"],
	football: ["av"],
	hockey: ["ops", "dps", "gps"],
} as const);

const reducer = (
	type: "college" | "country" | "draftPosition" | "jerseyNumbers",
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
	} else if (type === "draftPosition") {
		name = p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "undrafted";
	} else {
		name = helpers.getCountry(p.born.loc);
	}

	if (!infos[name]) {
		infos[name] = {
			numPlayers: 0,
			numActivePlayers: 0,
			numHof: 0,
			numRetired: 0,
			gp: 0,
			displayStat: 0,
			valueStat: 0,
			best: {
				displayStat: -Infinity,
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

	let displayStat = 0;
	let valueStat = 0;
	let gp = 0;
	for (const stats of p.stats) {
		gp += stats.gp ?? 0;
		valueStat += getValueStatsRow(stats);
		for (const displayStatName of displayStatNames) {
			displayStat += stats[displayStatName] ?? 0;
		}
	}

	info.gp += gp;
	info.valueStat += valueStat;
	info.displayStat += displayStat;
	if (valueStat >= info.best.valueStat) {
		info.best = {
			displayStat,
			p,
			valueStat,
		};
	}
};

export const genView = (
	id:
		| "colleges"
		| "countries"
		| "frivolitiesDraftPosition"
		| "frivolitiesJerseyNumbers",
	type: "college" | "country" | "draftPosition" | "jerseyNumbers",
) => {
	return defineView(id, async ({ updateEvents }) => {
		// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
		if (updateEvents.includes("firstRun")) {
			const displayStat = bySport({
				baseball: "war",
				basketball: "ws",
				football: "av",
				hockey: "ps",
			});
			const stats = bySport({
				baseball: ["keyStats", "war"],
				basketball: [
					"gp",
					"min",
					"pts",
					"trb",
					"ast",
					"per",
					"ewa",
					"ows",
					"dws",
					"ws",
					"ws48",
				],
				football: ["keyStats", "av"],
				hockey: ["keyStats", "ops", "dps", "ps"],
			} as const);

			const infosTemp: { [key: string]: InfoTemp } = {};
			for await (const { value: p } of idb.league.transaction("players")
				.store) {
				reducer(type, infosTemp, p);
			}

			const infosWithPlayer = (
				await Promise.all(
					Object.entries(infosTemp).map(async ([name, info]) => {
						const p = await idb.getCopy.playersPlus(info.best.p, {
							attrs: [
								"pid",
								"firstName",
								"lastName",
								"draft",
								"retiredYear",
								"statsTids",
								"hof",
								"jerseyNumber",
							],
							ratings: ["season", "ovr", "pos"],
							stats: ["season", "abbrev", "tid", ...stats, ...extraStats],
							fuzz: true,
						});

						// Should never happen, since there's no season or seasonRange and every player has ratings
						if (!p) {
							return;
						}

						return { name, info, p };
					}),
				)
			).filter((row) => row !== undefined);

			const retiredCounts: Record<string, number> = {};
			if (type === "jerseyNumbers") {
				const teams = await idb.cache.teams.getAll();
				for (const t of teams) {
					if (t.retiredJerseyNumbers) {
						for (const row of t.retiredJerseyNumbers) {
							retiredCounts[row.number] ??= 0;
							retiredCounts[row.number]! += 1;
						}
					}
				}
			}

			const players = addFirstNameShort(
				processPlayersHallOfFame(infosWithPlayer.map((row) => row.p)),
			);

			const infos = Array.from(
				Iterator.zip([infosWithPlayer, players], { mode: "strict" }),
				([{ name, info }, p]) => ({
					name,
					numPlayers: info.numPlayers,
					numActivePlayers: info.numActivePlayers,
					numHof: info.numHof,
					numRetired:
						type === "jerseyNumbers"
							? (retiredCounts[name] ?? 0)
							: info.numRetired,
					gp: info.gp,
					displayStat: info.displayStat,
					valueStat: info.valueStat,
					p,
				}),
			);

			return {
				infos,
				stats,
				displayStat,
			};
		}
	});
};

export default genView("colleges", "college");
