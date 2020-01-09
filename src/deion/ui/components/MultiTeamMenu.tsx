import React, { useCallback } from "react";
import { realtimeUpdate, toWorker, useLocalShallow } from "../util";

const setUserTid = async (userTid: number) => {
	await toWorker("updateGameAttributes", {
		userTid,
	});
	realtimeUpdate(["firstRun"]);
};

const handleChange = async (e: SyntheticInputEvent) => {
	const userTid = parseInt(e.target.value, 10);
	await setUserTid(userTid);
};

const MultiTeamMenu = () => {
	const state = useLocalShallow(state2 => ({
		teamNamesCache: state2.teamNamesCache,
		teamRegionsCache: state2.teamRegionsCache,
		userTid: state2.userTid,
		userTids: state2.userTids,
	}));
	const prev = useCallback(async () => {
		const ind = state.userTids.indexOf(state.userTid);
		const userTid = state.userTids[ind - 1];

		if (userTid !== undefined) {
			await setUserTid(userTid);
		}
	}, [state.userTid, state.userTids]);
	const next = useCallback(async () => {
		const ind = state.userTids.indexOf(state.userTid);
		const userTid = state.userTids[ind + 1];

		if (userTid !== undefined) {
			await setUserTid(userTid);
		}
	}, [state.userTid, state.userTids]); // Hide if not multi team or not loaded yet

	if (state.userTids.length <= 1) {
		return null;
	}

	const ind = state.userTids.indexOf(state.userTid);
	const prevDisabled = ind < 0 || ind === 0;
	const nextDisabled = ind < 0 || ind === state.userTids.length - 1;
	return (
		<div className="multi-team-menu d-flex align-items-end">
			<button
				className="btn btn-link p-0 mb-1"
				disabled={prevDisabled}
				onClick={prev}
				title="Previous Team"
			>
				<span className="glyphicon glyphicon-menu-left" />
			</button>
			<div className="flex-fill px-1">
				<label htmlFor="multi-team-select">Currently controlling:</label>
				<br />
				<select
					className="form-control"
					id="multi-team-select"
					onChange={handleChange}
					value={state.userTid}
				>
					{state.userTids.map(tid => (
						<option key={tid} value={tid}>
							{state.teamRegionsCache[tid]} {state.teamNamesCache[tid]}
						</option>
					))}
				</select>
			</div>
			<button
				className="btn btn-link p-0 mb-1"
				disabled={nextDisabled}
				onClick={next}
				title="Next Team"
			>
				<span className="glyphicon glyphicon-menu-right" />
			</button>
		</div>
	);
};

export default MultiTeamMenu;
