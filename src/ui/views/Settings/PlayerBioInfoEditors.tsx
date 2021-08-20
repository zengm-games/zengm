import { ChangeEvent, useRef, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
import { animation } from "./Injuries";
import { confirm, helpers, logEvent } from "../../util";
import classNames from "classnames";
import { isInvalidNumber } from "./PlayerBioInfo";

type RaceRow = Record<"race" | "frequency", string>;

const parseAndValidate = (races: RaceRow[]) => {
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
	id,
	country,
	defaultSelected,
	onSave,
	onSetDefault,
	races,
}: {
	id: number;
	country: string;
	defaultSelected: boolean;
	onSave: (races: RaceRow[]) => void;
	onSetDefault: () => void;
	races: RaceRow[];
}) => {
	const [show, setShow] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [racesEdited, setRacesEditedRaw] = useState([...races]);
	const lastSavedState = useRef<RaceRow[] | undefined>();

	const setRacesEdited = (
		racesEdited: Parameters<typeof setRacesEditedRaw>[0],
	) => {
		setRacesEditedRaw(racesEdited);
		setDirty(true);
	};

	const handleShow = () => {
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
			setRacesEditedRaw(lastSavedState.current ?? [...races]);
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

		try {
			parseAndValidate(racesEdited);
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
		lastSavedState.current = racesEdited;
		setDirty(false);

		setShow(false);

		onSave(racesEdited);
	};

	const handleChange =
		(i: number) => (event: ChangeEvent<HTMLInputElement>) => {
			setRacesEdited(rows =>
				rows.map((row, j) => {
					if (i !== j) {
						return row;
					}

					return {
						...row,
						frequency: event.target.value,
					};
				}),
			);
		};

	return (
		<>
			<Dropdown>
				<Dropdown.Toggle variant="secondary" id={`dropdown-race-${id}`}>
					{defaultSelected ? "Default" : "Custom"}
				</Dropdown.Toggle>

				<Dropdown.Menu>
					<Dropdown.Item onClick={onSetDefault}>Default</Dropdown.Item>
					<Dropdown.Item onClick={handleShow}>Custom</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
			<Modal
				size="sm"
				show={show}
				onHide={handleCancel}
				animation={animation}
				scrollable
			>
				<Modal.Header closeButton>
					<Modal.Title>Races - {country}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<form onSubmit={handleSave}>
						<input type="submit" className="d-none" />
						<div className="form-row font-weight-bold">
							<div className="col-8">Race</div>
							<div className="col-4">Frequency</div>
						</div>
						{racesEdited.map((race, i) => (
							<div key={race.race} className="form-row mt-2 align-items-center">
								<div className="col-8">
									{helpers.upperCaseFirstLetter(race.race)}
								</div>
								<div className="col-4">
									<input
										type="text"
										className={classNames("form-control", {
											"is-invalid": isInvalidNumber(parseFloat(race.frequency)),
										})}
										value={race.frequency}
										onChange={handleChange(i)}
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
						Save
					</button>
				</Modal.Footer>
			</Modal>
		</>
	);
};
