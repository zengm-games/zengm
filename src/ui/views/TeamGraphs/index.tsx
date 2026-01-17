import type { View } from "../../../common/types.ts";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { StatGraph, type TooltipData } from "../PlayerGraphs/ScatterPlot.tsx";
import useDropdownOptions, {
	type DropdownOption,
} from "../../hooks/useDropdownOptions.tsx";
import realtimeUpdate from "../../util/realtimeUpdate.ts";
import { getCols, helpers, toWorker } from "../../util/index.ts";
import { groupByUnique } from "../../../common/utils.ts";
import type { Col } from "../../components/DataTable/index.tsx";
import clsx from "clsx";
import { bySport, isSport } from "../../../common/index.ts";

const suffixes = {
	Home: "Home",
	Away: "Away",
	Conf: "Conference",
	Div: "Division",
};

const addPrefixForStat = (statType: string, stat: string) => {
	if (statType === "standings") {
		const overrides: Record<string, string> = {
			otl: "OTL",
			won: "W",
			lost: "L",
			tied: "T",
			winp: "Win%",
			pts: "PTS",
			ptsPct: "PTS%",
		};

		for (const suffix of Object.keys(suffixes)) {
			if (stat.endsWith(suffix)) {
				const statNoSuffix = stat.replace(suffix, "");
				return overrides[statNoSuffix] ?? statNoSuffix;
			}
		}

		return overrides[stat] ?? stat;
	}

	if (statType === "powerRankings") {
		const overrides: Record<string, string> = {
			avgAge: "AvgAge",
			rank: "#",
			ovr: "Team Rating",
			ovrCurrent: "Team Rating (With Injuries)",
		};

		const override = overrides[stat];
		if (override !== undefined) {
			return override;
		}

		if (stat.startsWith("rank_") || stat.startsWith("rankCurrent_")) {
			const type = stat.split("_")[1];
			const prefix = bySport({
				baseball: "pos",
				basketball: "rating",
				football: "pos",
				hockey: "pos",
			});
			return `${prefix}:${type}`;
		}

		return stat;
	}

	if (statType === "finances") {
		const overrides: Record<string, string> = {
			att: "Avg Attendance",
			ticketPrice: "Ticket Price",
			revenue: "Revenue",
			profit: "Profit",
			cash: "Cash",
			pop: "Pop",
			payrollOrSalaryPaid: "Payroll",
			scoutingLevel: "Scouting",
			coachingLevel: "Coaching",
			healthLevel: "Health",
			facilitiesLevel: "Facilities",
		};

		return overrides[stat] ?? stat;
	}

	if (stat.startsWith("opp")) {
		return `stat:${stat.charAt(3).toLowerCase()}${stat.slice(4)}`;
	}

	return `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`;
};

const getStatsWithLabels = (
	stats: string[],
	statType: string,
	prefixOpp: boolean,
) => {
	return getCols(stats.map((stat) => addPrefixForStat(statType, stat))).map(
		(col, i) => {
			const stat = stats[i]!;

			if (prefixOpp && stat.startsWith("opp")) {
				col.title = `opp${col.title}`;
				if (col.desc) {
					col.desc = `Opponent ${col.desc}`;
				}
			}

			if (stat === "rank") {
				col.title = "Rank";
			} else if (stat.startsWith("rank_")) {
				col.title += " Rank";
				delete col.desc;
			} else if (stat.startsWith("rankCurrent_")) {
				col.title += " Rank (With Injuries)";
				delete col.desc;
			}

			for (const [suffix, long] of Object.entries(suffixes)) {
				if (stat.endsWith(suffix)) {
					col.title += suffix;
					if (col.desc) {
						col.desc = `${long} ${col.desc}`;
					}
				}
			}

			return col;
		},
	);
};

