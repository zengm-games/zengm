import classNames from "classnames";
import PropTypes from "prop-types";
import React, { ChangeEvent } from "react";
import { BoxScoreRow, BoxScoreWrapper } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { localActions, processLiveGameEvents } from "../util";
import type { View } from "../../common/types";
import { Dropdown } from "react-bootstrap";

type PlayerRowProps = {
	forceUpdate?: boolean;
	i: number;
	liveGameInProgress?: boolean;
	p: any;
};

class PlayerRow extends React.Component<PlayerRowProps> {
	prevInGame: boolean | undefined;

	// Can't just switch to useMemo because p is mutated. Might be better to fix that, then switch to useMemo!
	shouldComponentUpdate(nextProps: PlayerRowProps) {
		return process.env.SPORT === "basketball"
			? this.prevInGame || nextProps.p.inGame || nextProps.forceUpdate
			: true;
	}

	render() {
		const { p, ...props } = this.props;

		// Needed for shouldComponentUpdate because state is mutated so we need to explicitly store the last value
		this.prevInGame = p.inGame;

		const classes =
			process.env.SPORT === "basketball"
				? classNames({
						"table-warning": p.inGame,
				  })
				: undefined;

		return <BoxScoreRow className={classes} p={p} {...props} />;
	}
}

// @ts-ignore
PlayerRow.propTypes = {
	p: PropTypes.object.isRequired,
};

const updatePhaseAndLeagueTopBar = () => {
	localActions.update({
		liveGameInProgress: false,
	});
};

const getSeconds = (time: string) => {
	const [min, sec] = time.split(":").map(x => parseInt(x, 10));
	return min * 60 + sec;
};

type LiveGameProps = View<"liveGame">;
type State = {
	playIndex: number;
	paused: boolean;
	speed: number;
	started: boolean;
};

class LiveGame extends React.Component<LiveGameProps, State> {
	boxScore: any;
	componentIsMounted: boolean | undefined;
	events: any[] | undefined;
	overtimes: number;
	playByPlayDiv: HTMLDivElement | null;
	quarters: string[];

	constructor(props: LiveGameProps) {
		super(props);
		this.state = {
			playIndex: -1,
			paused: false,
			speed: 7,
			started: !!props.events,
		};
		this.boxScore = props.initialBoxScore ? props.initialBoxScore : {};
		if (props.events) {
			this.startLiveGame(props.events.slice());
		}

		this.overtimes = 0;
		this.playByPlayDiv = null;
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
		window.addEventListener("optimizedResize", this.setPlayByPlayDivHeight);
	}

