import React, { useEffect, useRef, useState } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import { Modal } from "react-bootstrap";
import { PHASE, PHASE_TEXT, helpers } from "../../common";

const Confirm = confirmable(
	({ show, proceed, currentSeason, repeatSeason }: any) => {
		const [phase, setPhase] = useState(String(PHASE.PRESEASON));
		const [season, setSeason] = useState(String(currentSeason + 1));

		const inputRef = useRef<HTMLInputElement>(null);

		useEffect(() => {
			// Ugly hack that became necessary when upgrading reactstrap from v6 to v8
			setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.select();
				}
			}, 0);
		}, []);

		const cancel = () => proceed(null);
		const ok = () => proceed({ season, phase });

		const phases: {
			phase: string;
			text: string;
		}[] = [];
		for (const [phase, text] of Object.entries(PHASE_TEXT)) {
			const phaseInt = parseInt(phase);
			if (phaseInt < 0) {
				continue;
			}

			if (repeatSeason && phaseInt >= PHASE.DRAFT) {
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
			<Modal show={show} onHide={cancel}>
				<Modal.Body>
					During auto play, the AI will manage your team. How long to you want
					to simulate until?
					<form
						className="mt-3"
						onSubmit={event => {
							event.preventDefault();
							ok();
						}}
					>
						<div className="form-row">
							<div className="col">
								<input
									ref={inputRef}
									type="text"
									className="form-control"
									placeholder="Season"
									onChange={event => {
										setSeason(event.target.value);
									}}
									value={season}
								/>
							</div>
							<div className="col">
								<select
									className="form-control"
									onChange={event => {
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
	},
);

const confirmFunction = createConfirmation(Confirm);

// Pass "defaultValue" and it's used as the default value, like window.prompt. Don't pass "defaultValue" and it's like window.confirm.
const autoPlayDialog = (
	currentSeason: number,
	repeatSeason: boolean,
): {
	phase: string;
	season: string;
} | null => {
	// @ts-ignore
	return confirmFunction({
		currentSeason,
		repeatSeason,
	});
};

export default autoPlayDialog;
