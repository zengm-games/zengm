import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../util";

const Leader = ({ abbrev, name, pid, stat, value }) => {
    const numberToDisplay =
        process.env.SPORT === "basketball"
            ? helpers.roundStat(value, stat)
            : helpers.numberWithCommas(value);

    return (
        <>
            <a href={helpers.leagueUrl(["player", pid])}>{name}</a>
            {abbrev ? (
                <>
                    ,{" "}
                    <a href={helpers.leagueUrl(["roster", abbrev])}>{abbrev}</a>
                </>
            ) : null}
            : {numberToDisplay} {stat}
            <br />
        </>
    );
};

Leader.propTypes = {
    abbrev: PropTypes.string,
    name: PropTypes.string.isRequired,
    pid: PropTypes.number.isRequired,
    stat: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
};

const Leaders = ({ leagueLeaders, teamLeaders }) => (
    <>
        <h3>Team Leaders</h3>
        <p>
            {teamLeaders.map(leader => (
                <Leader key={leader.stat} {...leader} />
            ))}
            <a href={helpers.leagueUrl(["roster"])}>» Full Roster</a>
        </p>
        <h3>League Leaders</h3>
        <p>
            {leagueLeaders.map(leader => (
                <Leader key={leader.stat} {...leader} />
            ))}
            <a href={helpers.leagueUrl(["leaders"])}>» League Leaders</a>
            <br />
            <a href={helpers.leagueUrl(["player_stats"])}>» Player Stats</a>
        </p>
    </>
);

Leaders.propTypes = {
    leagueLeaders: PropTypes.arrayOf(PropTypes.object).isRequired,
    teamLeaders: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Leaders;