const getStatFromTeam = (t: any, stat: string, statType: string) => {
	if (statType === "finances") {
		if (stat.endsWith("Level")) {
			const key = stat.replace("Level", "");
			return t.seasonAttrs.expenseLevels[key];
		}
	}

	if (statType == "standings" || statType === "finances") {
		return t.seasonAttrs[stat] ?? 0;
	}

	if (statType === "powerRankings") {
		const other = stat.startsWith("rank_");
		const otherCurrent = stat.startsWith("rankCurrent_");
		if (other || otherCurrent) {
			const type = stat.split("_")[1]!;
			return t.powerRankings[other ? "other" : "otherCurrent"][type];
		}

		return t.powerRankings[stat];
	}

	return t.stats[stat];
};

const getFormattedStat = (value: number, stat: string, statType: string) => {
	if (statType === "standings") {
		if (stat === "winp" || stat === "ptsPct") {
			return helpers.roundWinp(value);
		} else {
			return Math.round(value);
		}
	}

	if (statType === "finances") {
		switch (stat) {
			case "pop":
				return `${value.toFixed(1)}M`;
			case "att":
				return helpers.numberWithCommas(Math.round(value));
			case "revenue":
				return helpers.formatCurrency(value, "M");
			case "profit":
				return helpers.formatCurrency(value, "M");
			case "cash":
				return helpers.formatCurrency(value, "M");
			case "payrollOrSalaryPaid":
				return helpers.formatCurrency(value, "M");
			case "scoutingLevel":
				return value;
			case "coachingLevel":
				return value;
			case "healthLevel":
				return value;
			case "facilitiesLevel":
				return value;
			default:
				throw new Error("Unknown stat");
		}
	}

	if (statType === "powerRankings") {
		if (stat !== "avgAge") {
			return Math.round(value);
		}
	}

	return helpers.roundStat(value, stat, statType === "totals");
};

type ViewProps = View<"teamGraphs">;

const GraphCreation = <Team extends ViewProps["teamsX"][number]>({
	stat,
	statType,
	teams,
}: {
	teams: [Team[], Team[]];
	stat: [string, string];
	statType: [string, string];
	minGames: number;
}) => {
	const teamsYByTid = groupByUnique<any>(teams[1], "tid");

	const data: TooltipData[] = [];
	for (const t of teams[0]) {
		const t2 = teamsYByTid[t.tid];
		if (!t2) {
			continue;
		}

		data.push({
			x: getStatFromTeam(t, stat[0], statType[0]),
			y: getStatFromTeam(t2, stat[1], statType[1]),
			row: t,
		});
	}

	if (data.length === 0) {
		return <div>No data for the selected options.</div>;
	}

	const titleX = getStatsWithLabels([stat[0]], statType[0], true)[0]!;
	const titleY = getStatsWithLabels([stat[1]], statType[1], true)[0]!;
	const descShort: [string, string] = [titleX.title, titleY.title];

	const reverseAxis = stat.map(
		(stat, i) => statType[i] === "powerRankings" && stat.startsWith("rank"),
	) as [boolean, boolean];

	return (
		<StatGraph<Team>
			data={data}
			descShort={descShort}
			descLong={[titleX.desc, titleY.desc]}
			getImageUrl={(t) => t.seasonAttrs.imgURLSmall ?? t.seasonAttrs.imgURL}
			getKey={(t) => t.tid}
			getLink={(t) =>
				helpers.leagueUrl([
					"roster",
					`${t.abbrev}_${t.tid}`,
					t.seasonAttrs.season,
				])
			}
			getTooltipTitle={(t) => `${t.seasonAttrs.region} ${t.seasonAttrs.name}`}
			renderTooltip={(value, p, i) => {
				return (
					<div key={i}>
						{getFormattedStat(value, stat[i]!, statType[i]!)} {descShort[i]}
					</div>
				);
			}}
			reverseAxis={reverseAxis}
			stat={stat}
			statType={statType}
		/>
	);
};

