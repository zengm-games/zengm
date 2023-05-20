import type { PlayerFiltered, View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { useState, useLayoutEffect, useRef } from "react";
import { StatGraph } from "./ScatterPlot";
import useDropdownOptions, {
	type DropdownOption,
} from "../hooks/useDropdownOptions";
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
	return helpers.roundStat(player.stats[stat], stat, statType === "totals");
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
				label: player.name,
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

type AxisState = {
	prevStat: string;
	stat: string;
	prevStatType: string;
	statType: string;
	playoffs: string;
	season: number;
};

// For responsive ones, render the last one, which should be the longest
const OptionDropdown = ({ value }: { value: DropdownOption }) => {
	return (
		<option value={value.key}>
			{Array.isArray(value.value) ? value.value.at(-1)!.text : value.value}
		</option>
	);
};

const PickStat = ({
	state,
	setState,
	stats,
}: {
	state: AxisState;
	setState: (state: Partial<AxisState>) => void;
	stats: string[];
}) => {
	const statsXEnriched = getStatsWithLabels(stats, state.statType);

	const seasons = useDropdownOptions("seasons");
	const statTypes = [
		...useDropdownOptions("statTypesAdv"),
		{ key: "contract", value: "Contract" },
		{ key: "ratings", value: "Ratings" },
	];
	const playoffs = useDropdownOptions("playoffs");

	return (
		<>
			<label className="form-label">Stat</label>
			<select
				className="form-select"
				value={state.stat}
				onChange={event =>
					setState({
						prevStat: state.stat,
						stat: event.target.value,
					})
				}
			>
				{statsXEnriched.map((x, i) => {
					return (
						<option key={i} value={x.value} title={x.desc}>
							{x.title}
						</option>
					);
				})}
			</select>
			<label className="form-label">Type</label>
			<select
				className="form-select"
				value={state.statType}
				onChange={event =>
					setState({
						prevStatType: state.statType,
						statType: event.target.value,
					})
				}
			>
				{statTypes.map(x => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
			<label className="form-label">Season</label>
			<select
				className="form-select"
				value={state.season}
				onChange={event => setState({ season: parseInt(event.target.value) })}
			>
				{seasons.map(x => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
			<label className="form-label">Playoffs</label>
			<select
				className="form-select"
				value={state.playoffs}
				onChange={event => setState({ playoffs: event.target.value })}
			>
				{playoffs.map(x => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
		</>
	);
};

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

	const [state, setState] = useState([
		{
			prevStat: statsX[0],
			stat: statsX[0],
			prevStatType: statTypeX,
			statType: statTypeX,
			playoffs: playoffsX,
			season: seasonX,
		},
		{
			prevStat: statsY[0],
			stat: statsY[0],
			prevStatType: statTypeY,
			statType: statTypeY,
			playoffs: playoffsY,
			season: seasonY,
		},
	] as [AxisState, AxisState]);
	const [minGames, setMinGames] = useState("0");

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
				state[0].season,
				state[1].season,
				state[0].statType,
				state[1].statType,
				state[0].playoffs,
				state[1].playoffs,
			]),
		);
	});

	const setStateX = (newState: Partial<AxisState>) => {
		setState(prevState => {
			return [
				{
					...prevState[0],
					...newState,
				},
				prevState[1],
			];
		});
	};

	const setStateY = (newState: Partial<AxisState>) => {
		setState(prevState => {
			return [
				prevState[0],
				{
					...prevState[1],
					...newState,
				},
			];
		});
	};

	function updateStatsIfStatTypeChange() {
		if (state[0].prevStatType != state[0].statType) {
			setStateX({
				stat: statsX[0],
				prevStatType: state[0].statType,
			});
		}
		if (state[1].prevStatType != state[1].statType) {
			setStateY({
				stat: statsY[0],
				prevStatType: state[1].statType,
			});
		}
	}

	let minGamesInteger = parseInt(minGames);
	if (Number.isNaN(minGamesInteger)) {
		minGamesInteger = 0;
	}

	return (
		<div>
			<div className="row">
				<div className="col-sm-3 mb-3">
					<PickStat stats={statsX} state={state[0]} setState={setStateX} />
				</div>
				<div className="col-sm-3 mb-3">
					<PickStat stats={statsY} state={state[1]} setState={setStateY} />
				</div>
			</div>
			<div className="row">
				<div className="col-sm-3 mb-3">
					<label className="form-label">Minimum games played</label>
					<input
						type="text"
						className="form-control"
						onChange={event => setMinGames(event.target.value)}
						value={minGames}
						inputMode="numeric"
					/>
				</div>
			</div>
			<div>
				<GraphCreation
					statsX={playersX}
					statsY={playersY}
					statX={state[0].stat}
					statY={state[1].stat}
					statTypeX={state[0].statType}
					statTypeY={state[1].statType}
					minGames={minGamesInteger}
				/>
			</div>
		</div>
	);
};

export default PlayerStatsGraphs;
