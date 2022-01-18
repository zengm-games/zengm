import { DataTable, MoreLinks, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";
import { isSport } from "../../common";
import { wrappedAgeAtDeath } from "../components/AgeAtDeath";

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
			teamsAndAllWatch: abbrev,
			seasonsAndCareer: season,
			statTypesAdv: statType,
			playoffs,
		},
	});

	const cols = getCols([
		"Name",
		"Pos",
		"Age",
		"Team",
		...(season === "all" ? ["Season"] : []),
		...stats.map(
			stat => `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`,
		),
	]);

	if (statType === "shotLocations") {
		cols[cols.length - 7].title = "M";
		cols[cols.length - 6].title = "A";
		cols[cols.length - 5].title = "%";
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

	const rows = players.map(p => {
		let pos;
		if (Array.isArray(p.ratings) && p.ratings.length > 0) {
			pos = p.ratings.at(-1).pos;
		} else if (p.ratings.pos) {
			pos = p.ratings.pos;
		} else {
			pos = "?";
		}

		// HACKS to show right stats, info
		let actualAbbrev;
		let actualTid;
		if (season === "career") {
			p.stats = p.careerStats;
			actualAbbrev = p.abbrev;
			actualTid = p.tid;
			if (playoffs === "playoffs") {
				p.stats = p.careerStatsPlayoffs;
			}
		} else {
			actualAbbrev = p.stats.abbrev;
			actualTid = p.stats.tid;
		}

		const statsRow = stats.map(stat =>
			formatStatGameHigh(p.stats, stat, statType),
		);

		const key = season === "all" ? `${p.pid}-${p.stats.season}` : p.pid;

		return {
			key,
			data: [
				{
					value: (
						<PlayerNameLabels
							injury={p.injury}
							jerseyNumber={p.stats.jerseyNumber}
							pid={p.pid}
							season={season === "career" ? undefined : p.stats.season}
							skills={p.ratings.skills}
							watch={p.watch}
						>
							{p.nameAbbrev}
						</PlayerNameLabels>
					),
					sortValue: p.name,
					searchValue: p.name,
				},
				pos,

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
				name={`PlayerStats${statType}`}
				rows={rows}
				superCols={superCols}
				pagination
			/>
		</>
	);
};

export default PlayerStats;
