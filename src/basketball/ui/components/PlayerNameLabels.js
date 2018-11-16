// @flow

import PropTypes from "prop-types";
import * as React from "react";
import SkillsBlock from "./SkillsBlock";
import RatingsStatsPopover from "./RatingsStatsPopover";
import { helpers } from "../../../deion/ui/util";
import type { PlayerInjury } from "../../../deion/common/types";

const PlayerNameLabels = ({
    children,
    injury,
    pid,
    skills,
    style,
    watch,
}: {
    children: string,
    injury?: PlayerInjury,
    pid: number,
    skills?: string[],
    style?: { [key: string]: string },
    watch?: boolean,
}) => {
    let injuryIcon = null;
    if (injury !== undefined) {
        if (injury.gamesRemaining > 0) {
            const title = `${injury.type} (out ${
                injury.gamesRemaining
            } more games)`;
            injuryIcon = (
                <span className="badge badge-danger badge-injury" title={title}>
                    {injury.gamesRemaining}
                </span>
            );
        } else if (injury.gamesRemaining === -1) {
            // This is used in box scores, where it would be confusing to display "out X more games" in old box scores
            injuryIcon = (
                <span
                    className="badge badge-danger badge-injury"
                    title={injury.type}
                >
                    &nbsp;
                </span>
            );
        }
    }

    return (
        <span style={style}>
            <a href={helpers.leagueUrl(["player", pid])}>{children}</a>
            {injuryIcon}
            <SkillsBlock skills={skills} />
            <RatingsStatsPopover pid={pid} watch={watch} />
        </span>
    );
};
PlayerNameLabels.propTypes = {
    children: PropTypes.any,
    injury: PropTypes.shape({
        gamesRemaining: PropTypes.number.isRequired,
        type: PropTypes.string.isRequired,
    }),
    pid: PropTypes.number.isRequired,
    skills: PropTypes.arrayOf(PropTypes.string),
    style: PropTypes.object,
    watch: PropTypes.bool,
};

export default PlayerNameLabels;
