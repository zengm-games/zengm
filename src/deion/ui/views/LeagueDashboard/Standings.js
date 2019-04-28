import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../util";

const Standings = ({
    confTeams,
    numPlayoffTeams,
    playoffsByConference,
    userTid,
}) => (
    <>
        <h3 />
        <table className="table table-striped table-bordered table-sm">
            <thead>
                <tr>
                    <th width="100%">Team</th>
                    <th>GB</th>
                </tr>
            </thead>
            <tbody>
                {confTeams.map((t, i) => {
                    return (
                        <tr
                            key={t.tid}
                            className={classNames({
                                separator:
                                    i === numPlayoffTeams - 1 &&
                                    playoffsByConference,
                                "table-info": t.tid === userTid,
                            })}
                        >
                            <td>
                                {t.rank}.{" "}
                                <a
                                    href={helpers.leagueUrl([
                                        "roster",
                                        t.abbrev,
                                    ])}
                                >
                                    {t.region}
                                </a>
                            </td>
                            <td className="text-right">{t.gb}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
        <a href={helpers.leagueUrl(["standings"])}>» League Standings</a>
    </>
);

Standings.propTypes = {
    confTeams: PropTypes.arrayOf(PropTypes.object).isRequired,
    numPlayoffTeams: PropTypes.number.isRequired,
    playoffsByConference: PropTypes.bool.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default Standings;
