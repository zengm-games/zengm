import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { View } from "../../common/types.ts";
import useDropdownOptions from "../hooks/useDropdownOptions.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { OptionDropdown } from "./PlayerGraphs/index.tsx";
import { isSport, PLAYER, PLAYER_STATS_TABLES } from "../../common/index.ts";
import {
	getCol,
	getCols,
	helpers,
	realtimeUpdate,
	toWorker,
} from "../util/index.ts";
import { ActionButton, DataTable, PlusMinus } from "../components/index.tsx";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import {
	allFilters,
	getExtraStatTypeKeys,
} from "../../common/advancedPlayerSearch.ts";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../components/contract.tsx";
import clsx from "clsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { wrappedAgeAtDeath } from "../components/AgeAtDeath.tsx";

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
			value: number | null;
	  };

type AdvancedPlayerSearchFilterEditing = Omit<
	AdvancedPlayerSearchFilter,
	"value"
> & {
	value: string;
	errorMessage: string | undefined;
};

const getFilterInfo = (category: string, key: string) => {
	const info = allFilters[category]!.options[key];
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
			onChange={(event) => {
				onChange(event.target.value as any);
			}}
			style={{
				width: 150,
			}}
		>
			{operators.map((operator) => {
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
	errorMessage,
}: {
	type: "numeric" | "string";
	value: string;
	onChange: (value: string) => void;
	errorMessage: string | undefined;
}) => {
	return (
		<div>
			<input
				type="text"
				className={clsx("form-control", {
					"is-invalid": errorMessage,
				})}
				inputMode={type === "numeric" ? "numeric" : undefined}
				value={value}
				onChange={(event) => {
					onChange(event.target.value as any);
				}}
				style={{
					width: 150,
				}}
			/>
			{errorMessage ? (
				<div className="text-danger form-text">{errorMessage}</div>
			) : null}
		</div>
	);
};

const SelectTeam = ({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) => {
	const teams = [
		{ key: "$ALL$", value: "All Teams" },
		{ key: "$DP$", value: "Draft Prospects" },
		{ key: "$FA$", value: "Free Agents" },
		...useDropdownOptions("teams"),
	];

	return (
		<select
			className="form-select"
			value={value as any}
			onChange={(event) => {
				onChange(event.target.value as any);
			}}
			style={{
				width: 308,
			}}
		>
			{teams.map((x) => {
				return <OptionDropdown key={x.key} value={x} />;
			})}
		</select>
	);
};

const validateFilter = (filter: AdvancedPlayerSearchFilterEditing) => {
	const info = getFilterInfo(filter.category, filter.key);
	if (info.valueType === "numeric") {
		if (filter.value !== "") {
			const number = helpers.localeParseFloat(filter.value);
			if (!Number.isFinite(number)) {
				return "Must be a number";
			}
		}
	}
};

const getInitialFilterEditing = (
	category: string,
	key: string,
	prevFilter?: AdvancedPlayerSearchFilterEditing,
) => {
	const info = getFilterInfo(category, key);
	const prevInfo = prevFilter
		? getFilterInfo(prevFilter.category, prevFilter.key)
		: undefined;

	// Don't retain info from abbrev, since it's kind of weird to do that because it's hidden in the abbrev state
	const prevIsAbbrev =
		prevInfo?.category === "bio" && prevInfo.key === "abbrev";

	const newFilter: AdvancedPlayerSearchFilterEditing = {
		category,
		key,
		errorMessage: undefined,

		// If switching between two string or two numeric fields, keep the operator the same
		operator:
			prevInfo?.valueType === info.valueType && !prevIsAbbrev
				? prevFilter!.operator
				: info.valueType === "string"
					? stringOperators[0]
					: numericOperators[0],

		// Keep the value the same, even if it may now be invalid - validation logic will handle any errors
		value: prevFilter && !prevIsAbbrev ? prevFilter.value : "",
	};

	if (category === "bio" && key === "abbrev") {
		// abbrev gets a special select dropdown, requires some special treatment here too
		newFilter.operator = "is exactly";
		newFilter.value = "$ALL$";
	}

	newFilter.errorMessage = validateFilter(newFilter);

	return newFilter;
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
		filter.errorMessage = validateFilter(filter);
		setFilters((oldFilters) => {
			return oldFilters.map((oldFilter, j) => (i === j ? filter : oldFilter));
		});
	};

	let statTypes = [
		{ key: "bio", value: "Bio" },
		{ key: "ratings", value: "Ratings" },
		...Object.entries(PLAYER_STATS_TABLES).map(([key, info]) => {
			const value =
				key === "regular" && isSport("basketball")
					? "Traditional Stats"
					: info.name;
			return { key, value };
		}),
	];

	if (isSport("baseball")) {
		statTypes = statTypes.filter((row) => row.key !== "fielding");
	}

	return (
		<div>
			{filters.map((filter, i) => {
				const filterInfo = getFilterInfo(filter.category, filter.key);
				if (!filterInfo) {
					return null;
				}

				return (
					<div className="d-flex" key={i}>
						<div className="p-2 rounded d-flex align-items-start gap-2 mb-3 bg-body-secondary me-auto">
							<div className="d-flex filter-wrapper flex-wrap gap-2">
								<div className="d-flex gap-2">
									<select
										className="form-select"
										value={filter.category}
										onChange={(event) => {
											const newCategory = event.target.value as any;
											const newKey = Object.keys(
												allFilters[newCategory]!.options,
											)[0]!;
											const newFilter = getInitialFilterEditing(
												newCategory,
												newKey,
												filter,
											);
											setFilter(i, newFilter);
										}}
										style={{
											width: 150,
										}}
									>
										{statTypes.map((x) => {
											return <OptionDropdown key={x.key} value={x} />;
										})}
									</select>
									<select
										className="form-select"
										value={filterInfo.key}
										onChange={(event) => {
											const newFilter = getInitialFilterEditing(
												filter.category,
												event.target.value,
												filter,
											);
											setFilter(i, newFilter);
										}}
										style={{
											width: 150,
										}}
									>
										{Object.values(allFilters[filter.category]!.options).map(
											(row, i) => {
												const col = getCol(row.colKey, row.colOverrides);
												return (
													<option key={i} value={row.key} title={col.desc}>
														{col.title}
														{col.desc !== undefined ? ` (${col.desc})` : null}
													</option>
												);
											},
										)}
									</select>
								</div>
								<div className="d-flex gap-2">
									{filter.key === "abbrev" ? (
										<SelectTeam
											value={filter.value}
											onChange={(value) => {
												setFilter(i, {
													...filter,
													operator: "is exactly",
													value,
												});
											}}
										/>
									) : (
										<>
											<SelectOperator
												type={filterInfo.valueType}
												value={filter.operator}
												onChange={(operator) => {
													setFilter(i, {
														...filter,
														operator,
													});
												}}
											/>
											<ValueInput
												type={filterInfo.valueType}
												value={filter.value}
												onChange={(value) => {
													setFilter(i, {
														...filter,
														value,
													});
												}}
												errorMessage={filter.errorMessage}
											/>
										</>
									)}
								</div>
							</div>
							<button
								className="text-danger btn btn-link p-0 border-0"
								onClick={() => {
									setFilters((oldFilters) => {
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
			<button
				type="button"
				className="btn btn-secondary"
				onClick={() => {
					setFilters((prev) => {
						return [...prev, getInitialFilterEditing("ratings", "ovr")];
					});
				}}
			>
				Add filter
			</button>
		</div>
	);
};

const ShowStatTypes = ({
	showStatTypes,
	setShowStatTypes,
}: {
	showStatTypes: string[];
	setShowStatTypes: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
	const dropdownOptions = useDropdownOptions("statTypesAdv");

	const allStatTypes = [
		{ key: "bio", value: "Bio" },
		{ key: "ratings", value: "Ratings" },
		...(isSport("basketball")
			? [
					{ key: "regular", value: "Traditional Stats" },
					...dropdownOptions.filter(
						(row) =>
							row.key !== "perGame" &&
							row.key !== "per36" &&
							row.key !== "totals",
					),
				]
			: isSport("baseball")
				? dropdownOptions.filter((row) => row.key !== "fielding")
				: dropdownOptions),
	];

	return (
		<>
			{allStatTypes.map((x) => {
				const id = `AdvancedPlayerSearchStatType-${x.key}`;
				return (
					<div className="form-check" key={x.key}>
						<input
							className="form-check-input"
							type="checkbox"
							checked={showStatTypes.includes(x.key as string)}
							id={id}
							onChange={(event) => {
								if (event.target.checked) {
									setShowStatTypes([...showStatTypes, x.key as string]);
								} else {
									setShowStatTypes(showStatTypes.filter((y) => y !== x.key));
								}
							}}
						/>
						<label className="form-check-label" htmlFor={id}>
							{Array.isArray(x.value) ? x.value.at(-1)!.text : x.value}
						</label>
					</div>
				);
			})}
		</>
	);
};

const filtersToEditable = (
	filters: AdvancedPlayerSearchFilter[],
): AdvancedPlayerSearchFilterEditing[] => {
	return filters.map((filter) => {
		return {
			...filter,
			value: filter.value === null ? "" : String(filter.value),
			errorMessage: undefined,
		};
	});
};

const filtersFromEditable = (
	filters: AdvancedPlayerSearchFilterEditing[],
): AdvancedPlayerSearchFilter[] => {
	return filters.map((filter) => {
		const info = getFilterInfo(filter.category, filter.key);
		return {
			category: filter.category,
			key: filter.key,
			operator: filter.operator,
			value:
				info?.valueType === "numeric"
					? filter.value === ""
						? null
						: helpers.localeParseFloat(filter.value)
					: filter.value,
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
	const { challengeNoRatings, currentSeason } = props;

	const [fetchingPlayers, setFetchingPlayers] = useState(false);

	const [[seasonStart, seasonEnd], setSeasonRange] = useState<[number, number]>(
		[props.seasonStart, props.seasonEnd],
	);
	const [singleSeason, setSingleSeason] = useState(props.singleSeason);
	const [playoffs, setPlayoffs] = useState(props.playoffs);
	const [statType, setStatType] = useState(props.statType);
	const [filters, setFilters] = useState(() => {
		return filtersToEditable(props.filters);
	});
	const [showStatTypes, setShowStatTypes] = useState(props.showStatTypes);

	const [rendered, setRendered] = useState({
		players: undefined as any[] | undefined,
		seasonStart,
		seasonEnd,
		singleSeason,
		playoffs,
		statType,
		filters: props.filters,
		showStatTypes,
	});

	const updatePlayers = async () => {
		setFetchingPlayers(true);

		const newFilters = filtersFromEditable(filters);

		const newPlayers = await toWorker("main", "advancedPlayerSearch", {
			seasonStart,
			seasonEnd,
			singleSeason,
			playoffs,
			statType,
			filters: newFilters,
			showStatTypes,
		});

		setRendered({
			players: newPlayers,
			seasonStart,
			seasonEnd,
			singleSeason,
			playoffs,
			statType,
			filters: newFilters,
			showStatTypes,
		});

		setFetchingPlayers(false);
	};

	useTitleBar({
		title: "Advanced Player Search",
	});

	useLayoutEffect(() => {
		// If URL has some paramters in it, load initial players
		if (!location.pathname.endsWith("/advanced_player_search")) {
			updatePlayers();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const seasons = useDropdownOptions("seasons");
	const playoffsOptions = useDropdownOptions("playoffsCombined");
	const statTypes = useDropdownOptions("statTypesStrict");

	const defaultCols = useRef([
		"Name",
		"Pos",
		"Team",
		"Age",
		"Contract",
		"Exp",
		"Season",
		"Ovr",
		"Pot",
	]);

	const { uniqueColFiltersWithInfo, uniqueStatTypeInfos } = useMemo(() => {
		const renderedFiltersWithInfos = rendered.filters
			.map((filter) => {
				const info = getFilterInfo(filter.category, filter.key);
				return {
					filter,
					info: info!,
				};
			})
			.filter((row) => !!row.info);

		const seenCols = new Set(defaultCols.current);
		const uniqueColFiltersWithInfo = renderedFiltersWithInfos.filter(
			(filter) => {
				if (seenCols.has(filter.info.colKey)) {
					return false;
				}
				seenCols.add(filter.info.colKey);
				return true;
			},
		);

		// Process these after filters, so filter cols get shown first
		let uniqueStatTypeInfos = [];
		for (const statType of rendered.showStatTypes) {
			const keys = getExtraStatTypeKeys([statType]);
			if (statType === "bio") {
				uniqueStatTypeInfos.push(
					...keys.attrs.map((key) => {
						const info = allFilters.bio!.options[key]!;
						return info;
					}),
				);
			} else if (statType === "ratings") {
				uniqueStatTypeInfos.push(
					...keys.ratings.map((key) => {
						const info = allFilters.ratings!.options[key]!;
						return info;
					}),
				);
			} else {
				uniqueStatTypeInfos.push(
					...keys.stats.map((key) => {
						const info = allFilters[statType]!.options[key]!;
						return info;
					}),
				);
			}
		}
		uniqueStatTypeInfos = uniqueStatTypeInfos.filter((row) => {
			if (seenCols.has(row.colKey)) {
				return false;
			}
			seenCols.add(row.colKey);
			return true;
		});

		return { uniqueColFiltersWithInfo, uniqueStatTypeInfos };
	}, [rendered.filters, rendered.showStatTypes]);

	const cols = getCols([
		...defaultCols.current,
		...uniqueColFiltersWithInfo.map((filter) => filter.info.colKey),
		...uniqueStatTypeInfos.map((row) => row.colKey),
	]);

	const currentSeasonOnly =
		rendered.seasonStart === rendered.seasonEnd &&
		rendered.seasonStart === currentSeason;

	// useMemo because this is slow, don't want to run it on every unrelated state change
	const rows = useMemo<DataTableRow[] | undefined>(() => {
		return rendered.players?.map((p, i) => {
			const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

			return {
				key: i,
				metadata: {
					type: "player",
					pid: p.pid,
					season: p.ratings.season,
					playoffs,
				},
				data: [
					wrappedPlayerNameLabels({
						pid: p.pid,
						injury: p.injury,
						season: p.ratings.season,
						skills: p.ratings.skills,
						jerseyNumber: p.stats.jerseyNumber,
						defaultWatch: p.watch,
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
					rendered.singleSeason === "totals"
						? wrappedAgeAtDeath(p.age, p.ageAtDeath)
						: p.age,
					p.contract.amount > 0 ? wrappedContractAmount(p) : null,
					p.contract.amount > 0 && currentSeasonOnly
						? wrappedContractExp(p)
						: null,
					p.stats.seasonStart !== undefined && p.stats.seasonEnd !== undefined
						? formatSeasonRange(p.stats.seasonStart, p.stats.seasonEnd)
						: p.ratings.season,
					showRatings ? p.ratings.ovr : null,
					showRatings ? p.ratings.pot : null,
					...[
						...uniqueColFiltersWithInfo.map((row) => row.info),
						...uniqueStatTypeInfos,
					].map((info) => {
						const value = info.getValue(p, rendered.singleSeason);
						if (info.category === "bio") {
							return value;
						} else if (info.category === "ratings") {
							return showRatings ? value : null;
						} else {
							if (
								isSport("basketball") &&
								(info.key === "pm100" || info.key === "onOff100")
							) {
								return <PlusMinus>{value as number}</PlusMinus>;
							}
							return helpers.roundStat(
								value,
								info.key,
								rendered.statType === "totals",
							);
						}
					}),
				],
			};
		});
	}, [
		challengeNoRatings,
		currentSeasonOnly,
		playoffs,
		rendered.players,
		rendered.singleSeason,
		rendered.statType,
		uniqueColFiltersWithInfo,
		uniqueStatTypeInfos,
	]);

	return (
		<>
			<form
				className="mb-5"
				onSubmit={async (event) => {
					event.preventDefault();

					const actualFilters = filtersFromEditable(filters);

					// This is just to set the URL so ctrl+R works
					realtimeUpdate(
						[],
						helpers.leagueUrl([
							"advanced_player_search",
							seasonStart,
							seasonEnd,
							singleSeason,
							playoffs,
							statType,
							JSON.stringify(
								actualFilters.map((filter) => {
									return [
										filter.category,
										filter.key,
										filter.operator,
										filter.value,
									];
								}),
							),
							JSON.stringify(showStatTypes),
						]),
					);

					await updatePlayers();
				}}
			>
				<div className="row row-cols-md-auto g-3 mb-3">
					<div className="col-12 col-sm-6">
						<div className="input-group">
							<select
								className="form-select"
								value={seasonStart}
								onChange={(event) => {
									const season = Number.parseInt(event.target.value);
									if (season > seasonEnd) {
										setSeasonRange([season, season]);
									} else {
										setSeasonRange([season, seasonEnd]);
									}
								}}
							>
								{seasons.map((x) => {
									return <OptionDropdown key={x.key} value={x} />;
								})}
							</select>
							<span className="input-group-text">to</span>
							<select
								className="form-select"
								value={seasonEnd}
								onChange={(event) => {
									const season = Number.parseInt(event.target.value);
									if (season < seasonStart) {
										setSeasonRange([season, season]);
									} else {
										setSeasonRange([seasonStart, season]);
									}
								}}
							>
								{seasons.map((x) => {
									return <OptionDropdown key={x.key} value={x} />;
								})}
							</select>
						</div>
					</div>
					<div className="col-12 col-sm-6">
						<select
							className="form-select"
							value={singleSeason}
							onChange={(event) => {
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
							onChange={(event) => {
								const newPlayoffs = event.target.value as any;

								setPlayoffs(newPlayoffs);
							}}
							value={playoffs}
						>
							{playoffsOptions.map((x) => {
								return <OptionDropdown key={x.key} value={x} />;
							})}
						</select>
					</div>

					{isSport("basketball") ? (
						<div className="col-12 col-sm-6">
							<select
								className="form-select"
								value={statType}
								onChange={(event) => {
									setStatType(event.target.value as any);
								}}
							>
								{statTypes.map((x) => {
									return <OptionDropdown key={x.key} value={x} />;
								})}
							</select>
						</div>
					) : null}
				</div>
				<h3>Filters</h3>
				<Filters filters={filters} setFilters={setFilters} />
				<h3 className="mt-3">Additional columns to show</h3>
				<ShowStatTypes
					showStatTypes={showStatTypes}
					setShowStatTypes={setShowStatTypes}
				/>
				<ActionButton
					className="mt-3"
					disabled={filters.some((filter) => filter.errorMessage)}
					processing={fetchingPlayers}
					processingText="Loading"
					type="submit"
				>
					Search
				</ActionButton>
			</form>

			{!rows ? null : rows.length === 0 ? (
				"No players found"
			) : (
				<DataTable
					cols={cols}
					defaultSort={[defaultCols.current.length, "desc"]}
					defaultStickyCols={window.mobile ? 0 : 1}
					name="AdvancedPlayerSearch"
					pagination
					rows={rows}
				/>
			)}
		</>
	);
};

export default AdvancedPlayerSearch;
