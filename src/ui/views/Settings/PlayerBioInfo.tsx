import { ChangeEvent, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import type { PlayerBioInfo } from "../../../common/types";
import { confirm, helpers, logEvent, toWorker } from "../../util";
import { godModeRequiredMessage } from "./SettingsFormOptions";
import { animation } from "./RowsEditor";
import type { initDefaults } from "../../../worker/util/loadNames";
import { getFrequencies, mergeCountries } from "../../../common/names";
import isEqual from "lodash-es/isEqual";
import orderBy from "lodash-es/orderBy";
import {
	CollegesEditor,
	FlagEditor,
	NamesEditor,
	RacesEditor,
} from "./PlayerBioInfoEditors";
import { CountriesEditor } from "./PlayerBioInfoCountries";

export type Defaults = Awaited<ReturnType<typeof initDefaults>>;

export const objectToArray = <T extends string>(
	object: Record<string, number>,
	key: T,
	sortKey: string,
	order?: "asc" | "desc",
): Record<T | "frequency", string>[] =>
	orderBy(
		Object.entries(object).map(
			([name, frequency]) =>
				({
					[key]: name,
					frequency: String(frequency),
				} as Record<T | "frequency", string>),
		),
		sortKey,
		order,
	);

export const arrayToObject = <T extends string>(
	array: Record<T | "frequency", string>[],
	key: T,
): Record<string, number> => {
	const output: Record<string, number> = {};
	for (const row of array) {
		output[row[key]] = parseFloat(row.frequency);
	}

	return output;
};

export const formatPlayerBioInfoState = (
	playerBioInfo: PlayerBioInfo | undefined,
	defaults: Defaults | undefined,
) => {
	if (defaults === undefined) {
		return {
			defaultRaces: [],
			defaultColleges: [],
			defaultFractionSkipCollege: "0.98",
			countries: [],
		};
	}

	const mergedCountries = mergeCountries(
		playerBioInfo,
		defaults.namesCountries,
		defaults.namesGroups,
		defaults.groups,
	);

	const defaultMergedCountries =
		playerBioInfo === undefined
			? mergedCountries
			: mergeCountries(
					undefined,
					defaults.namesCountries,
					defaults.namesGroups,
					defaults.groups,
			  );

	// Happens when playerBioInfo is undefined
	const allDefaults = mergedCountries === defaultMergedCountries;

	// Also get frequencies, in case not defined in playerBioInfo
	const frequencies = getFrequencies(playerBioInfo, defaults.countries);

	const countries = [];

	const defaultColleges2 =
		playerBioInfo?.default?.colleges ?? defaults.colleges;

	const defaultFractionSkipCollege2 =
		playerBioInfo?.default?.fractionSkipCollege ?? 0.98;

	for (const [country, frequency] of Object.entries(frequencies)) {
		const mergedCountry = mergedCountries[country];
		if (!mergedCountry) {
			continue;
		}

		const names = {
			first: mergedCountry.first ?? {},
			last: mergedCountry.last ?? {},
		};
		const builtIn = !!defaults.countries[country];
		let defaultNames = false;
		if (builtIn) {
			if (allDefaults) {
				defaultNames = true;
			} else {
				const namesCountry = defaultMergedCountries[country];

				if (namesCountry) {
					defaultNames =
						builtIn &&
						isEqual(names.first, namesCountry.first) &&
						isEqual(names.last, namesCountry.last);
				}
			}
		}

		const namesText: Record<
			"first" | "last",
			{
				name: string;
				frequency: string;
			}[]
		> = {
			first: [],
			last: [],
		};
		for (const key of ["first", "last"] as const) {
			namesText[key] = objectToArray(names[key], "name", "frequency", "desc");
		}

		const colleges = mergedCountry.colleges ?? defaultColleges2;
		const defaultColleges = allDefaults || isEqual(colleges, defaultColleges2);
		const collegesText = objectToArray(colleges, "name", "name");

		const defaultRaces2 =
			defaults.races[country] ??
			playerBioInfo?.default?.races ??
			defaults.races.USA;
		const races = mergedCountry.races ?? defaultRaces2;
		const defaultRaces = allDefaults || isEqual(races, defaultRaces2);
		const racesText = objectToArray(races, "race", "race");

		const fractionSkipCollege =
			mergedCountry.fractionSkipCollege ??
			(country === "USA" || country === "Canada"
				? 0.02
				: defaultFractionSkipCollege2);
		const fractionSkipCollegeText =
			fractionSkipCollege === defaultFractionSkipCollege2
				? ""
				: String(fractionSkipCollege);

		countries.push({
			id: Math.random(),
			country,
			frequency: String(frequency),

			builtIn,

			defaultNames,
			names: namesText,

			defaultColleges,
			colleges: collegesText,

			// Empty string means use default, which is different than the array ones where it copies the default in and makes it editable. This is because the default status is not conveniently shown on the main page
			fractionSkipCollege: fractionSkipCollegeText,

			defaultRaces,
			races: racesText,

			flag: mergedCountry.flag,
		});
	}

	const defaultCollegesText = objectToArray(defaultColleges2, "name", "name");
	const defaultRacesText = objectToArray(
		playerBioInfo?.default?.races ?? defaults.races.USA,
		"race",
		"race",
	);
	const defaultFractionSkipCollegeText = String(defaultFractionSkipCollege2);

	return {
		defaultColleges: defaultCollegesText,
		defaultRaces: defaultRacesText,
		defaultFractionSkipCollege: defaultFractionSkipCollegeText,
		countries: orderBy(countries, "country"),
	};
};

export type PlayerBioInfoState = ReturnType<typeof formatPlayerBioInfoState>;

export const isInvalidNumber = (number: number) =>
	Number.isNaN(number) || number <= 0;

// Assume it's all already validated by sub-pages, except the list of countries
export const parseAndValidate = (state: PlayerBioInfoState) => {
	const output: Required<PlayerBioInfo> = {
		default: {
			colleges: arrayToObject(state.defaultColleges, "name"),
			fractionSkipCollege: parseFloat(state.defaultFractionSkipCollege),
			races: arrayToObject(state.defaultRaces, "race"),
		},
		countries: {},
		frequencies: {},
	};

	for (const row of state.countries) {
		if (output.frequencies.hasOwnProperty(row.country)) {
			throw new Error(
				`Country names must be unique, but you have multiple countries named "${row.country}"`,
			);
		}

		const frequency = parseFloat(row.frequency);
		if (Number.isNaN(frequency)) {
			throw new Error(
				`Invalid frequency "${row.frequency}" for country "${row.country}"`,
			);
		}
		output.frequencies[row.country] = frequency;

		const country: typeof output["countries"][string] = {};
		for (const type of ["first", "last"] as const) {
			if (row.names[type].length === 0) {
				throw new Error(
					`You must define at least one ${type} name for the country "${row.country}".`,
				);
			}

			country[type] = arrayToObject(row.names[type], "name");
		}
		country.colleges = arrayToObject(row.colleges, "name");
		if (row.fractionSkipCollege !== "") {
			country.fractionSkipCollege = parseFloat(row.fractionSkipCollege);
		}
		country.races = arrayToObject(row.races, "race");
		if (row.flag !== undefined) {
			country.flag = row.flag;
		}

		output.countries[row.country] = country;
	}

	return output;
};

export const prune = (
	info: Required<PlayerBioInfo>,
	defaults: Defaults,
): PlayerBioInfo | undefined => {
	// This is what would happen with the current defaults applied to the built-ins
	const defaultMergedCountries = mergeCountries(
		{
			default: info.default,
		},
		defaults.namesCountries,
		defaults.namesGroups,
		defaults.groups,
	);

	// Check countries
	for (const [name, country] of Object.entries(info.countries)) {
		const mergedCountry = defaultMergedCountries[name];
		if (!mergedCountry) {
			continue;
		}

		for (const key of ["first", "last"] as const) {
			if (isEqual(country[key], mergedCountry[key])) {
				delete country[key];
			}
		}

		if (
			((name === "USA" || name === "Canada") &&
				country.fractionSkipCollege === 0.02) ||
			country.fractionSkipCollege === 0.98
		) {
			delete country.fractionSkipCollege;
		}

		if (isEqual(country.colleges, defaults.colleges)) {
			delete country.colleges;
		}

		if (isEqual(country.races, defaults.races[name] ?? defaults.races.USA)) {
			delete country.races;
		}

		if (Object.keys(country).length === 0) {
			delete info.countries[name];
		}
	}

	// Check defaults
	if (isEqual(info.default.colleges, defaults.colleges)) {
		delete info.default.colleges;
	}
	if (info.default.fractionSkipCollege === 0.98) {
		delete info.default.fractionSkipCollege;
	}
	if (isEqual(info.default.races, defaults.races.USA)) {
		delete info.default.races;
	}

	// Check frequencies
	const defaultFrequencies = getFrequencies(
		{
			countries: info.countries,
		},
		defaults.countries,
	);
	if (isEqual(defaultFrequencies, info.frequencies)) {
		info.frequencies = {};
	}

	const output: PlayerBioInfo = {};

	// Remove keys from root of object if there are no values
	for (const key of helpers.keys(info)) {
		if (Object.keys(info[key]).length > 0) {
			(output as any)[key] = info[key];
		}
	}

	if (Object.keys(output).length === 0) {
		return undefined;
	}

	return output;
};

export type PageInfo =
	| {
			name: "countries";
	  }
	| {
			name: "colleges";
			index: number | "default";
	  }
	| {
			name: "flag";
			index: number;
	  }
	| {
			name: "names";
			index: number;
	  }
	| {
			name: "races";
			index: number | "default";
	  };

const PlayerBioInfo2 = ({
	defaultValue,
	disabled,
	godModeRequired,
	onChange,
}: {
	defaultValue: PlayerBioInfo | undefined;
	disabled: boolean;
	godModeRequired?: "always" | "existingLeagueOnly";
	onChange: (playerBioInfo: PlayerBioInfo | undefined) => void;
}) => {
	const [show, setShow] = useState(false);
	const [infoState, setInfoStateRaw] = useState<
		PlayerBioInfoState | undefined
	>();
	const [defaultsState, setDefaultsState] = useState<
		PlayerBioInfoState | undefined
	>();
	const [dirty, setDirty] = useState(false);
	const lastSavedState = useRef<PlayerBioInfoState | undefined>();
	const [defaults, setDefaults] = useState<Defaults | undefined>();
	const [pageInfo, setPageInfo] = useState<PageInfo>({
		name: "countries",
	});
	const [countriesScroll, setCountriesScroll] = useState(0);

	const setInfoState = (
		infoState: PlayerBioInfoState | ((infoState: PlayerBioInfoState) => void),
	) => {
		setInfoStateRaw(infoState as any);
		setDirty(true);
	};

	const loadDefaults = async () => {
		const defaults = await toWorker(
			"main",
			"getPlayerBioInfoDefaults",
			undefined,
		);
		setDefaults(defaults);

		const infoState = formatPlayerBioInfoState(defaultValue, defaults);
		setInfoStateRaw(infoState);

		// Assume no player bio info... then processed (stringified) defaults are the output of this
		const defaultsState =
			defaultValue === undefined
				? infoState
				: formatPlayerBioInfoState(undefined, defaults);
		setDefaultsState(defaultsState);
	};

	const handleShow = async () => {
		if (!defaults) {
			await loadDefaults();
		}

		setShow(true);
	};

	const handleCancel = async () => {
		if (dirty) {
			const result = await confirm(
				"Are you sure you want to discard all your changes?",
				{
					okText: "Discard",
					cancelText: "Cancel",
				},
			);
			if (!result) {
				return;
			}

			// Reset for next time
			setInfoStateRaw(
				lastSavedState.current ??
					formatPlayerBioInfoState(defaultValue, defaults),
			);
			setDirty(false);
		}

		setShow(false);
	};

	const handleSave = (event: {
		preventDefault: () => void;
		stopPropagation: () => void;
	}) => {
		event.preventDefault();

		// Don't submit parent form
		event.stopPropagation();

		if (!infoState || !defaults) {
			return;
		}

		let parsed;
		try {
			parsed = parseAndValidate(infoState);
			parsed = prune(parsed, defaults);
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
			return;
		}

		// Save for next time
		lastSavedState.current = infoState;
		setDirty(false);

		setShow(false);

		onChange(parsed);
	};

	const handleChange =
		(key: "country" | "frequency" | "games", i: number) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setInfoState(data => ({
				...data,
				countries: data.countries.map((row, j) => {
					if (i !== j) {
						return row;
					}

					const extraProps: Partial<typeof data["countries"][number]> = {};
					if (key === "country") {
						// Just sets the default to false. Might be better to compare values, like it does in prune.
						extraProps.defaultNames = false;
						extraProps.defaultRaces = false;
						extraProps.builtIn = !!defaults?.countries.hasOwnProperty(
							event.target.value,
						);
					}

					return {
						...row,
						...extraProps,
						[key]: event.target.value,
					};
				}),
			}));
		};

	// Just sets the default to false. Might be better to compare values, like it does in prune.
	const handleChange2 =
		(
			key: "colleges" | "flag" | "fractionSkipCollege" | "names" | "races",
			i: number | "default",
		) =>
		(rows: any) => {
			const defaultProp = `default${helpers.upperCaseFirstLetter(
				key,
			)}` as const;

			if (i === "default") {
				if (key === "fractionSkipCollege") {
					// No need to update countries, cause default is stored as blank there
					setInfoState(data => ({
						...data,
						defaultFractionSkipCollege: rows,
					}));
				} else {
					setInfoState(data => ({
						...data,
						[defaultProp]: rows,
						countries: data.countries.map(row => {
							// Skip for races in built-in countries
							if (row.builtIn && key === "races") {
								return row;
							}

							// Apply the new default
							if (
								defaultProp !== "defaultFlag" &&
								defaultProp !== "defaultFractionSkipCollege" &&
								row[defaultProp]
							) {
								return {
									...row,
									[key]: [...rows],
								};
							}

							return row;
						}),
					}));
				}
			} else {
				setInfoState(data => ({
					...data,
					countries: data.countries.map((row, j) => {
						if (i !== j) {
							return row;
						}

						if (key === "flag" || key === "fractionSkipCollege") {
							return {
								...row,
								[key]: rows,
							};
						} else {
							return {
								...row,
								[key]: rows,
								[defaultProp]: false,
							};
						}
					}),
				}));
			}

			if (key !== "fractionSkipCollege") {
				setPageInfo({
					name: "countries",
				});
			}
		};

	const onCancel = () => {
		setPageInfo({
			name: "countries",
		});
	};

	const title = disabled ? godModeRequiredMessage(godModeRequired) : undefined;

	let modal = null;
	if (infoState && defaults && defaultsState) {
		let title = "Player Bio Info";
		if (pageInfo.name !== "countries") {
			const countryName =
				pageInfo.index === "default"
					? "Default"
					: infoState.countries[pageInfo.index].country;
			title += ` - ${countryName} - ${helpers.upperCaseFirstLetter(
				pageInfo.name,
			)}`;
		}

		modal = (
			<Modal
				size="lg"
				show={show}
				onHide={handleCancel}
				animation={animation}
				scrollable
			>
				<Modal.Header closeButton>
					<Modal.Title>{title}</Modal.Title>
				</Modal.Header>
				{pageInfo.name === "countries" ? (
					<CountriesEditor
						defaults={defaults}
						defaultsState={defaultsState}
						handleCancel={handleCancel}
						handleChange={handleChange}
						handleSave={handleSave}
						onSetDefault={(type, i) => {
							const country = infoState.countries[i].country;

							let array: any;

							if (type === "colleges") {
								array = [...infoState.defaultColleges];
							} else if (type === "races") {
								if (defaults.races[country]) {
									array = objectToArray(
										defaults.races[country],
										"race",
										"race",
									);
								} else {
									array = [...infoState.defaultRaces];
								}
							} else if (type === "names") {
								const row = defaultsState.countries.find(
									row => row.country === country,
								);
								if (!row) {
									throw new Error("Country not found");
								}
								array = row.names;
							} else if (type !== "flag") {
								throw new Error("Invalid type");
							}

							setInfoState(data => ({
								...data,
								countries: data.countries.map((row, j) => {
									if (i !== j) {
										return row;
									}

									if (type === "flag") {
										return {
											...row,
											flag: undefined,
										};
									}

									// Would be better to check if value actually differs from default, but annoying to do since default is an object and state is array of objects. Maybe later, after conversion functions are written for saving.
									const defaultProp = `default${helpers.upperCaseFirstLetter(
										type,
									)}`;

									return {
										...row,
										[type]: array,
										[defaultProp]: true,
									};
								}),
							}));
						}}
						onSetNone={(type, i) => {
							if (type !== "flag") {
								throw new Error("Invalid type");
							}

							setInfoState(data => ({
								...data,
								countries: data.countries.map((row, j) => {
									if (i !== j) {
										return row;
									}

									return {
										...row,
										flag: "none",
									};
								}),
							}));
						}}
						infoState={infoState}
						setInfoState={setInfoState}
						setPageInfo={setPageInfo}
						countriesScroll={countriesScroll}
						setCountriesScroll={setCountriesScroll}
					/>
				) : pageInfo.name === "races" ? (
					<RacesEditor
						defaults={pageInfo.index === "default"}
						rows={
							pageInfo.index === "default"
								? infoState.defaultRaces
								: infoState.countries[pageInfo.index].races
						}
						onCancel={onCancel}
						onSave={handleChange2("races", pageInfo.index)}
					/>
				) : pageInfo.name === "colleges" ? (
					<>
						<CollegesEditor
							defaultRows={
								pageInfo.index === "default"
									? defaultsState.defaultColleges
									: infoState.defaultColleges
							}
							defaults={pageInfo.index === "default"}
							rows={
								pageInfo.index === "default"
									? infoState.defaultColleges
									: infoState.countries[pageInfo.index].colleges
							}
							onCancel={onCancel}
							onSave={handleChange2("colleges", pageInfo.index)}
							defaultFractionSkipCollege={infoState.defaultFractionSkipCollege}
							fractionSkipCollege={
								pageInfo.index === "default"
									? infoState.defaultFractionSkipCollege
									: infoState.countries[pageInfo.index].fractionSkipCollege
							}
							onSaveFractionSkipCollege={handleChange2(
								"fractionSkipCollege",
								pageInfo.index,
							)}
						/>
					</>
				) : pageInfo.name === "names" ? (
					<>
						<NamesEditor
							defaultRows={
								defaultsState.countries.find(
									row =>
										row.country === infoState.countries[pageInfo.index].country,
								)?.names
							}
							rows={infoState.countries[pageInfo.index].names}
							onCancel={onCancel}
							onSave={handleChange2("names", pageInfo.index)}
						/>
					</>
				) : pageInfo.name === "flag" ? (
					<>
						<FlagEditor
							flag={infoState.countries[pageInfo.index].flag}
							onCancel={onCancel}
							onSave={handleChange2("flag", pageInfo.index)}
						/>
					</>
				) : null}
			</Modal>
		);
	}

	return (
		<>
			<button
				className="btn btn-secondary"
				type="button"
				disabled={disabled}
				title={title}
				onClick={handleShow}
			>
				Customize
			</button>

			{modal}
		</>
	);
};

export default PlayerBioInfo2;
