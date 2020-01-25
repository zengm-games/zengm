import PropTypes from "prop-types";
import React from "react";
import { SafeHtml } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import { View } from "../../common/types";

const Transactions = ({
	abbrev,
	eventType,
	events,
	season,
}: View<"transactions">) => {
	useTitleBar({
		title: "Transactions",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "transactions",
		dropdownFields: {
			teamsAndAll: abbrev,
			seasonsAndAll: season,
			eventType,
		},
	});

	const moreLinks =
		abbrev !== "all" ? (
			<p>
				More:{" "}
				{process.env.SPORT === "football" ? (
					<>
						<a href={helpers.leagueUrl(["depth", abbrev])}>Depth Chart</a> |{" "}
					</>
				) : null}
				<a href={helpers.leagueUrl(["roster", abbrev])}>Roster</a> |{" "}
				<a href={helpers.leagueUrl(["team_finances", abbrev])}>Finances</a> |{" "}
				<a href={helpers.leagueUrl(["game_log", abbrev, season])}>Game Log</a> |{" "}
				<a href={helpers.leagueUrl(["team_history", abbrev])}>History</a>
			</p>
		) : null;

	return (
		<>
			{moreLinks}

			<ul className="list-group">
				{events.map(e => (
					<li key={e.eid} className="list-group-item">
						<SafeHtml dirty={e.text} />
					</li>
				))}
			</ul>
		</>
	);
};

Transactions.propTypes = {
	abbrev: PropTypes.string.isRequired,
	eventType: PropTypes.oneOf([
		"all",
		"draft",
		"freeAgent",
		"reSigned",
		"release",
		"trade",
	]).isRequired,
	events: PropTypes.arrayOf(
		PropTypes.shape({
			eid: PropTypes.number.isRequired,
			text: PropTypes.string.isRequired,
		}),
	).isRequired,
	season: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

export default Transactions;
