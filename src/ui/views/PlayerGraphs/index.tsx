import type { View } from "../../../common/types";
import useTitleBar from "../../hooks/useTitleBar";
import { StatGraph, type TooltipData } from "./ScatterPlot";
import useDropdownOptions, {
	type DropdownOption,
} from "../../hooks/useDropdownOptions";
import realtimeUpdate from "../../util/realtimeUpdate";
import { getCols, helpers, toWorker } from "../../util";
import { groupByUnique } from "../../../common/groupBy";
import type { Col } from "../../components/DataTable";
import classNames from "classnames";

const addPrefixForStat = (statType: string, stat: string) => {
	if (statType === "ratings") {
		if (stat === "ovr") {
			return "Ovr";
		}
		if (stat === "pot") {
			return "Pot";
		}
		return `rating:${stat}`;
	} else if (statType === "bio") {
		if (stat === "age") {
			return "Age";
		}
		if (stat === "draftPosition") {
			return "Draft Pick";
		}
		if (stat === "salary") {
			return "Salary";
		}
	}
	return `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`;
};

const getStatsWithLabels = (stats: string[], statTypeX: string) => {
	return getCols(stats.map(stat => addPrefixForStat(statTypeX, stat)));
};

const getStatFromPlayer = (p: any, stat: string, statType: string) => {
	if (statType == "ratings") {
		return p.ratings[stat];
	} else if (statType == "bio") {
		return p[stat] ?? 0;
	}
	if (statType == "gameHighs") {
		stat = p.stats[stat];
		return Array.isArray(stat) ? stat[0] : stat;
	}
	return p.stats[stat];
};

type GraphCreationProps = {
	players: [any, any];
	stat: [string, string];
	statType: [string, string];
	minGames: number;
};

