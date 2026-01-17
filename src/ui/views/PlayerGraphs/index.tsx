import type { View } from "../../../common/types.ts";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { StatGraph, type TooltipData } from "./ScatterPlot.tsx";
import useDropdownOptions, {
	type DropdownOption,
} from "../../hooks/useDropdownOptions.tsx";
import realtimeUpdate from "../../util/realtimeUpdate.ts";
import { getCols, helpers, toWorker } from "../../util/index.ts";
import { groupByUnique } from "../../../common/utils.ts";
import type { Col } from "../../components/DataTable/index.tsx";
import clsx from "clsx";
import { addPrefixForStat } from "../../../common/advancedPlayerSearch.ts";

const getStatsWithLabels = (stats: string[], statType: string) => {
	return getCols(stats.map((stat) => addPrefixForStat(statType, stat)));
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

const getFormattedStat = (value: number, stat: string, statType: string) => {
	if (statType === "bio") {
		if (stat === "salary") {
			return helpers.formatCurrency(value, "M");
		}
		if (stat === "draftPosition") {
			return helpers.ordinal(value);
		}
	}
	if (statType === "bio" || statType === "ratings") {
		return value;
	}
	return helpers.roundStat(value, stat, statType === "totals");
};

const GraphCreation = ({
	minGames,
	players,
	stat,
	statType,
}: {
	players: [any, any];
	stat: [string, string];
	statType: [string, string];
	minGames: number;
}) => {
	const playersYByPid = groupByUnique<any>(players[1], "pid");

	const data: TooltipData[] = [];
	for (const p of players[0]) {
		if (!p.stats || p.stats.gp <= minGames) {
			continue;
		}

		const p2 = playersYByPid[p.pid];
		if (!p2 || !p2.stats || p2.stats.gp < minGames) {
			continue;
		}

		data.push({
			x: getStatFromPlayer(p, stat[0], statType[0]),
			y: getStatFromPlayer(p2, stat[1], statType[1]),
			row: p,
		});
	}

	if (data.length === 0) {
		return <div>No data for the selected options.</div>;
	}

	const titleX = getStatsWithLabels([stat[0]], statType[0])[0]!;
	const titleY = getStatsWithLabels([stat[1]], statType[1])[0]!;
	const descShort: [string, string] = [titleX.title, titleY.title];

	return (
		<StatGraph<any>
			data={data}
			descShort={descShort}
			descLong={[titleX.desc, titleY.desc]}
			getKey={(p) => p.pid}
			getLink={(p) => helpers.leagueUrl(["player", p.pid])}
			getTooltipTitle={(p) => p.name}
			renderTooltip={(value, p, i) => {
				const undraftedOverride =
					statType[i] === "bio" &&
					stat[i] === "draftPosition" &&
					p.draft.round === 0;
				return (
					<div key={i}>
						{undraftedOverride ? (
							"Undrafted"
						) : (
							<>
								{getFormattedStat(value, stat[i]!, statType[i]!)} {descShort[i]}
							</>
						)}
					</div>
				);
			}}
			reverseAxis={[false, false]}
			stat={stat}
			statType={statType}
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
export const OptionDropdown = ({ value }: { value: DropdownOption }) => {
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
	for (const [i, row] of statsXEnriched.entries()) {
		row.stat = stats[i]!;
	}

	const seasons = useDropdownOptions("seasons");
	const statTypes = [
		// Keep in sync with statTypes in playerGraphs.ts
		...useDropdownOptions("statTypesAdv"),
		{ key: "bio", value: "Bio" },
		{ key: "ratings", value: "Ratings" },
	];
	const playoffs = useDropdownOptions("playoffsCombined");

	const xyCapital = label === "x" ? "X" : "Y";

	return (
		<div
			className={clsx("input-group", className)}
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
				onChange={(event) =>
					updateUrl({
						[`season${xyCapital}`]:
							event.target.value === "career"
								? "career"
								: Number.parseInt(event.target.value),
					})
				}
				style={{
					maxWidth: 70,
				}}
			>
				<option value="career">Career</option>
				{seasons.map((x) => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
			<select
				className="form-select"
				value={state.statType}
				onChange={async (event) => {
					const newStatType = event.target.value;
					const { stat } = await toWorker("main", "getPlayerGraphStat", {
						prev: {
							statType: newStatType,
							stat: state.stat,
						},
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
				{statTypes.map((x) => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
			<select
				className="form-select"
				value={state.stat}
				onChange={(event) =>
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
				onChange={(event) =>
					updateUrl({ [`playoffs${xyCapital}`]: event.target.value })
				}
				style={{
					maxWidth: 130,
				}}
			>
				{playoffs
					.filter((x) => {
						if (x.key === "regularSeason") {
							// Regular season always exists
							return true;
						}
						if (state.statType === "bio" || state.statType === "ratings") {
							// No playoff version of these stats
							return false;
						}
						return x;
					})
					.map((x) => {
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

	let minGamesInteger = Number.parseInt(minGames);
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
							className={clsx(
								"form-control",
								minGamesError ? "is-invalid" : undefined,
							)}
							onChange={(event) => {
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
