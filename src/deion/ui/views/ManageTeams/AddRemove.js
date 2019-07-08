import React, { useEffect, useState } from "react";
import { PHASE } from "../../../common";
import { logEvent, toWorker } from "../../util";

type Props = {
    dispatch: any,
    confs: { cid: number, name: string }[],
    divs: { cid: number, did: number, name: string }[],
    phase: number,
    saving: boolean,
};

const AddRemove = ({ dispatch, confs, divs, phase, saving }: Props) => {
    const divsInDefaultConf = divs.filter(div => div.cid === confs[0].cid);

    const phaseDisabled = ![
        PHASE.PRESEASON,
        PHASE.AFTER_DRAFT,
        PHASE.RESIGN_PLAYERS,
        PHASE.FREE_AGENCY,
    ].includes(phase);

    const [cid, setCID] = useState(confs[0].cid);
    const [did, setDID] = useState(
        divsInDefaultConf.length > 0 ? divsInDefaultConf[0].did : 0,
    );

    // Force valid did
    useEffect(() => {
        const divsInConf = divs.filter(div => div.cid === cid);

        if (divsInConf.length === 0) {
            return;
        }

        if (divsInConf.some(div => div.did === did)) {
            return;
        }

        setDID(divsInConf[0].did);
    }, [cid, did, divs]);

    const addTeam = async e => {
        e.preventDefault();
        dispatch({ type: "startSaving" });

        const t = await toWorker("addTeam", cid, did);
        dispatch({ type: "addTeam", team: t });

        logEvent({
            type: "success",
            text: "Added new team.",
            saveToDb: false,
        });

        dispatch({ type: "doneSaving" });
    };

    const removeLastTeam = async e => {
        e.preventDefault();
        dispatch({ type: "startSaving" });

        await toWorker("removeLastTeam");
        dispatch({ type: "removeLastTeam" });

        logEvent({
            type: "success",
            text: "Removed last team.",
            saveToDb: false,
        });

        dispatch({ type: "doneSaving" });
    };

    return (
        <>
            {phaseDisabled ? (
                <p className="text-danger">
                    You can only add or remove teams during the preseason, after
                    draft, re-signing, or free agency game phases.
                </p>
            ) : null}
            <div className="row">
                <div className="col-sm">
                    <p>
                        After you add a team, it will become available to edit
                        in the form below. Created teams start with no players.
                        You can use God Mode to set up the roster, or start
                        simulating and the AI will sign free agents. There is
                        not yet support for a real expansion draft.
                    </p>

                    <form onSubmit={addTeam}>
                        <div className="form-group">
                            <label htmlFor="formConf">Conference</label>
                            <select
                                className="form-control w-auto"
                                id="formConf"
                                value={cid}
                                onChange={e => {
                                    setCID(parseInt(e.target.value, 10));
                                }}
                            >
                                {confs.map(conf => (
                                    <option key={conf.cid} value={conf.cid}>
                                        {conf.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="formDiv">Division</label>
                            <select
                                className="form-control w-auto"
                                id="formDiv"
                                value={did}
                                onChange={e => {
                                    setDID(parseInt(e.target.value, 10));
                                }}
                            >
                                {divs
                                    .filter(div => div.cid === cid)
                                    .map(div => (
                                        <option key={div.did} value={div.did}>
                                            {div.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

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
                        Due to some stupid technical complexities, it is not
                        currently possible to remove a team, except for the last
                        team on the list below.
                    </p>

                    <p>Players on the removed team will become free agents.</p>

                    <p>
                        <span className="text-danger">Please be careful!</span>{" "}
                        This will{" "}
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
