import { useState } from "react";
import type { View } from "../../common/types";
import useDropdownOptions from "../hooks/useDropdownOptions";
import useTitleBar from "../hooks/useTitleBar";
import { OptionDropdown } from "./PlayerGraphs";
import { isSport, RATINGS } from "../../common";
import { helpers, realtimeUpdate } from "../util";

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
	category: FilterCategory;
	key: string;
	operator: NumericOperator;
	value: number;
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

const Filters = ({
	filters,
	setFilters,
}: {
	filters: AdvancedPlayerSearchFilter[];
	setFilters: React.Dispatch<
		React.SetStateAction<AdvancedPlayerSearchFilter[]>
	>;
}) => {
	const setFilter = (i: number, filter: AdvancedPlayerSearchFilter) => {
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
						/>{" "}
						{filter.value}
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
								operator: ">=",
								value: 50,
							},
						];
					});
				}}
			>
				Add filter
			</button>
		</div>
	);
};

const AdvancedPlayerSearch = (props: View<"advancedPlayerSearch">) => {
	const [[seasonStart, seasonEnd], setSeasonRange] = useState<[number, number]>(
		[props.seasonStart, props.seasonEnd],
	);
	const [singleSeason, setSingleSeason] = useState(props.singleSeason);
	const [playoffs, setPlayoffs] = useState(props.playoffs);
	const [statType, setStatType] = useState(props.statType);
	const [filters, setFilters] = useState(props.filters);

	useTitleBar({
		title: "Advanced Player Search",
	});

	const seasons = useDropdownOptions("seasons");
	const playoffsOptions = useDropdownOptions("playoffsCombined");
	const statTypes = useDropdownOptions("statTypesStrict");

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
							JSON.stringify(filters),
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
		</>
	);
};

export default AdvancedPlayerSearch;
