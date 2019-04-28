import PropTypes from "prop-types";
import React from "react";
import { toWorker } from "../../util";

const handleAutoSort = async () => {
    await toWorker("autoSortRoster");
};

const handleResetPT = async (tid: number) => {
    await toWorker("resetPlayingTime", tid);
};

const InstructionsAndSortButtons = ({ editable, tid }) => {
    if (!editable) {
        return null;
    }

    return (
        <>
            <p style={{ clear: "both" }}>
                Drag row handles to move players between the starting lineup{" "}
                <span className="table-info legend-square" /> and the bench{" "}
                <span className="table-secondary legend-square" />.
            </p>
            <div className="btn-group mb-3">
                <button
                    className="btn btn-light-bordered"
                    onClick={handleAutoSort}
                >
                    Auto sort roster
                </button>
                <button
                    className="btn btn-light-bordered"
                    onClick={() => handleResetPT(tid)}
                >
                    Reset playing time
                </button>
            </div>
        </>
    );
};

InstructionsAndSortButtons.propTypes = {
    editable: PropTypes.bool.isRequired,
    tid: PropTypes.number.isRequired,
};

export default InstructionsAndSortButtons;
