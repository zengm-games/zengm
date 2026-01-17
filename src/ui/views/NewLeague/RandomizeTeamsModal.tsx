import { useState } from "react";
import { Modal } from "react-bootstrap";
import { REAL_PLAYERS_INFO } from "../../../common/index.ts";
import { SelectSeasonRange } from "./SelectSeasonRange.tsx";
import HelpPopover from "../../components/HelpPopover.tsx";
import {
	realContinents,
	type Continent,
} from "../../../common/geographicCoordinates.ts";
import Select from "react-select";
import ActionButton from "../../components/ActionButton.tsx";
import logEvent from "../../util/logEvent.ts";

export type PopulationFactor =
	| "random"
	| "randomWeighted"
	| "smallest"
	| "largest";

const newConfsDivsFields: {
	key: "confs" | "divs" | "teams";
	label: string;
}[] = [
	{
		key: "confs",
		label: "# confs",
	},
	{
		key: "divs",
		label: "# divs per conf",
	},
	{
		key: "teams",
		label: "# teams per div",
	},
];

const RandomizeTeamsModal = ({
	onCancel,
	onRandomize,
	show,
}: {
	onCancel: () => void;
	onRandomize: (arg: {
		real: boolean;
		populationFactor: PopulationFactor;
		continents: ReadonlyArray<Continent>;
		newConfDivNums: Record<"confs" | "divs" | "teams", number> | undefined;
		seasonRange: [number, number];
	}) => Promise<void>;
	show: boolean;
}) => {
	const [randomizing, setRandomizing] = useState(false);
	const [real, setReal] = useState(false);
	const [newConfsDivs, setNewConfsDivs] = useState(false);
	const [newConfsDivsNums, setNewConfsDivsNums] = useState({
		confs: "2",
		divs: "3",
		teams: "5",
	});
	const [populationFactor, setPopulationFactor] =
		useState<PopulationFactor>("random");
	const [continents, setContinents] =
		useState<ReadonlyArray<Continent>>(realContinents);
	const [seasonStart, setSeasonStart] = useState(
		REAL_PLAYERS_INFO?.MIN_SEASON ?? 0,
	);
	const [seasonEnd, setSeasonEnd] = useState(
		REAL_PLAYERS_INFO?.MAX_SEASON ?? 0,
	);
	const seasonRange: [number, number] = [seasonStart, seasonEnd];

	const actualContinents: ReadonlyArray<Continent> = real
		? ["North America"]
		: continents;

	const onSubmit = async () => {
		setRandomizing(true);

		try {
			let actualNewConfDivNums;
			if (newConfsDivs) {
				actualNewConfDivNums = {
					confs: Number.parseInt(newConfsDivsNums.confs),
					divs: Number.parseInt(newConfsDivsNums.divs),
					teams: Number.parseInt(newConfsDivsNums.teams),
				};

				for (const { key, label } of newConfsDivsFields) {
					if (
						actualNewConfDivNums[key] < 1 ||
						Number.isNaN(actualNewConfDivNums[key])
					) {
						throw new Error(`Invalid value for "${label}`);
					}
				}
			}

			await onRandomize({
				real,
				populationFactor,
				continents: actualContinents,
				newConfDivNums: actualNewConfDivNums,
				seasonRange,
			});
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
			});
		}

		setRandomizing(false);
	};

	const populationFactorOptions: {
		key: PopulationFactor;
		label: string;
		description: string;
	}[] = [
		{
			key: "random",
			label: "Random",
			description: "All regions have the same chance to be selected.",
		},
		{
			key: "randomWeighted",
			label: "Random, weight by population",
			description: "Larger regions have a higher chance to be selected.",
		},
		{
			key: "smallest",
			label: "Smallest regions only",
			description:
				"Only the smallest regions will be selected, with no randomness.",
		},
		{
			key: "largest",
			label: "Largest regions only",
			description:
				"Only the largest regions will be selected, with no randomness.",
		},
	];

	const maxWidth = 250;

	return (
		<Modal show={show} onHide={onCancel}>
			<Modal.Header closeButton>
				<Modal.Title>Randomize teams</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<form onSubmit={onSubmit}>
					{REAL_PLAYERS_INFO ? (
						<div className="mb-3" style={{ maxWidth }}>
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

					<div className="mb-3">
						<div style={{ maxWidth }}>
							<label className="form-label" htmlFor="randomize-confs-divs">
								Conferences and divisions
							</label>
							<HelpPopover className="ms-1">
								<p>
									By default, your current conferences and divisions will be
									kept, they will just have all their teams replaced by new
									teams.
								</p>
								<p>
									Altenratively, if you select <b>Generate new confs/divs</b>{" "}
									then you can quickly specify new ones. For instance, 2
									conferences with 2 divisions each and 10 teams each would
									generate 2*2*10=40 teams.
								</p>
							</HelpPopover>
							<select
								className="form-select"
								id="randomize-confs-divs"
								onChange={(event) => {
									setNewConfsDivs(event.target.value === "new");
								}}
								value={newConfsDivs ? "new" : "keep"}
							>
								<option value="keep">Keep current confs/divs</option>
								<option value="new">Generate new confs/divs</option>
							</select>
						</div>

						{newConfsDivs ? (
							<div className="mt-3 row">
								{newConfsDivsFields.map(({ key, label }) => {
									return (
										<div key={key} className="col">
											<label
												htmlFor={`randomize-confs-divs-${key}`}
												className="form-label"
											>
												{label}
											</label>
											<input
												type="number"
												className="form-control"
												id={`randomize-confs-divs-${key}`}
												min={1}
												step={1}
												value={newConfsDivsNums[key]}
												onChange={(event) => {
													setNewConfsDivsNums((prev) => {
														return {
															...prev,
															[key]: event.target.value,
														};
													});
												}}
											></input>
										</div>
									);
								})}
							</div>
						) : null}
					</div>

					<div className="mb-3" style={{ maxWidth }}>
						<label className="form-label" htmlFor="randomize-teams-population">
							Select by population
						</label>
						<HelpPopover className="ms-1">
							{populationFactorOptions.map((option) => {
								return (
									<p key={option.key}>
										<b>{option.label}:</b> {option.description}
									</p>
								);
							})}
						</HelpPopover>
						<select
							className="form-select"
							id="randomize-teams-population"
							onChange={(event) => {
								setPopulationFactor(event.target.value as any);
							}}
							value={populationFactor}
						>
							{populationFactorOptions.map((option) => {
								return (
									<option key={option.key} value={option.key}>
										{option.label}
									</option>
								);
							})}
						</select>
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
				<button
					className="btn btn-secondary"
					disabled={randomizing}
					onClick={onCancel}
				>
					Cancel
				</button>
				<ActionButton
					maintainWidth={false}
					onClick={onSubmit}
					processing={randomizing}
					processingText="Randomizing..."
					variant="primary"
				>
					Randomize
				</ActionButton>
			</Modal.Footer>
		</Modal>
	);
};

export default RandomizeTeamsModal;
