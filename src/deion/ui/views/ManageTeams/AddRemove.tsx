import React, { Dispatch, FormEvent, MouseEvent } from "react";
import { PHASE } from "../../../common";
import { logEvent, toWorker, helpers } from "../../util";
import type { Phase } from "../../../common/types";
import type { Action } from ".";

type Props = {
	dispatch: Dispatch<Action>;
	phase: Phase;
	saving: boolean;
};

const AddRemove = ({ dispatch, phase, saving }: Props) => {
	const phaseDisabled = ![
		PHASE.PRESEASON,
		PHASE.AFTER_DRAFT,
		PHASE.RESIGN_PLAYERS,
		PHASE.FREE_AGENCY,
	].includes(phase);

	const addTeam = async (e: FormEvent) => {
		e.preventDefault();
		dispatch({
			type: "startSaving",
		});
		const t = await toWorker("main", "addTeam");
		dispatch({
			type: "addTeam",
			team: t,
		});
		logEvent({
			type: "success",
			text: "Added new team.",
			saveToDb: false,
		});
		dispatch({
			type: "doneSaving",
		});
	};

	const removeLastTeam = async (e: MouseEvent) => {
		e.preventDefault();
		dispatch({
			type: "startSaving",
		});
		await toWorker("main", "removeLastTeam");
		dispatch({
			type: "removeLastTeam",
		});
		logEvent({
			type: "success",
			text: "Removed last team.",
			saveToDb: false,
		});
		dispatch({
			type: "doneSaving",
		});
	};

	return (
		<>
			{phaseDisabled ? (
				<p className="text-danger">
					You can only add or remove teams during the preseason, after draft,
					re-signing, or free agency game phases.
				</p>
			) : null}
			<div className="row">
				<div className="col-sm">
					<p>
						After you add a team here, it will become available to edit in the
						form below. Created teams start with no players. You can use God
						Mode to set up the roster, or start simulating and the AI will sign
						free agents.
					</p>
					<p>
						An{" "}
						<a href={helpers.leagueUrl(["expansion_draft"])}>expansion draft</a>{" "}
						is generally a better way to add a team.
					</p>

					<form onSubmit={addTeam}>
						<button
							type="submit"
							className="btn btn-primary btn-lg mb-3"
							disabled={phaseDisabled || saving}
						>
							Add Team
						</button>
					</form>
				</div>
				<div className="col-sm">
					<p>
						Due to some stupid technical complexities, it is not currently
						possible to remove a team, except for the last team on the list
						below.
					</p>

					<p>Players on the removed team will become free agents.</p>

					<p>
						<span className="text-danger">Please be careful!</span> This will{" "}
						<span className="text-danger font-weight-bold">
							completely delete
						</span>{" "}
						all historical data for the last team on the list below.
					</p>

					<button
						className="btn btn-danger btn mb-3"
						onClick={removeLastTeam}
						disabled={phaseDisabled || saving}
					>
						Remove Last Team
					</button>
				</div>
			</div>
		</>
	);
};

export default AddRemove;
