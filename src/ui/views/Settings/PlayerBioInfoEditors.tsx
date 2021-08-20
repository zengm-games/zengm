import { ChangeEvent, useRef, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
import { animation } from "./Injuries";
import { confirm, helpers, logEvent } from "../../util";
import classNames from "classnames";
import { isInvalidNumber, PlayerBioInfoState } from "./PlayerBioInfo";

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
	races,
	onCancel,
	onSave,
}: {
	races: PlayerBioInfoState["countries"][number]["races"];
	onCancel: () => void;
	onSave: (races: RaceRow[]) => void;
}) => {
	const [racesEdited, setRacesEdited] = useState([...races]);
	const lastSavedState = useRef<RaceRow[] | undefined>();

	const handleCancel = async () => {
		// Reset for next time
		setRacesEdited(lastSavedState.current ?? [...races]);

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
			<Modal.Body>
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
					{racesEdited.map((race, i) => (
						<div key={race.race} className="form-row mt-2 align-items-center">
							<div className="col-6">
								{helpers.upperCaseFirstLetter(race.race)}
							</div>
							<div className="col-6">
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
					Save Races
				</button>
			</Modal.Footer>
		</>
	);
};
