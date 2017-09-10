import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../common";
import {
    DataTable,
    NewWindowLink,
    PlayerPicture,
    SafeHtml,
    SkillsBlock,
    WatchBlock,
} from "../components";
import { getCols, setTitle, toWorker } from "../util";

const RatingsOverview = ({ ratings }) => {
    const r = ratings.length - 1;

    return (
        <div>
            <div className="row">
                <div className="col-xs-6">
                    <h2>Overall: {ratings[r].ovr}</h2>
                </div>
                <div className="col-xs-6">
                    <h2 className="pull-right">Potential: {ratings[r].pot}</h2>
                </div>
            </div>
            <div className="row">
                <div className="col-xs-4">
                    <b>Physical</b>
                    <br />
                    Height: {ratings[r].hgt}
                    <br />
                    Strength: {ratings[r].stre}
                    <br />
                    Speed: {ratings[r].spd}
                    <br />
                    Jumping: {ratings[r].jmp}
                    <br />
                    Endurance: {ratings[r].endu}
                </div>
                <div className="col-xs-4">
                    <b>Shooting</b>
                    <br />
                    Inside: {ratings[r].ins}
                    <br />
                    Dunks/Layups: {ratings[r].dnk}
                    <br />
                    Free Throws: {ratings[r].ft}
                    <br />
                    Two Pointers: {ratings[r].fg}
                    <br />
                    Three Pointers: {ratings[r].tp}
                </div>
                <div className="col-xs-4">
                    <b>Skill</b>
                    <br />
                    Blocks: {ratings[r].blk}
                    <br />
                    Steals: {ratings[r].stl}
                    <br />
                    Dribbling: {ratings[r].drb}
                    <br />
                    Passing: {ratings[r].pss}
                    <br />
                    Rebounding: {ratings[r].reb}
                </div>
            </div>
        </div>
    );
};

