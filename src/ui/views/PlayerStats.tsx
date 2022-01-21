import PropTypes from "prop-types";
import { DataTable, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { SortOrder, View } from "../../common/types";
import { isSport } from "../../common";
import getTemplate from "../util/columns/getTemplate";

export const formatStatGameHigh = (
	ps: any,
	stat: string,
	statType?: string,
) => {
	if (stat.endsWith("Max")) {
		if (!Array.isArray(ps[stat])) {
			return null;
		}

		// Can be [max, gid] or (for career stats) [max, gid, abbrev, tid, season]
		const row = ps[stat] as unknown as
			| [number, number]
			| [number, number, string, number, number];

		const abbrev = row.length > 3 ? row[2] : ps.abbrev;
		const tid = row.length > 3 ? row[3] : ps.tid;
		const season = row.length > 3 ? row[4] : ps.season;

		return (
			<a
				href={helpers.leagueUrl([
					"game_log",
					`${abbrev}_${tid}`,
					season as any,
					row[1],
				])}
			>
				{helpers.roundStat(row[0], stat, statType === "totals")}
			</a>
		);
	}

	return helpers.roundStat(ps[stat], stat, statType === "totals");
};

const PlayerStats = ({
	abbrev,
	players,
	playoffs,
	season,
	statType,
	config,
	superCols,
	userTid,
}: View<"playerStats">) => {
	useTitleBar({
		title: "Player Stats",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "player_stats",
		dropdownFields: {
			teamsAndAllWatch: abbrev,
			seasonsAndCareer: season,
			statTypesAdv: statType,
			playoffs,
		},
	});

	const cols = config.columns;

	let sortCol: string = cols[0].key ?? "col1";
	let sortDir: SortOrder = "asc";
	if (isSport("football")) {
		if (statType === "passing") {
			sortCol = "stat:passYds";
			sortDir = "desc";
		} else if (statType === "rushing") {
			sortCol = "stat:rusRecTD";
			sortDir = "desc";
		} else if (statType === "defense") {
			sortCol = "stat:defSk";
			sortDir = "desc";
		} else if (statType === "kicking") {
			sortCol = "stat:fgPct";
			sortDir = "desc";
		} else if (statType === "returns") {
			sortCol = "stat:krYds";
			sortDir = "desc";
		}
	}

	const rows = players.map(p => {
		if (season === "career") {
			p.stats = p.careerStats;
			if (playoffs === "playoffs") {
				p.stats = p.careerStatsPlayoffs;
			}
		}
		return {
			key: season === "all" ? `${p.pid}-${p.stats.season}` : p.pid,
			data: Object.fromEntries(
				cols.map(col => [col.key, getTemplate(p, col, config)]),
			),
			classNames: {
				"table-danger": p.hof,
				"table-info": p.stats.tid === userTid || p.tid === userTid,
			},
		};
	});

	return (
		<>
			<MoreLinks
				type="playerStats"
				page="player_stats"
				season={typeof season === "number" ? season : undefined}
				statType={statType}
				keepSelfLink
			/>

			<p>
				Players on your team are{" "}
				<span className="text-info">highlighted in blue</span>. Players in the
				Hall of Fame are <span className="text-danger">highlighted in red</span>
				.
			</p>

			<DataTable
				cols={cols}
				config={config}
				defaultSort={[sortCol, sortDir]}
				name={`PlayerStats${statType}`}
				rows={rows}
				superCols={superCols}
				pagination
			/>
		</>
	);
};

PlayerStats.propTypes = {
	abbrev: PropTypes.string.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
	statType: PropTypes.string.isRequired,
	config: PropTypes.object.isRequired,
	superCols: PropTypes.array,
	userTid: PropTypes.number,
};

export default PlayerStats;
