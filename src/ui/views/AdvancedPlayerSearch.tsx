import { useState } from "react";
import type { View } from "../../common/types";
import useDropdownOptions from "../hooks/useDropdownOptions";
import useTitleBar from "../hooks/useTitleBar";
import { OptionDropdown } from "./PlayerGraphs";
import { isSport, PLAYER } from "../../common";
import { getCols, helpers, realtimeUpdate } from "../util";
import { DataTable } from "../components";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import SelectMultiple from "../components/SelectMultiple";
import {
	allFilters,
	type FilterCategory,
} from "../../common/advancedPlayerSearch";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../components/contract";

const numericOperators = [">", "<", ">=", "<=", "=", "!="] as const;
type NumericOperator = (typeof numericOperators)[number];
const stringOperators = ["contains", "does not contain"] as const;
type StringOperator = (typeof stringOperators)[number];

export type AdvancedPlayerSearchFilter =
	| {
			category: "bio";
			key: "name" | "country" | "college";
			operator: StringOperator;
			value: string;
	  }
	| {
			category: "rating";
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

const getFilterInfo = (category: FilterCategory, key: string) => {
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
				width: 175,
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
				width: 175,
			}}
		/>
	);
};

const getInitialFilterEditing = (
	category: FilterCategory,
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

	const options = Object.values(allFilters).map(info => {
		return {
			label: info.label,
			options: Object.values(info.options),
		};
	});

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
							<div className="advanced-search-select" style={{ width: 175 }}>
								<SelectMultiple
									value={filterInfo}
									options={options}
									getOptionLabel={row => {
										const col = getCols([row.colKey])[0];
										return col.title;
									}}
									getOptionValue={row => {
										return JSON.stringify([row.category, row.key]);
									}}
									onChange={row => {
										if (row) {
											console.log(row);
											const newFilter = getInitialFilterEditing(
												row.category,
												row.key,
											);
											setFilter(i, newFilter);
										}
									}}
									isClearable={false}
									// Virtualization isn't needed here because there aren't too many options, and also it breaks the logic in CustomMenuList for finding the height of the dropdown menu because most of the children are sub-options rather than direct children
									virtualize={false}
								/>
							</div>
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
							return [...prev, getInitialFilterEditing("rating", "ovr")];
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

	const seenCols = new Set();
	const uniqueColFiltersWithInfo = filtersWithInfos.filter(filter => {
		if (seenCols.has(filter.info.colKey)) {
			return false;
		}

		seenCols.add(filter.info.colKey);
		return true;
	});

	const cols = getCols([
		"Name",
		"Pos",
		"Team",
		"Age",
		"Contract",
		"Exp",
		"Season",
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
						p.ratings.season,
					])}
				>
					{p.stats.abbrev}
				</a>,
				p.age,
				p.contract.amount > 0 ? wrappedContractAmount(p) : null,
				p.contract.amount > 0 && currentSeasonOnly
					? wrappedContractExp(p)
					: null,
				p.ratings.season,
				...uniqueColFiltersWithInfo.map(row => {
					if (row.filter.category === "rating") {
						return showRatings ? row.info.getValue(p) : null;
					} else {
						return row.info.getValue(p);
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
