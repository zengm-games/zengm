import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../common";
import {
    helpers,
    overrides,
    realtimeUpdate,
    subscribeLocal,
    toWorker,
} from "../util";

const HeadlineScore = ({ boxScore }) => {
    // Historical games will have boxScore.won.name and boxScore.lost.name so use that for ordering, but live games
    // won't. This is hacky, because the existence of this property is just a historical coincidence, and maybe it'll
    // change in the future.
    const t0 =
        boxScore.won && boxScore.won.name ? boxScore.won : boxScore.teams[0];
    const t1 =
        boxScore.lost && boxScore.lost.name ? boxScore.lost : boxScore.teams[1];

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

const FourFactors = ({ teams }) => {
    return (
        <table className="table table-bordered table-sm">
            <thead>
                <tr />
                <tr>
                    <th title="Four Factors: Effective Field Goal Percentage">
                        eFG%
                    </th>
                    <th title="Four Factors: Turnover Percentage">TOV%</th>
                    <th title="Four Factors: Offensive Rebound Percentage">
                        ORB%
                    </th>
                    <th title="Four Factors: Free Throws Made Over Field Goal Attempts">
                        FT/FGA
                    </th>
                </tr>
            </thead>
            <tbody>
                {teams.map((t, i) => {
                    const t2 = teams[1 - i];

                    const efg = (100 * (t.fg + t.tp / 2)) / t.fga;
                    const tovp = (100 * t.tov) / (t.fga + 0.44 * t.fta + t.tov);
                    const orbp = (100 * t.orb) / (t.orb + t2.drb);
                    const ftpfga = t.ft / t.fga;

                    const efg2 = (100 * (t2.fg + t2.tp / 2)) / t2.fga;
                    const tovp2 =
                        (100 * t2.tov) / (t2.fga + 0.44 * t2.fta + t2.tov);
                    const orbp2 = (100 * t2.orb) / (t2.orb + t.drb);
                    const ftpfga2 = t2.ft / t2.fga;

                    return (
                        <tr key={t.abbrev}>
                            <td className={efg > efg2 ? "table-success" : null}>
                                {helpers.roundStat(efg, "efg")}
                            </td>
                            <td
                                className={
                                    tovp < tovp2 ? "table-success" : null
                                }
                            >
                                {helpers.roundStat(tovp, "tovp")}
                            </td>
                            <td
                                className={
                                    orbp > orbp2 ? "table-success" : null
                                }
                            >
                                {helpers.roundStat(orbp, "orbp")}
                            </td>
                            <td
                                className={
                                    ftpfga > ftpfga2 ? "table-success" : null
                                }
                            >
                                {helpers.roundStat(ftpfga, "ftpfga")}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
FourFactors.propTypes = {
    teams: PropTypes.array.isRequired,
};

class NextButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            autoGoToNext: false,
            clickedGoToNext: false,
        };
        this.simNext = this.simNext.bind(this);
    }

    async simNext() {
        this.setState({
            autoGoToNext: true,
            clickedGoToNext: true,
        });
        await toWorker(`actions.playMenu.day`);
    }

    async componentDidUpdate() {
        if (this.state.autoGoToNext && this.props.nextGid !== undefined) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                autoGoToNext: false,
            });
            await realtimeUpdate(
                [],
                helpers.leagueUrl([
                    "game_log",
                    this.props.abbrev,
                    this.props.boxScore.season,
                    this.props.nextGid,
                ]),
            );
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                clickedGoToNext: false,
            });
        }
    }

    render() {
        const { abbrev, boxScore, currentGidInList, nextGid } = this.props;
        return subscribeLocal(local => {
            const { phase, playMenuOptions, season } = local.state;

            const canPlay = playMenuOptions.some(
                option => option.id === "day" || option.id === "week",
            );

            return (
                <div className="ml-4">
                    {boxScore.season === season &&
                    currentGidInList &&
                    (nextGid === undefined || this.state.clickedGoToNext) &&
                    (phase === PHASE.REGULAR_SEASON ||
                        phase === PHASE.PLAYOFFS) ? (
                        <button
                            className="btn btn-light-bordered"
                            disabled={!canPlay || this.state.autoGoToNext}
                            onClick={this.simNext}
                        >
                            Sim
                            <br />
                            Next
                        </button>
                    ) : (
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
                    )}
                </div>
            );
        });
    }
}
NextButton.propTypes = {
    abbrev: PropTypes.string,
    boxScore: PropTypes.object.isRequired,
    currentGidInList: PropTypes.bool,
    nextGid: PropTypes.number,
};

const DetailedScore = ({
    abbrev,
    boxScore,
    currentGidInList,
    nextGid,
    prevGid,
    showNextPrev,
}) => {
    // Quarter/overtime labels
    const qtrs = boxScore.teams[1].ptsQtrs.map((pts, i) => {
        return i < 4 ? `Q${i + 1}` : `OT${i - 3}`;
    });
    qtrs.push("F");

    return (
        <div className="d-flex align-items-center justify-content-center">
            {showNextPrev ? (
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
            ) : null}
            <div>
                <div className="mr-4 mx-xs-auto table-nonfluid text-center">
                    <table className="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th />
                                {qtrs.map(qtr => (
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
                {process.env.SPORT === "basketball" ? (
                    <div className="mx-xs-auto table-nonfluid text-center">
                        <FourFactors teams={boxScore.teams} />
                    </div>
                ) : null}
            </div>
            {showNextPrev ? (
                <NextButton
                    abbrev={abbrev}
                    boxScore={boxScore}
                    currentGidInList={currentGidInList}
                    nextGid={nextGid}
                />
            ) : null}
        </div>
    );
};

DetailedScore.propTypes = {
    abbrev: PropTypes.string,
    boxScore: PropTypes.object.isRequired,
    currentGidInList: PropTypes.bool,
    nextGid: PropTypes.number,
    prevGid: PropTypes.number,
    showNextPrev: PropTypes.bool,
};

class BoxScore extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    componentDidMount() {
        if (this.props.showNextPrev) {
            document.addEventListener("keydown", this.handleKeydown);
        }
    }

    componentWillUnmount() {
        if (this.props.showNextPrev) {
            document.removeEventListener("keydown", this.handleKeydown);
        }
    }

    handleKeydown(e) {
        if (this.props.showNextPrev) {
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
    }

    render() {
        const {
            abbrev,
            boxScore,
            currentGidInList,
            nextGid,
            prevGid,
            showNextPrev,
            Row,
        } = this.props;

        return (
            <>
                <center>
                    <HeadlineScore boxScore={boxScore} />
                    <DetailedScore
                        abbrev={abbrev}
                        boxScore={boxScore}
                        currentGidInList={currentGidInList}
                        key={boxScore.gid}
                        nextGid={nextGid}
                        prevGid={prevGid}
                        showNextPrev={showNextPrev}
                    />
                </center>
                <overrides.components.BoxScore boxScore={boxScore} Row={Row} />
                Attendance: {helpers.numberWithCommas(boxScore.att)}
            </>
        );
    }
}

BoxScore.propTypes = {
    abbrev: PropTypes.string,
    boxScore: PropTypes.object.isRequired,
    currentGidInList: PropTypes.bool,
    nextGid: PropTypes.number,
    prevGid: PropTypes.number,
    showNextPrev: PropTypes.bool,
    Row: PropTypes.any,
};

export default BoxScore;
