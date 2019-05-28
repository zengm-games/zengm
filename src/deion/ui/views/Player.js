import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    NewWindowLink,
    PlayerPicture,
    SafeHtml,
    SkillsBlock,
    WatchBlock,
} from "../components";
import { getCols, helpers, overrides, setTitle, toWorker } from "../util";

const Relatives = ({ pid, relatives }) => {
    if (relatives.length === 0) {
        return null;
    }

    return (
        <>
            {relatives.map(rel => {
                return (
                    <React.Fragment key={rel.pid}>
                        {helpers.upperCaseFirstLetter(rel.type)}:{" "}
                        <a href={helpers.leagueUrl(["player", rel.pid])}>
                            {rel.name}
                        </a>
                        <br />
                    </React.Fragment>
                );
            })}
            <a href={helpers.leagueUrl(["frivolities", "relatives", pid])}>
                (Family details)
            </a>
            <br />
        </>
    );
};

Relatives.propTypes = {
    pid: PropTypes.number.isRequired,
    relatives: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const StatsTable = ({ name, onlyShowIf, p, playoffs = false, stats }) => {
    const playerStats = p.stats.filter(ps => ps.playoffs === playoffs);
    const careerStats = playoffs ? p.careerStatsPlayoffs : p.careerStats;

    if (onlyShowIf !== undefined) {
        let display = false;
        for (const stat of onlyShowIf) {
            if (careerStats[stat] > 0) {
                display = true;
                break;
            }
        }

        if (!display) {
            return null;
        }
    }

    return (
        <>
            <h3>{name}</h3>
            <DataTable
                className="mb-3"
                cols={getCols(
                    "Year",
                    "Team",
                    "Age",
                    ...stats.map(stat => `stat:${stat}`),
                )}
                defaultSort={[0, "asc"]}
                footer={[
                    "Career",
                    null,
                    null,
                    ...stats.map(stat =>
                        helpers.roundStat(careerStats[stat], stat),
                    ),
                ]}
                name={`Player:${name}${playoffs ? ":Playoffs" : ""}`}
                rows={playerStats.map((ps, i) => {
                    return {
                        key: i,
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
                            ...stats.map(stat =>
                                helpers.roundStat(ps[stat], stat),
                            ),
                        ],
                    };
                })}
            />
        </>
    );
};

