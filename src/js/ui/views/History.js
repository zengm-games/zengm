import PropTypes from "prop-types";
import React from "react";
import { helpers, setTitle } from "../util";
import { Dropdown, JumpTo, NewWindowLink } from "../components";

const History = ({
    awards,
    champ,
    confs,
    invalidSeason,
    retiredPlayers,
    season,
    userTid,
}) => {
    setTitle(`Season Summary - ${season}`);

    if (invalidSeason) {
        return (
            <div>
                <h1>Error</h1>
                <p>Invalid season.</p>
            </div>
        );
    }

    return (
        <div>
            <Dropdown view="history" fields={["seasons"]} values={[season]} />
            <JumpTo season={season} />
            <h1>
                Season Summary <NewWindowLink />
            </h1>

            <p />
            <div className="row">
                <div className="col-md-3 col-sm-4 col-xs-12">
                    <div className="row">
                        <div className="col-sm-12 col-xs-6">
                            <h4>League Champions</h4>
                            {champ ? (
                                <div>
                                    <p>
                                        <span
                                            className={
                                                champ.tid === userTid
                                                    ? "bg-info"
                                                    : null
                                            }
                                        >
                                            <b>
                                                <a
                                                    href={helpers.leagueUrl([
                                                        "roster",
                                                        champ.abbrev,
                                                        season,
                                                    ])}
                                                >
                                                    {champ.region} {champ.name}
                                                </a>
                                            </b>
                                        </span>
                                        <br />
                                        <a
                                            href={helpers.leagueUrl([
                                                "playoffs",
                                                season,
                                            ])}
                                        >
                                            Playoffs Bracket
                                        </a>
                                    </p>
                                    <p>
                                        Finals MVP:{" "}
                                        <b>
                                            <a
                                                className={
                                                    champ.tid === userTid
                                                        ? "bg-info"
                                                        : null
                                                }
                                                href={helpers.leagueUrl([
                                                    "player",
                                                    awards.finalsMvp.pid,
                                                ])}
                                            >
                                                {awards.finalsMvp.name}
                                            </a>
                                        </b>
                                        <br />
                                        {awards.finalsMvp.pts.toFixed(
                                            1,
                                        )} pts,{" "}
                                        {awards.finalsMvp.trb.toFixed(1)} reb,{" "}
                                        {awards.finalsMvp.ast.toFixed(1)} ast
                                    </p>
                                </div>
                            ) : (
                                <p>???</p>
                            )}
                            <h4>Best Record</h4>
                            {awards.bestRecordConfs.map((t, i) => (
                                <p key={t.tid}>
                                    {confs[i].name}:<br />
                                    <span
                                        className={
                                            t.tid === userTid ? "bg-info" : null
                                        }
                                    >
                                        <a
                                            href={helpers.leagueUrl([
                                                "roster",
                                                t.abbrev,
                                                season,
                                            ])}
                                        >
                                            {t.region} {t.name}
                                        </a>{" "}
                                        ({t.won}-{t.lost})
                                    </span>
                                    <br />
                                </p>
                            ))}
                            <h4>Most Valuable Player</h4>
                            <p>
                                <span
                                    className={
                                        awards.mvp.tid === userTid
                                            ? "bg-info"
                                            : null
                                    }
                                >
                                    <b>
                                        <a
                                            href={helpers.leagueUrl([
                                                "player",
                                                awards.mvp.pid,
                                            ])}
                                        >
                                            {awards.mvp.name}
                                        </a>
                                    </b>{" "}
                                    (
                                    <a
                                        href={helpers.leagueUrl([
                                            "roster",
                                            awards.mvp.abbrev,
                                            season,
                                        ])}
                                    >
                                        {awards.mvp.abbrev}
                                    </a>
                                    )
                                </span>
                                <br />
                                {awards.mvp.pts.toFixed(1)} pts,{" "}
                                {awards.mvp.trb.toFixed(1)} reb,{" "}
                                {awards.mvp.ast.toFixed(1)} ast
                            </p>
                        </div>
                        <div className="col-sm-12 col-xs-6">
                            <h4>Defensive Player of the Year</h4>
                            <p>
                                <span
                                    className={
                                        awards.dpoy.tid === userTid
                                            ? "bg-info"
                                            : null
                                    }
                                >
                                    <b>
                                        <a
                                            href={helpers.leagueUrl([
                                                "player",
                                                awards.dpoy.pid,
                                            ])}
                                        >
                                            {awards.dpoy.name}
                                        </a>
                                    </b>{" "}
                                    (
                                    <a
                                        href={helpers.leagueUrl([
                                            "roster",
                                            awards.dpoy.abbrev,
                                            season,
                                        ])}
                                    >
                                        {awards.dpoy.abbrev}
                                    </a>
                                    )
                                </span>
                                <br />
                                {awards.dpoy.trb.toFixed(1)} reb,{" "}
                                {awards.dpoy.blk.toFixed(1)} blk,{" "}
                                {awards.dpoy.stl.toFixed(1)} stl
                            </p>
                            <h4>Sixth Man of the Year</h4>
                            {awards.smoy ? (
                                <p>
                                    <span
                                        className={
                                            awards.smoy.tid === userTid
                                                ? "bg-info"
                                                : null
                                        }
                                    >
                                        <b>
                                            <a
                                                href={helpers.leagueUrl([
                                                    "player",
                                                    awards.smoy.pid,
                                                ])}
                                            >
                                                {awards.smoy.name}
                                            </a>
                                        </b>{" "}
                                        (
                                        <a
                                            href={helpers.leagueUrl([
                                                "roster",
                                                awards.smoy.abbrev,
                                                season,
                                            ])}
                                        >
                                            {awards.smoy.abbrev}
                                        </a>
                                        )
                                    </span>
                                    <br />
                                    {awards.smoy.pts.toFixed(1)} pts,{" "}
                                    {awards.smoy.trb.toFixed(1)} reb,{" "}
                                    {awards.smoy.ast.toFixed(1)} ast
                                </p>
                            ) : (
                                <p>???</p>
                            )}
                            <h4>Most Improved Player</h4>
                            {awards.mip ? (
                                <p>
                                    <span
                                        className={
                                            awards.mip.tid === userTid
                                                ? "bg-info"
                                                : null
                                        }
                                    >
                                        <b>
                                            <a
                                                href={helpers.leagueUrl([
                                                    "player",
                                                    awards.mip.pid,
                                                ])}
                                            >
                                                {awards.mip.name}
                                            </a>
                                        </b>{" "}
                                        (
                                        <a
                                            href={helpers.leagueUrl([
                                                "roster",
                                                awards.mip.abbrev,
                                                season,
                                            ])}
                                        >
                                            {awards.mip.abbrev}
                                        </a>
                                        )
                                    </span>
                                    <br />
                                    {awards.mip.pts.toFixed(1)} pts,{" "}
                                    {awards.mip.trb.toFixed(1)} reb,{" "}
                                    {awards.mip.ast.toFixed(1)} ast
                                </p>
                            ) : (
                                <p>???</p>
                            )}
                            <h4>Rookie of the Year</h4>
                            {awards.roy ? (
                                <p>
                                    <span
                                        className={
                                            awards.roy.tid === userTid
                                                ? "bg-info"
                                                : null
                                        }
                                    >
                                        <b>
                                            <a
                                                href={helpers.leagueUrl([
                                                    "player",
                                                    awards.roy.pid,
                                                ])}
                                            >
                                                {awards.roy.name}
                                            </a>
                                        </b>{" "}
                                        (
                                        <a
                                            href={helpers.leagueUrl([
                                                "roster",
                                                awards.roy.abbrev,
                                                season,
                                            ])}
                                        >
                                            {awards.roy.abbrev}
                                        </a>
                                        )
                                    </span>
                                    <br />
                                    {awards.roy.pts.toFixed(1)} pts,{" "}
                                    {awards.roy.trb.toFixed(1)} reb,{" "}
                                    {awards.roy.ast.toFixed(1)} ast
                                </p>
                            ) : (
                                <p>???</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-sm-4 col-xs-6">
                    <h4>All-League Teams</h4>
                    {awards.allLeague.map(t => (
                        <div key={t.title}>
                            <h5>{t.title}</h5>
                            {t.players.map(p => (
                                <div key={p.pid}>
                                    <span
                                        className={
                                            p.tid === userTid ? "bg-info" : null
                                        }
                                    >
                                        <a
                                            href={helpers.leagueUrl([
                                                "player",
                                                p.pid,
                                            ])}
                                        >
                                            {p.name}
                                        </a>{" "}
                                        (
                                        <a
                                            href={helpers.leagueUrl([
                                                "roster",
                                                p.abbrev,
                                                season,
                                            ])}
                                        >
                                            {p.abbrev}
                                        </a>
                                        )
                                    </span>
                                    <br />
                                </div>
                            ))}
                        </div>
                    ))}
                    <br />
                    <h4>All-Rookie Team</h4>
                    {awards.allRookie.length === 0 ? <p>None</p> : null}
                    {awards.allRookie.map(p => (
                        <div key={p.pid}>
                            <span
                                className={p.tid === userTid ? "bg-info" : null}
                            >
                                <a href={helpers.leagueUrl(["player", p.pid])}>
                                    {p.name}
                                </a>{" "}
                                (
                                <a
                                    href={helpers.leagueUrl([
                                        "roster",
                                        p.abbrev,
                                        season,
                                    ])}
                                >
                                    {p.abbrev}
                                </a>
                                )
                            </span>
                            <br />
                        </div>
                    ))}
                    <br />
                </div>
                <div className="col-md-3 col-sm-4 col-xs-6">
                    <h4>All-Defensive Teams</h4>
                    {awards.allDefensive.map(t => (
                        <div key={t.title}>
                            <h5>{t.title}</h5>
                            {t.players.map(p => (
                                <div key={p.pid}>
                                    <span
                                        className={
                                            p.tid === userTid ? "bg-info" : null
                                        }
                                    >
                                        <a
                                            href={helpers.leagueUrl([
                                                "player",
                                                p.pid,
                                            ])}
                                        >
                                            {p.name}
                                        </a>{" "}
                                        (
                                        <a
                                            href={helpers.leagueUrl([
                                                "roster",
                                                p.abbrev,
                                                season,
                                            ])}
                                        >
                                            {p.abbrev}
                                        </a>
                                        )
                                    </span>
                                    <br />
                                </div>
                            ))}
                        </div>
                    ))}
                    <br />
                </div>
                <div className="clearfix visible-sm visible-xs" />
                <div className="col-md-3 col-sm-12">
                    <h4>Retired Players</h4>
                    <p
                        style={{
                            MozColumnWidth: "12em",
                            MozColumns: "12em",
                            WebkitColumns: "12em",
                            columns: "12em",
                        }}
                    >
                        {retiredPlayers.map(p => (
                            <span
                                key={p.pid}
                                className={
                                    p.stats.tid === userTid ? "bg-info" : null
                                }
                            >
                                <a href={helpers.leagueUrl(["player", p.pid])}>
                                    {p.name}
                                </a>{" "}
                                (
                                {p.stats.tid >= 0 ? (
                                    <span>
                                        <a
                                            href={helpers.leagueUrl([
                                                "roster",
                                                p.stats.abbrev,
                                                season,
                                            ])}
                                        >
                                            {p.stats.abbrev}
                                        </a>
                                        ,{" "}
                                    </span>
                                ) : null}
                                age: {p.age}
                                {p.hof ? (
                                    <span>
                                        ;{" "}
                                        <a
                                            href={helpers.leagueUrl([
                                                "hall_of_fame",
                                            ])}
                                        >
                                            <b>HoF</b>
                                        </a>
                                    </span>
                                ) : null}
                                )<br />
                            </span>
                        ))}
                    </p>
                </div>
            </div>
        </div>
    );
};

History.propTypes = {
    awards: PropTypes.object,
    champ: PropTypes.object,
    confs: PropTypes.arrayOf(PropTypes.object),
    invalidSeason: PropTypes.bool.isRequired,
    retiredPlayers: PropTypes.arrayOf(PropTypes.object),
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number,
};

export default History;
