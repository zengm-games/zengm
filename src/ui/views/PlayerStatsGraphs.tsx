import type { PlayerFiltered, View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { useState, useEffect } from "react";
import { Chart, registerables } from "chart.js";
import { ScatterPlot } from "./ScatterPlot";

Chart.register(...registerables);

type GraphCreationProps = {
	stats: any;
	statX: string;
	statY: string;
	minGames: number;
};

function GraphCreation(props: GraphCreationProps) {
	const playerNames = props.stats.map(
		(player: any) => player.firstName + " " + player.lastName,
	);
	const statsToShow = props.stats
		.filter((player: PlayerFiltered) => {
			return player.stats["gp"] > props.minGames;
		})
		.map((player: PlayerFiltered) => {
			return { x: player.stats[props.statX], y: player.stats[props.statY] };
		});
	const data = statsToShow;

	const options: any = {
		maintainAspectRatio: true,
		responsive: true,
		aspectRatio: 2.5,
		tooltips: {
			callbacks: {
				label: function (tooltipItem: any, data: any) {
					const label = data.labels[tooltipItem.index];
					return (
						label + ": (" + tooltipItem.xLabel + ", " + tooltipItem.yLabel + ")"
					);
				},
			},
		},
	};

	return <ScatterPlot data={data}></ScatterPlot>;
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
			seasons: season,
			statTypesAdvNotCareer: statType,
			playoffs,
		},
	});

	const [statToChartX, setStatToChartX] = useState(() => stats[0]);
	const [statToChartY, setStatToChartY] = useState(() => stats[1]);
	const [minimumGames, setMinimumGames] = useState(() => 0);

	const handleMinGamesChange = (games: string) => {
		const minGamesParsed: number = parseInt(games);
		setMinimumGames(isNaN(minGamesParsed) ? 0 : minGamesParsed);
	};

	return (
		<div>
			<div className="row">
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
				</div>
				<div className="col-sm-3 mb-3">
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
			</div>
			<div className="row">
				<div className="col-sm-3 mb-3">
					<label className="form-label">Minimum games played</label>
					<input
						type="text"
						className="form-control"
						onChange={event => handleMinGamesChange(event.target.value)}
						value={minimumGames}
					/>
				</div>
			</div>
			<div>
				<GraphCreation
					stats={players}
					statX={statToChartX}
					statY={statToChartY}
					minGames={minimumGames}
				/>
			</div>
		</div>
	);
};

export default PlayerStatsGraphs;
