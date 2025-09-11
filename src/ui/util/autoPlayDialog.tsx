import { useEffect, useRef, useState } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import Modal from "../components/Modal.tsx";
import { PHASE, PHASE_TEXT, helpers } from "../../common/index.ts";

const Confirm = confirmable<
	{
		currentSeason: number;
		forceHistoricalRosters: boolean;
		repeatSeason: "players" | "playersAndRosters" | undefined;
	},
	{
		season: string;
		phase: string;
	} | null
>(({ show, proceed, currentSeason, forceHistoricalRosters, repeatSeason }) => {
	const [phase, setPhase] = useState(String(PHASE.PRESEASON));
	const [season, setSeason] = useState(String(currentSeason + 1));

	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.select();
		}
	}, []);

	const cancel = () => proceed(null);
	const ok = () => proceed({ season, phase });

	const phases: {
		phase: string;
		text: string;
	}[] = [];
	for (const [phase, text] of Object.entries(PHASE_TEXT)) {
		const phaseInt = Number.parseInt(phase);
		if (phaseInt < 0) {
			continue;
		}

		if (
			(repeatSeason === "playersAndRosters" || forceHistoricalRosters) &&
			phaseInt >= PHASE.DRAFT
		) {
			continue;
		}

		if (
			repeatSeason === "players" &&
			(phaseInt === PHASE.DRAFT || phaseInt === PHASE.AFTER_DRAFT)
		) {
			continue;
		}

		if (phaseInt === PHASE.AFTER_TRADE_DEADLINE) {
			continue;
		}

		phases.push({
			phase,
			text: helpers.upperCaseFirstLetter(text),
		});
	}

	return (
		<Modal animation show={show} onHide={cancel}>
			<Modal.Body>
				During auto play, the AI will manage your team. How long to you want to
				simulate until?
				<form
					className="mt-3"
					onSubmit={(event) => {
						event.preventDefault();
						ok();
					}}
				>
					<div className="row gx-2">
						<div className="col">
							<input
								ref={inputRef}
								type="number"
								className="form-control"
								placeholder="Season"
								onChange={(event) => {
									setSeason(event.target.value);
								}}
								value={season}
								inputMode="numeric"
							/>
						</div>
						<div className="col">
							<select
								className="form-select"
								onChange={(event) => {
									setPhase(event.target.value);
								}}
								value={phase}
							>
								{phases.map(({ phase, text }) => (
									<option key={phase} value={phase}>
										{text}
									</option>
								))}
							</select>
						</div>
					</div>
				</form>
			</Modal.Body>

			<Modal.Footer>
				<button className="btn btn-secondary" onClick={cancel}>
					Cancel
				</button>
				<button className="btn btn-primary" onClick={ok}>
					Simulate!
				</button>
			</Modal.Footer>
		</Modal>
	);
});

const confirmFunction = createConfirmation(Confirm);

const autoPlayDialog = (
	currentSeason: number,
	forceHistoricalRosters: boolean,
	repeatSeason: "players" | "playersAndRosters" | undefined,
) => {
	return confirmFunction({
		currentSeason,
		forceHistoricalRosters,
		repeatSeason,
	});
};

export default autoPlayDialog;
