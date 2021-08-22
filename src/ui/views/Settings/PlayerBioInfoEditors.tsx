import { ChangeEvent, useRef, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
import { helpers, logEvent } from "../../util";
import classNames from "classnames";
import { isInvalidNumber, PlayerBioInfoState } from "./PlayerBioInfo";
import {
	PlayerBioInfoRowButton,
	smallColStyle,
} from "./PlayerBioInfoCountries";

type RaceRow = PlayerBioInfoState["countries"][number]["races"][number];

const parseAndValidateRaces = (races: RaceRow[]) => {
	const VALID_RACES = ["asian", "black", "brown", "white"];

	for (const row of races) {
		if (!VALID_RACES.includes(row.race)) {
			throw new Error(`Invalid race "${row.race}"`);
		}

		const number = parseFloat(row.frequency);
		if (Number.isNaN(number)) {
			throw new Error(
				`Invalid frequency "${row.frequency}" for race "${row.race}"`,
			);
		}
	}
};

export const RacesEditor = ({
	defaults,
	rows,
	onCancel,
	onSave,
}: {
	defaults: boolean;
	rows: RaceRow[];
	onCancel: () => void;
	onSave: (races: RaceRow[]) => void;
}) => {
	const [rowsEdited, setRowsEdited] = useState([...rows]);
	const lastSavedState = useRef<RaceRow[] | undefined>();

	const handleCancel = async () => {
		// Reset for next time
		setRowsEdited(lastSavedState.current ?? [...rows]);

		onCancel();
	};

	const handleSave = (event: {
		preventDefault: () => void;
		stopPropagation: () => void;
	}) => {
		event.preventDefault();

		// Don't submit parent form
		event.stopPropagation();

		try {
			parseAndValidateRaces(rowsEdited);
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
		lastSavedState.current = rowsEdited;

		onSave(rowsEdited);
	};

	const handleChange =
		(field: "frequency", i: number) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setRowsEdited(rows =>
				rows.map((row, j) => {
					if (i !== j) {
						return row;
					}

					return {
						...row,
						[field]: event.target.value,
					};
				}),
			);
		};

	return (
		<>
			<Modal.Body>
				{defaults ? (
					<p className="alert alert-warning">
						Default races apply only to custom countries you create, not any of
						the built-in countries in the game. Built-in countries all have
						their own predefined default races.
					</p>
				) : null}

				<form
					onSubmit={handleSave}
					style={{
						maxWidth: 150,
					}}
				>
					<input type="submit" className="d-none" />
					<div className="form-row font-weight-bold">
						<div className="col-6">Race</div>
						<div className="col-6">Frequency</div>
					</div>
					{rowsEdited.map((rows, i) => (
						<div key={rows.race} className="form-row mt-2 align-items-center">
							<div className="col-6">
								{helpers.upperCaseFirstLetter(rows.race)}
							</div>
							<div className="col-6">
								<input
									type="text"
									className={classNames("form-control", {
										"is-invalid": isInvalidNumber(parseFloat(rows.frequency)),
									})}
									value={rows.frequency}
									onChange={handleChange("frequency", i)}
								/>
							</div>
						</div>
					))}
				</form>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={handleCancel}>
					Cancel
				</button>
				<button className="btn btn-primary" onClick={handleSave}>
					Save Races
				</button>
			</Modal.Footer>
		</>
	);
};

type CollegeRow = PlayerBioInfoState["countries"][number]["colleges"][number];

const isInvalidFractionSkipCollege = (
	fractionSkipCollege: string,
	defaults: boolean,
) => {
	if (!defaults && fractionSkipCollege === "") {
		// Can be empty string if not default
		return false;
	}
	const number = parseFloat(fractionSkipCollege);
	return Number.isNaN(number) || number < 0 || number > 1;
};

const parseAndValidateColleges = (
	colleges: CollegeRow[],
	fractionSkipCollege: string,
	defaults: boolean,
) => {
	for (const row of colleges) {
		const number = parseFloat(row.frequency);
		if (Number.isNaN(number)) {
			throw new Error(
				`Invalid frequency "${row.frequency}" for college "${row.name}"`,
			);
		}
	}

	if (isInvalidFractionSkipCollege(fractionSkipCollege, defaults)) {
		throw new Error(
			`Invalid fraction skip college value "${fractionSkipCollege}"`,
		);
	}
};

const CollegesControls = ({
	defaultRows,
	rows,
	position,
	onSave,
}: {
	defaultRows: CollegeRow[];
	rows: CollegeRow[];
	position: "top" | "bottom";
	onSave: (rows: CollegeRow[]) => void;
}) => {
	return (
		<>
			<div className="btn-group">
				<button
					className="btn btn-light-bordered"
					onClick={() => {
						const newCollege = {
							name: "College",
							frequency: "1",
						};
						if (position === "top") {
							onSave([newCollege, ...rows]);
						} else {
							onSave([...rows, newCollege]);
						}
					}}
				>
					Add
				</button>
				<Dropdown>
					<Dropdown.Toggle
						className="btn-light-bordered btn-light-bordered-group-right"
						variant="foo"
						id="dropdown-colleges-reset"
					>
						Reset
					</Dropdown.Toggle>

					<Dropdown.Menu>
						<Dropdown.Item
							onClick={() => {
								onSave(defaultRows);
							}}
						>
							Default
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								onSave([]);
							}}
						>
							Clear
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
			</div>
		</>
	);
};