StatsTable.propTypes = {
    name: PropTypes.string.isRequired,
    onlyShowIf: PropTypes.arrayOf(PropTypes.string),
    p: PropTypes.object.isRequired,
    playoffs: PropTypes.bool,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const ShotLocationsTable = ({ careerStats = {}, name, stats = [] }) => {
    return (
        <DataTable
            className="mb-3"
            cols={getCols(
                "Year",
                "Team",
                "Age",
                "stat:gp",
                "stat:gs",
                "stat:min",
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
            rows={stats.map((ps, i) => {
                return {
                    key: i,
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
    ratings,
    retired,
    showContract,
    showTradeFor,
    statTables,
    willingToSign,
}) => {
    setTitle(player.name);

    let draftInfo = null;
    if (player.draft.round) {
        draftInfo = (
            <>
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
            </>
        );
    } else {
        draftInfo = (
            <>
                Undrafted: {player.draft.year}
                <br />
            </>
        );
    }

    let contractInfo = null;
    if (showContract) {
        contractInfo = (
            <>
                {freeAgent ? "Asking for" : "Contract"}:{" "}
                {helpers.formatCurrency(player.contract.amount, "M")}
                /yr thru {player.contract.exp}
                <br />
            </>
        );
    }

    let statusInfo = null;
    if (!retired) {
        statusInfo = (
            <>
                {injured ? (
                    <span
                        className="badge badge-danger badge-injury"
                        style={{ marginLeft: 0 }}
                        title={`${player.injury.type} (out ${
                            player.injury.gamesRemaining
                        } more games)`}
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
            </>
        );
    }

    const statsRegularSeason = player.stats.filter(ps => !ps.playoffs);
    const statsPlayoffs = player.stats.filter(ps => ps.playoffs);

    return (
        <>
            <div className="row mb-3">
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
                        Weight: {player.weight} lbs
                        <br />
                        Born: {player.born.year} - {player.born.loc}
                        <br />
                        {typeof player.diedYear !== "number" ? (
                            <>
                                Age: {player.age}
                                <br />
                            </>
                        ) : (
                            <>
                                Died: {player.diedYear}
                                <br />
                            </>
                        )}
                        <Relatives
                            pid={player.pid}
                            relatives={player.relatives}
                        />
                        {draftInfo}
                        {player.college && player.college !== "" ? (
                            <>
                                From: {player.college}
                                <br />
                            </>
                        ) : null}
                        {contractInfo}
                        {godMode ? (
                            <>
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
                            </>
                        ) : null}
                        {statusInfo}
                    </div>
                </div>

                <div className="col-sm-6 text-nowrap">
                    {!retired ? (
                        <overrides.components.RatingsOverview
                            ratings={player.ratings}
                        />
                    ) : null}
                </div>
            </div>

            {showTradeFor ? (
                <span title={player.untradableMsg}>
                    <button
                        className="btn btn-light-bordered mb-3"
                        disabled={player.untradable}
                        onClick={() =>
                            toWorker("actions.tradeFor", { pid: player.pid })
                        }
                    >
                        Trade For
                    </button>
                </span>
            ) : null}
            {freeAgent ? (
                <span
                    title={
                        willingToSign
                            ? null
                            : `${player.name} refuses to negotiate with you`
                    }
                >
                    <button
                        className="btn btn-light-bordered mb-3"
                        disabled={!willingToSign}
                        onClick={() =>
                            toWorker("actions.negotiate", player.pid)
                        }
                    >
                        Negotiate Contract
                    </button>
                </span>
            ) : null}

            {player.careerStats.gp > 0 ? (
                <>
                    <h2>Regular Season</h2>
                    {statTables.map(({ name, onlyShowIf, stats }) => (
                        <StatsTable
                            key={name}
                            name={name}
                            onlyShowIf={onlyShowIf}
                            stats={stats}
                            p={player}
                        />
                    ))}
                    {process.env.SPORT === "basketball" ? (
                        <>
                            <h3>Shot Locations</h3>
                            <ShotLocationsTable
                                careerStats={player.careerStats}
                                name="Player:ShotLocations"
                                stats={statsRegularSeason}
                            />
                        </>
                    ) : null}
                </>
            ) : null}

            {player.careerStatsPlayoffs.gp > 0 ? (
                <>
                    <h2>Playoffs</h2>
                    {statTables.map(({ name, onlyShowIf, stats }) => (
                        <StatsTable
                            key={name}
                            name={name}
                            onlyShowIf={onlyShowIf}
                            stats={stats}
                            p={player}
                            playoffs
                        />
                    ))}
                    {process.env.SPORT === "basketball" ? (
                        <>
                            <h3>Shot Locations</h3>
                            <ShotLocationsTable
                                careerStats={player.careerStatsPlayoffs}
                                name="Player:PlayoffShotLocations"
                                stats={statsPlayoffs}
                            />
                        </>
                    ) : null}
                </>
            ) : null}

            <h2>Ratings</h2>
            <DataTable
                className="mb-3"
                cols={getCols(
                    "Year",
                    "Team",
                    "Age",
                    "Pos",
                    "Ovr",
                    "Pot",
                    ...ratings.map(rating => `rating:${rating}`),
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
                            ...ratings.map(rating => r[rating]),
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
                        <table className="table table-nonfluid table-striped table-bordered table-sm player-awards">
                            <tbody>
                                {player.awardsGrouped.map((a, i) => {
                                    return (
                                        <tr key={i}>
                                            <td>
                                                {a.count > 1 ? (
                                                    <span>{a.count}x </span>
                                                ) : null}
                                                {a.type} ({a.seasons.join(", ")}
                                                )
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
                    <div
                        style={{
                            maxHeight: 500,
                            overflowY: "scroll",
                        }}
                    >
                        {feats.map(e => {
                            return (
                                <p key={e.eid}>
                                    <b>{e.season}</b>:{" "}
                                    <SafeHtml dirty={e.text} />
                                </p>
                            );
                        })}
                    </div>
                    {feats.length === 0 ? <p>None</p> : null}
                </div>
            </div>

            <div className="row" style={{ marginBottom: "-1rem" }}>
                <div className="col-lg-2 col-md-3 col-sm-4">
                    <h2>Salaries</h2>
                    <DataTable
                        className="mb-3"
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
                <div className="col-lg-10 col-md-9 col-sm-8">
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
            </div>
        </>
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
    ratings: PropTypes.arrayOf(PropTypes.string).isRequired,
    retired: PropTypes.bool.isRequired,
    showContract: PropTypes.bool.isRequired,
    showTradeFor: PropTypes.bool.isRequired,
    statTables: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            stats: PropTypes.arrayOf(PropTypes.string).isRequired,
        }),
    ).isRequired,
    willingToSign: PropTypes.bool.isRequired,
};

export default Player;
