import { csvFormat, csvParse } from "d3-dsv";
import { m, AnimatePresence } from "framer-motion";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
import type { PlayerBioInfo, Race, ThenArg } from "../../../common/types";
import {
	confirm,
	downloadFile,
	logEvent,
	resetFileInput,
	toWorker,
} from "../../util";
import { godModeRequiredMessage } from "./SettingsForm";
import classNames from "classnames";
import { animation } from "./Injuries";
import type { initDefaults } from "../../../worker/util/loadNames";
import { getFrequencies, mergeCountries } from "../../../common/names";
import isEqual from "lodash-es/isEqual";
import orderBy from "lodash-es/orderBy";

type Defaults = ThenArg<ReturnType<typeof initDefaults>>;

const racesToText = (races: Record<Race, number>) =>
	orderBy(
		Object.entries(races).map(([race, frequency]) => ({
			race,
			frequency: String(frequency),
		})),
		"race",
	);

const formatInfoState = (
	playerBioInfo: PlayerBioInfo | undefined,
	defaults: Defaults | undefined,
) => {
	if (defaults === undefined) {
		return [];
	}

	const mergedCountries = mergeCountries(
		playerBioInfo,
		defaults.namesCountries,
		defaults.namesGroups,
		defaults.groups,
	);

	// also get back frequencies, in case not defined in playerBioInfo
	const frequencies = getFrequencies(playerBioInfo, defaults.countries);

	const countries = [];

	for (const [country, frequency] of Object.entries(frequencies)) {
		const mergedCountry = mergedCountries[country];
		if (!mergedCountry) {
			continue;
		}

		const defaultRaces2 =
			defaults.races[country] ??
			playerBioInfo?.default?.races ??
			defaults.races.USA;
		const races = mergedCountry.races ?? defaultRaces2;
		const defaultRaces = isEqual(races, defaultRaces2);

		const names = {
			first: mergedCountry.first ?? {},
			last: mergedCountry.last ?? {},
		};
		const defaultNamesAllowed = !!defaults.countries[country];
		let defaultNames = false;
		if (defaultNamesAllowed) {
			let fromGroup;
			for (const [group, countries] of Object.entries(defaults.groups)) {
				if (countries.includes(country)) {
					fromGroup = group;
					break;
				}
			}

			let namesCountry;
			if (fromGroup) {
				namesCountry = defaults.namesGroups[fromGroup];
			} else if (defaults.namesCountries[country]) {
				namesCountry = defaults.namesCountries[country];
			}

			if (namesCountry) {
				defaultNames =
					defaultNamesAllowed &&
					isEqual(names.first, namesCountry.first) &&
					isEqual(names.last, namesCountry.last);
			}
		}

		const racesText = racesToText(races);

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
			namesText[key] = orderBy(
				Object.entries(names[key]).map(([name, frequency]) => ({
					name,
					frequency: String(frequency),
				})),
				"frequency",
				"desc",
			);
		}

		countries.push({
			id: Math.random(),
			country,
			frequency: String(frequency),

			defaultRaces,
			races: racesText,

			defaultNames,
			defaultNamesAllowed,
			names: namesText,
		});
	}

	return countries;
};

type PlayerBioInfoState = ReturnType<typeof formatInfoState>;

// https://stackoverflow.com/a/35200633/786644
const ImportButton = ({
	defaults,
	setErrorMessage,
	setInfoState,
}: {
	defaults: Defaults | undefined;
	setErrorMessage: (errorMessage?: string) => void;
	setInfoState: (injuries: PlayerBioInfoState) => void;
}) => (
	<button
		className="btn btn-light-bordered"
		style={{ position: "relative", overflow: "hidden" }}
		onClick={() => {}}
	>
		Import
		<input
			className="cursor-pointer"
			type="file"
			style={{
				position: "absolute",
				top: 0,
				right: 0,
				minWidth: "100%",
				minHeight: "100%",
				fontSize: 100,
				display: "block",
				filter: "alpha(opacity=0)",
				opacity: 0,
				outline: "none",
			}}
			onClick={resetFileInput}
			onChange={event => {
				if (!event.target.files) {
					return;
				}
				const file = event.target.files[0];
				if (!file) {
					return;
				}

				setErrorMessage();

				const reader = new window.FileReader();
				reader.readAsText(file);

				reader.onload = async event2 => {
					try {
						// @ts-ignore
						const rows = csvParse(event2.currentTarget.result);

						if (
							!rows.columns.includes("name") ||
							!rows.columns.includes("frequency") ||
							!rows.columns.includes("games")
						) {
							setErrorMessage(
								"File should be a CSV file with columns: name, frequency, games",
							);
							return;
						}

						setInfoState(formatInfoState(rows as any), defaults);
					} catch (error) {
						setErrorMessage(error.message);
						return;
					}
				};
			}}
		/>
	</button>
);

