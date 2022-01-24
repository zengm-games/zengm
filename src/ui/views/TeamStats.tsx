import type { ReactNode } from "react";
import { getCols, gradientStyleFactory, helpers, prefixStatOpp } from "../util";
import useTitleBar from "../hooks/useTitleBar";
import { DataTable, PlusMinus, MoreLinks } from "../components";
import type { View } from "../../common/types";
import { isSport } from "../../common";
import { formatMaybeInteger } from "./LeagueStats";

const TeamStats = ({
	allStats,
	averages,
	playoffs,
	season,
	stats,
	superCols,
	teamOpponent,
	teams,
	ties,
	otl,
	usePts,
	userTid,
}: View<"teamStats">) => {
	useTitleBar({
		title: "Team Stats",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "team_stats",
		dropdownFields: {
			seasons: season,
			teamOpponentAdvanced: teamOpponent,
			playoffs,
		},
	});

	const basicColNames = ["#", "Team", "stat:gp", "W", "L"];
	if (otl) {
		basicColNames.push("OTL");
		if (superCols) {
			superCols[0].colspan += 1;
		}
	}
	if (ties) {
		basicColNames.push("T");
		if (superCols) {
			superCols[0].colspan += 1;
		}
	}
	if (usePts) {
		basicColNames.push("PTS");
		basicColNames.push("PTS%");
		if (superCols) {
			superCols[0].colspan += 2;
		}
	} else {
		basicColNames.push("%");
		if (superCols) {
			superCols[0].colspan += 1;
		}
	}
	basicColNames.push("AvgAge");
	if (superCols) {
		superCols[0].colspan += 1;
	}

	// Account for # column
	if (superCols) {
		superCols[0].colspan += 1;
	}

	const cols = getCols(
		[
			...basicColNames,
			...stats.map(stat => {
				if (stat.startsWith("opp")) {
					return `stat:${stat.charAt(3).toLowerCase()}${stat.slice(4)}`;
				}
				return `stat:${stat}`;
			}),
		],
		{
			"#": {
				sortSequence: [],
				noSearch: true,
			},
		},
	);

	if (teamOpponent.endsWith("ShotLocations")) {
		cols[cols.length - 7].title = "M";
		cols[cols.length - 6].title = "A";
		cols[cols.length - 5].title = "%";
	}

	const otherStatColumns = ["won", "lost", "age"];
	if (otl) {
		otherStatColumns.push("otl");
	}
	if (ties) {
		otherStatColumns.push("tied");
	}
	if (usePts) {
		otherStatColumns.push("pts");
		otherStatColumns.push("ptsPct");
	} else {
		otherStatColumns.push("winp");
	}

	const gradientStyle = gradientStyleFactory(
		1,
		Math.round(0.35 * teams.length),
		Math.round(0.65 * teams.length),
		teams.length,
	);

	const makeRowObject = (
		teamStats: typeof teams[number]["stats"],
		teamSeasonAttrs: typeof teams[number]["seasonAttrs"],
	) => {
		const data: { [key: string]: ReactNode } = {
			gp: formatMaybeInteger(teamStats.gp),
			won: formatMaybeInteger(teamSeasonAttrs.won),
			lost: formatMaybeInteger(teamSeasonAttrs.lost),
		};

		if (otl) {
			data.otl = formatMaybeInteger(teamSeasonAttrs.otl);
		}
		if (ties) {
			data.tied = formatMaybeInteger(teamSeasonAttrs.tied);
		}
		if (usePts) {
			data.ptsPts = Math.round(teamSeasonAttrs.pts);
			data.ptsPct = helpers.roundWinp(teamSeasonAttrs.ptsPct);
		} else {
			data.winp = helpers.roundWinp(teamSeasonAttrs.winp);
		}

		data.avgAge =
			teamSeasonAttrs.avgAge !== undefined
				? teamSeasonAttrs.avgAge.toFixed(1)
				: null;

		for (const stat of stats) {
			const value = teamStats.hasOwnProperty(stat)
				? (teamStats as any)[stat]
				: (teamSeasonAttrs as any)[stat];
			data[stat] = helpers.roundStat(value, stat);
		}

		if (isSport("basketball") || isSport("hockey")) {
			const plusMinusCols = [prefixStatOpp(teamOpponent, "mov"), "nrtg"];
			for (const plusMinusCol of plusMinusCols) {
				if (data.hasOwnProperty(plusMinusCol)) {
					data[plusMinusCol] = (
						<PlusMinus>{(teamStats as any)[plusMinusCol]}</PlusMinus>
					);
				}
			}
		}

		return data;
	};

	const rows = teams.map(t => {
		const data = makeRowObject(t.stats, t.seasonAttrs);

		// This is our team.
		if (userTid === t.tid) {
			// Color stat values accordingly.
			for (const [statType, value] of Object.entries(data)) {
				if (
					(!stats.includes(statType) && !otherStatColumns.includes(statType)) ||
					!allStats[statType]
				) {
					continue;
				}

				// Determine our team's percentile for this stat type. Closer to the start is better.
				const statTypeValue = t.stats.hasOwnProperty(statType)
					? (t.stats as any)[statType]
					: (t.seasonAttrs as any)[statType];
				const rank = teams.length - allStats[statType].indexOf(statTypeValue);

				data[statType] = {
					style: gradientStyle(rank),
					value,
				};
			}
		}

		return {
			key: t.tid,
			data: [
				null,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${t.seasonAttrs.abbrev}_${t.tid}`,
						season,
					])}
				>
					{t.seasonAttrs.abbrev}
				</a>,
				...Object.values(data),
			],
		};
	});

	const footer = averages
		? [
				null,
				"Avg",
				...Object.values(makeRowObject(averages as any, averages as any)),
		  ]
		: undefined;

	return (
		<>
			<MoreLinks type="teamStats" page="team_stats" season={season} />

			<DataTable
				cols={cols}
				defaultSort={[3, "desc"]}
				name={`TeamStats${teamOpponent}`}
				rankCol={0}
				rows={rows}
				footer={footer}
				superCols={superCols}
			/>
		</>
	);
};

export default TeamStats;
