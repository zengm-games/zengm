import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import AutoAffix from "react-overlays/lib/AutoAffix";
import { helpers, setTitle } from "../util";
import { BoxScore, PlayerNameLabels } from "../components";

class PlayerRow extends React.Component {
    shouldComponentUpdate(nextProps) {
        return this.prevInGame || nextProps.p.inGame;
    }

    render() {
        const { i, p } = this.props;

        // Needed for shouldComponentUpdate because state is mutated so we need to explicitly store the last value
        this.prevInGame = p.inGame;

        const classes = classNames({
            separator: i === 4,
            "table-warning": p.inGame,
        });
        return (
            <tr className={classes}>
                <td>
                    <PlayerNameLabels
                        injury={p.injury}
                        pid={p.pid}
                        skills={p.skills}
                    >
                        {p.name}
                    </PlayerNameLabels>
                </td>
                <td>{p.pos}</td>
                <td>{p.min.toFixed(1)}</td>
                <td>
                    {p.fg}-{p.fga}
                </td>
                <td>
                    {p.tp}-{p.tpa}
                </td>
                <td>
                    {p.ft}-{p.fta}
                </td>
                <td>{p.orb}</td>
                <td>{p.trb}</td>
                <td>{p.ast}</td>
                <td>{p.tov}</td>
                <td>{p.stl}</td>
                <td>{p.blk}</td>
                <td>{p.ba}</td>
                <td>{p.pf}</td>
                <td>{p.pts}</td>
                <td>{helpers.plusMinus(p.pm, 0)}</td>
                <td>{helpers.gameScore(p).toFixed(1)}</td>
            </tr>
        );
    }
}

PlayerRow.propTypes = {
    i: PropTypes.number.isRequired,
    p: PropTypes.object.isRequired,
};

