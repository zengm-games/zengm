import { DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import type { View } from "../../common/types";
import { PLAYER } from "../../common";
import { Player } from "../../common/types";
import { ColTemp } from "../util/columns/getCols";
import getTemplate from "../util/columns/getTemplate";

const Injuries = ({
	abbrev,
	challengeNoRatings,
	godMode,
	injuries,
	season,
	config,
	userTid,
}: View<"injuries">) => {
	useTitleBar({
		title: "Injuries",
		dropdownView: "injuries",
		dropdownFields: { teamsAndAllWatch: abbrev, seasonsAndCurrent: season },
	});

	const cols = [...config.columns];

	const rows = injuries.map(p => {
		return {
			key: p.pid,
			data: Object.fromEntries(
				cols.map(col => [col.key, getTemplate(p, col, config)]),
			),
		};
	});

	// const rows = injuries.map((p, i) => {
	// 	const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;
	//
	// 	return {
	// 		key: season === "current" ? p.pid : i,
	// 		data: [
	// 			<PlayerNameLabels
	// 				pid={p.pid}
	// 				skills={p.ratings.skills}
	// 				season={typeof season === "number" ? season : undefined}
	// 				watch={p.watch}
	// 			>
	// 				{p.name}
	// 			</PlayerNameLabels>,
	// 			p.ratings.pos,
	// 			<a
	// 				href={helpers.leagueUrl([
	// 					"roster",
	// 					`${p.stats.abbrev}_${p.stats.tid}`,
	// 					season,
	// 				])}
	// 			>
	// 				{p.stats.abbrev}
	// 			</a>,
	// 			p.age,
	// 			showRatings ? p.ratings.ovr : null,
	// 			showRatings ? p.ratings.pot : null,
	// 			...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
	// 			p.type,
	// 			p.games,
	// 			showRatings ? p.ovrDrop : null,
	// 			showRatings ? p.potDrop : null,
	// 		],
	// 		classNames: {
	// 			"table-danger": p.hof,
	// 			"table-info": p.stats.tid === userTid,
	// 		},
	// 	};
	// });

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
					defaultSort={["Ovr", "desc"]}
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
