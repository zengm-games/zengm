import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { BoxScoreWrapper } from "../components";
import { overrides, setTitle } from "../util";

class PlayerRow extends React.Component {
    // Can't just switch to useMemo because p is mutated. Might be better to fix that, then switch to useMemo!
    shouldComponentUpdate(nextProps) {
        return process.env.SPORT === "basketball"
            ? this.prevInGame || nextProps.p.inGame
            : true;
    }

    render() {
        const { i, p, ...props } = this.props;

        // Needed for shouldComponentUpdate because state is mutated so we need to explicitly store the last value
        this.prevInGame = p.inGame;

        const classes =
            process.env.SPORT === "basketball"
                ? classNames({
                      separator: i === 4,
                      "table-warning": p.inGame,
                  })
                : undefined;

        return (
            <overrides.components.BoxScoreRow
                className={classes}
                i={i}
                p={p}
                {...props}
            />
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
            paused: false,
            speed: 7,
            started: !!props.events,
        };
        if (props.events) {
            this.startLiveGame(props.events.slice());
        }

        this.overtimes = 0;
        this.quarters = ["Q1"];

        this.handleSpeedChange = this.handleSpeedChange.bind(this);
        this.setPlayByPlayDivHeight = this.setPlayByPlayDivHeight.bind(this);
        this.handlePause = this.handlePause.bind(this);
        this.handlePlay = this.handlePlay.bind(this);
        this.processToNextPause = this.processToNextPause.bind(this);
    }

    componentDidMount() {
        this.componentIsMounted = true;

        // Keep height of plays list equal to window
        this.setPlayByPlayDivHeight();
        window.addEventListener("resize", this.setPlayByPlayDivHeight);
    }

    componentDidUpdate() {
        if (this.props.events && !this.state.started) {
            this.setState(
                {
                    boxScore: this.props.initialBoxScore,
                    started: true,
                },
                () => {
                    this.startLiveGame(this.props.events.slice());
                },
            );
        }
    }

    componentWillUnmount() {
        this.componentIsMounted = false;

        window.removeEventListener("resize", this.setPlayByPlayDivHeight);
    }

    setPlayByPlayDivHeight() {
        // Keep in sync with .live-game-affix
        if (window.matchMedia("(min-width:768px)").matches) {
            this.playByPlayDiv.style.height = `${window.innerHeight - 113}px`;
        } else if (this.playByPlayDiv.style.height !== "") {
            this.playByPlayDiv.style.removeProperty("height");
        }
    }

    startLiveGame(events) {
        this.events = events;
        this.processToNextPause();
    }

    processToNextPause(force) {
        if (!this.componentIsMounted || (this.state.paused && !force)) {
            return;
        }

        // eslint-disable-next-line react/no-access-state-in-setstate
        const boxScore = this.state.boxScore; // This means we're mutating state, which is a little faster, but bad

        const output = overrides.util.processLiveGameEvents({
            boxScore,
            events: this.events,
            overtimes: this.overtimes,
            quarters: this.quarters,
        });
        const text = output.text;
        this.overtimes = output.overtimes;
        this.quarters = output.quarters;

        if (text !== undefined) {
            const p = document.createElement("p");
            const node = document.createTextNode(text);
            if (text.startsWith("Start of")) {
                const b = document.createElement("b");
                b.appendChild(node);
                p.appendChild(b);
            } else {
                p.appendChild(node);
            }

            this.playByPlayDiv.insertBefore(p, this.playByPlayDiv.firstChild);
        }

        if (this.events.length > 0) {
            if (!this.state.paused) {
                setTimeout(
                    this.processToNextPause,
                    4000 / 1.2 ** this.state.speed,
                );
            }
        } else {
            boxScore.time = "0:00";
            boxScore.gameOver = true;
            if (boxScore.scoringSummary) {
                for (const event of boxScore.scoringSummary) {
                    event.hide = false;
                }
            }
        }

        this.setState({
            boxScore,
        });
    }

    handleSpeedChange(e) {
        this.setState({ speed: e.target.value });
    }

    handlePause() {
        this.setState({
            paused: true,
        });
    }

    handlePlay() {
        this.setState(
            {
                paused: false,
            },
            () => {
                this.processToNextPause();
            },
        );
    }

    render() {
        setTitle("Live Game Simulation");

        // Needs to return actual div, not fragment, for AutoAffix!!!
        return (
            <div>
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
                            <BoxScoreWrapper
                                boxScore={this.state.boxScore}
                                Row={PlayerRow}
                            />
                        ) : (
                            <h1>Loading...</h1>
                        )}
                    </div>
                    <div className="col-md-3">
                        <div className="live-game-affix">
                            {this.state.boxScore.gid >= 0 ? (
                                <div className="d-flex align-items-center mb-3">
                                    <div className="btn-group mr-2">
                                        {this.state.paused ? (
                                            <button
                                                className="btn btn-light-bordered"
                                                disabled={
                                                    this.state.boxScore.gameOver
                                                }
                                                onClick={this.handlePlay}
                                                title="Resume Simulation"
                                            >
                                                <span className="glyphicon glyphicon-play" />
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-light-bordered"
                                                disabled={
                                                    this.state.boxScore.gameOver
                                                }
                                                onClick={this.handlePause}
                                                title="Pause Simulation"
                                            >
                                                <span className="glyphicon glyphicon-pause" />
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-light-bordered"
                                            disabled={
                                                !this.state.paused ||
                                                this.state.boxScore.gameOver
                                            }
                                            onClick={() => {
                                                this.processToNextPause(true);
                                            }}
                                            title="Show Next Play"
                                        >
                                            <span className="glyphicon glyphicon-step-forward" />
                                        </button>
                                    </div>
                                    <div className="form-group flex-grow-1 mb-0">
                                        <input
                                            type="range"
                                            className="form-control-range"
                                            disabled={
                                                this.state.boxScore.gameOver
                                            }
                                            min="1"
                                            max="33"
                                            step="1"
                                            value={this.state.speed}
                                            onChange={this.handleSpeedChange}
                                            title="Speed"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            <div
                                className="live-game-playbyplay"
                                ref={c => {
                                    this.playByPlayDiv = c;
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
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
