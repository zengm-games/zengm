import { useState } from "react";
import type { View } from "../../common/types";
import useDropdownOptions from "../hooks/useDropdownOptions";
import useTitleBar from "../hooks/useTitleBar";
import { OptionDropdown } from "./PlayerGraphs";
import { isSport, RATINGS } from "../../common";
import { getCols, helpers, realtimeUpdate } from "../util";
import { DataTable } from "../components";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";

const numericOperators = [">", "<", ">=", "<=", "=", "!="] as const;
type NumericOperator = (typeof numericOperators)[number];
const stringOperators = ["contains", "does not contain"] as const;
type StringOperator = (typeof stringOperators)[number];

type FilterCategory = "rating";

type AdvancedPlayerSearchField = {
	key: string;
	valueType: "numeric" | "string";
};

export type AdvancedPlayerSearchFilter = {
	category: "rating";
	key: string;
	colKey: string;
	operator: NumericOperator;
	value: number;
};

type AdvancedPlayerSearchFilterEditing = Omit<
	AdvancedPlayerSearchFilter,
	"value"
> & {
	value: string;
};

const possibleFilters: Record<
	FilterCategory,
	{
		label: string;
		options: AdvancedPlayerSearchField[];
	}
> = {
	rating: {
		label: "Ratings",
		options: ["ovr", "pot", ...RATINGS].map(key => {
			return {
				key,
				colKey: `rating:${key}`,
				valueType: "numeric",
			};
		}),
	},
};

const getFilterInfo = (category: FilterCategory, key: string) => {
	return possibleFilters[category].options.find(row => row.key === key);
};

const SelectOperator = <
	Type extends "numeric" | "string",
	Value = Type extends "numeric" ? NumericOperator : StringOperator,
>({
	type,
	value,
	onChange,
}: {
	type: Type;
	value: Value;
	onChange: (value: Value) => void;
}) => {
	const operators = type === "numeric" ? numericOperators : stringOperators;
	return (
		<select
			className="form-select"
			value={value as any}
			onChange={event => {
				onChange(event.target.value as any);
			}}
		>
			{operators.map(operator => {
				return (
					<option key={operator} value={operator}>
						{operator}
					</option>
				);
			})}
		</select>
	);
};

const ValueInput = ({
	type,
	value,
	onChange,
}: {
	type: "numeric" | "string";
	value: string;
	onChange: (value: string) => void;
}) => {
	return (
		<input
			type="text"
			className="form-control"
			inputMode={type === "numeric" ? "numeric" : undefined}
			value={value}
			onChange={event => {
				onChange(event.target.value as any);
			}}
		/>
	);
};

const Filters = ({
	filters,
	setFilters,
}: {
	filters: AdvancedPlayerSearchFilterEditing[];
	setFilters: React.Dispatch<
		React.SetStateAction<AdvancedPlayerSearchFilterEditing[]>
	>;
}) => {
	const setFilter = (i: number, filter: AdvancedPlayerSearchFilterEditing) => {
		setFilters(oldFilters => {
			return oldFilters.map((oldFilter, j) => (i === j ? filter : oldFilter));
		});
	};

	return (
		<div>
			{filters.map((filter, i) => {
				const filterInfo = getFilterInfo(filter.category, filter.key);
				if (!filterInfo) {
					return null;
				}

				return (
					<div key={i} className="d-flex gap-2">
						{filter.key}{" "}
						<SelectOperator
							type={filterInfo.valueType}
							value={filter.operator}
							onChange={operator => {
								setFilter(i, {
									...filter,
									operator,
								});
							}}
						/>
						<ValueInput
							type={filterInfo.valueType}
							value={filter.value}
							onChange={value => {
								setFilter(i, {
									...filter,
									value,
								});
							}}
						/>
					</div>
				);
			})}
			<button
				type="button"
				className="btn btn-secondary"
				onClick={() => {
					setFilters(prev => {
						return [
							...prev,
							{
								category: "rating",
								key: "ovr",
								colKey: "rating:ovr",
								operator: ">=",
								value: "50",
							} satisfies AdvancedPlayerSearchFilterEditing,
						];
					});
				}}
			>
				Add filter
			</button>
		</div>
	);
};

const filtersToEditable = (
	filters: AdvancedPlayerSearchFilter[],
): AdvancedPlayerSearchFilterEditing[] => {
	return filters.map(filter => {
		return {
			...filter,
			value: String(filter.value),
		};
	});
};

