import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import { helpers, realtimeUpdate } from "../util";

const HeadlineScore = ({ boxScore }) => {
    // Completed games will have boxScore.won and boxScore.lost so use that for ordering, but live games won't
    const t0 = boxScore.won ? boxScore.won : boxScore.teams[0];
    const t1 = boxScore.lost ? boxScore.lost : boxScore.teams[1];

    return (
        <h2>
            <a href={helpers.leagueUrl(["roster", t0.abbrev, boxScore.season])}>
                {t0.region} {t0.name}
            </a>{" "}
            {t0.pts},{" "}
            <a href={helpers.leagueUrl(["roster", t1.abbrev, boxScore.season])}>
                {t1.region} {t1.name}
            </a>{" "}
            {t1.pts}
            {boxScore.overtime}
        </h2>
    );
};
HeadlineScore.propTypes = {
    boxScore: PropTypes.object.isRequired,
};

const DetailedScore = ({ abbrev, boxScore, nextGid, prevGid }) => {
    return (
        <div className="d-flex align-items-center justify-content-center">
            <div className="mr-4">
                <a
                    className={classNames("btn", "btn-light-bordered", {
                        disabled: prevGid === undefined,
                    })}
                    href={helpers.leagueUrl([
                        "game_log",
                        abbrev,
                        boxScore.season,
                        prevGid,
                    ])}
                >
                    Prev
                </a>
            </div>
            <div className="mr-4">
                <div className="mr-4 mx-xs-auto table-nonfluid text-center">
                    <table className="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th />
                                {boxScore.qtrs.map(qtr => (
                                    <th key={qtr}>{qtr}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {boxScore.teams.map(t => (
                                <tr key={t.abbrev}>
                                    <th>
                                        <a
                                            href={helpers.leagueUrl([
                                                "roster",
                                                t.abbrev,
                                                boxScore.season,
                                            ])}
                                        >
                                            {t.abbrev}
                                        </a>
                                    </th>
                                    {t.ptsQtrs.map((pts, i) => (
                                        <td key={i}>{pts}</td>
                                    ))}
                                    <th>{t.pts}</th>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mx-xs-auto table-nonfluid text-center">
                    <table className="table table-bordered table-sm">
                        <thead>
                            <tr />
                            <tr>
                                <th title="Four Factors: Effective Field Goal Percentage">
                                    eFG%
                                </th>
                                <th title="Four Factors: Turnover Percentage">
                                    TOV%
                                </th>
                                <th title="Four Factors: Offensive Rebound Percentage">
                                    ORB%
                                </th>
                                <th title="Four Factors: Free Throws Made Over Field Goal Attempts">
                                    FT/FGA
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {boxScore.teams.map((t, i) => (
                                <tr key={t.abbrev}>
                                    <td
                                        className={
                                            t.efg >= boxScore.teams[1 - i].efg
                                                ? "table-success"
                                                : null
                                        }
                                    >
                                        {t.efg.toFixed(1)}
                                    </td>
                                    <td
                                        className={
                                            t.tovp <= boxScore.teams[1 - i].tovp
                                                ? "table-success"
                                                : null
                                        }
                                    >
                                        {t.tovp.toFixed(1)}
                                    </td>
                                    <td
                                        className={
                                            t.orbp >= boxScore.teams[1 - i].orbp
                                                ? "table-success"
                                                : null
                                        }
                                    >
                                        {t.orbp.toFixed(1)}
                                    </td>
                                    <td
                                        className={
                                            t.ftpfga >=
                                            boxScore.teams[1 - i].ftpfga
                                                ? "table-success"
                                                : null
                                        }
                                    >
                                        {t.ftpfga.toFixed(3)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div>
                <a
                    className={classNames("btn", "btn-light-bordered", {
                        disabled: nextGid === undefined,
                    })}
                    href={helpers.leagueUrl([
                        "game_log",
                        abbrev,
                        boxScore.season,
                        nextGid,
                    ])}
                >
                    Next
                </a>
            </div>
        </div>
    );
};

DetailedScore.propTypes = {
    abbrev: PropTypes.string.isRequired,
    boxScore: PropTypes.object.isRequired,
    nextGid: PropTypes.number,
    prevGid: PropTypes.number,
};

class BoxScore extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    componentDidMount() {
        document.addEventListener("keydown", this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeydown);
    }

    handleKeydown(e) {
        if (
            e.keyCode === 37 &&
            this.props.boxScore &&
            this.props.prevGid !== undefined
        ) {
            // prev
            realtimeUpdate(
                [],
                helpers.leagueUrl([
                    "game_log",
                    this.props.abbrev,
                    this.props.boxScore.season,
                    this.props.prevGid,
                ]),
            );
        } else if (
            e.keyCode === 39 &&
            this.props.boxScore &&
            this.props.nextGid !== undefined
        ) {
            // next
            realtimeUpdate(
                [],
                helpers.leagueUrl([
                    "game_log",
                    this.props.abbrev,
                    this.props.boxScore.season,
                    this.props.nextGid,
                ]),
            );
        }
    }

    render() {
        const { abbrev, boxScore, nextGid, prevGid, Row } = this.props;

        return (
            <>
                <center>
                    <HeadlineScore boxScore={boxScore} />
                    <DetailedScore
                        abbrev={abbrev}
                        boxScore={boxScore}
                        nextGid={nextGid}
                        prevGid={prevGid}
                    />
                </center>
                {boxScore.teams.map(t => (
                    <div key={t.abbrev} className="mb-3">
                        <h3>
                            <a
                                href={helpers.leagueUrl([
                                    "roster",
                                    t.abbrev,
                                    boxScore.season,
                                ])}
                            >
                                {t.region} {t.name}
                            </a>
                        </h3>
                        <ResponsiveTableWrapper>
                            <table className="table table-striped table-bordered table-sm table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Pos</th>
                                        <th>Min</th>
                                        <th>FG</th>
                                        <th>3Pt</th>
                                        <th>FT</th>
                                        <th>Off</th>
                                        <th>Reb</th>
                                        <th>Ast</th>
                                        <th>TO</th>
                                        <th>Stl</th>
                                        <th>Blk</th>
                                        <th>BA</th>
                                        <th>PF</th>
                                        <th>Pts</th>
                                        <th>+/-</th>
                                        <th title="Game Score">GmSc</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {t.players.map((p, i) => {
                                        return <Row key={p.pid} i={i} p={p} />;
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td>Total</td>
                                        <td />
                                        <td>{t.min}</td>
                                        <td>
                                            {t.fg}-{t.fga}
                                        </td>
                                        <td>
                                            {t.tp}-{t.tpa}
                                        </td>
                                        <td>
                                            {t.ft}-{t.fta}
                                        </td>
                                        <td>{t.orb}</td>
                                        <td>{t.drb + t.orb}</td>
                                        <td>{t.ast}</td>
                                        <td>{t.tov}</td>
                                        <td>{t.stl}</td>
                                        <td>{t.blk}</td>
                                        <td>{t.ba}</td>
                                        <td>{t.pf}</td>
                                        <td>{t.pts}</td>
                                        <td />
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </ResponsiveTableWrapper>
                    </div>
                ))}
                Attendance: {helpers.numberWithCommas(boxScore.att)}
            </>
        );
    }
}

BoxScore.propTypes = {
    abbrev: PropTypes.string.isRequired,
    boxScore: PropTypes.object.isRequired,
    nextGid: PropTypes.number,
    prevGid: PropTypes.number,
    Row: PropTypes.any,
};

export default BoxScore;
