import PropTypes from "prop-types";
import { CountryFlag, DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";
import { PLAYER } from "../../common";
import { dataTableWrappedMood } from "../components/Mood";
import { wrappedHeight } from "../components/Height";
import { wrappedWeight } from "../components/Weight";
import getTemplate from "../util/columns/getTemplate";

const PlayerBios = ({
	abbrev,
	currentSeason,
	challengeNoRatings,
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
				legacyCols={cols}
				defaultSort={["col1", "asc"]}
				name="PlayerBios"
				pagination
				rows={rows}
			/>
		</>
	);
};

PlayerBios.propTypes = {
	abbrev: PropTypes.string.isRequired,
	currentSeason: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	season: PropTypes.number.isRequired,
	config: PropTypes.object.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default PlayerBios;
