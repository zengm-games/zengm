import { useState } from "react";
import { Modal } from "react-bootstrap";
import { SPORT_HAS_REAL_PLAYERS } from "../../../common/index.ts";
import { SelectSeasonRange } from "./SelectSeasonRange.tsx";
import { MAX_SEASON, MIN_SEASON } from "./index.tsx";
import HelpPopover from "../../components/HelpPopover.tsx";
import {
	realContinents,
	type Continent,
} from "../../../common/geographicCoordinates.ts";
import Select from "react-select";

const RandomizeTeamsModal = ({
	onCancel,
	onRandomize,
	show,
}: {
	onCancel: () => void;
	onRandomize: (arg: {
		real: boolean;
		weightByPopulation: boolean;
		continents: ReadonlyArray<Continent>;
		seasonRange: [number, number];
	}) => void;
	show: boolean;
}) => {
	const [real, setReal] = useState(false);
	const [weightByPopulation, setWeightByPopulation] = useState(true);
	const [continents, setContinents] =
		useState<ReadonlyArray<Continent>>(realContinents);
	const [seasonStart, setSeasonStart] = useState(MIN_SEASON);
	const [seasonEnd, setSeasonEnd] = useState(MAX_SEASON);
	const seasonRange: [number, number] = [seasonStart, seasonEnd];

	const actualContinents: ReadonlyArray<Continent> = real
		? ["North America"]
		: continents;

	const onSubmit = () => {
		onRandomize({
			real,
			weightByPopulation,
			continents: actualContinents,
			seasonRange,
		});
	};

	return (
		<Modal show={show} onHide={onCancel}>
			<Modal.Header closeButton>
				<Modal.Title>Randomize teams</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<form onSubmit={onSubmit}>
					{SPORT_HAS_REAL_PLAYERS ? (
						<div className="mb-3" style={{ width: 250 }}>
							<select
								className="form-select"
								value={real ? "real" : "random"}
								onChange={(event) => {
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
								setWeightByPopulation((value) => !value);
							}}
						/>
						<label
							className="form-check-label"
							htmlFor="randomize-teams-popweight"
						>
							Weight by population
						</label>
						<HelpPopover className="ms-1">
							"Weight by population" means teams from larger cities are more
							likely to be selected. Otherwise, each team has an equal chance of
							being selected.
						</HelpPopover>
					</div>
					{real ? null : (
						<>
							<div className="mb-1 d-flex">
								<div>Continents</div>
								<button
									className="btn btn-secondary btn-xs ms-auto"
									onClick={() => {
										console.log("CLIK");
										setContinents(realContinents);
									}}
									type="button"
								>
									Select all
								</button>
							</div>
							<Select
								classNamePrefix="dark-select"
								// Close menu on select of the last available item
								closeMenuOnSelect={
									continents.length === realContinents.length - 1
								}
								options={realContinents.map((continent) => ({
									continent,
								}))}
								value={actualContinents.map((continent) => ({
									continent,
								}))}
								getOptionLabel={(x) => x.continent}
								getOptionValue={(x) => x.continent}
								isMulti
								onChange={(newValue) => {
									setContinents(newValue.map((x) => x.continent));
								}}
							/>
						</>
					)}
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
