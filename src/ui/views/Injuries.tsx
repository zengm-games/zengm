import { DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import type { View } from "../../common/types";
import { PLAYER } from "../../common";

const Injuries = ({
	abbrev,
	challengeNoRatings,
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
				<PlayerNameLabels
					pid={p.pid}
					skills={p.ratings.skills}
					season={typeof season === "number" ? season : undefined}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
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
						await toWorker("main", "clearInjury", "all");
					}}
				>
					Heal All Injuries
				</button>
			) : null}

			{rows.length > 0 ? (
				<DataTable
					cols={cols}
					defaultSort={[cols.length - 3, "asc"]}
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
