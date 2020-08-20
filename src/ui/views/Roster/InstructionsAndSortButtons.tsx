import PropTypes from "prop-types";
import React from "react";
import { toWorker } from "../../util";

const handleAutoSort = async () => {
	await toWorker("main", "autoSortRoster", undefined, undefined);
};

const handleResetPT = async () => {
	await toWorker("main", "resetPlayingTime", undefined);
};

const InstructionsAndSortButtons = ({ editable }: { editable: boolean }) => {
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
			<div className="btn-group mb-3">
				<button className="btn btn-light-bordered" onClick={handleAutoSort}>
					Auto sort roster
				</button>
				<button className="btn btn-light-bordered" onClick={handleResetPT}>
					Reset playing time
				</button>
			</div>
		</>
	);
};

InstructionsAndSortButtons.propTypes = {
	editable: PropTypes.bool.isRequired,
};

export default InstructionsAndSortButtons;
