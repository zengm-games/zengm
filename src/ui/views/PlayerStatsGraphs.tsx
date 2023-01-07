import type { PlayerFiltered, View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { useState, useLayoutEffect, useRef } from "react";
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
	if (statType == "gameHighs") {
		stat = player.stats[stat];
		return Array.isArray(stat) ? stat[0] : stat;
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
	playoffsX,
	playoffsY,
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
	});

	const firstUpdate = useRef(true);

	const seasons = useDropdownOptions("seasons").map(x => x.value);
	const statTypes = [
		...useDropdownOptions("statTypesAdv").map(x => x.key),
		"ratings",
		"contract",
	];
	const playoffs = useDropdownOptions("playoffs").map(x => x.key);

	const initialStatXState = {
		prevStat: statsX[0],
		stat: statsX[0],
		prevStatType: statTypeX,
		statType: statTypeX,
	};
	const initialStatYState = {
		prevStat: statsY[0],
		stat: statsY[0],
		prevStatType: statTypeY,
		statType: statTypeY,
	};

	const [statToChartX, setStatToChartX] = useState(() => initialStatXState);
	const [statToChartY, setStatToChartY] = useState(() => initialStatYState);
	const [minimumGames, setMinimumGames] = useState(() => 0);
	const [seasonXState, setSeasonX] = useState(() => seasonX);
	const [seasonYState, setSeasonY] = useState(() => seasonY);
	const [playoffsXState, setPlayoffsX] = useState(() => playoffsX);
	const [playoffsYState, setPlayoffsY] = useState(() => playoffsY);

	useLayoutEffect(() => {
		if (firstUpdate.current) {
			updateStatsIfStatTypeChange();
			firstUpdate.current = false;
			return;
		}
		firstUpdate.current = true;
		realtimeUpdate(
			[],
			helpers.leagueUrl([
				"player_stats_graphs",
				seasonXState.toString(),
				seasonYState.toString(),
				statToChartX.statType,
				statToChartY.statType,
				playoffsXState,
				playoffsYState,
			]),
		);
	});

	function updateStatsIfStatTypeChange() {
		if (statToChartX.prevStatType != statToChartX.statType) {
			setStatToChartX({
				...statToChartX,
				stat: statsX[0],
				prevStatType: statToChartX.statType,
			});
		}
		if (statToChartY.prevStatType != statToChartY.statType) {
			setStatToChartY({
				...statToChartY,
				stat: statsY[0],
				prevStatType: statToChartY.statType,
			});
		}
	}

	const handleMinGamesChange = (games: string) => {
		const minGamesParsed: number = parseInt(games);
		setMinimumGames(isNaN(minGamesParsed) ? 0 : minGamesParsed);
	};

	return (
		<div>
			<div className="row">
				<div className="col-sm-3 mb-3">
					<label className="form-label">X axis stat</label>
					<select
						className="form-select"
						value={statToChartX.stat}
						onChange={event =>
							setStatToChartX({
								...statToChartX,
								prevStat: statToChartX.stat,
								stat: event.target.value,
							})
						}
					>
						{statsX.map((x: string) => {
							return <option>{x}</option>;
						})}
					</select>
					<label className="form-label">X axis stat type</label>
					<select
						className="form-select"
						value={statToChartX.statType.toString()}
						onChange={event =>
							setStatToChartX({
								...statToChartX,
								prevStatType: statToChartX.statType,
								statType: event.target.value,
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
					<label className="form-label">Playoffs</label>
					<select
						className="form-select"
						value={playoffsXState.toString()}
						onChange={event => setPlayoffsX(event.target.value)}
					>
						{playoffs.map((x: any) => {
							return <option>{x}</option>;
						})}
					</select>
				</div>
				<div className="col-sm-3 mb-3">
					<label className="form-label">Y axis stat</label>
					<select
						className="form-select"
						value={statToChartY.stat}
						onChange={event =>
							setStatToChartY({
								...statToChartY,
								prevStat: statToChartY.stat,
								stat: event.target.value,
							})
						}
					>
						{statsY.map((x: string) => {
							return <option>{x}</option>;
						})}
					</select>
					<label className="form-label">Y axis stat type</label>
					<select
						className="form-select"
						value={statToChartY.statType.toString()}
						onChange={event =>
							setStatToChartY({
								...statToChartY,
								prevStatType: statToChartY.statType,
								statType: event.target.value,
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
					<label className="form-label">Playoffs</label>
					<select
						className="form-select"
						value={playoffsYState.toString()}
						onChange={event => setPlayoffsY(event.target.value)}
					>
						{playoffs.map((x: any) => {
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
					statX={statToChartX.stat}
					statY={statToChartY.stat}
					statTypeX={statToChartX.statType.toString()}
					statTypeY={statToChartY.statType.toString()}
					minGames={minimumGames}
				/>
			</div>
		</div>
	);
};

export default PlayerStatsGraphs;
