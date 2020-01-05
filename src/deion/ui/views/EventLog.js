import PropTypes from "prop-types";
import React from "react";
import { SafeHtml } from "../components";
import useTitleBar from "../hooks/useTitleBar";

const EventLog = ({ abbrev, events, season }) => {
	useTitleBar({
		title: "Event Log",
		dropdownView: "event_log",
		dropdownFields: { teams: abbrev, seasons: season },
	});

	return (
		<>
			<ul>
				{events.map(e => (
					<li key={e.eid}>
						<SafeHtml dirty={e.text} />
					</li>
				))}
			</ul>
		</>
	);
};

EventLog.propTypes = {
	abbrev: PropTypes.string.isRequired,
	events: PropTypes.arrayOf(
		PropTypes.shape({
			eid: PropTypes.number.isRequired,
			text: PropTypes.string.isRequired,
		}),
	).isRequired,
	season: PropTypes.number.isRequired,
};

export default EventLog;