const GraphCreation = (props: GraphCreationProps) => {
	const playersYByPid = groupByUnique<any>(props.players[1], "pid");

	const data: TooltipData[] = [];
	for (const p of props.players[0]) {
		if (!p.stats || p.stats.gp <= props.minGames) {
			continue;
		}

		const p2 = playersYByPid[p.pid];
		if (!p2 || !p2.stats || p2.stats.gp < props.minGames) {
			continue;
		}

		data.push({
			x: getStatFromPlayer(p, props.stat[0], props.statType[0]),
			y: getStatFromPlayer(p2, props.stat[1], props.statType[1]),
			p,
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
};

type AxisState = {
	stat: string;
	statType: string;
	playoffs: string;
	season: number | "career";
};

// For responsive ones, render the last one, which should be the longest
const OptionDropdown = ({ value }: { value: DropdownOption }) => {
	return (
		<option value={value.key}>
			{Array.isArray(value.value) ? value.value.at(-1)!.text : value.value}
		</option>
	);
};

type UpdateUrlParam = {
	seasonX?: number | "career";
	seasonY?: number | "career";
	statTypeX?: string;
	statTypeY?: string;
	playoffsX?: string;
	playoffsY?: string;
	statX?: string;
	statY?: string;
	minGames?: string;
};

const PickStat = ({
	className,
	label,
	state,
	updateUrl,
	stats,
}: {
	className?: string;
	label: "x" | "y";
	state: AxisState;
	updateUrl: (state: UpdateUrlParam) => void;
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
		// Keep in sync with statTypes in playerGraphs.ts
		...useDropdownOptions("statTypesAdv"),
		{ key: "bio", value: "Bio" },
		{ key: "ratings", value: "Ratings" },
	];
	const playoffs = useDropdownOptions("playoffs");

	const xyCapital = label === "x" ? "X" : "Y";

	return (
		<div
			className={classNames("input-group", className)}
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
				onChange={event =>
					updateUrl({
						[`season${xyCapital}`]:
							event.target.value === "career"
								? "career"
								: parseInt(event.target.value),
					})
				}
				style={{
					maxWidth: 70,
				}}
			>
				<option value="career">Career</option>
				{seasons.map(x => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
			<select
				className="form-select"
				value={state.statType}
				onChange={async event => {
					const newStatType = event.target.value;
					const { stat } = await toWorker("main", "getPlayerGraphStat", {
						statType: newStatType,
						stat: state.stat,
					});
					await updateUrl({
						[`stat${xyCapital}`]: stat,
						[`statType${xyCapital}`]: newStatType,
					});
				}}
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
					updateUrl({
						[`stat${xyCapital}`]: event.target.value,
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
				onChange={event =>
					updateUrl({ [`playoffs${xyCapital}`]: event.target.value })
				}
				style={{
					maxWidth: 130,
				}}
			>
				{playoffs.map(x => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
			<button
				className="btn btn-secondary"
				onClick={async () => {
					const { stat, statType } = await toWorker(
						"main",
						"getPlayerGraphStat",
						{},
					);

					await updateUrl({
						[`stat${xyCapital}`]: stat,
						[`statType${xyCapital}`]: statType,
					});
				}}
			>
				<span className="d-none d-sm-inline">Random stat</span>
				<span className="d-sm-none">Rand</span>
			</button>
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
	minGames,
}: View<"playerGraphs">) => {
	useTitleBar({
		title: "Player Graphs",
		dropdownView: "player_graphs",
	});

	const updateUrl = async (toUpdate: UpdateUrlParam) => {
		const url = helpers.leagueUrl([
			"player_graphs",
			toUpdate.seasonX ?? seasonX,
			toUpdate.statTypeX ?? statTypeX,
			toUpdate.playoffsX ?? playoffsX,
			toUpdate.statX ?? statX,
			toUpdate.seasonY ?? seasonY,
			toUpdate.statTypeY ?? statTypeY,
			toUpdate.playoffsY ?? playoffsY,
			toUpdate.statY ?? statY,
			`${toUpdate.minGames ?? minGames}g`,
		]);

		await realtimeUpdate([], url, undefined, true);
	};

	if (location.pathname.endsWith("/player_graphs")) {
		// Set initial URL, for ctrl+r and reloading
		updateUrl({});
	}

	let minGamesInteger = parseInt(minGames);
	let minGamesError = false;
	if (Number.isNaN(minGamesInteger)) {
		minGamesInteger = 0;
		minGamesError = true;
	}

	return (
		<>
			<div className="d-flex gap-3 align-items-start mb-3 flex-wrap">
				<div>
					<PickStat
						className="mb-3"
						label="x"
						stats={statsX}
						state={{
							season: seasonX,
							statType: statTypeX,
							playoffs: playoffsX,
							stat: statX,
						}}
						updateUrl={updateUrl}
					/>
					<PickStat
						label="y"
						stats={statsY}
						state={{
							season: seasonY,
							statType: statTypeY,
							playoffs: playoffsY,
							stat: statY,
						}}
						updateUrl={updateUrl}
					/>
				</div>
				<div className="d-flex d-lg-block">
					<button
						className="btn btn-secondary me-3 me-lg-0 mb-lg-3"
						onClick={() => {
							updateUrl({
								seasonX: seasonY,
								seasonY: seasonX,
								statTypeX: statTypeY,
								statTypeY: statTypeX,
								playoffsX: playoffsY,
								playoffsY: playoffsX,
								statX: statY,
								statY: statX,
							});
						}}
					>
						Swap x and y{<span className="d-none d-sm-inline"> axes</span>}
					</button>
					<div
						className="input-group"
						style={{
							width: "unset",
						}}
					>
						<span className="input-group-text">Minimum games played</span>
						<input
							type="text"
							className={classNames(
								"form-control",
								minGamesError ? "is-invalid" : undefined,
							)}
							onChange={event => {
								updateUrl({
									minGames: event.target.value,
								});
							}}
							value={minGames}
							inputMode="numeric"
							style={{
								maxWidth: 70,
							}}
						/>
					</div>
				</div>
			</div>
			<div>
				<GraphCreation
					players={[playersX, playersY]}
					stat={[statX, statY]}
					statType={[statTypeX, statTypeY]}
					minGames={minGamesInteger}
				/>
			</div>
		</>
	);
};

export default PlayerGraphs;
