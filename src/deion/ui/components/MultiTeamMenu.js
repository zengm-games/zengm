// @flow

import React, { useCallback } from "react";
import { realtimeUpdate, subscribeLocal, toWorker } from "../util";

const setUserTid = async (userTid: number) => {
    await toWorker("updateGameAttributes", { userTid });
    realtimeUpdate(["firstRun"]);
};

const handleChange = async (e: SyntheticInputEvent<>) => {
    const userTid = parseInt(e.target.value, 10);
    await setUserTid(userTid);
};

const MultiTeamMenuInner = ({
    local,
}: {
    local: {
        state: {
            teamNamesCache: string[],
            teamRegionsCache: string[],
            userTid: number,
            userTids: number[],
        },
    },
}) => {
    const prev = useCallback(async () => {
        const ind = local.state.userTids.indexOf(local.state.userTid);
        const userTid = local.state.userTids[ind - 1];
        if (userTid !== undefined) {
            await setUserTid(userTid);
        }
    }, [local.state.userTid, local.state.userTids]);

    const next = useCallback(async () => {
        const ind = local.state.userTids.indexOf(local.state.userTid);
        const userTid = local.state.userTids[ind + 1];
        if (userTid !== undefined) {
            await setUserTid(userTid);
        }
    }, [local.state.userTid, local.state.userTids]);

    // Hide if not multi team or not loaded yet
    if (local.state.userTids.length <= 1) {
        return null;
    }

    const ind = local.state.userTids.indexOf(local.state.userTid);
    const prevDisabled = ind < 0 || ind === 0;
    const nextDisabled = ind < 0 || ind === local.state.userTids.length - 1;

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

const MultiTeamMenu = () => {
    return subscribeLocal(local => <MultiTeamMenuInner local={local} />);
};

export default MultiTeamMenu;
