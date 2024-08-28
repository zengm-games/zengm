import { DataTable } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import type { View } from "../../common/types";
import { PLAYER } from "../../common";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";

const Injuries = ({
	abbrev,
	challengeNoRatings,
	currentSeason,
	godMode,
	injuries,
	season,
	stats,
	userTid,
}: View<"injuries">) => {
	useTitleBar({
		title: "Injuries",
		dropdownView: "injuries",
		dropdownFields: { teamsAndAllWatch: abbrev, seasonsAndCurrent: season },
	});

	const cols = getCols([
		"Name",
		"Pos",
		"Team",
		"Age",
		"Ovr",
		"Pot",
		...stats.map(stat => `stat:${stat}`),
		"TypeInjury",
		"Games",
		"Ovr Drop",
		"Pot Drop",
	]);

	const rows = injuries.map((p, i) => {
		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

		return {
			key: season === "current" ? p.pid : i,
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
					awardsSeason: typeof season === "number" ? season : currentSeason,
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
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
				p.type,
				p.games,
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

			{season === "current" && godMode && rows.length > 0 ? (
				<button
					className="btn btn-god-mode mb-3"
					onClick={async () => {
						await toWorker("main", "clearInjuries", "all");
					}}
				>
					Heal All Injuries
				</button>
			) : null}

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
