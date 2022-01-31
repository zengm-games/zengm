import { DataTable } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker } from "../util";
import type { View } from "../../common/types";
import getTemplate from "../util/columns/getTemplate";

const Injuries = ({
	abbrev,
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

	const rows = injuries.map(p => {
		return {
			key: p.pid,
			data: Object.fromEntries(
				config.columns.map(col => [col.key, getTemplate(p, col, config)]),
			),
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
					cols={config.columns}
					config={config}
					defaultSort={["Games", "asc"]}
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
