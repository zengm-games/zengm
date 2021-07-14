import type { ReactNode } from "react";
import { getCols, helpers } from "../util";
import useTitleBar from "../hooks/useTitleBar";
import { DataTable, MoreLinks } from "../components";
import type { View } from "../../common/types";

const formatMaybeInteger = (x: number) =>
	Number.isInteger(x) ? String(x) : x.toFixed(1);

const LeagueStats = ({
	abbrev,
	playoffs,
	seasons,
	stats,
	superCols,
	teamOpponent,
	tid,
	ties,
	otl,
	usePts,
}: View<"leagueStats">) => {
	useTitleBar({
		title: "League Stats",
		dropdownView: "league_stats",
		dropdownFields: {
			teamsAndAll: abbrev,
			teamAdvanced: teamOpponent,
			playoffs,
		},
	});

	const basicColNames =
		tid < 0
			? ["Season", "# Teams", "stat:gp", "W", "L"]
			: ["Season", "stat:gp", "W", "L"];
	if (otl) {
		basicColNames.push("OTL");
	}
	if (ties) {
		basicColNames.push("T");
	}
	if (usePts) {
		basicColNames.push("PTS");
		basicColNames.push("PTS%");
	} else {
		basicColNames.push("%");
	}
	basicColNames.push("AvgAge");
	if (superCols) {
		superCols[0].colspan += 1;
	}

	if (superCols) {
		superCols[0].colspan += 1;
		if (otl) {
			superCols[0].colspan += 1;
		}
		if (ties) {
			superCols[0].colspan += 1;
		}
		if (tid >= 0) {
			superCols[0].colspan -= 1;
		}
		if (usePts) {
			superCols[0].colspan += 2;
		} else {
			superCols[0].colspan += 1;
		}
	}

	const cols = getCols([
		...basicColNames,
		...stats.map(stat => {
			if (stat.startsWith("opp")) {
				return `stat:${stat.charAt(3).toLowerCase()}${stat.slice(4)}`;
			}
			return `stat:${stat}`;
		}),
	]);

	if (teamOpponent.endsWith("ShotLocations")) {
		cols[cols.length - 7].title = "M";
		cols[cols.length - 6].title = "A";
		cols[cols.length - 5].title = "%";
	}

	const rows = seasons.map(s => {
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

		// Create the cells for this row.
		const data: { [key: string]: ReactNode } = {
			season:
				abbrev === "all" ? (
					<a
						href={helpers.leagueUrl([
							"team_stats",
							s.season,
							teamOpponent,
							playoffs,
						])}
					>
						{s.season}
					</a>
				) : (
					<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`, s.season])}>
						{s.season}
					</a>
				),
		};

		if (abbrev === "all") {
			data.numTeams = s.numTeams;
		}

		data.gp = formatMaybeInteger(s.stats.gp);
		data.won = formatMaybeInteger(s.stats.won);
		data.lost = formatMaybeInteger(s.stats.lost);

		if (otl) {
			data.otl = formatMaybeInteger(s.stats.otl);
		}
		if (ties) {
			data.tied = formatMaybeInteger(s.stats.tied);
		}
		if (usePts) {
			data.ptsPts = formatMaybeInteger(s.stats.ptsPts);
			data.ptsPct = helpers.roundWinp(s.stats.ptsPct);
		} else {
			data.winp = helpers.roundWinp(s.stats.winp);
		}

		data.avgAge = Number.isNaN(s.stats.avgAge)
			? null
			: s.stats.avgAge.toFixed(1);

		for (const stat of stats) {
			data[stat] = helpers.roundStat(s.stats[stat], stat);
		}

		return {
			key: s.season,
			data: Object.values(data),
		};
	});

	const pagination = rows.length > 100;

	return (
		<>
			<MoreLinks type="league" page="league_stats" />
			<DataTable
				cols={cols}
				defaultSort={[0, "desc"]}
				name={`LeagueStats${teamOpponent}`}
				pagination={pagination}
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default LeagueStats;