class LiveGame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            boxScore: props.initialBoxScore ? props.initialBoxScore : {},
            speed: 7,
            started: !!props.events,
        };
        if (props.events) {
            this.startLiveGame(props.events.slice());
        }

        this.handleSpeedChange = this.handleSpeedChange.bind(this);
        this.setPlayByPlayDivHeight = this.setPlayByPlayDivHeight.bind(this);
    }

    componentDidMount() {
        this.componentIsMounted = true;

        // Keep height of plays list equal to window
        this.setPlayByPlayDivHeight();
        window.addEventListener("resize", this.setPlayByPlayDivHeight);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.events && !this.state.started) {
            this.setState(
                {
                    boxScore: nextProps.initialBoxScore,
                    started: true,
                },
                () => {
                    this.startLiveGame(nextProps.events.slice());
                },
            );
        }
    }

    componentWillUnmount() {
        this.componentIsMounted = false;

        window.removeEventListener("resize", this.setPlayByPlayDivHeight);
    }

    setPlayByPlayDivHeight() {
        this.playByPlayDiv.style.height = `${window.innerHeight - 104}px`;
    }

    startLiveGame(events) {
        let overtimes = 0;

        const processToNextPause = () => {
            if (!this.componentIsMounted) {
                return;
            }

            // eslint-disable-next-line react/no-access-state-in-setstate
            const boxScore = this.state.boxScore; // This means we're mutating state, which is a little faster, but bad

            let stop = false;
            let text = null;
            while (!stop && events.length > 0) {
                const e = events.shift();

                if (e.type === "text") {
                    if (e.t === 0 || e.t === 1) {
                        text = `${e.time} - ${boxScore.teams[e.t].abbrev} - ${
                            e.text
                        }`;
                    } else {
                        text = e.text;
                    }

                    // Show score after scoring plays
                    if (text.includes("made")) {
                        text += ` (${boxScore.teams[0].pts}-${
                            boxScore.teams[1].pts
                        })`;
                    }

                    boxScore.time = e.time;

                    stop = true;
                } else if (e.type === "sub") {
                    for (
                        let i = 0;
                        i < boxScore.teams[e.t].players.length;
                        i++
                    ) {
                        if (boxScore.teams[e.t].players[i].pid === e.on) {
                            boxScore.teams[e.t].players[i].inGame = true;
                        } else if (
                            boxScore.teams[e.t].players[i].pid === e.off
                        ) {
                            boxScore.teams[e.t].players[i].inGame = false;
                        }
                    }
                } else if (e.type === "stat") {
                    // Quarter-by-quarter score
                    if (e.s === "pts") {
                        // This is a hack because array elements are not made observable by default in the Knockout mapping plugin and I didn't want to write a really ugly mapping function.
                        const ptsQtrs = boxScore.teams[e.t].ptsQtrs;
                        if (ptsQtrs.length <= e.qtr) {
                            // Must be overtime! This updates ptsQtrs too.
                            boxScore.teams[0].ptsQtrs.push(0);
                            boxScore.teams[1].ptsQtrs.push(0);

                            if (ptsQtrs.length > 4) {
                                overtimes += 1;
                                if (overtimes === 1) {
                                    boxScore.overtime = " (OT)";
                                } else if (overtimes > 1) {
                                    boxScore.overtime = ` (${overtimes}OT)`;
                                }
                                boxScore.quarter = `${helpers.ordinal(
                                    overtimes,
                                )} overtime`;
                            } else {
                                boxScore.quarter = `${helpers.ordinal(
                                    ptsQtrs.length,
                                )} quarter`;
                            }
                        }
                        ptsQtrs[e.qtr] += e.amt;
                        boxScore.teams[e.t].ptsQtrs = ptsQtrs;
                    }

                    // Everything else
                    if (e.s === "drb") {
                        boxScore.teams[e.t].players[e.p].trb += e.amt;
                        boxScore.teams[e.t].trb += e.amt;
                    } else if (e.s === "orb") {
                        boxScore.teams[e.t].players[e.p].trb += e.amt;
                        boxScore.teams[e.t].trb += e.amt;
                        boxScore.teams[e.t].players[e.p][e.s] += e.amt;
                        boxScore.teams[e.t][e.s] += e.amt;
                    } else if (
                        e.s === "min" ||
                        e.s === "fg" ||
                        e.s === "fga" ||
                        e.s === "tp" ||
                        e.s === "tpa" ||
                        e.s === "ft" ||
                        e.s === "fta" ||
                        e.s === "ast" ||
                        e.s === "tov" ||
                        e.s === "stl" ||
                        e.s === "blk" ||
                        e.s === "ba" ||
                        e.s === "pf" ||
                        e.s === "pts"
                    ) {
                        boxScore.teams[e.t].players[e.p][e.s] += e.amt;
                        boxScore.teams[e.t][e.s] += e.amt;

                        if (e.s === "pts") {
                            for (let j = 0; j < 2; j++) {
                                for (
                                    let k = 0;
                                    k < boxScore.teams[j].players.length;
                                    k++
                                ) {
                                    if (boxScore.teams[j].players[k].inGame) {
                                        boxScore.teams[j].players[k].pm +=
                                            e.t === j ? e.amt : -e.amt;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (text !== null) {
                const p = document.createElement("p");
                const node = document.createTextNode(text);
                if (text.startsWith("Start of")) {
                    const b = document.createElement("b");
                    b.appendChild(node);
                    p.appendChild(b);
                } else {
                    p.appendChild(node);
                }

                this.playByPlayDiv.insertBefore(
                    p,
                    this.playByPlayDiv.firstChild,
                );
            }

            if (events.length > 0) {
                setTimeout(processToNextPause, 4000 / 1.2 ** this.state.speed);
            } else {
                boxScore.time = "0:00";
                boxScore.gameOver = true;
            }

            this.setState({
                boxScore,
            });
        };

        processToNextPause();
    }

    handleSpeedChange(e) {
        this.setState({ speed: e.target.value });
    }

    render() {
        setTitle("Live Game Simulation");

        return (
            <>
                <h1>Live Game Simulation</h1>

                <p className="text-danger">
                    If you navigate away from this page, you won't be able to
                    see these play-by-play results again because they are not
                    stored anywhere. The results of this game are already final,
                    though.
                </p>

                <div className="row">
                    <div className="col-md-9">
                        {this.state.boxScore.gid >= 0 ? (
                            <BoxScore
                                boxScore={this.state.boxScore}
                                Row={PlayerRow}
                            />
                        ) : (
                            <h1>Loading...</h1>
                        )}
                    </div>
                    <div className="col-md-3">
                        <AutoAffix viewportOffsetTop={60} container={this}>
                            <div>
                                <form>
                                    <label htmlFor="playByPlaySpeed">
                                        Play-By-Play Speed:
                                    </label>
                                    <input
                                        type="range"
                                        id="playByPlaySpeed"
                                        min="1"
                                        max="33"
                                        step="1"
                                        style={{ width: "100%" }}
                                        value={this.state.speed}
                                        onChange={this.handleSpeedChange}
                                    />
                                </form>

                                <div
                                    ref={c => {
                                        this.playByPlayDiv = c;
                                    }}
                                    style={{ height: "100%", overflow: "auto" }}
                                />
                            </div>
                        </AutoAffix>
                    </div>
                </div>
            </>
        );
    }
}

LiveGame.propTypes = {
    events: PropTypes.arrayOf(
        PropTypes.shape({
            type: PropTypes.string.isRequried,
        }),
    ),
    initialBoxScore: PropTypes.object,
};

export default LiveGame;
