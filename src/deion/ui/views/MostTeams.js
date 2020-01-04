import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitleBar } from "../util";
import { DataTable, NewWindowLink } from "../components";

const MostTeams = ({ players, stats, userTid }) => {
	setTitleBar({ title: "Most Teams" });

	const cols = getCols(
		"Name",
		"# Teams",
		"Pos",
		"Drafted",
		"Retired",
		"Pick",
		"Peak Ovr",
		...stats.map(stat => `stat:${stat}`),
	);

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: [
				<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
				p.numTeams,
				p.ratings[p.ratings.length - 1].pos,
				p.draft.year,
				p.retiredYear === Infinity ? null : p.retiredYear,
				p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
				p.peakOvr,
				...stats.map(stat => helpers.roundStat(p.careerStats[stat], stat)),
			],
			classNames: {
				"table-danger": p.hof,
				"table-success": p.retiredYear === Infinity,
				"table-info": p.statsTids
					.slice(0, p.statsTids.length - 1)
					.includes(userTid),
			},
		};
	});

	return (
		<>
			<h1>
				Most Teams <NewWindowLink />
			</h1>

			<p>
				These are the 100 players who played for the most teams (minimum: 5).
			</p>

			<p>
				Players who have played for your team are{" "}
				<span className="text-info">highlighted in blue</span>. Active players
				are <span className="text-success">highlighted in green</span>. Hall of
				Famers are <span className="text-danger">highlighted in red</span>.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[1, "desc"]}
				name="MostTeams"
				rows={rows}
			/>
		</>
	);
};

MostTeams.propTypes = {
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default MostTeams;
