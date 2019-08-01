import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../../../deion/ui/util";

const Player = ({ i, p, season, userTid }) => {
    if (!p) {
        return <div />;
    }

    let pos = p.pos;
    if (i === 24) {
        pos = "KR";
    } else if (i === 25) {
        pos = "PR";
    }

    // The wrapper div here actually matters, don't change to fragment!
    return (
        <div>
            <span className={p.tid === userTid ? "table-info" : null}>
                {pos}{" "}
                <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> (
                <a href={helpers.leagueUrl(["roster", p.abbrev, season])}>
                    {p.abbrev}
                </a>
                )
            </span>
        </div>
    );
};

Player.propTypes = {
    i: PropTypes.number.isRequired,
    p: PropTypes.object,
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

const Teams = ({ className, name, season, team, userTid }) => {
    return (
        <div className={className}>
            <h4>{name}</h4>
            {team.map((p, i) => (
                <Player key={i} i={i} p={p} season={season} userTid={userTid} />
            ))}
        </div>
    );
};

Teams.propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    nested: PropTypes.bool,
    team: PropTypes.array.isRequired,
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default Teams;
