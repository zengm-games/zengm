import React from "react";
import { PLAYER } from "../../../common";
import { DataTable, PlayerNameLabels } from "../../components";
import { helpers, getCols } from "../../util";
import type { View } from "../../../common/types";

const Players = ({
	gmHistory,
	players,
	stats,
	tid,
}: Pick<View<"teamHistory">, "players" | "stats" | "tid"> & {
	gmHistory?: boolean;
}) => {
	const cols = getCols(
		"Name",
		"Pos",
		...stats.map(stat => `stat:${stat}`),
		"Last Season",
	);

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: [
				<PlayerNameLabels
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					pid={p.pid}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				p.pos,
				...stats.map(stat => helpers.roundStat(p.careerStats[stat], stat)),
				p.lastYr,
			],
			classNames: {
				// Highlight active and HOF players
				"table-danger": p.hof,
				"table-info": p.tid > PLAYER.RETIRED && p.tid !== tid, // On other team
				"table-success": p.tid === tid, // On this team
			},
		};
	});

	return (
		<>
			<h2>Players</h2>
			<p>
				Players currently on {gmHistory ? "your" : "this"} team are{" "}
				<span className="text-success">highlighted in green</span>. Other active
				players are <span className="text-info">highlighted in blue</span>.
				Players in the Hall of Fame are{" "}
				<span className="text-danger">highlighted in red</span>.
			</p>
			<DataTable
				cols={cols}
				defaultSort={[2, "desc"]}
				name="TeamHistory"
				rows={rows}
				pagination
			/>
		</>
	);
};

export default Players;
