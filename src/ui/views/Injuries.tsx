import { DataTable } from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers } from "../util/index.ts";
import type { View } from "../../common/types.ts";
import { PLAYER } from "../../common/index.ts";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { wrappedCheckmarkOrCross } from "../components/CheckmarkOrCross.tsx";

const Injuries = ({
	abbrev,
	challengeNoRatings,
	currentSeason,
	injuries,
	season,
	stats,
	userTid,
}: View<"injuries">) => {
	useTitleBar({
		title: "Injuries",
		dropdownView: "injuries",
		dropdownFields: {
			teamsAndAllWatchPlayoffs: abbrev,
			seasonsAndCurrent: season,
		},
	});

	const cols = getCols([
		"Name",
		"Pos",
		"Team",
		"Age",
		"Ovr",
		"Pot",
		...stats.map((stat) => `stat:${stat}`),
		"TypeInjury",
		"Games",
		"Playing Through?",
		"Ovr Drop",
		"Pot Drop",
	]);

	const numericSeason = typeof season === "number" ? season : currentSeason;

	const rows: DataTableRow[] = injuries.map((p, i) => {
		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

		return {
			key: season === "current" ? p.pid : i,
			metadata: {
				type: "player",
				pid: p.pid,
				season: numericSeason,
				playoffs: "regularSeason",
			},
			data: [
				wrappedPlayerNameLabels({
					pid: p.pid,
					season: typeof season === "number" ? season : undefined,
					skills: p.ratings.skills,
					watch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
					awards: p.awards,
					awardsSeason: numericSeason,
				}),
				p.ratings.pos,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${p.stats.abbrev}_${p.stats.tid}`,
						season,
					])}
				>
					{p.stats.abbrev}
				</a>,
				p.age,
				showRatings ? p.ratings.ovr : null,
				showRatings ? p.ratings.pot : null,
				...stats.map((stat) => helpers.roundStat(p.stats[stat], stat)),
				p.type,
				p.games,
				wrappedCheckmarkOrCross({ hideCross: true, success: p.playingThrough }),
				showRatings ? p.ovrDrop : null,
				showRatings ? p.potDrop : null,
			],
			classNames: {
				"table-danger": p.hof,
				"table-info": p.stats.tid === userTid,
			},
		};
	});

	return (
		<>
			<p>
				Players on your team are{" "}
				<span className="text-info">highlighted in blue</span>. Players in the
				Hall of Fame are <span className="text-danger">highlighted in red</span>
				.
			</p>

			{rows.length > 0 ? (
				<DataTable
					cols={cols}
					defaultSort={[cols.length - 3, "asc"]}
					defaultStickyCols={window.mobile ? 0 : 1}
					name="Injuries"
					pagination
					rows={rows}
				/>
			) : (
				<p>No injured players found.</p>
			)}
		</>
	);
};

export default Injuries;
