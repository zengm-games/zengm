import { useEffect, useRef, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
import { downloadFile, helpers, resetFileInput, toWorker } from "../../util";
import classNames from "classnames";
import {
	Defaults,
	formatPlayerBioInfoState,
	isInvalidNumber,
	PageInfo,
	parseAndValidate,
	PlayerBioInfoState,
	prune,
} from "./PlayerBioInfo";
import { IMPORT_FILE_STYLE } from "./Injuries";

export const smallColStyle = {
	marginLeft: 10,
	width: 81,
};

export const PlayerBioInfoRowButton = ({
	className,
	onClick,
	title,
	icon,
}: {
	className: string;
	onClick: () => void;
	title: string;
	icon: string;
}) => {
	return (
		<button
			className={`${className} btn btn-link pl-2 pr-0 py-0 border-0`}
			onClick={onClick}
			style={{ fontSize: 20, marginTop: 10 }}
			title={title}
			type="button"
		>
			<span className={`glyphicon ${icon}`} />
		</button>
	);
};

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
			style={IMPORT_FILE_STYLE}
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
						const info = JSON.parse(event2.currentTarget.result);
						setInfoState(
							formatPlayerBioInfoState(
								info.gameAttributes.playerBioInfo,
								defaults,
							),
						);
					} catch (error) {
						setErrorMessage(error.message);
						return;
					}
				};
			}}
		/>
	</button>
);

const ExportButton = ({
	defaults,
	infoState,
}: {
	defaults: Defaults;
	infoState: PlayerBioInfoState;
}) => (
	<button
		className="btn btn-light-bordered"
		onClick={() => {
			const parsed = parseAndValidate(infoState);
			const pruned = prune(parsed, defaults);

			downloadFile(
				"playerBioInfo.json",
				JSON.stringify({ gameAttributes: { playerBioInfo: pruned } }),
				"application/json",
			);
		}}
	>
		Export
	</button>
);

type SetInfoState = (
	infoState:
		| PlayerBioInfoState
		| ((infoState: PlayerBioInfoState) => PlayerBioInfoState),
) => void;

type CountryRow = PlayerBioInfoState["countries"][number];