type AxisState = {
	stat: string;
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

type UpdateUrlParam = {
	seasonX?: number;
	seasonY?: number;
	statTypeX?: string;
	statTypeY?: string;
	playoffsX?: string;
	playoffsY?: string;
	statX?: string;
	statY?: string;
	minGames?: string;
};

const actuallyAddSuffix = (text: string) => {
	if (isSport("basketball") && text.includes("Feats")) {
		return text;
	}

	return `${text} Stats`;
};

const addStatsSuffix = (option: DropdownOption) => {
	const value = option.value;

	let newValue: typeof value;
	if (typeof value === "string") {
		newValue = actuallyAddSuffix(value);
	} else {
		newValue = value.map((row) => {
			return {
				...row,
				text: actuallyAddSuffix(row.text),
			};
		});
	}

	return {
		...option,
		value: newValue,
	};
};

const PickStat = ({
	className,
	label,
	state,
	updateUrl,
	seasons,
	stats,
}: {
	className?: string;
	label: "x" | "y";
	state: AxisState;
	updateUrl: (state: UpdateUrlParam) => void;
	seasons: [number, number];
	stats: string[];
}) => {
	const statsXEnriched = getStatsWithLabels(
		stats,
		state.statType,
		false,
	) as (Col & {
		stat: string;
	})[];
	for (const [i, row] of statsXEnriched.entries()) {
		row.stat = stats[i]!;
	}

	const dropdownSeasons = useDropdownOptions("seasons");
	const statTypes = [
		// Keep in sync with statTypes in TeamGraphs.ts
		...useDropdownOptions("teamOpponentAdvanced").map(addStatsSuffix),
		{ key: "standings", value: "Standings" },
		{ key: "powerRankings", value: "Power Rankings" },
		{ key: "finances", value: "Finances" },
	];
	const playoffs = useDropdownOptions("playoffs");

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
						[`season${xyCapital}`]: Number.parseInt(event.target.value),
					})
				}
				style={{
					maxWidth: 70,
				}}
			>
				{dropdownSeasons.map((x) => {
					return <OptionDropdown key={x.key} value={x} />;
				})}
			</select>
			<select
				className="form-select"
				value={state.statType}
				onChange={async (event) => {
					const newStatType = event.target.value;
					const { stat } = await toWorker("main", "getTeamGraphStat", {
						prev: {
							statType: newStatType,
							stat: state.stat,
						},
						seasons,
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
						if (
							state.statType === "standings" ||
							state.statType === "finances" ||
							(!isSport("basketball") && state.statType === "powerRankings")
						) {
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
						"getTeamGraphStat",
						{
							seasons,
						},
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

const TeamGraphs = ({
	playoffsX,
	playoffsY,
	seasonX,
	seasonY,
	statTypeX,
	statTypeY,
	statsX,
	statsY,
	statX,
	statY,
	teamsX,
	teamsY,
}: ViewProps) => {
	useTitleBar({
		title: "Team Graphs",
		dropdownView: "team_graphs",
	});

	const updateUrl = async (toUpdate: UpdateUrlParam) => {
		const url = helpers.leagueUrl([
			"team_graphs",
			toUpdate.seasonX ?? seasonX,
			toUpdate.statTypeX ?? statTypeX,
			toUpdate.playoffsX ?? playoffsX,
			toUpdate.statX ?? statX,
			toUpdate.seasonY ?? seasonY,
			toUpdate.statTypeY ?? statTypeY,
			toUpdate.playoffsY ?? playoffsY,
			toUpdate.statY ?? statY,
		]);

		await realtimeUpdate([], url, undefined, true);
	};

	if (location.pathname.endsWith("/team_graphs")) {
		// Set initial URL, for ctrl+r and reloading
		updateUrl({});
	}

	const seasons: [number, number] = [seasonX, seasonY];

	return (
		<>
			<div className="d-flex gap-3 align-items-start mb-3 flex-wrap">
				<div>
					<PickStat
						className="mb-3"
						label="x"
						seasons={seasons}
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
						seasons={seasons}
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
				</div>
			</div>
			<div>
				<GraphCreation
					teams={[teamsX, teamsY]}
					stat={[statX, statY]}
					statType={[statTypeX, statTypeY]}
					minGames={0}
				/>
			</div>
		</>
	);
};

export default TeamGraphs;
