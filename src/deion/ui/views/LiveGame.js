import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import AutoAffix from "react-overlays/lib/AutoAffix";
import { BoxScoreWrapper } from "../components";
import { overrides, setTitle } from "../util";

class PlayerRow extends React.Component {
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
                : null;

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

            const output = overrides.util.processLiveGameEvents(
                events,
                boxScore,
                overtimes,
            );
            const text = output.text;
            overtimes = output.overtimes;

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
                        <AutoAffix viewportOffsetTop={60} container={this}>
                            {/* Needs to return actual div, not fragment, for AutoAffix!!! */}
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
