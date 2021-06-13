import PropTypes from "prop-types";
import type { ReactNode } from "react";
import { getCols, gradientStyleFactory, helpers, prefixStatOpp } from "../util";
import useTitleBar from "../hooks/useTitleBar";
import { DataTable, PlusMinus, MoreLinks } from "../components";
import type { View } from "../../common/types";
import { isSport } from "../../common";

const TeamStats = ({
	allStats,
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
	}
	if (ties) {
		basicColNames.push("T");
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

	// Account for # column
	if (superCols) {
		superCols[0].colspan += 1;
	}

	const cols = getCols(
		...basicColNames,
		...stats.map(stat => {
			if (stat.startsWith("opp")) {
				return `stat:${stat.charAt(3).toLowerCase()}${stat.slice(4)}`;
			}
			return `stat:${stat}`;
		}),
	);
	cols[0].sortSequence = [];
	cols[0].noSearch = true;

	if (teamOpponent.endsWith("ShotLocations")) {
		cols[cols.length - 7].title = "M";
		cols[cols.length - 6].title = "A";
		cols[cols.length - 5].title = "%";
	}

	const otherStatColumns = ["won", "lost"];
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

	const rows = teams.map(t => {
		const data: { [key: string]: ReactNode } = {
			"#": null,
			abbrev: (
				<a
					href={helpers.leagueUrl([
						"roster",
						`${t.seasonAttrs.abbrev}_${t.tid}`,
						season,
					])}
				>
					{t.seasonAttrs.abbrev}
				</a>
			),
			gp: t.stats.gp,
			won: t.seasonAttrs.won,
			lost: t.seasonAttrs.lost,
		};

		if (otl) {
			data.otl = t.seasonAttrs.otl;
		}
		if (ties) {
			data.tied = t.seasonAttrs.tied;
		}
		if (usePts) {
			data.ptsPts = Math.round(t.seasonAttrs.pts);
			data.ptsPct = helpers.roundWinp(t.seasonAttrs.ptsPct);
		} else {
			data.winp = helpers.roundWinp(t.seasonAttrs.winp);
		}

		for (const stat of stats) {
			const value = t.stats.hasOwnProperty(stat)
				? (t.stats as any)[stat]
				: (t.seasonAttrs as any)[stat];
			data[stat] = helpers.roundStat(value, stat);
		}

		if (isSport("basketball") || isSport("hockey")) {
			const plusMinusCols = [prefixStatOpp(teamOpponent, "mov"), "nrtg"];
			for (const plusMinusCol of plusMinusCols) {
				if (data.hasOwnProperty(plusMinusCol)) {
					data[plusMinusCol] = (
						<PlusMinus>{(t.stats as any)[plusMinusCol]}</PlusMinus>
					);
				}
			}
		}

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

			return {
				key: t.tid,
				data: Object.values(data),
			};
		}

		return {
			key: t.tid,
			data: Object.values(data),
		};
	});

	return (
		<>
			<MoreLinks type="teamStats" page="team_stats" season={season} />

			<DataTable
				cols={cols}
				defaultSort={[3, "desc"]}
				name={`TeamStats${teamOpponent}`}
				rankCol={0}
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

TeamStats.propTypes = {
	allStats: PropTypes.object.isRequired,
	playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
	season: PropTypes.number.isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	superCols: PropTypes.array,
	teamOpponent: PropTypes.oneOf([
		"advanced",
		"opponent",
		"team",
		"teamShotLocations",
		"opponentShotLocations",
	]).isRequired,
	teams: PropTypes.arrayOf(PropTypes.object).isRequired,
	otl: PropTypes.bool.isRequired,
	ties: PropTypes.bool.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default TeamStats;
