// @flow

import PropTypes from "prop-types";
import React from "react";
import { PlayerNameLabels } from "../../../deion/ui/components";
import { helpers } from "../../../deion/ui/util";
import processStats from "../../worker/core/player/processStats";

const BoxScoreRow = ({
    className,
    onClick,
    p,
    stats,
}: {
    className: string,
    onClick?: Function,
    p: any,
    stats: string[],
}) => {
    const processed = processStats(p, stats);
    console.log(p, stats, processed);
    return (
        <tr className={className} onClick={onClick}>
            <td>{p.pos}</td>
            <td width="100%">
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    skills={p.skills}
                >
                    {p.name}
                </PlayerNameLabels>
            </td>
            {stats.map(stat => (
                <td key={stat}>
                    {helpers.roundStat(processed[stat], stat, true)}
                </td>
            ))}
        </tr>
    );
};

BoxScoreRow.propTypes = {
    className: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    p: PropTypes.object.isRequired,
};

export default BoxScoreRow;