export const CollegesEditor = ({
	defaultRows,
	defaults,
	rows,
	onCancel,
	onSave,

	defaultFractionSkipCollege,
	fractionSkipCollege,
	onSaveFractionSkipCollege,
}: {
	defaultRows: CollegeRow[];
	defaults: boolean;
	rows: CollegeRow[];
	onCancel: () => void;
	onSave: (rows: CollegeRow[]) => void;

	defaultFractionSkipCollege: string;
	fractionSkipCollege: string;
	onSaveFractionSkipCollege: (value: string) => void;
}) => {
	const [rowsEdited, setRowsEdited] = useState([...rows]);
	const lastSavedState = useRef<
		| undefined
		| {
				rowsEdited: CollegeRow[];
				fractionSkipCollegeEdited: string;
		  }
	>();

	const [fractionSkipCollegeEdited, setFractionSkipCollegeEdited] =
		useState(fractionSkipCollege);

	const handleCancel = async () => {
		// Reset for next time
		setRowsEdited(lastSavedState.current?.rowsEdited ?? [...rows]);
		setFractionSkipCollegeEdited(
			lastSavedState.current?.fractionSkipCollegeEdited ??
				fractionSkipCollegeEdited,
		);

		onCancel();
	};

	const handleSave = (event: {
		preventDefault: () => void;
		stopPropagation: () => void;
	}) => {
		event.preventDefault();

		// Don't submit parent form
		event.stopPropagation();

		try {
			parseAndValidateColleges(rowsEdited, fractionSkipCollegeEdited, defaults);
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
		lastSavedState.current = {
			rowsEdited,
			fractionSkipCollegeEdited,
		};

		onSaveFractionSkipCollege(fractionSkipCollegeEdited);
		onSave(rowsEdited);
	};

	const handleChange =
		(field: "name" | "frequency", i: number) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setRowsEdited(rows =>
				rows.map((row, j) => {
					if (i !== j) {
						return row;
					}

					return {
						...row,
						[field]: event.target.value,
					};
				}),
			);
		};

	const isInvalidFraction = isInvalidFractionSkipCollege(
		fractionSkipCollegeEdited,
		defaults,
	);

	return (
		<>
			<Modal.Body>
				<form onSubmit={handleSave}>
					<div className="form-group">
						<label htmlFor="fractionSkipCollege">
							Fraction of players who skip college
						</label>
						<input
							type="text"
							className={classNames("form-control", {
								"is-invalid": isInvalidFraction,
							})}
							style={{ maxWidth: 100 }}
							id="fractionSkipCollege"
							value={fractionSkipCollegeEdited}
							onChange={event => {
								setFractionSkipCollegeEdited(event.target.value);
							}}
						/>
						{isInvalidFraction ? (
							<span className="form-text text-danger">
								{defaults
									? "Value must be between 0 and 1."
									: "Value must be blank (default) or between 0 and 1."}
							</span>
						) : (
							<span className="form-text text-muted">
								{defaults
									? "By default, USA and Canada have their own default fraction that override this value."
									: `Leave blank to use the current default value (${defaultFractionSkipCollege}).`}
							</span>
						)}
					</div>
				</form>

				<CollegesControls
					defaultRows={defaultRows}
					position="top"
					rows={rowsEdited}
					onSave={setRowsEdited}
				/>

				<form
					onSubmit={handleSave}
					style={{
						maxWidth: 350,
					}}
					className="my-3"
				>
					<input type="submit" className="d-none" />
					<div className="d-flex font-weight-bold" style={{ marginRight: 26 }}>
						<div className="flex-grow-1">College</div>
						<div style={smallColStyle}>Frequency</div>
					</div>
					{rowsEdited.map((row, i) => (
						<div key={i} className="d-flex">
							<div className="d-flex mt-2 flex-grow-1">
								<div className="flex-grow-1">
									<input
										type="text"
										className="form-control"
										value={row.name}
										onChange={handleChange("name", i)}
									/>
								</div>
								<div style={smallColStyle}>
									<input
										type="text"
										className={classNames("form-control", {
											"is-invalid": isInvalidNumber(parseFloat(row.frequency)),
										})}
										value={row.frequency}
										onChange={handleChange("frequency", i)}
									/>
								</div>
							</div>
							<PlayerBioInfoRowButton
								className="text-danger"
								onClick={() => {
									setRowsEdited(rows => rows.filter(row2 => row !== row2));
								}}
								title="Delete"
								icon="glyphicon-remove"
							/>
						</div>
					))}
				</form>

				<CollegesControls
					defaultRows={defaultRows}
					position="bottom"
					rows={rowsEdited}
					onSave={setRowsEdited}
				/>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={handleCancel}>
					Cancel
				</button>
				<button className="btn btn-primary" onClick={handleSave}>
					Save Colleges
				</button>
			</Modal.Footer>
		</>
	);
};

