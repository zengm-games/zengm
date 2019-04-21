// @flow

import PropTypes from "prop-types";
import React from "react";
import { helpers, logEvent, toWorker } from "../util";
import type { Player } from "../../common/types";

// season is just needed during re-signing, because it's used to make sure drafted players in hard cap leagues always
// are willing to sign.
const NegotiateButtons = ({
    capSpace,
    disabled,
    minContract,
    p,
    season,
    userTid,
}: {
    capSpace: number,
    disabled?: boolean,
    minContract: number,
    p: Player<>,
    season?: number,
    userTid: number,
}) => {
    if (
        helpers.refuseToNegotiate(
            p.contract.amount * 1000,
            p.freeAgentMood[userTid],
            typeof season === "number" && p.draft.year === season,
        )
    ) {
        return "Refuses!";
    }

    return (
        <div className="btn-group">
            <button
                className="btn btn-light-bordered btn-xs"
                disabled={!!disabled}
                onClick={() => toWorker("actions.negotiate", p.pid)}
            >
                Negotiate
            </button>
            <button
                className="btn btn-light-bordered btn-xs"
                disabled={
                    !!disabled ||
                    (p.contract.amount > capSpace &&
                        p.contract.amount > minContract / 1000)
                }
                onClick={async () => {
                    const errorMsg = await toWorker(
                        "sign",
                        p.pid,
                        p.contract.amount * 1000,
                        p.contract.exp,
                    );
                    if (errorMsg !== undefined && errorMsg) {
                        logEvent({
                            type: "error",
                            text: errorMsg,
                            saveToDb: false,
                        });
                    }
                }}
            >
                Sign
            </button>
        </div>
    );
};

NegotiateButtons.propTypes = {
    disabled: PropTypes.bool,
    p: PropTypes.object.isRequired,
    season: PropTypes.number,
    userTid: PropTypes.number.isRequired,
};

export default NegotiateButtons;
