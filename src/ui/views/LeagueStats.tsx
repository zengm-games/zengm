import React, { ReactNode } from "react";
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
	if (ties) {
		basicColNames.push("T");
	}

	if (superCols) {
		superCols[0].colspan += 1;
		if (ties) {
			superCols[0].colspan += 1;
		}
		if (tid >= 0) {
			superCols[0].colspan -= 1;
		}
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

	if (teamOpponent.endsWith("ShotLocations")) {
		cols[cols.length - 3].title = "M";
		cols[cols.length - 2].title = "A";
		cols[cols.length - 1].title = "%";
	}

	const rows = seasons.map(s => {
		const otherStatColumns = ["won", "lost"];
		if (ties) {
			otherStatColumns.push("tied");
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

		if (ties) {
			data.tied = formatMaybeInteger(s.stats.tied);
		}

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
				name={`TeamStats${teamOpponent}`}
				pagination={pagination}
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default LeagueStats;
