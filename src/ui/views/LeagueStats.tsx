import type { ReactNode } from "react";
import { getCols, helpers } from "../util/index.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { DataTable, MoreLinks } from "../components/index.tsx";
import type { View } from "../../common/types.ts";
import { isSport } from "../../common/index.ts";
import { expandFieldingStats } from "../util/expandFieldingStats.baseball.ts";

export const formatMaybeInteger = (x: number) =>
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
		basicColNames.push("PTS", "PTS%");
	} else {
		basicColNames.push("%");
	}
	basicColNames.push("AvgAge");

	let actualSuperCols;
	if (superCols) {
		actualSuperCols = helpers.deepCopy(superCols);
		if (actualSuperCols) {
			actualSuperCols[0].colspan += 1;
		}

		if (actualSuperCols) {
			actualSuperCols[0].colspan += 1;
			if (otl) {
				actualSuperCols[0].colspan += 1;
			}
			if (ties) {
				actualSuperCols[0].colspan += 1;
			}
			if (tid >= 0) {
				actualSuperCols[0].colspan -= 1;
			}
			if (usePts) {
				actualSuperCols[0].colspan += 2;
			} else {
				actualSuperCols[0].colspan += 1;
			}
		}
	}

	const cols = getCols([
		...basicColNames,
		...stats.map((stat) => {
			if (stat.startsWith("opp")) {
				return `stat:${stat.charAt(3).toLowerCase()}${stat.slice(4)}`;
			}
			return stat === "pos" ? "Pos" : `stat:${stat}`;
		}),
	]);

	if (teamOpponent.endsWith("ShotLocations")) {
		cols.at(-7)!.title = "M";
		cols.at(-6)!.title = "A";
		cols.at(-5)!.title = "%";
	}

	if (
		isSport("baseball") &&
		(teamOpponent === "fielding" || teamOpponent === "oppFielding")
	) {
		seasons = expandFieldingStats({
			rows: seasons,
			stats,
			allPositions: true,
			statsProperty: "stats",
		});
	}

	const rows = seasons.map((s) => {
		const otherStatColumns = ["won", "lost"];
		if (otl) {
			otherStatColumns.push("otl");
		}
		if (ties) {
			otherStatColumns.push("tied");
		}
		if (usePts) {
			otherStatColumns.push("pts", "ptsPct");
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

		data.gp = formatMaybeInteger((s.stats as any).gp);
		data.won = formatMaybeInteger((s.stats as any).won);
		data.lost = formatMaybeInteger((s.stats as any).lost);

		if (otl) {
			data.otl = formatMaybeInteger((s.stats as any).otl);
		}
		if (ties) {
			data.tied = formatMaybeInteger((s.stats as any).tied);
		}
		if (usePts) {
			data.ptsPts = formatMaybeInteger((s.stats as any).ptsPts);
			data.ptsPct = helpers.roundWinp((s.stats as any).ptsPct);
		} else {
			data.winp = helpers.roundWinp((s.stats as any).winp);
		}

		data.avgAge = Number.isNaN(s.stats.avgAge)
			? null
			: (s.stats.avgAge as number).toFixed(1);

		for (const stat of stats) {
			data[stat] = helpers.roundStat((s.stats as any)[stat], stat);
		}

		return {
			key:
				isSport("baseball") &&
				(teamOpponent === "fielding" || teamOpponent === "oppFielding")
					? `${s.season}-${(s.stats as any).pos}`
					: s.season,
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
				defaultStickyCols={1}
				name={`LeagueStats${teamOpponent}`}
				pagination={pagination}
				rows={rows}
				superCols={actualSuperCols}
			/>
		</>
	);
};

export default LeagueStats;
