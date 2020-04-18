import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../common";
import { DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";

const UpcomingFreeAgents = ({
	phase,
	players,
	season,
	stats,
}: View<"upcomingFreeAgents">) => {
	useTitleBar({
		title: "Upcoming Free Agents",
		dropdownView: "upcoming_free_agents",
		dropdownFields: { seasonsUpcoming: season },
	});

	const cols = getCols(
		"Name",
		"Pos",
		"Team",
		"Age",
		"Ovr",
		"Pot",
		...stats.map(stat => `stat:${stat}`),
		...(phase === PHASE.RESIGN_PLAYERS ? [] : ["Current Contract"]),
		"Desired Contract",
	);

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: [
				<PlayerNameLabels
					injury={p.injury}
					pid={p.pid}
					skills={p.ratings.skills}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				p.ratings.pos,
				<a href={helpers.leagueUrl(["roster", p.abbrev])}>{p.abbrev}</a>,
				p.age,
				p.ratings.ovr,
				p.ratings.pot,
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
				...(phase === PHASE.RESIGN_PLAYERS
					? []
					: [
							<>
								{helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
								{p.contract.exp}
							</>,
					  ]),
				<>
					{helpers.formatCurrency(p.contractDesired.amount, "M")} thru{" "}
					{p.contractDesired.exp}
				</>,
			],
		};
	});

	return (
		<>
			<p>
				More:{" "}
				<a href={helpers.leagueUrl(["free_agents"])}>Current Free Agents</a>
			</p>

			{phase !== PHASE.RESIGN_PLAYERS ? (
				<p>
					Keep in mind that many of these players will choose to re-sign with
					their current team rather than become free agents.
				</p>
			) : null}

			<DataTable
				cols={cols}
				defaultSort={[3, "desc"]}
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
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default UpcomingFreeAgents;
