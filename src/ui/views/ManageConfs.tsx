import isEqual from "fast-deep-equal";
import { useReducer, useState } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers, logEvent, toWorker } from "../util/index.ts";
import type { View } from "../../common/types.ts";
import { PHASE } from "../../common/index.ts";
import { Conference, reducer } from "./NewLeague/CustomizeTeams.tsx";
import StickyBottomButtons from "../components/StickyBottomButtons.tsx";

const nextSeasonWarning =
	"Because the regular season is already over, changes will not be fully applied until next season.";

const ManageConfs = ({
	actualPhase,
	autoRelocate,
	initialConfs,
	initialDivs,
	initialTeams,
}: View<"manageConfs">) => {
	const [{ confs, divs, teams }, dispatch] = useReducer(reducer, {
		confs: [...initialConfs],
		divs: [...initialDivs],
		teams: [...initialTeams],
	});
	const [saving, setSaving] = useState(false);

	useTitleBar({ title: "Manage Conferences" });

	if (autoRelocate) {
		return (
			<p>
				You cannot edit conferences/divisions while a{" "}
				<a href={helpers.leagueUrl(["auto_relocate"])}>team relocation vote</a>{" "}
				is pending.
			</p>
		);
	}

	return (
		<>
			{actualPhase >= PHASE.PLAYOFFS ? (
				<p className="alert alert-warning d-inline-block">
					{nextSeasonWarning}
				</p>
			) : null}

			{confs.map((conf, i) => (
				<Conference
					key={conf.cid}
					conf={conf}
					confs={confs}
					divs={divs}
					teams={teams}
					dispatch={dispatch}
					disableMoveUp={i === 0}
					disableMoveDown={i === confs.length - 1}
				/>
			))}
			<div className="mb-3 d-flex">
				<button
					className="btn btn-light-bordered ms-auto"
					onClick={() => {
						dispatch({ type: "addConf" });
					}}
					style={{
						marginRight: 18,
					}}
				>
					Add Conference
				</button>
			</div>

			<StickyBottomButtons>
				<form
					className="btn-group ms-auto"
					onSubmit={async (event) => {
						event.preventDefault();

						// Check to make sure that somehow we didn't accidentally reassign a tid
						const initialRegions = initialTeams.map((t) => t.region);
						const regions = teams.map((t) => t.region);
						if (!isEqual(initialRegions, regions)) {
							throw new Error("tids may not be constant");
						}

						setSaving(true);
						console.log({ confs, divs, teams });

						await toWorker("main", "updateConfsDivs", {
							confs,
							divs,
							teams,
						});

						let text = "Saved conferences and divisions.";

						if (actualPhase >= PHASE.PLAYOFFS) {
							text += `<br /><br />${nextSeasonWarning}`;
						}

						logEvent({
							type: "success",
							text,
							saveToDb: false,
						});

						setSaving(false);
					}}
				>
					<button
						className="btn btn-primary me-2"
						type="submit"
						disabled={saving || confs.length === 0 || divs.length === 0}
					>
						Save conferences and divisions
					</button>
				</form>
			</StickyBottomButtons>
		</>
	);
};

export default ManageConfs;