const filtersFromEditable = (
	filters: AdvancedPlayerSearchFilterEditing[],
): AdvancedPlayerSearchFilter[] => {
	return filters.map(filter => {
		return {
			...filter,
			value: helpers.localeParseFloat(filter.value),
		};
	});
};

const AdvancedPlayerSearch = (props: View<"advancedPlayerSearch">) => {
	const [[seasonStart, seasonEnd], setSeasonRange] = useState<[number, number]>(
		[props.seasonStart, props.seasonEnd],
	);
	const [singleSeason, setSingleSeason] = useState(props.singleSeason);
	const [playoffs, setPlayoffs] = useState(props.playoffs);
	const [statType, setStatType] = useState(props.statType);
	const [filters, setFilters] = useState(() => {
		return filtersToEditable(props.filters);
	});

	useTitleBar({
		title: "Advanced Player Search",
	});

	const seasons = useDropdownOptions("seasons");
	const playoffsOptions = useDropdownOptions("playoffsCombined");
	const statTypes = useDropdownOptions("statTypesStrict");

	const cols = getCols(["Name", "Pos", "Age", "Team", "Season"]);

	const rows = props.players.map((p, i) => {
		return {
			key: i,
			data: [
				wrappedPlayerNameLabels({
					pid: p.pid,
					injury: p.injury,
					season: p.ratings.season,
					skills: p.ratings.skills,
					jerseyNumber: p.stats.jerseyNumber,
					watch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				p.ratings.pos,
				p.age,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${p.stats.abbrev}_${p.stats.tid}`,
						p.ratings.season,
					])}
				>
					{p.stats.abbrev}
				</a>,
				p.ratings.season,
			],
		};
	});

	return (
		<>
			<form
				onSubmit={event => {
					event.preventDefault();
					realtimeUpdate(
						[],
						helpers.leagueUrl([
							"advanced_player_search",
							seasonStart,
							seasonEnd,
							singleSeason,
							playoffs,
							statType,
							JSON.stringify(filtersFromEditable(filters)),
						]),
					);
				}}
			>
				<div className="mb-3">
					<label htmlFor="seasonStart" className="form-label">
						Season range
					</label>
					<div className="input-group">
						<select
							id="seasonStart"
							className="form-select"
							value={seasonStart}
							onChange={event => {
								const season = parseInt(event.target.value);
								if (season > seasonEnd) {
									setSeasonRange([season, season]);
								} else {
									setSeasonRange([season, seasonEnd]);
								}
							}}
							style={{
								maxWidth: 70,
							}}
						>
							{seasons.map(x => {
								return <OptionDropdown key={x.key} value={x} />;
							})}
						</select>
						<span className="input-group-text">to</span>
						<select
							className="form-select"
							value={seasonEnd}
							onChange={event => {
								const season = parseInt(event.target.value);
								if (season < seasonStart) {
									setSeasonRange([season, season]);
								} else {
									setSeasonRange([seasonStart, season]);
								}
							}}
							style={{
								maxWidth: 70,
							}}
						>
							{seasons.map(x => {
								return <OptionDropdown key={x.key} value={x} />;
							})}
						</select>
					</div>
				</div>
				<div className="mb-3">
					<select
						className="form-select"
						value={singleSeason}
						onChange={event => {
							setSingleSeason(event.target.value as any);
						}}
					>
						<option value="singleSeason">Single season</option>
						<option value="totals">Totals</option>
					</select>
				</div>
				<div className="mb-3">
					<select
						className="form-select"
						onChange={event => {
							const newPlayoffs = event.target.value as any;

							setPlayoffs(newPlayoffs);
						}}
						value={playoffs}
					>
						{playoffsOptions.map(x => {
							return <OptionDropdown key={x.key} value={x} />;
						})}
					</select>
				</div>
				{isSport("basketball") ? (
					<div className="mb-3">
						<select
							className="form-select"
							value={statType}
							onChange={event => {
								setStatType(event.target.value as any);
							}}
						>
							{statTypes.map(x => {
								return <OptionDropdown key={x.key} value={x} />;
							})}
						</select>
					</div>
				) : null}
				<Filters filters={filters} setFilters={setFilters} />
				<button type="submit" className="btn btn-primary">
					Search
				</button>
			</form>

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				defaultStickyCols={window.mobile ? 0 : 1}
				name="AdvancedPlayerSearch"
				pagination
				rows={rows}
			/>
		</>
	);
};

export default AdvancedPlayerSearch;
