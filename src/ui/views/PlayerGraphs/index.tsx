import type { View } from "../../../common/types";
import useTitleBar from "../../hooks/useTitleBar";
import { useState, useLayoutEffect, useRef } from "react";
import { StatGraph, type TooltipData } from "./ScatterPlot";
import useDropdownOptions, {
	type DropdownOption,
} from "../../hooks/useDropdownOptions";
import realtimeUpdate from "../../util/realtimeUpdate";
import { getCols, helpers } from "../../util";
import { groupByUnique } from "../../../common/groupBy";
import type { Col } from "../../components/DataTable";

const addPrefixForStat = (statType: string, stat: string) => {
	if (statType == "ratings") {
		if (stat === "ovr") {
			return "Ovr";
		}
		if (stat === "pot") {
			return "Pot";
		}
		return `rating:${stat}`;
	} else if (statType == "contract") {
		return stat;
	}
	return `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`;
};

function getStatsWithLabels(stats: any[], statTypeX: string) {
	return getCols(stats.map(stat => addPrefixForStat(statTypeX, stat)));
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
	players: [any, any];
	stat: [string, string];
	statType: [string, string];
	minGames: number;
};

function GraphCreation(props: GraphCreationProps) {
	const playersYByPid = groupByUnique<any>(props.players[1], "pid");

	const data: TooltipData[] = [];
	for (const p of props.players[0]) {
		if (p.stats.gp <= props.minGames) {
			continue;
		}

		const p2 = playersYByPid[p.pid];
		if (!p2 || p2.stats.gp < props.minGames) {
			continue;
		}

		data.push({
			x: getStatFromPlayer(p, props.stat[0], props.statType[0]),
			y: getStatFromPlayer(p2, props.stat[1], props.statType[1]),
			name: p.name,
			pid: p.pid,
		});
	}

	const titleX = getStatsWithLabels([props.stat[0]], props.statType[0])[0];
	const titleY = getStatsWithLabels([props.stat[1]], props.statType[1])[0];

	return (
		<StatGraph
			data={data}
			descShort={[titleX.title, titleY.title]}
			descLong={[titleX.desc, titleY.desc]}
			stat={props.stat}
			statType={props.statType}
		/>
	);
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
	label,
	state,
	setState,
	stats,
}: {
	label: string;
	state: AxisState;
	setState: (state: Partial<AxisState>) => void;
	stats: string[];
}) => {
	const statsXEnriched = getStatsWithLabels(stats, state.statType) as (Col & {
		stat: string;
	})[];
	for (let i = 0; i < statsXEnriched.length; i++) {
		statsXEnriched[i].stat = stats[i];
	}

	const seasons = useDropdownOptions("seasons");
	const statTypes = [
		...useDropdownOptions("statTypesAdv"),
		{ key: "contract", value: "Contract" },
		{ key: "ratings", value: "Ratings" },
	];
	const playoffs = useDropdownOptions("playoffs");

	return (
		<div
			className="input-group"
			style={{
				maxWidth: 600,
			}}
		>
			<span className="input-group-text">
				{label}
				<span className="d-none d-sm-inline">-axis</span>
			</span>
			<select
				className="form-select"
				value={state.season}
				onChange={event => setState({ season: parseInt(event.target.value) })}
				style={{
					maxWidth: 70,
				}}
			>
				{seasons.map(x => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
			<select
				className="form-select"
				value={state.statType}
				onChange={event =>
					setState({
						prevStatType: state.statType,
						statType: event.target.value,
					})
				}
				style={{
					maxWidth: 130,
				}}
			>
				{statTypes.map(x => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
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
						<option key={i} value={x.stat} title={x.desc}>
							{x.title}
							{x.desc !== undefined ? ` (${x.desc})` : null}
						</option>
					);
				})}
			</select>
			<select
				className="form-select"
				value={state.playoffs}
				onChange={event => setState({ playoffs: event.target.value })}
				style={{
					maxWidth: 130,
				}}
			>
				{playoffs.map(x => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
		</div>
	);
};

const PlayerGraphs = ({
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
	statX,
	statY,
	minGames: initialMinGames,
}: View<"playerGraphs">) => {
	useTitleBar({
		title: "Player Graphs",
		jumpTo: true,
		dropdownView: "player_graphs",
	});
	const firstUpdate = useRef(true);

	const [state, setState] = useState([
		{
			prevStat: statX,
			stat: statX,
			prevStatType: statTypeX,
			statType: statTypeX,
			playoffs: playoffsX,
			season: seasonX,
		},
		{
			prevStat: statY,
			stat: statY,
			prevStatType: statTypeY,
			statType: statTypeY,
			playoffs: playoffsY,
			season: seasonY,
		},
	] as [AxisState, AxisState]);
	const [minGames, setMinGames] = useState(String(initialMinGames));

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
				"player_graphs",
				state[0].season,
				state[1].season,
				state[0].statType,
				state[1].statType,
				state[0].playoffs,
				state[1].playoffs,
				state[0].stat,
				state[1].stat,
				minGames,
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
		<div className="d-flex flex-column gap-3">
			<PickStat
				label="x"
				stats={statsX}
				state={state[0]}
				setState={setStateX}
			/>
			<PickStat
				label="y"
				stats={statsY}
				state={state[1]}
				setState={setStateY}
			/>
			<div className="input-group">
				<span className="input-group-text">Minimum games played</span>
				<input
					type="text"
					className="form-control"
					onChange={event => setMinGames(event.target.value)}
					value={minGames}
					inputMode="numeric"
					style={{
						maxWidth: 70,
					}}
				/>
			</div>
			<div>
				<GraphCreation
					players={[playersX, playersY]}
					stat={[state[0].stat, state[1].stat]}
					statType={[state[0].statType, state[1].statType]}
					minGames={minGamesInteger}
				/>
			</div>
		</div>
	);
};

export default PlayerGraphs;
