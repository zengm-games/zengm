import type { PlayerFiltered, View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { useState, useLayoutEffect, useRef } from "react";
import { StatGraph } from "./ScatterPlot";
import useDropdownOptions from "../hooks/useDropdownOptions";
import realtimeUpdate from "../util/realtimeUpdate";
import { getColTitles, helpers } from "../util";

function addPrefixForStat(
	statType: string,
	stat: any,
): { actual: any; parsed: string } {
	if (statType == "ratings") {
		return { actual: stat, parsed: `rating:${stat}` };
	} else if (statType == "contract") {
		return { actual: stat, parsed: stat };
	}
	return {
		actual: stat,
		parsed: `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`,
	};
}

function getStatsWithLabels(stats: any[], statTypeX: string) {
	return getColTitles(stats.map(stat => addPrefixForStat(statTypeX, stat)));
}

function getStatFromPlayer(player: any, stat: string, statType: string) {
	if (statType == "ratings") {
		return player.ratings[stat];
	} else if (statType == "contract") {
		if (player["contract"]) {
			return player.contract[stat] ?? 0;
		}
		return 0;
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

	const labelX = getStatsWithLabels([props.statX], props.statTypeX)[0].desc;
	const labelY = getStatsWithLabels([props.statY], props.statTypeY)[0].desc;

	return <StatGraph data={data} statX={labelX} statY={labelY} />;
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
		title: "Player Graphs",
		jumpTo: true,
		dropdownView: "player_stats_graphs",
	});
	const firstUpdate = useRef(true);

	const seasons = useDropdownOptions("seasons").map(x => x.value);
	const statTypes = [
		...useDropdownOptions("statTypesAdv"),
		{ key: "contract", value: "Contract" },
		{ key: "ratings", value: "Ratings" },
	];
	const playoffs = useDropdownOptions("playoffs");

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

	const statsXEnriched = getStatsWithLabels(statsX, statTypeX);
	const statsYEnriched = getStatsWithLabels(statsY, statTypeY);

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
				seasonXState,
				seasonYState,
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
						{statsXEnriched.map((x: any) => {
							return (
								<option value={x.value} title={x.desc}>
									{x.title}
								</option>
							);
						})}
					</select>
					<label className="form-label">X axis stat type</label>
					<select
						className="form-select"
						value={statToChartX.statType}
						onChange={event =>
							setStatToChartX({
								...statToChartX,
								prevStatType: statToChartX.statType,
								statType: event.target.value,
							})
						}
					>
						{statTypes.map((x: any) => {
							return (
								<option value={x.key}>
									{Array.isArray(x.value) ? x.value[1].text : x.value}
								</option>
							);
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
						value={playoffsXState}
						onChange={event => setPlayoffsX(event.target.value)}
					>
						{playoffs.map((x: any) => {
							return (
								<option value={x.key}>
									{Array.isArray(x.value) ? x.value[1].text : x.value}
								</option>
							);
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
						{statsYEnriched.map((x: any) => {
							return (
								<option value={x.value} title={x.desc}>
									{x.title}
								</option>
							);
						})}
					</select>
					<label className="form-label">Y axis stat type</label>
					<select
						className="form-select"
						value={statToChartY.statType}
						onChange={event =>
							setStatToChartY({
								...statToChartY,
								prevStatType: statToChartY.statType,
								statType: event.target.value,
							})
						}
					>
						{statTypes.map((x: any) => {
							return (
								<option value={x.key}>
									{Array.isArray(x.value) ? x.value[1].text : x.value}
								</option>
							);
						})}
					</select>
					<label className="form-label">Y axis year</label>
					<select
						className="form-select"
						value={seasonYState}
						onChange={event => setSeasonY(Number(event.target.value))}
					>
						{seasons.map((x: any) => {
							return <option>{x}</option>;
						})}
					</select>
					<label className="form-label">Playoffs</label>
					<select
						className="form-select"
						value={playoffsYState}
						onChange={event => setPlayoffsY(event.target.value)}
					>
						{playoffs.map((x: any) => {
							return (
								<option value={x.key}>
									{Array.isArray(x.value) ? x.value[1].text : x.value}
								</option>
							);
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
						inputMode="numeric"
					/>
				</div>
			</div>
			<div>
				<GraphCreation
					statsX={playersX}
					statsY={playersY}
					statX={statToChartX.stat}
					statY={statToChartY.stat}
					statTypeX={statToChartX.statType}
					statTypeY={statToChartY.statType}
					minGames={minimumGames}
				/>
			</div>
		</div>
	);
};

export default PlayerStatsGraphs;
