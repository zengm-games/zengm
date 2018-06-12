// @flow

import PropTypes from "prop-types";
import * as React from "react";
import { emitter, realtimeUpdate, subscribeLocal, toWorker } from "../util";

const handleChange = async (e: SyntheticInputEvent<>) => {
    const userTid = parseInt(e.target.value, 10);
    await toWorker("updateGameAttributes", { userTid });

    // firstRun is kind of a hack, but it should update everything
    realtimeUpdate(["firstRun"]);
    emitter.emit("updateMultiTeam");
};

type Props = {
    userTid: number,
    userTids: number[],
};

class MultiTeamMenu extends React.Component<Props> {
    shouldComponentUpdate(nextProps: Props) {
        return (
            this.props.userTid !== nextProps.userTid ||
            JSON.stringify(this.props.userTids) !==
                JSON.stringify(nextProps.userTids)
        );
    }

    render() {
        const { userTid, userTids } = this.props;

        // Hide if not multi team or not loaded yet
        if (userTids.length <= 1) {
            return null;
        }

        return subscribeLocal(local => {
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
                        value={userTid}
                    >
                        {userTids.map((tid, i) => (
                            <option key={tid} value={tid}>
                                {local.state.teamRegionsCache[userTids[i]]}{" "}
                                {local.state.teamNamesCache[userTids[i]]}
                            </option>
                        ))}
                    </select>
                </div>
            );
        });
    }
}

MultiTeamMenu.propTypes = {
    userTid: PropTypes.number.isRequired,
    userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default MultiTeamMenu;
