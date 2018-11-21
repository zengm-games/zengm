import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../util";

const TeamStat = ({ name, rank, stat, value }) => {
    return (
        <>
            {name}: {helpers.roundStat(value, stat)} ({helpers.ordinal(rank)})
            <br />
        </>
    );
};

TeamStat.propTypes = {
    name: PropTypes.string.isRequired,
    rank: PropTypes.number.isRequired,
    stat: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
};

const TeamStats = ({ teamStats }) => (
    <>
        <h3>Team Stats</h3>
        <p>
            {teamStats.map(teamStat => (
                <TeamStat key={teamStat.stat} {...teamStat} />
            ))}
            <a href={helpers.leagueUrl(["team_stats"])}>» Team Stats</a>
        </p>
    </>
);

TeamStats.propTypes = {
    teamStats: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            rank: PropTypes.number.isRequired,
            stat: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default TeamStats;
