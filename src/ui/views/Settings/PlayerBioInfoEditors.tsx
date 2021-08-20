import { ChangeEvent, useRef, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
import { helpers, logEvent } from "../../util";
import classNames from "classnames";
import { isInvalidNumber, PlayerBioInfoState } from "./PlayerBioInfo";

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

const parseAndValidateColleges = (colleges: CollegeRow[]) => {
	for (const row of colleges) {
		const number = parseFloat(row.frequency);
		if (Number.isNaN(number)) {
			throw new Error(
				`Invalid frequency "${row.frequency}" for college "${row.name}"`,
			);
		}
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
						id="dropdown-injuries-reset"
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
}: {
	defaultRows: CollegeRow[];
	defaults: boolean;
	rows: CollegeRow[];
	onCancel: () => void;
	onSave: (rows: CollegeRow[]) => void;
}) => {
	const [rowsEdited, setRowsEdited] = useState([...rows]);
	const lastSavedState = useRef<CollegeRow[] | undefined>();

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
			parseAndValidateColleges(rowsEdited);
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
					<div className="form-row font-weight-bold">
						<div className="col-9">College</div>
						<div className="col-3">Frequency</div>
					</div>
					{rowsEdited.map((row, i) => (
						<div key={i} className="form-row mt-2 align-items-center">
							<div className="col-9">
								<input
									type="text"
									className="form-control"
									value={row.name}
									onChange={handleChange("name", i)}
								/>
							</div>
							<div className="col-3">
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
