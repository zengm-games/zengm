// @flow

import React from "react";
import { realtimeUpdate, subscribeLocal, toWorker } from "../util";

const handleChange = async (e: SyntheticInputEvent<>) => {
    const userTid = parseInt(e.target.value, 10);
    await toWorker("updateGameAttributes", { userTid });

    // firstRun is kind of a hack, but it should update everything
    realtimeUpdate(["firstRun"]);
};

const MultiTeamMenu = () => {
    return subscribeLocal(local => {
        // Hide if not multi team or not loaded yet
        if (local.state.userTids.length <= 1) {
            return null;
        }

        return (
            <div className="multi-team-menu">
                <label htmlFor="multi-team-select">
                    Currently controlling:
                </label>
                <br />
                <select
                    className="form-control"
                    id="multi-team-select"
                    onChange={handleChange}
                    value={local.state.userTid}
                >
                    {local.state.userTids.map(tid => (
                        <option key={tid} value={tid}>
                            {local.state.teamRegionsCache[tid]}{" "}
                            {local.state.teamNamesCache[tid]}
                        </option>
                    ))}
                </select>
            </div>
        );
    });
};

export default MultiTeamMenu;
