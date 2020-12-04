import PropTypes from "prop-types";
import React from "react";
import { toWorker } from "../../util";

const handleAutoSort = async () => {
	await toWorker("main", "autoSortRoster", undefined, undefined);
};

const handleResetPT = async () => {
	await toWorker("main", "resetPlayingTime", undefined);
};

const InstructionsAndSortButtons = ({
	keepRosterSorted,
	editable,
}: {
	keepRosterSorted: boolean;
	editable: boolean;
}) => {
	if (!editable) {
		return null;
	}

	return (
		<>
			<p
				style={{
					clear: "both",
				}}
			>
				Click or drag row handles to move players between the starting lineup{" "}
				<span className="table-info legend-square" /> and the bench{" "}
				<span className="table-secondary legend-square" />.
			</p>
			<div className="btn-group mb-2">
				<button className="btn btn-light-bordered" onClick={handleAutoSort}>
					Auto sort roster
				</button>
				<button className="btn btn-light-bordered" onClick={handleResetPT}>
					Reset playing time
				</button>
			</div>
			<div className="form-check mb-3">
				<input
					className="form-check-input"
					type="checkbox"
					checked={keepRosterSorted}
					id="ai-sort-user-roster"
					onChange={async () => {
						if (!keepRosterSorted) {
							await handleAutoSort();
						}
						await toWorker("main", "updateGameAttributes", {
							keepRosterSorted: !keepRosterSorted,
						});
					}}
				/>
				<label className="form-check-label" htmlFor="ai-sort-user-roster">
					Keep auto sorted
				</label>
			</div>
		</>
	);
};

InstructionsAndSortButtons.propTypes = {
	editable: PropTypes.bool.isRequired,
};

export default InstructionsAndSortButtons;
