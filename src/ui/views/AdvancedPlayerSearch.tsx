import { useState } from "react";
import type { View } from "../../common/types";
import useDropdownOptions from "../hooks/useDropdownOptions";
import useTitleBar from "../hooks/useTitleBar";
import { OptionDropdown } from "./PlayerGraphs";
import { isSport, PLAYER, PLAYER_STATS_TABLES } from "../../common";
import { getCols, helpers, realtimeUpdate } from "../util";
import { DataTable } from "../components";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import { allFilters } from "../../common/advancedPlayerSearch";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../components/contract";

const numericOperators = [">", "<", ">=", "<=", "=", "!="] as const;
type NumericOperator = (typeof numericOperators)[number];
const stringOperators = [
	"contains",
	"does not contain",
	"is exactly",
	"is not exactly",
] as const;
type StringOperator = (typeof stringOperators)[number];

export type AdvancedPlayerSearchFilter =
	| {
			category: string;
			key: string;
			operator: StringOperator;
			value: string;
	  }
	| {
			category: string;
			key: string;
			operator: NumericOperator;
			value: number;
	  };

type AdvancedPlayerSearchFilterEditing = Omit<
	AdvancedPlayerSearchFilter,
	"value"
> & {
	value: string;
};

const getFilterInfo = (category: string, key: string) => {
	const info = allFilters[category].options[key];
	if (!info) {
		throw new Error("Should never happen");
	}
	return info;
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
	const textOverrides =
		type === "numeric"
			? {
					">": "greater than",
					"<": "less than",
					">=": "greater than or equal to",
					"<=": "less than or equal to",
					"=": "equals",
					"!=": "does not equal",
				}
			: undefined;

	return (
		<select
			className="form-select"
			value={value as any}
			onChange={event => {
				onChange(event.target.value as any);
			}}
			style={{
				width: 150,
			}}
		>
			{operators.map(operator => {
				return (
					<option key={operator} value={operator}>
						{(textOverrides as any)?.[operator] ?? operator}
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
			style={{
				width: 150,
			}}
		/>
	);
};

const getInitialFilterEditing = (
	category: string,
	key: string,
	prevFilter?: AdvancedPlayerSearchFilterEditing,
): AdvancedPlayerSearchFilterEditing => {
	const info = getFilterInfo(category, key);
	const prevInfo = prevFilter
		? getFilterInfo(prevFilter.category, prevFilter.key)
		: undefined;

	return {
		category,
		key,

		// If switching between two string or two numeric fields, keep the operator the same
		operator:
			prevInfo?.valueType === info.valueType
				? prevFilter!.operator
				: info.valueType === "string"
					? stringOperators[0]
					: numericOperators[0],

		// Keep the value the same, even if it may now be invalid - validation logic will handle any errors
		value: prevFilter?.value ?? "",
	};
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

	const statTypes = [
		{ key: "bio", value: "Bio" },
		{ key: "ratings", value: "Ratings" },
		...Object.entries(PLAYER_STATS_TABLES).map(([key, info]) => {
			const value =
				key === "regular" && isSport("basketball") ? "Stats" : info.name;
			return { key, value };
		}),
	];

	return (
		<div>
			{filters.map((filter, i) => {
				const filterInfo = getFilterInfo(filter.category, filter.key);
				if (!filterInfo) {
					return null;
				}

				return (
					<div key={i}>
						<div className="p-2 rounded d-inline-flex gap-2 mb-3 bg-body-secondary">
							<select
								className="form-select"
								value={filter.category}
								onChange={event => {
									const newCategory = event.target.value as any;
									const newKey = Object.keys(
										allFilters[newCategory].options,
									)[0];
									const newFilter = getInitialFilterEditing(
										newCategory,
										newKey,
									);
									setFilter(i, newFilter);
								}}
								style={{
									width: 150,
								}}
							>
								{statTypes.map(x => {
									return <OptionDropdown key={x.key} value={x} />;
								})}
							</select>
							<select
								className="form-select"
								value={filterInfo.key}
								onChange={event => {
									const newFilter = getInitialFilterEditing(
										filter.category,
										event.target.value,
									);
									setFilter(i, newFilter);
								}}
								style={{
									width: 150,
								}}
							>
								{Object.values(allFilters[filter.category].options).map(
									(row, i) => {
										const col = getCols(
											[row.colKey],
											row.colOverrides
												? {
														[row.colKey]: row.colOverrides,
													}
												: undefined,
										)[0];
										return (
											<option key={i} value={row.key} title={col.desc}>
												{col.title}
												{col.desc !== undefined ? ` (${col.desc})` : null}
											</option>
										);
									},
								)}
							</select>
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
							<button
								className="text-danger btn btn-link p-0 border-0"
								onClick={() => {
									setFilters(oldFilters => {
										return oldFilters.filter((oldFilter, j) => i !== j);
									});
								}}
								title="Delete filter"
								style={{ fontSize: 20, marginTop: 3 }}
								type="button"
							>
								<span className="glyphicon glyphicon-remove" />
							</button>
						</div>
					</div>
				);
			})}
			<div className="d-flex gap-2">
				<button
					type="button"
					className="btn btn-secondary"
					onClick={() => {
						setFilters(prev => {
							return [...prev, getInitialFilterEditing("ratings", "ovr")];
						});
					}}
				>
					Add filter
				</button>
				<button type="submit" className="btn btn-primary">
					Search
				</button>
			</div>
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
		const info = getFilterInfo(filter.category, filter.key);
		if (info?.valueType === "numeric") {
			return {
				...filter,
				value: helpers.localeParseFloat(filter.value),
			};
		}

		return {
			...filter,
		};
	}) as any;
};

const formatSeasonRange = (seasonStart: number, seasonEnd: number) => {
	if (seasonStart === seasonEnd) {
		return String(seasonEnd);
	}

	return `${seasonStart}-${seasonEnd}`;
};

const AdvancedPlayerSearch = (props: View<"advancedPlayerSearch">) => {
	const { challengeNoRatings, currentSeason, players } = props;

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

	const filtersWithInfos = props.filters
		.map(filter => {
			const info = getFilterInfo(filter.category, filter.key);
			return {
				filter,
				info: info!,
			};
		})
		.filter(row => !!row.info);

	const defaultCols = [
		"Name",
		"Pos",
		"Team",
		"Age",
		"Contract",
		"Exp",
		"Season",
		"Ovr",
		"Pot",
	];

	const seenCols = new Set(defaultCols);
	const uniqueColFiltersWithInfo = filtersWithInfos.filter(filter => {
		if (seenCols.has(filter.info.colKey)) {
			return false;
		}

		seenCols.add(filter.info.colKey);
		return true;
	});

	const cols = getCols([
		...defaultCols,
		...uniqueColFiltersWithInfo.map(filter => filter.info.colKey),
	]);

	const currentSeasonOnly =
		seasonStart === seasonEnd && seasonStart === currentSeason;

	const rows = players.map((p, i) => {
		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

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
				<a
					href={helpers.leagueUrl([
						"roster",
						`${p.stats.abbrev}_${p.stats.tid}`,
						p.stats.seasonEnd ?? p.stats.season,
					])}
				>
					{p.stats.abbrev}
				</a>,
				p.age,
				p.contract.amount > 0 ? wrappedContractAmount(p) : null,
				p.contract.amount > 0 && currentSeasonOnly
					? wrappedContractExp(p)
					: null,
				p.stats.seasonStart !== undefined && p.stats.seasonEnd !== undefined
					? formatSeasonRange(p.stats.seasonStart, p.stats.seasonEnd)
					: p.ratings.season,
				...uniqueColFiltersWithInfo.map(row => {
					const value = row.info.getValue(p);
					if (row.filter.category === "bio") {
						return value;
					} else if (row.filter.category === "ratings") {
						return showRatings ? value : null;
					} else {
						return helpers.roundStat(
							value,
							row.filter.key,
							statType === "totals",
						);
					}
				}),
			],
		};
	});

	return (
		<>
			<form
				className="mb-5"
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
				<div className="row row-cols-md-auto g-3 mb-3">
					<div className="col-12 col-sm-6">
						<div className="input-group">
							<select
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
							>
								{seasons.map(x => {
									return <OptionDropdown key={x.key} value={x} />;
								})}
							</select>
						</div>
					</div>
					<div className="col-12 col-sm-6">
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
					<div className="col-12 col-sm-6">
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
						<div className="col-12 col-sm-6">
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
				</div>
				<Filters filters={filters} setFilters={setFilters} />
			</form>

			<DataTable
				cols={cols}
				defaultSort={[defaultCols.length, "desc"]}
				defaultStickyCols={window.mobile ? 0 : 1}
				name="AdvancedPlayerSearch"
				pagination
				rows={rows}
			/>
		</>
	);
};

export default AdvancedPlayerSearch;
