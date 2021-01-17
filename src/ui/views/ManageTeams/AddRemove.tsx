import type { Dispatch, FormEvent } from "react";
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
					<h2>Add Team</h2>
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
							className="btn btn-primary mb-3"
							disabled={phaseDisabled || saving}
						>
							Add Team
						</button>
					</form>
				</div>
				<div className="col-sm">
					<h2>Remove Team</h2>

					<p>
						You can disable a team by changing its <b>Status</b> from "Active"
						to "Inactive" in the table below. This can be done at any time
						except during the regular season, playoffs, or draft.
					</p>
					<p>
						When a team is disabled, all its players become free agents. Because
						of this, the best time to disable a team is right after the playoffs
						finish. Then the draft and free agency can proceed like normal, just
						with fewer teams.
					</p>
					<p>
						Team history is preserved for disabled teams, and disabled teams can
						be re-enabled in the future, either here or in an{" "}
						<a href={helpers.leagueUrl(["expansion_draft"])}>expansion draft</a>
						.
					</p>
				</div>
			</div>
		</>
	);
};

export default AddRemove;