type NameRow =
	PlayerBioInfoState["countries"][number]["names"]["first"][number];

type NameRows = PlayerBioInfoState["countries"][number]["names"];

const parseAndValidateNames = (names: NameRows) => {
	for (const key of ["first", "last"] as const) {
		if (names[key].length === 0) {
			throw new Error(`You must define at least one ${key} name.`);
		}

		for (const row of names[key]) {
			const number = parseFloat(row.frequency);
			if (Number.isNaN(number)) {
				throw new Error(
					`Invalid frequency "${row.frequency}" for ${key} name "${row.name}"`,
				);
			}
		}
	}
};

const NamesControls = ({
	defaultRows,
	rows,
	position,
	onSave,
}: {
	defaultRows: NameRow[] | undefined;
	rows: NameRow[];
	position: "top" | "bottom";
	onSave: (rows: NameRow[]) => void;
}) => {
	return (
		<>
			<div className="btn-group">
				<button
					className="btn btn-light-bordered"
					onClick={() => {
						const newName = {
							name: "Name",
							frequency: "1",
						};
						if (position === "top") {
							onSave([newName, ...rows]);
						} else {
							onSave([...rows, newName]);
						}
					}}
				>
					Add
				</button>
				<Dropdown>
					<Dropdown.Toggle
						className="btn-light-bordered btn-light-bordered-group-right"
						variant="foo"
						id="dropdown-names-reset"
					>
						Reset
					</Dropdown.Toggle>

					<Dropdown.Menu>
						{defaultRows ? (
							<Dropdown.Item
								onClick={() => {
									onSave(defaultRows);
								}}
							>
								Default
							</Dropdown.Item>
						) : null}
						<Dropdown.Item
							onClick={() => {
								onSave([]);
							}}
						>
							Clear
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
			</div>
		</>
	);
};

