import PropTypes from "prop-types";
import React from "react";
import { SafeHtml } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";

const Transactions = ({
	abbrev,
	eventType,
	events,
	season,
	tid,
}: View<"transactions">) => {
	useTitleBar({
		title: "Transactions",
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
						<a href={helpers.leagueUrl(["depth", `${abbrev}_${tid}`])}>
							Depth Chart
						</a>{" "}
						|{" "}
					</>
				) : null}
				<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`])}>Roster</a> |{" "}
				<a href={helpers.leagueUrl(["team_finances", `${abbrev}_${tid}`])}>
					Finances
				</a>{" "}
				|{" "}
				<a href={helpers.leagueUrl(["game_log", `${abbrev}_${tid}`, season])}>
					Game Log
				</a>{" "}
				|{" "}
				<a href={helpers.leagueUrl(["team_history", `${abbrev}_${tid}`])}>
					History
				</a>{" "}
				|{" "}
				<a href={helpers.leagueUrl(["schedule", `${abbrev}_${tid}`])}>
					Schedule
				</a>
				|{" "}
				<a href={helpers.leagueUrl(["news", `${abbrev}_${tid}`, season])}>
					News Feed
				</a>
			</p>
		) : (
			<p>
				More: <a href={helpers.leagueUrl(["news", "all", season])}>News Feed</a>
			</p>
		);

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
	tid: PropTypes.number.isRequired,
};

export default Transactions;
