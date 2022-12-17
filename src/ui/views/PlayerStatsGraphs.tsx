import type { PlayerFiltered, View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { useState } from "react";
import { Chart as ChartJS, LinearScale, registerables } from "chart.js";
import { Scatter } from "react-chartjs-2";
ChartJS.register(...registerables);

function GraphCreation({ stats, statX, statY }: any) {
	console.log(stats);
	const playerNames = stats.map(
		(player: any) => player.firstName + player.lastName,
	);
	const statsToShow = stats.map((player: PlayerFiltered) => {
		return { x: player.stats[statX], y: player.stats[statY] };
	});
	console.log(playerNames);
	const data = {
		labels: playerNames,
		datasets: [
			{
				label: statX + " x " + statY,
				data: statsToShow,
				backgroundColor: "rgba(255, 99, 132, 1)",
			},
		],
	};

	const options: any = {
		tooltips: {
			callbacks: {
				label: function (tooltipItem: any, data: any) {
					var label = data.labels[tooltipItem.index];
					return (
						label + ": (" + tooltipItem.xLabel + ", " + tooltipItem.yLabel + ")"
					);
				},
			},
		},
	};

	return (
		<div>
			<Scatter data={data} options={options}></Scatter>
		</div>
	);
}
const PlayerStatsGraphs = ({
	abbrev,
	playoffs,
	season,
	statType,
	players,
	stats,
}: View<"playerStatsGraphs">) => {
	useTitleBar({
		title: "Player Stats Graphics",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "player_stats_graphs",
		dropdownFields: {
			teamsAndAllWatch: abbrev,
			seasonsAndCareer: season,
			statTypesAdv: statType,
			playoffs,
		},
	});

	const [statToChartX, setStatToChartX] = useState(() => stats[0]);
	const [statToChartY, setStatToChartY] = useState(() => stats[0]);
	console.log(statToChartX);
	console.log(players[0]);
	console.log("statsTable> " + stats);
	return (
		<div>
			<div className="col-sm-3 mb-3">
				<label className="form-label">X axis</label>
				<select
					className="form-select"
					value={statToChartX}
					onChange={event => setStatToChartX(event.target.value)}
				>
					{stats.map((x: string) => {
						return <option>{x}</option>;
					})}
				</select>
				<label className="form-label">Y axis</label>
				<select
					className="form-select"
					value={statToChartY}
					onChange={event => setStatToChartY(event.target.value)}
				>
					{stats.map((x: string) => {
						return <option>{x}</option>;
					})}
				</select>
			</div>
			<div>
				<GraphCreation
					stats={players}
					statY={statToChartY}
					statX={statToChartX}
				></GraphCreation>
			</div>
		</div>
	);
};

export default PlayerStatsGraphs;
