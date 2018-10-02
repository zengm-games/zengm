import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { helpers, setTitle } from "../util";
import { Dropdown, JumpTo, NewWindowLink } from "../components";
import clickable from "../wrappers/clickable";

const DivStandingsRow = clickable(({ clicked, season, t, toggleClicked }) => {
    return (
        <tr
            key={t.tid}
            className={classNames({
                info: t.highlight,
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
            <td>{helpers.roundWinp(t.seasonAttrs.winp)}</td>
            <td>{t.gb}</td>
            <td>
                {t.seasonAttrs.wonHome}-{t.seasonAttrs.lostHome}
            </td>
            <td>
                {t.seasonAttrs.wonAway}-{t.seasonAttrs.lostAway}
            </td>
            <td>
                {t.seasonAttrs.wonDiv}-{t.seasonAttrs.lostDiv}
            </td>
            <td>
                {t.seasonAttrs.wonConf}-{t.seasonAttrs.lostConf}
            </td>
            <td>{t.seasonAttrs.streak}</td>
            <td>{t.seasonAttrs.lastTen}</td>
        </tr>
    );
});

DivStandingsRow.propTypes = {
    season: PropTypes.number.isRequired,
    t: PropTypes.object.isRequired,
};

const DivStandings = ({ div, season }) => {
    return (
        <div className="table-responsive">
            <table className="table table-striped table-bordered table-sm table-hover">
                <thead>
                    <tr>
                        <th width="100%">{div.name}</th>
                        <th>W</th>
                        <th>L</th>
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
                        <DivStandingsRow key={t.tid} t={t} season={season} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

DivStandings.propTypes = {
    div: PropTypes.shape({
        name: PropTypes.string.isRequired,
        teams: PropTypes.arrayOf(PropTypes.object).isRequired,
    }).isRequired,
    season: PropTypes.number.isRequired,
};

const ConfStandings = ({ playoffsByConference, season, teams }) => {
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
                                info: t.highlight,
                                separator: i === 7 && playoffsByConference,
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

ConfStandings.propTypes = {
    teams: PropTypes.arrayOf(PropTypes.object).isRequired,
    playoffsByConference: PropTypes.bool.isRequired,
    season: PropTypes.number.isRequired,
};

const Standings = ({ confs, playoffsByConference, season }) => {
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
            {confs.map((conf, i) => (
                <div
                    key={conf.cid}
                    style={{ marginBottom: i < confs.length - 1 ? "1rem" : 0 }}
                >
                    <h2>{conf.name}</h2>
                    <div className="row">
                        <div className="col-md-9">
                            {conf.divs.map(div => (
                                <DivStandings
                                    key={div.did}
                                    div={div}
                                    season={season}
                                />
                            ))}
                        </div>

                        <div className="col-md-3 d-none d-md-block">
                            <ConfStandings
                                playoffsByConference={playoffsByConference}
                                season={season}
                                teams={conf.teams}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

Standings.propTypes = {
    confs: PropTypes.arrayOf(
        PropTypes.shape({
            cid: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            divs: PropTypes.arrayOf(PropTypes.object).isRequired,
        }),
    ).isRequired,
    playoffsByConference: PropTypes.bool.isRequired,
    season: PropTypes.number.isRequired,
};

export default Standings;