	componentDidUpdate() {
		if (this.props.events && !this.state.started) {
			this.boxScore = this.props.initialBoxScore;
			this.setState(
				{
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

		window.removeEventListener("optimizedResize", this.setPlayByPlayDivHeight);

		updatePhaseAndLeagueTopBar();
	}

	setPlayByPlayDivHeight() {
		if (this.playByPlayDiv) {
			// Keep in sync with .live-game-affix
			if (window.matchMedia("(min-width:768px)").matches) {
				this.playByPlayDiv.style.height = `${window.innerHeight - 113}px`;
			} else if (this.playByPlayDiv.style.height !== "") {
				this.playByPlayDiv.style.removeProperty("height");
			}
		}
	}

	startLiveGame(events: any[]) {
		this.events = events;
		this.processToNextPause();
	}

	processToNextPause(force?: boolean): number {
		if (!this.componentIsMounted || (this.state.paused && !force)) {
			return 0;
		}

		const startSeconds = getSeconds(this.boxScore.time);

		if (!this.events) {
			throw new Error("this.events is undefined");
		}

		const output = processLiveGameEvents({
			boxScore: this.boxScore,
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
			if (text === "End of game" || text.startsWith("Start of")) {
				const b = document.createElement("b");
				b.appendChild(node);
				p.appendChild(b);
			} else {
				p.appendChild(node);
			}

			if (this.playByPlayDiv) {
				this.playByPlayDiv.insertBefore(p, this.playByPlayDiv.firstChild);
			}
		}

		if (this.events && this.events.length > 0) {
			if (!this.state.paused) {
				setTimeout(this.processToNextPause, 4000 / 1.2 ** this.state.speed);
			}
		} else {
			this.boxScore.time = "0:00";
			this.boxScore.gameOver = true;
			if (this.boxScore.scoringSummary) {
				for (const event of this.boxScore.scoringSummary) {
					event.hide = false;
				}
			}

			// Update team records with result of game
			if (!this.boxScore.playoffs) {
				for (const t of this.boxScore.teams) {
					// Keep in sync with liveGame.ts
					if (this.boxScore.won.pts === this.boxScore.lost.pts) {
						// Tied!
						if (t.tied !== undefined) {
							t.tied += 1;
						}
					} else if (this.boxScore.won.tid === t.tid) {
						t.won += 1;
					} else if (this.boxScore.lost.tid === t.tid) {
						t.lost += 1;
					}
				}
			}

			updatePhaseAndLeagueTopBar();
		}

		this.setState(state => ({
			playIndex: state.playIndex + 1,
		}));

		const endSeconds = getSeconds(this.boxScore.time);

		// This is negative when rolling over to a new quarter
		const elapsedSeconds = startSeconds - endSeconds;
		return elapsedSeconds;
	}

	// Plays up to `cutoffs` seconds, or until end of quarter
	playSeconds(cutoff: number) {
		let seconds = 0;
		while (seconds < cutoff && !this.boxScore.gameOver) {
			const elapsedSeconds = this.processToNextPause(true);
			if (elapsedSeconds > 0) {
				seconds += elapsedSeconds;
			} else if (elapsedSeconds < 0) {
				// End of quarter, always stop
				break;
			}
		}
	}

	playUntilLastTwoMinutes() {
		const quartersToPlay =
			this.quarters.length >= 4 ? 0 : 4 - this.quarters.length;
		for (let i = 0; i < quartersToPlay; i++) {
			this.playSeconds(Infinity);
		}

		const currentSeconds = getSeconds(this.boxScore.time);
		const targetSeconds = 125; // 2 minutes plus 5 seconds, cause can't always be exact
		const secoundsToPlay = currentSeconds - targetSeconds;
		if (secoundsToPlay > 0) {
			this.playSeconds(secoundsToPlay);
		}
	}

	handleSpeedChange(event: ChangeEvent<HTMLInputElement>) {
		const speed = parseInt(event.target.value, 10);
		if (!Number.isNaN(speed)) {
			this.setState({ speed });
		}
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
		// Needs to return actual div, not fragment, for AutoAffix!!!
		return (
			<div>
				<p className="text-danger">
					If you navigate away from this page, you won't be able to see these
					play-by-play results again because they are not stored anywhere. The
					results of this game are already final, though.
				</p>

				<div className="row">
					<div className="col-md-9">
						{this.boxScore.gid >= 0 ? (
							<BoxScoreWrapper
								boxScore={this.boxScore}
								injuredToBottom
								Row={PlayerRow}
								playIndex={this.state.playIndex}
							/>
						) : (
							<h2>Loading...</h2>
						)}
					</div>
					<div className="col-md-3">
						<div className="live-game-affix">
							{this.boxScore.gid >= 0 ? (
								<div className="d-flex align-items-center mb-3">
									<div className="btn-group mr-2">
										{this.state.paused ? (
											<button
												className="btn btn-light-bordered"
												disabled={this.boxScore.gameOver}
												onClick={this.handlePlay}
												title="Resume Simulation"
											>
												<span className="glyphicon glyphicon-play" />
											</button>
										) : (
											<button
												className="btn btn-light-bordered"
												disabled={this.boxScore.gameOver}
												onClick={this.handlePause}
												title="Pause Simulation"
											>
												<span className="glyphicon glyphicon-pause" />
											</button>
										)}
										<button
											className="btn btn-light-bordered"
											disabled={!this.state.paused || this.boxScore.gameOver}
											onClick={() => {
												this.processToNextPause(true);
											}}
											title="Show Next Play"
										>
											<span className="glyphicon glyphicon-step-forward" />
										</button>
										<Dropdown alignRight>
											<Dropdown.Toggle
												id="live-game-sim-more"
												className="btn-light-bordered live-game-sim-more"
												disabled={!this.state.paused || this.boxScore.gameOver}
												variant={"no-class" as any}
												title="Fast Forward"
											>
												<span className="glyphicon glyphicon-fast-forward" />
											</Dropdown.Toggle>
											<Dropdown.Menu>
												<Dropdown.Item
													onClick={() => {
														this.playSeconds(60);
													}}
												>
													1 minute
												</Dropdown.Item>
												<Dropdown.Item
													onClick={() => {
														this.playSeconds(60 * 3);
													}}
												>
													3 minutes
												</Dropdown.Item>
												<Dropdown.Item
													onClick={() => {
														this.playSeconds(60 * 6);
													}}
												>
													6 minutes
												</Dropdown.Item>
												<Dropdown.Item
													onClick={() => {
														this.playSeconds(Infinity);
													}}
												>
													End of quarter
												</Dropdown.Item>
												<Dropdown.Item
													onClick={() => {
														this.playUntilLastTwoMinutes();
													}}
												>
													Until last 2 minutes
												</Dropdown.Item>
											</Dropdown.Menu>
										</Dropdown>
									</div>
									<div className="form-group flex-grow-1 mb-0">
										<input
											type="range"
											className="form-control-range"
											disabled={this.boxScore.gameOver}
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

// @ts-ignore
LiveGame.propTypes = {
	events: PropTypes.arrayOf(
		PropTypes.shape({
			type: PropTypes.string.isRequired,
		}),
	),
	initialBoxScore: PropTypes.object,
};

const LiveGameWrapper = (props: LiveGameProps) => {
	useTitleBar({ title: "Live Game Simulation", hideNewWindow: true });

	return <LiveGame {...props} />;
};

// @ts-ignore
LiveGameWrapper.propTypes = LiveGame.propTypes;

export default LiveGameWrapper;
