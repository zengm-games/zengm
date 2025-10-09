import { DataTable, MoreLinks, PlusMinus } from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers } from "../util/index.ts";
import type { View } from "../../common/types.ts";
import { isSport } from "../../common/index.ts";
import { wrappedAgeAtDeath } from "../components/AgeAtDeath.tsx";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import { expandFieldingStats } from "../util/expandFieldingStats.baseball.ts";
import type { DataTableRow } from "../components/DataTable/index.tsx";

export const formatStatGameHigh = (
	ps: any,
	stat: string,
	statType?: string,
) => {
	if (isSport("baseball")) {
		// Catcher-only fielding stats
		if (
			ps.pos !== "C" &&
			(stat === "pb" || stat === "sbF" || stat === "csF" || stat === "csp")
		) {
			return null;
		}
	}

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

	if (isSport("basketball") && (stat === "pm100" || stat === "onOff100")) {
		return <PlusMinus>{ps[stat]}</PlusMinus>;
	}

	return helpers.roundStat(ps[stat], stat, statType === "totals");
};

const PlayerStats = ({
	abbrev,
	players,
	playoffs,
	season,
	statType,
	stats,
	superCols,
	userTid,
}: View<"playerStats">) => {
	useTitleBar({
		title: "Player Stats",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "player_stats",
		dropdownFields: {
			teamsAndAllWatchPlayoffs: abbrev,
			seasonsAndCareer: season,
			statTypesAdv: statType,
			playoffsCombined: playoffs,
		},
	});

	const cols = getCols([
		"Name",
		"Pos",
		"Age",
		"Team",
		...(season === "all" ? ["Season"] : []),
		...stats.map((stat) =>
			stat === "pos"
				? "Pos"
				: `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`,
		),
	]);

	if (statType === "shotLocations") {
		cols.at(-7)!.title = "M";
		cols.at(-6)!.title = "A";
		cols.at(-5)!.title = "%";
	}

	let sortCol = cols.length - 1;
	if (isSport("football")) {
		if (statType === "passing") {
			sortCol = 9;
		} else if (statType === "rushing") {
			sortCol = cols.length - 3;
		} else if (statType === "defense") {
			sortCol = 16;
		} else if (statType === "kicking") {
			sortCol = cols.length - 11;
		} else if (statType === "returns") {
			sortCol = 12;
		}
	}

	let statsProperty:
		| "careerStats"
		| "careerStatsPlayoffs"
		| "careerStatsCombined"
		| "stats";
	if (season === "career") {
		statsProperty =
			playoffs === "playoffs"
				? "careerStatsPlayoffs"
				: playoffs === "combined"
					? "careerStatsCombined"
					: "careerStats";
	} else {
		statsProperty = "stats";
	}

	if (isSport("baseball") && statType === "fielding") {
		players = expandFieldingStats({
			rows: players,
			stats,
			statsProperty,
		});
	}

	const rows: DataTableRow[] = players.map((p) => {
		// HACKS to show right stats, info
		let actualAbbrev;
		let actualTid;
		if (season === "career") {
			actualAbbrev = p.abbrev;
			actualTid = p.tid;
		} else {
			actualAbbrev = p.stats.abbrev;
			actualTid = p.stats.tid;
		}
		if (statsProperty !== "stats") {
			p.stats = p[statsProperty];
		}

		const statsRow = stats.map((stat) =>
			formatStatGameHigh(p.stats, stat, statType),
		);

		let key;
		if (isSport("baseball") && statType === "fielding") {
			key = `${p.pid}-${p.stats.season}-${p.stats.pos}`;
		} else if (season === "all") {
			key = `${p.pid}-${p.stats.season}`;
		} else {
			key = p.pid;
		}

		const numericSeason = season === "career" ? undefined : p.stats.season;

		return {
			key,
			metadata: {
				type: "player",
				pid: p.pid,
				season: season === "all" ? p.stats.season : season,
				playoffs,
			},
			data: [
				wrappedPlayerNameLabels({
					pid: p.pid,
					injury: p.injury,
					season: numericSeason,
					skills: p.ratings.skills,
					jerseyNumber: p.stats.jerseyNumber,
					watch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
					awards: p.awards,
					awardsSeason: numericSeason,
				}),
				p.pos,

				// Only show age at death for career totals, otherwise just use current age
				season === "career"
					? wrappedAgeAtDeath(p.age, p.ageAtDeath)
					: p.stats.season - p.born.year,

				<a
					href={helpers.leagueUrl([
						"roster",
						`${actualAbbrev}_${actualTid}`,
						...(season === "career" ? [] : [p.stats.season]),
					])}
				>
					{actualAbbrev}
				</a>,

				...(season === "all" ? [p.stats.season] : []),

				...statsRow,
			],
			classNames: {
				"table-danger": p.hof,
				"table-info": actualTid === userTid,
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
				defaultSort={[sortCol, "desc"]}
				defaultStickyCols={window.mobile ? 0 : 1}
				name={`PlayerStats${statType}`}
				rows={rows}
				superCols={superCols}
				pagination
			/>
		</>
	);
};

export default PlayerStats;