export const NamesEditor = ({
	defaultRows,
	rows,
	onCancel,
	onSave,
}: {
	defaultRows: NameRows | undefined;
	rows: NameRows;
	onCancel: () => void;
	onSave: (rows: NameRows) => void;
}) => {
	const [rowsEdited, setRowsEdited] = useState({ ...rows });
	const lastSavedState = useRef<undefined | NameRows>();
	const [firstOrLast, setFirstOrLast] = useState<"first" | "last">("first");

	const handleCancel = async () => {
		// Reset for next time
		setRowsEdited(lastSavedState.current ?? { ...rows });

		onCancel();
	};

	const handleSave = (event: {
		preventDefault: () => void;
		stopPropagation: () => void;
	}) => {
		event.preventDefault();

		// Don't submit parent form
		event.stopPropagation();

		try {
			parseAndValidateNames(rowsEdited);
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
		lastSavedState.current = rowsEdited;

		onSave(rowsEdited);
	};

	const handleChange =
		(field: "name" | "frequency", i: number) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setRowsEdited(rows => ({
				...rows,
				[firstOrLast]: rows[firstOrLast].map((row, j) => {
					if (i !== j) {
						return row;
					}

					return {
						...row,
						[field]: event.target.value,
					};
				}),
			}));
		};

	const setRowsEditedWrapper =
		(type: "first" | "last") => (rowsNew: NameRow[]) => {
			setRowsEdited(rows => ({
				...rows,
				[type]: rowsNew,
			}));
		};

	return (
		<>
			<Modal.Body>
				<NamesControls
					defaultRows={defaultRows?.[firstOrLast]}
					position="top"
					rows={rowsEdited[firstOrLast]}
					onSave={setRowsEditedWrapper(firstOrLast)}
				/>

				<ul className="nav nav-tabs mt-3">
					{(["first", "last"] as const).map(type => (
						<li key={type} className="nav-item">
							<a
								className={classNames("nav-link", {
									active: type === firstOrLast,
								})}
								onClick={() => {
									setFirstOrLast(type);
								}}
							>
								{helpers.upperCaseFirstLetter(type)}
							</a>
						</li>
					))}
				</ul>

				{rowsEdited[firstOrLast].length > 0 ? (
					<form
						onSubmit={handleSave}
						style={{
							maxWidth: 350,
						}}
						className="my-3"
					>
						<input type="submit" className="d-none" />
						<div
							className="d-flex font-weight-bold"
							style={{ marginRight: 26 }}
						>
							<div className="flex-grow-1">Name</div>
							<div style={smallColStyle}>Frequency</div>
						</div>
						{rowsEdited[firstOrLast].map((row, i) => (
							<div key={i} className="d-flex">
								<div className="d-flex mt-2 flex-grow-1">
									<div className="flex-grow-1">
										<input
											type="text"
											className="form-control"
											value={row.name}
											onChange={handleChange("name", i)}
										/>
									</div>
									<div style={smallColStyle}>
										<input
											type="text"
											className={classNames("form-control", {
												"is-invalid": isInvalidNumber(
													parseFloat(row.frequency),
												),
											})}
											value={row.frequency}
											onChange={handleChange("frequency", i)}
										/>
									</div>
								</div>
								<PlayerBioInfoRowButton
									className="text-danger"
									onClick={() => {
										setRowsEditedWrapper(firstOrLast)(
											rowsEdited[firstOrLast].filter(row2 => row !== row2),
										);
									}}
									title="Delete"
									icon="glyphicon-remove"
								/>
							</div>
						))}
					</form>
				) : (
					<div className="mt-3 text-danger">
						You must define at least one {firstOrLast} name.
					</div>
				)}

				{rowsEdited[firstOrLast].length > 0 ? (
					<NamesControls
						defaultRows={defaultRows?.[firstOrLast]}
						position="bottom"
						rows={rowsEdited[firstOrLast]}
						onSave={setRowsEditedWrapper(firstOrLast)}
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
					disabled={rowsEdited[firstOrLast].length === 0}
				>
					Save Names
				</button>
			</Modal.Footer>
		</>
	);
};