const ExportButton = ({ infoState }: { infoState: PlayerBioInfoState }) => (
	<button
		className="btn btn-light-bordered"
		onClick={() => {
			const output = csvFormat(infoState, ["name", "frequency", "games"]);

			downloadFile("injuries.csv", output, "text/csv");
		}}
	>
		Export
	</button>
);

const Controls = ({
	defaults,
	infoState,
	position,
	setInfoState,
}: {
	defaults: Defaults;
	infoState: PlayerBioInfoState;
	position: "top" | "bottom";
	setInfoState: (
		infoState:
			| PlayerBioInfoState
			| ((infoState: PlayerBioInfoState) => PlayerBioInfoState),
	) => void;
}) => {
	const [importErrorMessage, setImportErrorMessage] = useState<
		string | undefined
	>();

	return (
		<>
			<div className="d-flex justify-content-between">
				<div className="btn-group">
					<button
						className="btn btn-light-bordered"
						onClick={() => {
							const newCountry: PlayerBioInfoState[number] = {
								id: Math.random(),
								country: "Country",
								frequency: "1",

								defaultRaces: false,
								races: racesToText(defaults.races.USA),

								defaultNames: false,
								defaultNamesAllowed: false,
								names: {
									first: [],
									last: [],
								},
							};
							if (position === "top") {
								setInfoState(rows => [newCountry, ...rows]);
							} else {
								setInfoState(rows => [...rows, newCountry]);
							}
						}}
					>
						Add
					</button>
					<Dropdown>
						<Dropdown.Toggle
							className="btn-light-bordered btn-light-bordered-group-right"
							variant="foo"
							id="dropdown-injuries-reset"
						>
							Reset
						</Dropdown.Toggle>

						<Dropdown.Menu>
							<Dropdown.Item
								onClick={async () => {
									setInfoState(
										formatInfoState(
											await toWorker("main", "getDefaultInjuries"),
											defaults,
										),
									);
								}}
							>
								Default
							</Dropdown.Item>
							<Dropdown.Item
								onClick={() => {
									setInfoState([]);
								}}
							>
								Clear
							</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
				</div>
				<div className="btn-group">
					<ImportButton
						defaults={defaults}
						setErrorMessage={setImportErrorMessage}
						setInfoState={setInfoState}
					/>
					<ExportButton infoState={infoState} />
				</div>
			</div>

			{importErrorMessage ? (
				<div className="text-danger mt-3">{importErrorMessage}</div>
			) : null}
		</>
	);
};

const isInvalidNumber = (number: number) => Number.isNaN(number) || number <= 0;

