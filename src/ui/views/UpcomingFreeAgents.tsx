import PropTypes from "prop-types";
import { PHASE } from "../../common";
import { DataTable, MoreLinks, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";
import { dataTableWrappedMood } from "../components/Mood";
import { Player } from "../../common/types";
import { ColTemp } from "../util/columns/getCols";
import getTemplate from "../util/columns/getTemplate";

const UpcomingFreeAgents = ({
	challengeNoRatings,
	phase,
	players,
	projectedCapSpace,
	season,
	config,
	userTid,
}: View<"upcomingFreeAgents">) => {
	useTitleBar({
		title: "Upcoming Free Agents",
		dropdownView: "upcoming_free_agents",
		dropdownFields: { seasonsUpcoming: season },
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

	return (
		<>
			<MoreLinks type="freeAgents" page="upcoming_free_agents" />

			<p>
				Projected {season} cap space:{" "}
				{helpers.formatCurrency(projectedCapSpace / 1000, "M")}
			</p>

			{phase !== PHASE.RESIGN_PLAYERS ? (
				<p>
					Keep in mind that many of these players will choose to re-sign with
					their current team rather than become free agents. Also, even if a
					player is &gt;99% willing to re-sign with his team, he still may
					become a free agent if his team does not want him.
				</p>
			) : null}

			<p>
				"Projected mood" is based on projected salary demands, not on projected
				future team performance or any other factors.
			</p>

			<DataTable
				cols={cols}
				config={config}
				defaultSort={["Ovr", "desc"]}
				name="UpcomingFreeAgents"
				rows={rows}
				pagination
			/>
		</>
	);
};

UpcomingFreeAgents.propTypes = {
	phase: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	season: PropTypes.number.isRequired,
	config: PropTypes.object.isRequired,
};

export default UpcomingFreeAgents;
