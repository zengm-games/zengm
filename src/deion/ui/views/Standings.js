import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import {
    Dropdown,
    JumpTo,
    NewWindowLink,
    ResponsiveTableWrapper,
} from "../components";
import { helpers, setTitle } from "../util";
import clickable from "../wrappers/clickable";

const record = (seasonAttrs, type, ties) => {
    const won = `won${type}`;
    const lost = `lost${type}`;
    const tied = `tied${type}`;

    const val = `${seasonAttrs[won]}-${seasonAttrs[lost]}`;
    if (ties) {
        return `${val}-${seasonAttrs[tied]}`;
    }
    return val;
};

const DivStandingsRow = clickable(
    ({ clicked, season, t, ties, toggleClicked }) => {
        return (
            <tr
                key={t.tid}
                className={classNames({
                    "table-info": t.highlight,
                    "table-warning": clicked,
                })}
                onClick={toggleClicked}
            >
                <td>
                    <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>
                        {t.region} {t.name}
                    </a>
                    <span>{t.playoffsRank ? ` (${t.playoffsRank})` : ""}</span>
                </td>
                <td>{t.seasonAttrs.won}</td>
                <td>{t.seasonAttrs.lost}</td>
                {ties ? <td>{t.seasonAttrs.tied}</td> : null}
                <td>{helpers.roundWinp(t.seasonAttrs.winp)}</td>
                <td>{t.gb}</td>
                <td>{record(t.seasonAttrs, "Home", ties)}</td>
                <td>{record(t.seasonAttrs, "Away", ties)}</td>
                <td>{record(t.seasonAttrs, "Div", ties)}</td>
                <td>{record(t.seasonAttrs, "Conf", ties)}</td>
                <td>{t.seasonAttrs.streak}</td>
                <td>{t.seasonAttrs.lastTen}</td>
            </tr>
        );
    },
);

DivStandingsRow.propTypes = {
    season: PropTypes.number.isRequired,
    t: PropTypes.object.isRequired,
    ties: PropTypes.bool.isRequired,
};

const DivStandings = ({ div, season, ties }) => {
    return (
        <ResponsiveTableWrapper>
            <table className="table table-striped table-bordered table-sm table-hover">
                <thead>
                    <tr>
                        <th width="100%">{div.name}</th>
                        <th>W</th>
                        <th>L</th>
                        {ties ? <th>T</th> : null}
                        <th>%</th>
                        <th>GB</th>
                        <th>Home</th>
                        <th>Road</th>
                        <th>Div</th>
                        <th>Conf</th>
                        <th>Streak</th>
                        <th>L10</th>
                    </tr>
                </thead>
                <tbody>
                    {div.teams.map(t => (
                        <DivStandingsRow
                            key={t.tid}
                            t={t}
                            season={season}
                            ties={ties}
                        />
                    ))}
                </tbody>
            </table>
        </ResponsiveTableWrapper>
    );
};

DivStandings.propTypes = {
    div: PropTypes.shape({
        name: PropTypes.string.isRequired,
        teams: PropTypes.arrayOf(PropTypes.object).isRequired,
    }).isRequired,
    season: PropTypes.number.isRequired,
    ties: PropTypes.bool.isRequired,
};

const SmallStandings = ({ numPlayoffTeams, season, teams }) => {
    return (
        <table className="table table-striped table-bordered table-sm">
            <thead>
                <tr>
                    <th width="100%">Team</th>
                    <th style={{ textAlign: "right" }}>GB</th>
                </tr>
            </thead>
            <tbody>
                {teams.map((t, i) => {
                    return (
                        <tr
                            key={t.tid}
                            className={classNames({
                                "table-info": t.highlight,
                                separator: i === numPlayoffTeams - 1,
                            })}
                        >
                            <td>
                                {t.rank}.{" "}
                                <a
                                    href={helpers.leagueUrl([
                                        "roster",
                                        t.abbrev,
                                        season,
                                    ])}
                                >
                                    {t.region}
                                </a>
                            </td>
                            <td style={{ textAlign: "right" }}>{t.gb}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

SmallStandings.propTypes = {
    numPlayoffTeams: PropTypes.number.isRequired,
    season: PropTypes.number.isRequired,
    teams: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const Standings = ({
    allTeams,
    confs,
    numPlayoffTeams,
    playoffsByConference,
    season,
    ties,
}) => {
    if (season === undefined) {
        setTitle("Standings");
    } else {
        setTitle(`Standings - ${season}`);
    }

    return (
        <>
            <Dropdown view="standings" fields={["seasons"]} values={[season]} />
            <JumpTo season={season} />
            <h1>
                Standings <NewWindowLink />
            </h1>
            <div className="row">
                <div className={!playoffsByConference ? "col-md-9" : "col-12"}>
                    {confs.map((conf, i) => (
                        <div
                            key={conf.cid}
                            style={{
                                marginBottom: i < confs.length - 1 ? "1rem" : 0,
                            }}
                        >
                            <h2>{conf.name}</h2>
                            <div className="row">
                                <div
                                    className={
                                        playoffsByConference
                                            ? "col-md-9"
                                            : "col-12"
                                    }
                                >
                                    {conf.divs.map(div => (
                                        <DivStandings
                                            key={div.did}
                                            div={div}
                                            season={season}
                                            ties={ties}
                                        />
                                    ))}
                                </div>

                                {playoffsByConference ? (
                                    <div className="col-md-3 d-none d-md-block">
                                        <SmallStandings
                                            numPlayoffTeams={Math.floor(
                                                numPlayoffTeams / confs.length,
                                            )}
                                            season={season}
                                            teams={conf.teams}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
                {!playoffsByConference ? (
                    <div
                        className="col-md-3 d-none d-md-block"
                        style={{ paddingTop: 39 }}
                    >
                        <SmallStandings
                            numPlayoffTeams={numPlayoffTeams}
                            season={season}
                            teams={allTeams}
                        />
                    </div>
                ) : null}
            </div>
        </>
    );
};

Standings.propTypes = {
    allTeams: PropTypes.arrayOf(PropTypes.object).isRequired,
    confs: PropTypes.arrayOf(
        PropTypes.shape({
            cid: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            divs: PropTypes.arrayOf(PropTypes.object).isRequired,
        }),
    ).isRequired,
    numPlayoffTeams: PropTypes.number.isRequired,
    playoffsByConference: PropTypes.bool.isRequired,
    season: PropTypes.number.isRequired,
    ties: PropTypes.bool.isRequired,
};

export default Standings;
