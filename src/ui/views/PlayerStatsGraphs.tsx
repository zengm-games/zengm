import type { PlayerFiltered, View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { StatGraph } from "./ScatterPlot";
import useDropdownOptions from "../hooks/useDropdownOptions";
import realtimeUpdate from "../util/realtimeUpdate";
import { helpers } from "../util";

function getStatFromPlayer(player: any, stat: string, statType: string) {
	if (statType == "ratings") {
		return player.ratings[stat];
	} else if (statType == "contract") {
		if (player["contract"]) {
			return player.contract[stat] ?? 0.0;
		}
		return 0.0;
	}
	return player.stats[stat];
}

type GraphCreationProps = {
	statsX: any;
	statsY: any;
	statX: string;
	statY: string;
	statTypeX: string;
	statTypeY: string;
	minGames: number;
};

function GraphCreation(props: GraphCreationProps) {
	const playersYMappedByPid = props.statsY.reduce(function (
		map: any,
		obj: any,
	) {
		map[obj.pid] = obj;
		return map;
	},
	{});
	const statsToShowX = props.statsX.reduce(
		(plotData: any[], player: PlayerFiltered) => {
			if (player.stats["gp"] <= props.minGames) {
				return plotData;
			}
			const playerY = playersYMappedByPid[player.pid] ?? null;
			if (!playerY || playerY.stats["gp"] < props.minGames) {
				return plotData;
			}
			plotData.push({
				x: getStatFromPlayer(player, props.statX, props.statTypeX),
				y: getStatFromPlayer(playerY, props.statY, props.statTypeY),
				label: player.firstName + " " + player.lastName,
				link: helpers.leagueUrl(["player", player.pid]),
			});
			return plotData;
		},
		[],
	);
	const data = statsToShowX;

	return (
		<StatGraph data={data} statX={props.statX} statY={props.statY}></StatGraph>
	);
}
const PlayerStatsGraphs = ({
	playoffs,
	seasonX,
	seasonY,
	statTypeX,
	statTypeY,
	playersX,
	playersY,
	statsX,
	statsY,
}: View<"playerStatsGraphs">) => {
	useTitleBar({
		title: "Player Stats Graphics",
		jumpTo: true,
		dropdownView: "player_stats_graphs",
		dropdownFields: {
			playoffs,
		},
	});

	console.log(seasonX, seasonY, statTypeX, statTypeY);

	const firstUpdate = useRef(true);

	const seasons = useDropdownOptions("seasons").map(x => x.value);
	const statTypes = [
		...useDropdownOptions("statTypes").map(x => x.key),
		"ratings",
		"contract",
	];

	const [statToChartX, setStatToChartX] = useState(() => statsX[0]);
	const [statToChartY, setStatToChartY] = useState(() => statsY[1]);
	const [minimumGames, setMinimumGames] = useState(() => 0);
	const [seasonXState, setSeasonX] = useState(() => seasonX);
	const [seasonYState, setSeasonY] = useState(() => seasonY);
	const initialStateTypeXState = {
		prevState: statTypeX,
		newState: statTypeX,
	};
	const initialStateTypeYState = {
		prevState: statTypeY,
		newState: statTypeY,
	};
	const [statTypeXState, setStatTypeX] = useState(() => initialStateTypeXState);
	const [statTypeYState, setStatTypeY] = useState(() => initialStateTypeYState);

	useLayoutEffect(() => {
		if (firstUpdate.current) {
			firstUpdate.current = false;
			return;
		}
		firstUpdate.current = true;
		console.log("update");
		realtimeUpdate(
			[],
			helpers.leagueUrl([
				"player_stats_graphs",
				seasonXState.toString(),
				seasonYState.toString(),
				statTypeXState.newState,
				statTypeYState.newState,
				playoffs,
			]),
		);
	});

	useEffect(() => {
		if (statTypeXState.prevState != statTypeXState.newState) {
			console.log("wow");
			setStatToChartX(statsX[0]);
		}
		if (statTypeYState.prevState != statTypeYState.newState) {
			console.log("wow" + statTypeYState.newState);
			setStatToChartY(statsY[0]);
		}
	});

	const handleMinGamesChange = (games: string) => {
		const minGamesParsed: number = parseInt(games);
		setMinimumGames(isNaN(minGamesParsed) ? 0 : minGamesParsed);
	};

	return (
		<div>
			{statToChartY}
			<div className="row">
				<div className="col-sm-3 mb-3">
					<label className="form-label">X axis stat</label>
					<select
						className="form-select"
						value={statToChartX}
						onChange={event => setStatToChartX(event.target.value)}
					>
						{statsX.map((x: string) => {
							return <option>{x}</option>;
						})}
					</select>
					<label className="form-label">X axis stat type</label>
					<select
						className="form-select"
						value={statTypeXState.newState.toString()}
						onChange={event =>
							setStatTypeX({
								prevState: statTypeXState.newState,
								newState: event.target.value,
							})
						}
					>
						{statTypes.map((x: any) => {
							return <option>{x}</option>;
						})}
					</select>
					<label className="form-label">X axis year</label>
					<select
						className="form-select"
						value={seasonXState}
						onChange={event => setSeasonX(Number(event.target.value))}
					>
						{seasons.map((x: any) => {
							return <option>{x}</option>;
						})}
					</select>
				</div>
				<div className="col-sm-3 mb-3">
					<label className="form-label">Y axis stat</label>
					<select
						className="form-select"
						value={statToChartY}
						onChange={event => setStatToChartY(event.target.value)}
					>
						{statsY.map((x: string) => {
							return <option>{x}</option>;
						})}
					</select>
					<label className="form-label">Y axis stat type</label>
					<select
						className="form-select"
						value={statTypeYState.newState.toString()}
						onChange={event =>
							setStatTypeY({
								prevState: statTypeYState.newState,
								newState: event.target.value,
							})
						}
					>
						{statTypes.map((x: any) => {
							return <option>{x}</option>;
						})}
					</select>
					<label className="form-label">Y axis year</label>
					<select
						className="form-select"
						value={seasonYState.toString()}
						onChange={event => setSeasonY(Number(event.target.value))}
					>
						{seasons.map((x: any) => {
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
					statsX={playersX}
					statsY={playersY}
					statX={statToChartX}
					statY={statToChartY}
					statTypeX={statTypeXState.newState.toString()}
					statTypeY={statTypeYState.newState.toString()}
					minGames={minimumGames}
				/>
			</div>
		</div>
	);
};

export default PlayerStatsGraphs;
