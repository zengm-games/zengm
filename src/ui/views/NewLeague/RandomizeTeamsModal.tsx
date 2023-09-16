import { useState } from "react";
import { Modal } from "react-bootstrap";
import { SPORT_HAS_REAL_PLAYERS } from "../../../common";
import { SelectSeasonRange } from "./SelectSeasonRange";
import { MAX_SEASON, MIN_SEASON } from ".";

const RandomizeTeamsModal = ({
	onCancel,
	onRandomize,
	show,
}: {
	onCancel: () => void;
	onRandomize: (arg: {
		real: boolean;
		weightByPopulation: boolean;
		northAmericaOnly: boolean;
		seasonRange: [number, number];
	}) => void;
	show: boolean;
}) => {
	const [real, setReal] = useState(false);
	const [weightByPopulation, setWeightByPopulation] = useState(true);
	const [northAmericaOnly, setNorthAmericaOnly] = useState(false);
	const [seasonStart, setSeasonStart] = useState(MIN_SEASON);
	const [seasonEnd, setSeasonEnd] = useState(MAX_SEASON);
	const seasonRange: [number, number] = [seasonStart, seasonEnd];

	const actualNorthAmericaOnly = northAmericaOnly || real;

	const onSubmit = () => {
		onRandomize({
			real,
			weightByPopulation,
			northAmericaOnly: actualNorthAmericaOnly,
			seasonRange,
		});
	};

	return (
		<Modal show={show} onHide={onCancel}>
			<Modal.Header closeButton>
				<Modal.Title>Randomize Teams</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<p>
					This will replace your current teams with a set of random teams
					{SPORT_HAS_REAL_PLAYERS
						? " - either completely random teams with fake players, or real teams from any season"
						: null}
					. It will also try to group them into reasonable divisions.
				</p>
				<p>
					"Weight by population" means it is more likely to select teams from
					larger cities. Otherwise, each team has an equal chance of being
					selected.
				</p>
				<form onSubmit={onSubmit}>
					{SPORT_HAS_REAL_PLAYERS ? (
						<div className="mb-3" style={{ width: 250 }}>
							<select
								className="form-select"
								value={real ? "real" : "random"}
								onChange={event => {
									setReal(event.target.value === "real");
								}}
							>
								<option value="random">Random teams and players</option>
								<option value="real">Real teams and players</option>
							</select>
						</div>
					) : null}
					<div className="form-check form-switch mb-3">
						<input
							className="form-check-input"
							type="checkbox"
							role="switch"
							id="randomize-teams-popweight"
							checked={weightByPopulation}
							onChange={() => {
								setWeightByPopulation(value => !value);
							}}
						/>
						<label
							className="form-check-label"
							htmlFor="randomize-teams-popweight"
						>
							Weight by population
						</label>
					</div>
					<div className="form-check form-switch mb-3">
						<input
							className="form-check-input"
							type="checkbox"
							role="switch"
							id="randomize-teams-northamerica"
							checked={actualNorthAmericaOnly}
							disabled={real}
							onChange={() => {
								setNorthAmericaOnly(value => !value);
							}}
						/>
						<label
							className="form-check-label"
							htmlFor="randomize-teams-northamerica"
						>
							North America only
						</label>
					</div>
					{real ? (
						<div className="d-flex align-items-center">
							<label htmlFor="select-season-range" className="me-2">
								Season range
							</label>
							<SelectSeasonRange
								id="select-season-range"
								seasonRange={seasonRange}
								setters={[setSeasonStart, setSeasonEnd]}
							/>
						</div>
					) : null}
				</form>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={onCancel}>
					Cancel
				</button>
				<button className="btn btn-primary" onClick={onSubmit}>
					Randomize
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default RandomizeTeamsModal;
