import { DataTable } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import getTemplate from "../util/columns/getTemplate";

const PlayerBios = ({
	abbrev,
	currentSeason,
	players,
	season,
	config,
	userTid,
}: View<"playerBios">) => {
	useTitleBar({
		title: "Player Bios",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "player_bios",
		dropdownFields: { teamsAndAllWatch: abbrev, seasons: season },
	});

	const cols = config.columns;

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: Object.fromEntries(
				cols.map(col => [col.key, getTemplate(p, col, config)]),
			),
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

			<DataTable
				cols={cols}
				config={config}
				defaultSort={["Name", "asc"]}
				name="PlayerBios"
				pagination
				rows={rows}
			/>
		</>
	);
};

export default PlayerBios;