const Controls = ({
	defaults,
	defaultsState,
	infoState,
	position,
	setInfoState,
}: {
	defaults: Defaults;
	defaultsState: PlayerBioInfoState;
	infoState: PlayerBioInfoState;
	position: "top" | "bottom";
	setInfoState: SetInfoState;
}) => {
	const [importErrorMessage, setImportErrorMessage] = useState<
		string | undefined
	>();

	const addCountry = (newCountry: CountryRow) => {
		if (position === "top") {
			setInfoState(data => ({
				...data,
				countries: [newCountry, ...data.countries],
			}));
		} else {
			setInfoState(data => ({
				...data,
				countries: [...data.countries, newCountry],
			}));
		}
	};

	const currentCountryNames = new Set(
		infoState.countries.map(row => row.country),
	);
	const defaultCountriesAvailable = defaultsState.countries.filter(
		row => !currentCountryNames.has(row.country),
	);

	return (
		<>
			<div className="d-flex justify-content-between">
				<div className="btn-group">
					<Dropdown>
						<Dropdown.Toggle
							className="btn-light-bordered btn-light-bordered-group-left"
							variant="foo"
							id="dropdown-countries-add"
						>
							Add
						</Dropdown.Toggle>

						<Dropdown.Menu>
							<Dropdown.Item
								onClick={async () => {
									const newCountry: CountryRow = {
										id: Math.random(),
										country: "Country",
										frequency: "1",

										builtIn: false,

										defaultRaces: true,
										races: [...infoState.defaultRaces],

										defaultColleges: true,
										colleges: [...infoState.defaultColleges],
										fractionSkipCollege: "0.98",

										defaultNames: false,
										names: {
											first: [],
											last: [],
										},
									};

									addCountry(newCountry);
								}}
							>
								Custom
							</Dropdown.Item>
							{defaultCountriesAvailable.map(row => (
								<Dropdown.Item
									key={row.id}
									onClick={() => {
										addCountry({ ...row });
									}}
								>
									{row.country}
								</Dropdown.Item>
							))}
						</Dropdown.Menu>
					</Dropdown>
					<Dropdown>
						<Dropdown.Toggle
							className="btn-light-bordered btn-light-bordered-group-right"
							variant="foo"
							id="dropdown-countries-reset"
						>
							Reset
						</Dropdown.Toggle>

						<Dropdown.Menu>
							<Dropdown.Item
								onClick={async () => {
									setInfoState(
										formatPlayerBioInfoState(
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
									setInfoState(data => ({
										...data,
										countries: [],
									}));
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
					<ExportButton defaults={defaults} infoState={infoState} />
				</div>
			</div>

			{importErrorMessage ? (
				<div className="text-danger mt-3">{importErrorMessage}</div>
			) : null}
		</>
	);
};

export const CountriesEditor = ({
	defaults,
	defaultsState,
	handleCancel,
	handleChange,
	handleSave,
	onSetDefault,
	infoState,
	setInfoState,
	setPageInfo,
	countriesScroll,
	setCountriesScroll,
}: {
	defaults: Defaults;
	defaultsState: PlayerBioInfoState;
	handleCancel: any;
	handleChange: any;
	handleSave: any;
	onSetDefault: (type: "colleges" | "names" | "races", i: number) => void;
	infoState: PlayerBioInfoState;
	setInfoState: SetInfoState;
	setPageInfo: (pageInfo: PageInfo) => void;
	countriesScroll: number;
	setCountriesScroll: (scrollTop: number) => void;
}) => {
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const setPageInfoWrapper = (pageInfo: PageInfo) => {
		setPageInfo(pageInfo);
		setCountriesScroll(wrapperRef.current?.scrollTop ?? 0);
	};

	useEffect(() => {
		if (wrapperRef.current && countriesScroll !== 0) {
			wrapperRef.current.scrollTop = countriesScroll;
			setCountriesScroll(0);
		}
	}, [countriesScroll, setCountriesScroll, wrapperRef]);

	return (
		<>
			<Modal.Body ref={wrapperRef}>
				<p>
					By default, leagues can have players from any of the built-in
					countries. Each built-in country comes with built-in names and races,
					and they all share the same default colleges list. Here you can edit
					any of that, or add custom countries.
				</p>
				<p>
					The probability of a new player being from a certain country being
					selected is its "frequency" value divided by the sum of all
					frequencies. Names, colleges, and races work the same way.
				</p>

				<div className="mb-3">
					<button
						className="btn btn-secondary mr-2"
						onClick={() => {
							setPageInfoWrapper({
								name: "colleges",
								index: "default",
							});
						}}
					>
						Edit default colleges
					</button>
					<button
						className="btn btn-secondary"
						onClick={() => {
							setPageInfoWrapper({
								name: "races",
								index: "default",
							});
						}}
					>
						Edit default races
					</button>
				</div>

				<Controls
					defaults={defaults}
					defaultsState={defaultsState}
					position="top"
					infoState={infoState}
					setInfoState={setInfoState}
				/>

				{infoState.countries.length > 0 ? (
					<form onSubmit={handleSave} className="my-3">
						<input type="submit" className="d-none" />
						<div
							className="d-flex font-weight-bold"
							style={{ marginRight: 55 }}
						>
							<div className="flex-grow-1">Country</div>
							<div style={smallColStyle}>Frequency</div>
							<div style={smallColStyle}>Names</div>
							<div style={smallColStyle}>Colleges</div>
							<div style={smallColStyle}>Races</div>
						</div>
						{infoState.countries.map((country, i) => (
							<div key={country.id} className="d-flex">
								<div className="d-flex mt-2 flex-grow-1">
									<div className="flex-grow-1">
										<input
											type="text"
											className="form-control"
											value={country.country}
											onChange={handleChange("country", i)}
										/>
									</div>
									<div style={smallColStyle}>
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
									{(["names", "colleges", "races"] as const).map(key => {
										const onClickCustom = () => {
											setPageInfoWrapper({
												name: key,
												index: i,
											});
										};

										if (key === "names" && !country.builtIn) {
											// Non-built in countries have no default names

											return (
												<div style={smallColStyle} key={key}>
													<button
														className="btn btn-secondary w-100"
														onClick={onClickCustom}
													>
														Custom
													</button>
												</div>
											);
										}

										return (
											<div style={smallColStyle} key={key}>
												<Dropdown>
													<Dropdown.Toggle
														variant="secondary"
														id={`dropdown-${key}-${country.id}`}
														className="w-100"
													>
														{country[
															`default${helpers.upperCaseFirstLetter(
																key,
															)}` as const
														]
															? "Default"
															: "Custom"}
													</Dropdown.Toggle>

													<Dropdown.Menu>
														<Dropdown.Item
															onClick={() => {
																onSetDefault(key, i);
															}}
														>
															Default
														</Dropdown.Item>
														<Dropdown.Item onClick={onClickCustom}>
															Custom
														</Dropdown.Item>
													</Dropdown.Menu>
												</Dropdown>
											</div>
										);
									})}
								</div>
								<PlayerBioInfoRowButton
									className="text-reset"
									onClick={() => {
										setInfoState(data => {
											const countries = [...data.countries];

											const newCountry = {
												...country,
												id: Math.random(),
											};

											countries.splice(i + 1, 0, newCountry);

											return {
												...data,
												countries,
											};
										});
									}}
									title="Clone"
									icon="glyphicon-plus"
								/>
								<PlayerBioInfoRowButton
									className="text-danger"
									onClick={() => {
										setInfoState(data => ({
											...data,
											countries: data.countries.filter(row => row !== country),
										}));
									}}
									title="Delete"
									icon="glyphicon-remove"
								/>
							</div>
						))}
					</form>
				) : (
					<div className="mt-3 text-danger">
						You must define at least one country.
					</div>
				)}

				{infoState.countries.length > 0 ? (
					<Controls
						defaults={defaults}
						defaultsState={defaultsState}
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
					disabled={infoState.countries.length === 0}
				>
					Save
				</button>
			</Modal.Footer>
		</>
	);
};
