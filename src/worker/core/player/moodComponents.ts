import { finances } from "..";
import { PHASE, PLAYER } from "../../../common";
import type { MoodComponents, Player } from "../../../common/types";
import { idb } from "../../db";
import { g, helpers } from "../../util";

// Make components -2 to 2, then scale with traits to -5 to 5
const moodComponents = async (
	p: Player,
	tid: number,
): Promise<MoodComponents> => {
	const season = g.get("season");

	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsByTidSeason",
		[
			[tid, season - 2],
			[tid, season],
		],
	);
	const currentTeamSeason = teamSeasons.find(ts => ts.season === season);

	const teams = helpers.addPopRank(
		(await idb.cache.teams.getAll()).filter(t => !t.disabled),
	);
	const t = teams.find(t => t.tid === tid);
	if (!t) {
		throw new Error(`tid ${tid} not found`);
	}

	const components = {
		marketSize: 0,
		facilities: 0,
		teamPerformance: 0,
		hype: 0,
		loyalty: 0,
		trades: 0,
		playingTime: 0,
		rookieContract: 0,
	};

	{
		// MARKET SIZE: -2 to 2, based on population rank
		const marketSize0to1 = (teams.length - t.popRank) / (teams.length - 1);
		components.marketSize = -2 + marketSize0to1 * 4;
	}

	{
		// FACILITIES: -2 to 2, based on facilities expenses rank
		const facilitiesRank = finances.getRankLastThree(
			teamSeasons,
			"expenses",
			"facilities",
		);
		const facilities0to1 = (teams.length - facilitiesRank) / (teams.length - 1);
		components.facilities = -2 + facilities0to1 * 4;
	}

	{
		// TEAM PERFORMANCE: -2 means no playoffs and 25% winning percentage. +2 means championship and 60% winning percentage, or 75% winning percentage
		if (currentTeamSeason) {
			const projectedRecord = {
				won: currentTeamSeason.won,
				lost: currentTeamSeason.lost,
				tied: currentTeamSeason.tied || 0,
			};

			let wonTitle = false;

			// If season ongoing, project record and playoff success based on last year
			if (g.get("phase") <= PHASE.REGULAR_SEASON) {
				const previousSeason = teamSeasons.find(ts => ts.season === season - 1);
				const previousRecord = {
					won: previousSeason ? previousSeason.won : 0,
					lost: previousSeason ? previousSeason.lost : 0,
					tied: previousSeason ? previousSeason.tied || 0 : 1,
				};

				const fractionComplete =
					(projectedRecord.won + projectedRecord.lost + projectedRecord.tied) /
					g.get("numGames");

				const currentGames =
					projectedRecord.won + projectedRecord.lost + projectedRecord.tied;
				const previousGames =
					previousRecord.won + previousRecord.lost + previousRecord.tied;

				const remainingGames = helpers.bound(
					g.get("numGames") - currentGames,
					0,
					Infinity,
				);

				for (const key of ["won", "lost", "tied"] as const) {
					const currentFraction =
						currentGames > 0 ? projectedRecord[key] / currentGames : 0;
					const previousFraction =
						previousGames > 0 ? previousRecord[key] / previousGames : 0;

					projectedRecord[key] +=
						(currentFraction * fractionComplete +
							previousFraction * (1 - fractionComplete)) *
						remainingGames;
				}

				if (previousSeason) {
					wonTitle =
						previousSeason.playoffRoundsWon >=
						g.get("numGamesPlayoffSeries", season - 1).length;
				}
			} else {
				wonTitle =
					currentTeamSeason.playoffRoundsWon >=
					g.get("numGamesPlayoffSeries", "current").length;
			}

			let winp = helpers.calcWinp(projectedRecord);
			if (wonTitle) {
				// If won title, equivalent to extra 15%, so 60% winp and title maxes it out
				winp += 0.15;
			}

			// 25% to 75% -> -2 to 2
			components.teamPerformance = -2 + ((winp - 0.25) * 4) / 0.5;

			// Set upper bound, in case went over due to playoff bonus
			components.teamPerformance = helpers.bound(
				components.teamPerformance,
				-Infinity,
				2,
			);
		}
	}

	{
		// HYPE
		if (currentTeamSeason) {
			components.hype = -2 + 4 * currentTeamSeason.hype;
		}
	}

	{
		// LOYALTY
		const numSeasonsWithTeam = p.stats.filter(row => row.tid === tid).length;
		components.loyalty = numSeasonsWithTeam / 8;
	}

	{
		// TRADES
		let numPlayersTradedAwayNormalized = 0;
		for (const teamSeason of teamSeasons) {
			if (teamSeason.season === season - 2) {
				numPlayersTradedAwayNormalized +=
					teamSeason.numPlayersTradedAway * 0.25;
			} else if (teamSeason.season === season - 1) {
				numPlayersTradedAwayNormalized += teamSeason.numPlayersTradedAway * 0.5;
			} else if (teamSeason.season === season) {
				numPlayersTradedAwayNormalized +=
					teamSeason.numPlayersTradedAway * 0.75;
			}
		}

		components.trades = helpers.bound(
			-(numPlayersTradedAwayNormalized - 7) / 2,
			-Infinity,
			0,
		);
	}

	{
		// PLAYING TIME
	}

	{
		// ROOKIE CONTRACT
		if (!g.get("hardCap")) {
			const rookieContractLength = g.get("rookieContractLengths")[
				p.draft.round - 1
			];
			if (
				rookieContractLength !== undefined &&
				p.draft.round > 0 &&
				((p.draft.year + rookieContractLength > season && p.tid >= 0) ||
					(p.draft.year + rookieContractLength === season &&
						g.get("phase") <= PHASE.RESIGN_PLAYERS))
			) {
				components.rookieContract = 10;
			}
		}
	}

	// Apply difficulty modulation
	const difficulty = g.get("difficulty");
	if (difficulty !== 0) {
		for (const key of helpers.keys(components)) {
			// Higher difficulty should result in lower mood, but we don't want to swap signs because that'd make for weird output (like complaining about team success when you won the title... but it's okay to just have it at 0 and say nothing)
			if (difficulty > 0) {
				if (components[key] > 0) {
					components[key] /= 1 + difficulty;
				} else {
					components[key] *= 1 + difficulty;
				}
			} else {
				if (components[key] > 0) {
					components[key] *= 1 - difficulty;
				} else {
					components[key] /= 1 - difficulty;
				}
			}
		}
	}

	// Bound all components - they don't all have the same bounds!
	components.marketSize = helpers.bound(components.marketSize, -2, 2);
	components.facilities = helpers.bound(components.facilities, -2, 2);
	components.teamPerformance = helpers.bound(components.teamPerformance, -2, 2);
	components.hype = helpers.bound(components.hype, -2, 2);
	components.loyalty = helpers.bound(components.loyalty, 0, Infinity);
	components.trades = helpers.bound(components.trades, -Infinity, 0);
	components.playingTime = helpers.bound(components.playingTime, -2, 2);
	components.rookieContract = helpers.bound(
		components.rookieContract,
		0,
		Infinity,
	);

	// Apply traits modulation
	if (p.moodTraits.includes("F")) {
		components.marketSize *= 2.5;
		components.hype *= 2.5;
		components.playingTime *= 2.5;
	}
	if (p.moodTraits.includes("L")) {
		components.marketSize *= 0.5;
		components.loyalty *= 2.5;
		components.trades *= 2.5;
	}
	if (p.moodTraits.includes("$")) {
		components.facilities *= 1.5;
		components.marketSize *= 0.5;
		components.teamPerformance *= 0.5;
	}
	if (p.moodTraits.includes("W")) {
		components.marketSize *= 0.5;
		components.playingTime *= 0.5;
		components.teamPerformance *= 2.5;
	}

	return components;
};

export default moodComponents;
