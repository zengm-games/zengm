import PropTypes from "prop-types";
import React from "react";
import { ScoreBox } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";

const Schedule = ({ abbrev, completed, upcoming }: View<"schedule">) => {
	useTitleBar({
		title: "Schedule",
		dropdownView: "schedule",
		dropdownFields: { teams: abbrev },
	});

	return (
		<>
			<div className="row">
				<div className="col-sm-6">
					<h2>Upcoming Games</h2>
					<ul className="list-group">
						{upcoming.map((game, i) => (
							<ScoreBox key={game.gid} game={game} header={i === 0} />
						))}
					</ul>
				</div>
				<div className="col-sm-6 d-none d-sm-block">
					<h2>Completed Games</h2>
					{completed.map((game, i) => (
						<ScoreBox key={game.gid} game={game} header={i === 0} />
					))}
				</div>
			</div>
		</>
	);
};

Schedule.propTypes = {
	abbrev: PropTypes.string.isRequired,
	completed: PropTypes.arrayOf(PropTypes.object).isRequired,
	upcoming: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Schedule;
