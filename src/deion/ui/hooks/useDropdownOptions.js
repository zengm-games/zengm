// @flow

import orderBy from "lodash/orderBy";
import { useEffect, useState } from "react";
import { PHASE } from "../../common";
import { overrides, useLocalShallow } from "../util";

const sortedTeams = state => {
	return orderBy(
		state.teamAbbrevsCache.map((abbrev, i) => {
			return {
				key: abbrev,
				val: `${state.teamRegionsCache[i]} ${state.teamNamesCache[i]}`,
			};
		}),
		"val",
	);
};

const useDropdownOptions = (field: string) => {
	const [options, setOptions] = useState([]);

	const state = useLocalShallow(state2 => ({
		phase: state2.phase,
		season: state2.season,
		startingSeason: state2.startingSeason,
		teamAbbrevsCache: state2.teamAbbrevsCache,
		teamNamesCache: state2.teamNamesCache,
		teamRegionsCache: state2.teamRegionsCache,
	}));

	useEffect(() => {
		let newOptions: {
			key: number | string,
			val: number | string,
		}[];
		if (field === "teams") {
			newOptions = sortedTeams(state);
		} else if (field === "teamsAndSpecial") {
			newOptions = [
				{
					key: "special",
					val: "All-Star Game",
				},
				...sortedTeams(state),
			];
		} else if (field === "teamsAndAll") {
			newOptions = [
				{
					key: "all",
					val: "All Teams",
				},
				...sortedTeams(state),
			];
		} else if (field === "teamsAndAllWatch") {
			newOptions = [
				{
					key: "all",
					val: "All Teams",
				},
				{
					key: "watch",
					val: "Watch List",
				},
				...sortedTeams(state),
			];
		} else if (
			field === "seasons" ||
			field === "seasonsAndCareer" ||
			field === "seasonsAndAll" ||
			field === "seasonsAndOldDrafts" ||
			field === "seasonsHistory"
		) {
			newOptions = [];
			for (
				let season = state.startingSeason;
				season <= state.season;
				season++
			) {
				newOptions.push({
					key: season,
					val: `${season}`,
				});
			}
			if (field === "seasonsAndCareer") {
				newOptions.unshift({
					key: "career",
					val: "Career Totals",
				});
			}
			if (field === "seasonsAndAll") {
				newOptions.unshift({
					key: "all",
					val: "All Seasons",
				});
			}
			if (field === "seasonsAndOldDrafts") {
				const NUM_PAST_SEASONS = 20; // Keep synced with league/create.js
				for (
					let season = state.startingSeason - 1;
					season >= state.startingSeason - NUM_PAST_SEASONS;
					season--
				) {
					newOptions.unshift({
						key: season,
						val: `${season}`,
					});
				}

				// Remove current season, if draft hasn't happened yet
				if (state.phase < PHASE.DRAFT) {
					newOptions.pop();
				}
			}
			if (field === "seasonsHistory") {
				// Remove current season until playoffs end
				if (state.phase <= PHASE.PLAYOFFS) {
					newOptions.pop();
				}
			}
		} else if (field === "seasonsUpcoming") {
			newOptions = [];
			// For upcomingFreeAgents, bump up 1 if we're past the season
			const offset = state.phase <= PHASE.RESIGN_PLAYERS ? 0 : 1;
			for (let j = 0 + offset; j < 5 + offset; j++) {
				newOptions.push({
					key: state.season + j,
					val: `${state.season + j}`,
				});
			}
		} else if (field === "playoffs") {
			newOptions = [
				{
					val: "Regular Season",
					key: "regularSeason",
				},
				{
					val: "Playoffs",
					key: "playoffs",
				},
			];
		} else if (field === "shows") {
			newOptions = [
				{
					val: "Past 10 Seasons",
					key: "10",
				},
				{
					val: "All Seasons",
					key: "all",
				},
			];
		} else if (field === "statTypes" || field === "statTypesAdv") {
			if (process.env.SPORT === "basketball") {
				newOptions = [
					{
						val: "Per Game",
						key: "perGame",
					},
					{
						val: "Per 36 Mins",
						key: "per36",
					},
					{
						val: "Totals",
						key: "totals",
					},
				];

				if (field === "statTypesAdv") {
					newOptions.push({
						val: "Shot Locations",
						key: "shotLocations",
					});
					newOptions.push({
						val: "Advanced",
						key: "advanced",
					});
				}
			} else {
				newOptions = [
					{
						val: "Passing",
						key: "passing",
					},
					{
						val: "Rushing/Receiving",
						key: "rushing",
					},
					{
						val: "Defense",
						key: "defense",
					},
					{
						val: "Kicking",
						key: "kicking",
					},
					{
						val: "Returns",
						key: "returns",
					},
				];
			}
		} else if (field === "awardType") {
			newOptions =
				process.env.SPORT === "basketball"
					? [
							{
								val: "Won Championship",
								key: "champion",
							},
							{
								val: "Most Valuable Player",
								key: "mvp",
							},
							{
								val: "Finals MVP",
								key: "finals_mvp",
							},
							{
								val: "Defensive Player of the Year",
								key: "dpoy",
							},
							{
								val: "Sixth Man of the Year",
								key: "smoy",
							},
							{
								val: "Most Improved Player",
								key: "mip",
							},
							{
								val: "Rookie of the Year",
								key: "roy",
							},
							{
								val: "First Team All-League",
								key: "first_team",
							},
							{
								val: "Second Team All-League",
								key: "second_team",
							},
							{
								val: "Third Team All-League",
								key: "third_team",
							},
							{
								val: "All-League",
								key: "all_league",
							},
							{
								val: "First Team All-Defensive",
								key: "first_def",
							},
							{
								val: "Second Team All-Defensive",
								key: "second_def",
							},
							{
								val: "Third Team All-Defensive",
								key: "third_def",
							},
							{
								val: "All-Defensive",
								key: "all_def",
							},
							{
								val: "All-Star",
								key: "all_star",
							},
							{
								val: "All-Star MVP",
								key: "all_star_mvp",
							},
							{
								val: "League Scoring Leader",
								key: "ppg_leader",
							},
							{
								val: "League Rebounding Leader",
								key: "rpg_leader",
							},
							{
								val: "League Assists Leader",
								key: "apg_leader",
							},
							{
								val: "League Steals Leader",
								key: "spg_leader",
							},
							{
								val: "League Blocks Leader",
								key: "bpg_leader",
							},
					  ]
					: [
							{
								val: "Won Championship",
								key: "champion",
							},
							{
								val: "Most Valuable Player",
								key: "mvp",
							},
							{
								val: "Finals MVP",
								key: "finals_mvp",
							},
							{
								val: "Defensive Player of the Year",
								key: "dpoy",
							},
							{
								val: "Offensive Rookie of the Year",
								key: "oroy",
							},
							{
								val: "Defensive Rookie of the Year",
								key: "droy",
							},
							{
								val: "First Team All-League",
								key: "first_team",
							},
							{
								val: "Second Team All-League",
								key: "second_team",
							},
							{
								val: "All-League",
								key: "all_league",
							},
					  ];
		} else if (field === "eventType") {
			newOptions = [
				{
					val: "All Types",
					key: "all",
				},
				{
					val: "Draft",
					key: "draft",
				},
				{
					val: "FA Signed",
					key: "freeAgent",
				},
				{
					val: "Re-signed",
					key: "reSigned",
				},
				{
					val: "Released",
					key: "release",
				},
				{
					val: "Trades",
					key: "trade",
				},
			];
		} else if (field === "teamOpponent") {
			newOptions = [
				{
					val: "Team",
					key: "team",
				},
				{
					val: "Opponent",
					key: "opponent",
				},
			];
		} else if (field === "teamOpponentAdvanced") {
			newOptions = Object.keys(
				overrides.common.constants.TEAM_STATS_TABLES,
			).map(key => {
				return {
					val: overrides.common.constants.TEAM_STATS_TABLES[key].name,
					key,
				};
			});
		} else if (field === "teamRecordType") {
			newOptions = [
				{
					val: "By Team",
					key: "team",
				},
				{
					val: "By Conference",
					key: "conf",
				},
				{
					val: "By Division",
					key: "div",
				},
			];
		} else {
			throw new Error(`Unknown Dropdown field: ${field}`);
		}

		setOptions(newOptions);
	}, [field, state]);

	return options;
};

export default useDropdownOptions;
