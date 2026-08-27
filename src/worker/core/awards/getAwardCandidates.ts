import { bySport } from "../../../common/sportFunctions.ts";
import type {
	Award2,
	AwardInfoIndividual,
	AwardInfoTeam,
	Awards2,
	GameAttributesLeague,
} from "../../../common/types.ts";
import { groupByUnique } from "../../../common/utils.ts";
import { idb } from "../../db/index.ts";
import addFirstNameShort from "../../util/addFirstNameShort.ts";
import g from "../../util/g.ts";
import type { StatOverridesByMatchup } from "./getPlayers.ts";
import { hashPlayoffSeries } from "./hashPlayoffSeries.ts";
import { processAwards } from "./processAwards.ts";

const persistedAwardsToAwardSetting = (persistedAwards: Awards2) => {
	let statOverridesByMatchup: StatOverridesByMatchup | undefined;

	const awards: GameAttributesLeague["awards"] = [];

	const seenShortNames = new Set();

	for (const persistedAward of persistedAwards.awards) {
		// Store statOverrides first before ignoring repeated ones, so semifinals MVP statOverrides get saved for both awards
		const group = persistedAward.group;
		if (
			group?.type === "playoffSeries" &&
			persistedAward.numTeams === undefined
		) {
			const matchupKey = hashPlayoffSeries(group);
			statOverridesByMatchup ??= {};
			statOverridesByMatchup[matchupKey] = {};
			for (const p of persistedAward.winner) {
				if (p?.statOverrides) {
					statOverridesByMatchup[matchupKey][p.pid] = {
						tid: p.tid,
						...p.statOverrides,
					};
				}
			}
		}

		// Skip multiple repeated conf/div awards - this assumes shortName is unique
		if (seenShortNames.has(persistedAward.shortName)) {
			continue;
		}
		seenShortNames.add(persistedAward.shortName);

		const award: GameAttributesLeague["awards"][number] & {
			winner?: Awards2["awards"][number]["winner"];
		} = {
			...persistedAward,
			group:
				group === undefined || group.type === "playoffSeries"
					? undefined
					: group.type,
		};
		delete award.winner;
		awards.push(award);
	}

	return { awards, statOverridesByMatchup };
};

const getAwards = async (season: number) => {
	const persistedAwards = await idb.getCopy.awards({ season });

	let awards;
	let statOverridesByMatchup;
	if (persistedAwards) {
		const output = persistedAwardsToAwardSetting(persistedAwards);
		awards = output.awards;
		statOverridesByMatchup = output.statOverridesByMatchup;
	} else {
		// Either the current season, or some past season where no awards are in database so might as well show current awards
		awards = g.get("awards");
	}

	return {
		awards,
		statOverridesByMatchup,
	};
};

export const getAwardCandidates = async (
	season: number,
	awardsOverride?: GameAttributesLeague["awards"],
) => {
	let awards;
	let statOverridesByMatchup;
	if (awardsOverride) {
		awards = awardsOverride;
	} else {
		const info = await getAwards(season);
		awards = info.awards;
		statOverridesByMatchup = info.statOverridesByMatchup;
	}

	const { errorMessages, realizedAwards, players } = await processAwards({
		awards,
		numPlayersPerIndividualAward: 10,
		season,
		statOverridesByMatchup,
	});

	const playersByPid = groupByUnique(players, "pid");

	// Like showStatsByType but with a bit more
	const awardCandidateStats: Partial<Record<Award2["showStats"], string[]>> =
		bySport({
			baseball: {
				overall: ["keyStats", "war"],
				sp: ["w", "l", "era", "ip", "war"],
				rp: ["sv", "era", "ip", "war"],
				offense: ["pa", "hr", "ba", "ops", "war"],
				defense: ["pa", "hr", "ba", "ops", "war"], // Showing actualy defensive stats would be annoying because arrays
			},
			basketball: {
				offense: ["pts", "trb", "ast", "per"],
				defense: ["trb", "blk", "stl", "dws"],
			},
			football: {
				overall: ["keyStats", "av"],
				defense: ["defTck", "defSk", "defPssDef", "defInt", "av"],
				blocking: ["pbw", "pbwr", "rbw", "rbwr", "av"],
			},
			hockey: {
				overall: ["keyStats", "ps"],
				defense: ["tk", "hit", "dps"],
				goalkeeping: ["gpGoalie", "gaa", "svPct", "gps"],
			},
		});

	const augmentPlayers = (
		award: Award2,
		winner:
			| AwardInfoIndividual["winner"]
			| (AwardInfoTeam["winner"][number][number] & {
					opoyOverride?: undefined;
			  })[],
	) => {
		return addFirstNameShort(
			winner
				.map((p2) => {
					if (p2 === undefined) {
						return;
					}

					const statRange = award.statRange ?? "regularSeason";

					const p = playersByPid[p2.pid]!;
					const formula = award.formulaByPos?.[p.pos] ?? award.formula;
					return {
						...p,
						currentStats: {
							...p.currentStats[statRange],
							score: p.scores[statRange]?.[formula],
						} as {
							score: number | undefined;
						} & (typeof p)["currentStats"]["regularSeason"],
						opoyOverride: p2.opoyOverride,
						statOverrides: p2.statOverrides,
					};
				})
				.filter((p) => p !== undefined),
		);
	};

	type Output = (
		| (AwardInfoIndividual & { rank?: undefined })
		| (AwardInfoTeam & { rank: number })
	) & {
		players: ReturnType<typeof augmentPlayers>;
		stats: string[];
	};

	const awardCandidates: Output[][] = realizedAwards.map((group) =>
		group.flatMap((award) => {
			const showStats = awardCandidateStats[award.showStats];
			if (!showStats) {
				throw new Error("Invalid showStats");
			}

			const stats = [...showStats, "score"];

			const numTeams = award.numTeams;
			if (numTeams !== undefined) {
				return award.winner.map((winner, i): Output => {
					return {
						...award,
						numTeams,
						rank: i + 1,
						players: augmentPlayers(award, winner),
						stats,
					};
				});
			}

			return {
				...award,
				numTeams: undefined,
				rank: undefined,
				players: augmentPlayers(award, award.winner),
				stats,
			};
		}),
	);

	return { awardCandidates, errorMessages };
};