const parseAndValidate = (
	PlayerBioInfoState: PlayerBioInfoState,
): PlayerBioInfo | undefined => {
	const injuries = PlayerBioInfoState.map(row => ({
		name: row.name,
		frequency: parseFloat(row.frequency),
		games: parseFloat(row.games),
	}));

	for (const row of injuries) {
		if (isInvalidNumber(row.frequency)) {
			throw new Error(
				`Injury "${row.name}" has an invalid frequency - must be a positive number.`,
			);
		}

		if (isInvalidNumber(row.games)) {
			throw new Error(
				`Injury "${row.name}" has an invalid number of games - must be a positive number.`,
			);
		}
	}

	if (injuries.length === 0) {
		throw new Error("You must define at least one type of injury.");
	}

	return injuries;
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
	onChange: (injuries: PlayerBioInfo | undefined) => void;
}) => {
	const [show, setShow] = useState(false);
	const [infoState, setInfoStateRaw] = useState<
		PlayerBioInfoState | undefined
	>();
	const [dirty, setDirty] = useState(false);
	const lastSavedState = useRef<PlayerBioInfoState | undefined>();
	const [defaults, setDefaults] = useState<Defaults | undefined>();

	const setInfoState = (
		infoState: PlayerBioInfoState | ((infoState: PlayerBioInfoState) => void),
	) => {
		setInfoStateRaw(infoState as any);
		setDirty(true);
	};

	const loadDefaults = async () => {
		const defaults = await toWorker("main", "getPlayerBioInfoDefaults");
		setDefaults(defaults);
		setInfoStateRaw(formatInfoState(defaultValue, defaults));
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
				"Are you sure you want to discard your changes?",
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
				lastSavedState.current ?? formatInfoState(defaultValue, defaults),
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

		let parsed;
		try {
			parsed = parseAndValidate(infoState);
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
		(key: "name" | "frequency" | "games", i: number) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setInfoState(rows =>
				rows.map((row, j) => {
					if (i !== j) {
						return row;
					}

					return {
						...row,
						[key]: event.target.value,
					};
				}),
			);
		};

	const title = disabled ? godModeRequiredMessage(godModeRequired) : undefined;

	let modal = null;
	if (infoState && defaults) {
		modal = (
			<Modal
				size="lg"
				show={show}
				onHide={handleCancel}
				animation={animation}
				scrollable
			>
				<Modal.Header closeButton>
					<Modal.Title>Player Biographical Info</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>
						The probability of a new player being from a certain country being
						selected is its "frequency" value divided by the sum of all
						frequencies.
					</p>

					<Controls
						defaults={defaults}
						position="top"
						infoState={infoState}
						setInfoState={setInfoState}
					/>

					{infoState.length > 0 ? (
						<form onSubmit={handleSave} className="my-3">
							<input type="submit" className="d-none" />
							<div className="form-row" style={{ marginRight: 22 }}>
								<div className="col-6">Name</div>
								<div className="col-3">Frequency</div>
								<div className="col-3">Games</div>
							</div>
							<AnimatePresence initial={false}>
								{infoState.map((country, i) => (
									<m.div
										key={country.id}
										initial={{ opacity: 0, y: -38 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{}}
										layout
										transition={{ duration: 0.2, type: "tween" }}
									>
										<div className="d-flex">
											<div className="form-row mt-1 flex-grow-1" key={i}>
												<div className="col-6">
													<input
														type="text"
														className="form-control"
														value={country.country}
														onChange={handleChange("name", i)}
													/>
												</div>
												<div className="col-3">
													<input
														type="text"
														className={classNames("form-control", {
															"is-invalid": isInvalidNumber(
																parseFloat(country.frequency),
															),
														})}
														value={country.frequency}
														onChange={handleChange("frequency", i)}
													/>
												</div>
												<div className="col-3">AAA</div>
											</div>
											<button
												className="text-danger btn btn-link pl-2 pr-0 border-0"
												onClick={() => {
													setInfoState(rows =>
														rows.filter(row => row !== country),
													);
												}}
												style={{ fontSize: 20 }}
												title="Delete"
												type="button"
											>
												<span className="glyphicon glyphicon-remove" />
											</button>
										</div>
									</m.div>
								))}
							</AnimatePresence>
						</form>
					) : (
						<div className="mt-3 text-danger">
							You must define at least one country.
						</div>
					)}

					{infoState.length > 0 ? (
						<Controls
							defaults={defaults}
							position="bottom"
							infoState={infoState}
							setInfoState={setInfoState}
						/>
					) : null}
				</Modal.Body>
				<Modal.Footer>
					<button className="btn btn-secondary" onClick={handleCancel}>
						Cancel
					</button>
					<button
						className="btn btn-primary"
						onClick={handleSave}
						disabled={infoState.length === 0}
					>
						Save
					</button>
				</Modal.Footer>
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
