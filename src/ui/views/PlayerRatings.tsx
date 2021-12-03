import PropTypes from "prop-types";
import { DataTable, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import getTemplate from "../util/columns/getTemplate";

const PlayerRatings = ({
	abbrev,
	challengeNoRatings,
	currentSeason,
	players,
	config,
	season,
	userTid,
}: View<"playerRatings">) => {
	useTitleBar({
		title: "Player Ratings",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "player_ratings",
		dropdownFields: { teamsAndAllWatch: abbrev, seasons: season },
	});

	const cols = config.columns;

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: Object.fromEntries(
				cols.map(col => [col.key, getTemplate(p, col, {})]),
			),
		};
	});

	console.log(players[0]);

	return (
		<div>
			<MoreLinks type="playerRatings" page="player_ratings" season={season} />

			{challengeNoRatings ? (
				<p className="alert alert-danger d-inline-block">
					<b>Challenge Mode:</b> All player ratings are hidden, except for
					retired players.
				</p>
			) : null}

			<p>
				Players on your team are
				<span className="text-info">highlighted in blue</span>. Players in the
				Hall of Fame are <span className="text-danger">highlighted in red</span>
				.
			</p>

			<DataTable
				cols={cols}
				config={config}
				defaultSort={["Ovr", "desc"]}
				name="PlayerRatings"
				pagination
				rows={rows}
			/>
		</div>
	);
};

PlayerRatings.propTypes = {
	abbrev: PropTypes.string.isRequired,
	currentSeason: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	config: PropTypes.object.isRequired,
	season: PropTypes.number.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default PlayerRatings;
