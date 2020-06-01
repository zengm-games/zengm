import classNames from "classnames";
import PropTypes from "prop-types";
import React, { ChangeEvent } from "react";
import { BoxScoreRow, BoxScoreWrapper } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { localActions, processLiveGameEvents } from "../util";
import type { View } from "../../common/types";

type PlayerRowProps = {
	i: number;
	p: any;
};

class PlayerRow extends React.Component<PlayerRowProps> {
	prevInGame: boolean | undefined;

	// Can't just switch to useMemo because p is mutated. Might be better to fix that, then switch to useMemo!
	shouldComponentUpdate(nextProps: PlayerRowProps) {
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

		return <BoxScoreRow className={classes} i={i} p={p} {...props} />;
	}
}

// @ts-ignore
PlayerRow.propTypes = {
	i: PropTypes.number.isRequired,
	p: PropTypes.object.isRequired,
};

const updatePhaseAndLeagueTopBar = () => {
	localActions.update({
		liveGameInProgress: false,
	});
};

type LiveGameProps = View<"liveGame">;
type State = {
	boxScore: any;
	paused: boolean;
	speed: number;
	started: boolean;
};

class LiveGame extends React.Component<LiveGameProps, State> {
	componentIsMounted: boolean | undefined;
	events: any[] | undefined;
	overtimes: number;
	playByPlayDiv: HTMLDivElement | null;
	quarters: string[];

	constructor(props: LiveGameProps) {
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

	processToNextPause(force?: boolean) {
		if (!this.componentIsMounted || (this.state.paused && !force)) {
			return;
		}

		// eslint-disable-next-line react/no-access-state-in-setstate
		const boxScore = this.state.boxScore; // This means we're mutating state, which is a little faster, but bad

		if (!this.events) {
			throw new Error("this.events is undefined");
		}

		const output = processLiveGameEvents({
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
			boxScore.time = "0:00";
			boxScore.gameOver = true;
			if (boxScore.scoringSummary) {
				for (const event of boxScore.scoringSummary) {
					event.hide = false;
				}
			}

			updatePhaseAndLeagueTopBar();
		}

		this.setState({
			boxScore,
		});
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
						{this.state.boxScore.gid >= 0 ? (
							<BoxScoreWrapper boxScore={this.state.boxScore} Row={PlayerRow} />
						) : (
							<h2>Loading...</h2>
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
												disabled={this.state.boxScore.gameOver}
												onClick={this.handlePlay}
												title="Resume Simulation"
											>
												<span className="glyphicon glyphicon-play" />
											</button>
										) : (
											<button
												className="btn btn-light-bordered"
												disabled={this.state.boxScore.gameOver}
												onClick={this.handlePause}
												title="Pause Simulation"
											>
												<span className="glyphicon glyphicon-pause" />
											</button>
										)}
										<button
											className="btn btn-light-bordered"
											disabled={
												!this.state.paused || this.state.boxScore.gameOver
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
											disabled={this.state.boxScore.gameOver}
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