RatingsOverview.propTypes = {
    ratings: PropTypes.arrayOf(
        PropTypes.shape({
            blk: PropTypes.number.isRequired,
            dnk: PropTypes.number.isRequired,
            drb: PropTypes.number.isRequired,
            endu: PropTypes.number.isRequired,
            fg: PropTypes.number.isRequired,
            ft: PropTypes.number.isRequired,
            hgt: PropTypes.number.isRequired,
            ins: PropTypes.number.isRequired,
            jmp: PropTypes.number.isRequired,
            ovr: PropTypes.number.isRequired,
            pot: PropTypes.number.isRequired,
            pss: PropTypes.number.isRequired,
            reb: PropTypes.number.isRequired,
            spd: PropTypes.number.isRequired,
            stl: PropTypes.number.isRequired,
            stre: PropTypes.number.isRequired,
            tp: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

const StatsTable = ({ careerStats = {}, name, stats = [] }) => {
    return (
        <DataTable
            cols={getCols(
                "Year",
                "Team",
                "Age",
                "GP",
                "GS",
                "Min",
                "M",
                "A",
                "%",
                "M",
                "A",
                "%",
                "M",
                "A",
                "%",
                "Off",
                "Def",
                "Tot",
                "Ast",
                "TO",
                "Stl",
                "Blk",
                "BA",
                "PF",
                "Pts",
                "+/-",
                "PER",
                "EWA",
            )}
            defaultSort={[0, "asc"]}
            footer={[
                "Career",
                null,
                null,
                careerStats.gp,
                careerStats.gs,
                careerStats.min.toFixed(1),
                careerStats.fg.toFixed(1),
                careerStats.fga.toFixed(1),
                careerStats.fgp.toFixed(1),
                careerStats.tp.toFixed(1),
                careerStats.tpa.toFixed(1),
                careerStats.tpp.toFixed(1),
                careerStats.ft.toFixed(1),
                careerStats.fta.toFixed(1),
                careerStats.ftp.toFixed(1),
                careerStats.orb.toFixed(1),
                careerStats.drb.toFixed(1),
                careerStats.trb.toFixed(1),
                careerStats.ast.toFixed(1),
                careerStats.tov.toFixed(1),
                careerStats.stl.toFixed(1),
                careerStats.blk.toFixed(1),
                careerStats.ba.toFixed(1),
                careerStats.pf.toFixed(1),
                careerStats.pts.toFixed(1),
                helpers.plusMinus(careerStats.pm, 1),
                careerStats.per.toFixed(1),
                careerStats.ewa.toFixed(1),
            ]}
            name={name}
            rows={stats.map(ps => {
                return {
                    key: ps.psid,
                    data: [
                        ps.season,
                        <a
                            href={helpers.leagueUrl([
                                "roster",
                                ps.abbrev,
                                ps.season,
                            ])}
                        >
                            {ps.abbrev}
                        </a>,
                        ps.age,
                        ps.gp,
                        ps.gs,
                        ps.min.toFixed(1),
                        ps.fg.toFixed(1),
                        ps.fga.toFixed(1),
                        ps.fgp.toFixed(1),
                        ps.tp.toFixed(1),
                        ps.tpa.toFixed(1),
                        ps.tpp.toFixed(1),
                        ps.ft.toFixed(1),
                        ps.fta.toFixed(1),
                        ps.ftp.toFixed(1),
                        ps.orb.toFixed(1),
                        ps.drb.toFixed(1),
                        ps.trb.toFixed(1),
                        ps.ast.toFixed(1),
                        ps.tov.toFixed(1),
                        ps.stl.toFixed(1),
                        ps.blk.toFixed(1),
                        ps.ba.toFixed(1),
                        ps.pf.toFixed(1),
                        ps.pts.toFixed(1),
                        helpers.plusMinus(ps.pm, 1),
                        ps.per.toFixed(1),
                        ps.ewa.toFixed(1),
                    ],
                };
            })}
            superCols={[
                {
                    title: "",
                    colspan: 6,
                },
                {
                    title: "FG",
                    desc: "Field Goals",
                    colspan: 3,
                },
                {
                    title: "3PT",
                    desc: "Three-Pointers",
                    colspan: 3,
                },
                {
                    title: "FT",
                    desc: "Free Throws",
                    colspan: 3,
                },
                {
                    title: "Reb",
                    desc: "Rebounds",
                    colspan: 3,
                },
                {
                    title: "",
                    colspan: 10,
                },
            ]}
        />
    );
};

StatsTable.propTypes = {
    careerStats: PropTypes.object,
    name: PropTypes.string.isRequired,
    stats: PropTypes.arrayOf(PropTypes.object),
};

const ShotLocationsTable = ({ careerStats = {}, name, stats = [] }) => {
    return (
        <DataTable
            cols={getCols(
                "Year",
                "Team",
                "Age",
                "GP",
                "GS",
                "Min",
                "M",
                "A",
                "%",
                "M",
                "A",
                "%",
                "M",
                "A",
                "%",
                "M",
                "A",
                "%",
            )}
            defaultSort={[0, "asc"]}
            footer={[
                "Career",
                null,
                null,
                careerStats.gp,
                careerStats.gs,
                careerStats.min.toFixed(1),
                careerStats.fgAtRim.toFixed(1),
                careerStats.fgaAtRim.toFixed(1),
                careerStats.fgpAtRim.toFixed(1),
                careerStats.fgLowPost.toFixed(1),
                careerStats.fgaLowPost.toFixed(1),
                careerStats.fgpLowPost.toFixed(1),
                careerStats.fgMidRange.toFixed(1),
                careerStats.fgaMidRange.toFixed(1),
                careerStats.fgpMidRange.toFixed(1),
                careerStats.tp.toFixed(1),
                careerStats.tpa.toFixed(1),
                careerStats.tpp.toFixed(1),
            ]}
            name={name}
            rows={stats.map(ps => {
                return {
                    key: ps.psid,
                    data: [
                        ps.season,
                        <a
                            href={helpers.leagueUrl([
                                "roster",
                                ps.abbrev,
                                ps.season,
                            ])}
                        >
                            {ps.abbrev}
                        </a>,
                        ps.age,
                        ps.gp,
                        ps.gs,
                        ps.min.toFixed(1),
                        ps.fgAtRim.toFixed(1),
                        ps.fgaAtRim.toFixed(1),
                        ps.fgpAtRim.toFixed(1),
                        ps.fgLowPost.toFixed(1),
                        ps.fgaLowPost.toFixed(1),
                        ps.fgpLowPost.toFixed(1),
                        ps.fgMidRange.toFixed(1),
                        ps.fgaMidRange.toFixed(1),
                        ps.fgpMidRange.toFixed(1),
                        ps.tp.toFixed(1),
                        ps.tpa.toFixed(1),
                        ps.tpp.toFixed(1),
                    ],
                };
            })}
            superCols={[
                {
                    title: "",
                    colspan: 6,
                },
                {
                    title: "At Rim",
                    colspan: 3,
                },
                {
                    title: "Low Post",
                    colspan: 3,
                },
                {
                    title: "Mid-Range",
                    colspan: 3,
                },
                {
                    title: "3PT",
                    desc: "Three-Pointers",
                    colspan: 3,
                },
            ]}
        />
    );
};

ShotLocationsTable.propTypes = {
    careerStats: PropTypes.object,
    name: PropTypes.string.isRequired,
    stats: PropTypes.arrayOf(PropTypes.object),
};

const Player = ({
    events,
    feats,
    freeAgent,
    godMode,
    injured,
    player,
    retired,
    showContract,
    showTradeFor,
}) => {
    setTitle(player.name);

    let draftInfo = null;
    if (player.draft.round) {
        draftInfo = (
            <div>
                Draft:{" "}
                <a
                    href={helpers.leagueUrl([
                        "draft_summary",
                        player.draft.year,
                    ])}
                >
                    {player.draft.year}
                </a>{" "}
                - Round {player.draft.round} (Pick {player.draft.pick}) by{" "}
                {player.draft.abbrev}
                <br />
            </div>
        );
    } else {
        draftInfo = (
            <div>
                Undrafted: {player.draft.year}
                <br />
            </div>
        );
    }

    let contractInfo = null;
    if (showContract) {
        contractInfo = (
            <div>
                {freeAgent ? "Asking for" : "Contract"}:{" "}
                {helpers.formatCurrency(player.contract.amount, "M")}/yr thru{" "}
                {player.contract.exp}
                <br />
            </div>
        );
    }

    let statusInfo = null;
    if (!retired) {
        statusInfo = (
            <div>
                {injured ? (
                    <span
                        className="label label-danger label-injury"
                        style={{ marginLeft: 0 }}
                        title={`${player.injury.type} (out ${player.injury
                            .gamesRemaining} more games)`}
                    >
                        {player.injury.gamesRemaining}
                    </span>
                ) : null}
                <SkillsBlock
                    className={injured ? null : "skills-alone"}
                    skills={player.ratings[player.ratings.length - 1].skills}
                />
                <WatchBlock pid={player.pid} watch={player.watch} />
                <br />
            </div>
        );
    }

    const statsRegularSeason = player.stats.filter(ps => !ps.playoffs);
    const statsPlayoffs = player.stats.filter(ps => ps.playoffs);

    return (
        <div>
            <div className="row">
                <div className="col-sm-6">
                    <h1>
                        {player.name} <NewWindowLink />
                    </h1>
                    <div className="player-picture">
                        <PlayerPicture
                            face={player.face}
                            imgURL={player.imgURL}
                        />
                    </div>
                    <div style={{ float: "left" }}>
                        <strong>
                            {player.ratings[player.ratings.length - 1].pos},{" "}
                            {player.teamRegion} {player.teamName}
                        </strong>
                        <br />
                        Height: {player.hgtFt}'{player.hgtIn}"<br />
                        Weight: {player.weight} lbs<br />
                        Born: {player.born.year} - {player.born.loc}
                        <br />
                        {!player.diedYear ? (
                            <div>
                                Age: {player.age}
                                <br />
                            </div>
                        ) : (
                            <div>
                                Died: {player.diedYear}
                                <br />
                            </div>
                        )}
                        {draftInfo}
                        {player.college && player.college !== "" ? (
                            <div>
                                From: {player.college}
                                <br />
                            </div>
                        ) : null}
                        {contractInfo}
                        {godMode ? (
                            <div>
                                <a
                                    href={helpers.leagueUrl([
                                        "customize_player",
                                        player.pid,
                                    ])}
                                    className="god-mode god-mode-text"
                                >
                                    Edit Player
                                </a>
                                <br />
                            </div>
                        ) : null}
                        {statusInfo}
                    </div>
                </div>

                <div className="visible-xs clearfix" />

                <div className="col-sm-6" style={{ whiteSpace: "nowrap" }}>
                    {!retired ? (
                        <RatingsOverview ratings={player.ratings} />
                    ) : null}
                </div>
            </div>

            <p />

            {showTradeFor ? (
                <span title={player.untradableMsg}>
                    <button
                        className="btn btn-default"
                        disabled={player.untradable}
                        onClick={() =>
                            toWorker("actions.tradeFor", { pid: player.pid })}
                    >
                        Trade For
                    </button>
                </span>
            ) : null}
            {freeAgent ? (
                <button
                    className="btn btn-default"
                    onClick={() => toWorker("actions.negotiate", player.pid)}
                >
                    Sign Free Agent
                </button>
            ) : null}

            <h2>Regular Season</h2>
            <h3>Stats</h3>
            <StatsTable
                careerStats={player.careerStats}
                name="Player:Stats"
                stats={statsRegularSeason}
            />

            <h3>Shot Locations</h3>
            <ShotLocationsTable
                careerStats={player.careerStats}
                name="Player:ShotLocations"
                stats={statsRegularSeason}
            />

            <h2>Playoffs</h2>
            <h3>Stats</h3>
            <StatsTable
                careerStats={player.careerStatsPlayoffs}
                name="Player:PlayoffStats"
                stats={statsPlayoffs}
            />

            <h3>Shot Locations</h3>
            <ShotLocationsTable
                careerStats={player.careerStatsPlayoffs}
                name="Player:PlayoffShotLocations"
                stats={statsPlayoffs}
            />

            <h2>Ratings</h2>
            <DataTable
                cols={getCols(
                    "Year",
                    "Team",
                    "Age",
                    "Pos",
                    "Ovr",
                    "Pot",
                    "rating:Hgt",
                    "rating:Str",
                    "rating:Spd",
                    "rating:Jmp",
                    "rating:End",
                    "rating:Ins",
                    "rating:Dnk",
                    "rating:FT",
                    "rating:2Pt",
                    "rating:3Pt",
                    "rating:Blk",
                    "rating:Stl",
                    "rating:Drb",
                    "rating:Pss",
                    "rating:Reb",
                    "Skills",
                )}
                defaultSort={[0, "asc"]}
                name="Player:Ratings"
                rows={player.ratings.map(r => {
                    return {
                        key: r.season,
                        data: [
                            r.season,
                            r.abbrev ? (
                                <a
                                    href={helpers.leagueUrl([
                                        "roster",
                                        r.abbrev,
                                        r.season,
                                    ])}
                                >
                                    {r.abbrev}
                                </a>
                            ) : null,
                            r.age,
                            r.pos,
                            r.ovr,
                            r.pot,
                            r.hgt,
                            r.stre,
                            r.spd,
                            r.jmp,
                            r.endu,
                            r.ins,
                            r.dnk,
                            r.ft,
                            r.fg,
                            r.tp,
                            r.blk,
                            r.stl,
                            r.drb,
                            r.pss,
                            r.reb,
                            <SkillsBlock
                                className="skills-alone"
                                skills={r.skills}
                            />,
                        ],
                    };
                })}
            />

            <div className="row">
                <div className="col-sm-6">
                    <h2>Awards</h2>
                    {player.awardsGrouped.length > 0 ? (
                        <table className="table table-nonfluid table-striped table-bordered table-condensed player-awards">
                            <tbody>
                                {player.awardsGrouped.map((a, i) => {
                                    return (
                                        <tr key={i}>
                                            <td>
                                                {a.count > 1 ? <span>{a.count}x </span> : null}
                                                {a.type} ({a.seasons.join(", ")})
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : null}
                    {player.awardsGrouped.length === 0 ? <p>None</p> : null}
                </div>
                <div className="col-sm-6">
                    <h2>Statistical Feats</h2>
                    {feats.map(e => {
                        return (
                            <p key={e.eid}>
                                <b>{e.season}</b>: <SafeHtml dirty={e.text} />
                            </p>
                        );
                    })}
                    {feats.length === 0 ? <p>None</p> : null}
                </div>
            </div>

            <div className="row">
                <div className="col-md-10 col-md-push-2 col-sm-9 col-sm-push-3">
                    <h2>Transactions</h2>
                    {events.map(e => {
                        return (
                            <p key={e.eid}>
                                <b>{e.season}</b>: <SafeHtml dirty={e.text} />
                            </p>
                        );
                    })}
                    {events.length === 0 ? <p>None</p> : null}
                </div>
                <div className="col-md-2 col-md-pull-10 col-sm-3 col-sm-pull-9">
                    <h2>Salaries</h2>
                    <DataTable
                        cols={getCols("Year", "Amount")}
                        defaultSort={[0, "asc"]}
                        footer={[
                            "Total",
                            helpers.formatCurrency(player.salariesTotal, "M"),
                        ]}
                        name="Player:Salaries"
                        rows={player.salaries.map((s, i) => {
                            return {
                                key: i,
                                data: [
                                    s.season,
                                    helpers.formatCurrency(s.amount, "M"),
                                ],
                            };
                        })}
                    />
                </div>
            </div>
        </div>
    );
};

Player.propTypes = {
    events: PropTypes.arrayOf(
        PropTypes.shape({
            eid: PropTypes.number.isRequired,
            season: PropTypes.number.isRequired,
            text: PropTypes.string.isRequired,
        }),
    ).isRequired,
    feats: PropTypes.arrayOf(
        PropTypes.shape({
            eid: PropTypes.number.isRequired,
            season: PropTypes.number.isRequired,
            text: PropTypes.string.isRequired,
        }),
    ).isRequired,
    freeAgent: PropTypes.bool.isRequired,
    godMode: PropTypes.bool.isRequired,
    injured: PropTypes.bool.isRequired,
    player: PropTypes.object.isRequired,
    retired: PropTypes.bool.isRequired,
    showContract: PropTypes.bool.isRequired,
    showTradeFor: PropTypes.bool.isRequired,
};

export default Player;
