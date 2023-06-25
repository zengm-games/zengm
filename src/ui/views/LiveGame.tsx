import classNames from "classnames";
import {
	Component,
	type ChangeEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	BoxScoreRow,
	BoxScoreWrapper,
	Confetti,
	PlayPauseNext,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, processLiveGameEvents, toWorker } from "../util";
import type { View } from "../../common/types";
import { bySport, getPeriodName, isSport } from "../../common";
import useLocalStorageState from "use-local-storage-state";
import type { SportState } from "../util/processLiveGameEvents.baseball";
import { HeadlineScore } from "../components/BoxScoreWrapper";

type PlayerRowProps = {
	exhibition?: boolean;
	forceUpdate?: boolean;
	i: number;
	liveGameInProgress?: boolean;
	p: any;
};

class PlayerRow extends Component<PlayerRowProps> {
	prevInGame: boolean | undefined;

	// Can't just switch to hooks and React.memo because p is mutated, so there is no way to access the previous value of inGame in the memo callback function
	override shouldComponentUpdate(nextProps: PlayerRowProps) {
		return bySport({
			baseball: true,
			basketball: !!(
				this.prevInGame ||
				nextProps.p.inGame ||
				nextProps.forceUpdate
			),
			football: true,
			hockey: !!(
				this.prevInGame ||
				nextProps.p.inGame ||
				nextProps.p.inPenaltyBox ||
				nextProps.forceUpdate
			),
		});
	}

	override render() {
		const { p, ...props } = this.props;

		// Needed for shouldComponentUpdate because state is mutated so we need to explicitly store the last value
		this.prevInGame = p.inGame;

		const classes = bySport({
			baseball: undefined,
			basketball: classNames({
				"table-warning": p.inGame,
			}),
			football: undefined,
			hockey: classNames({
				"table-warning": p.inGame,
				"table-danger": p.inPenaltyBox,
			}),
		});

		return <BoxScoreRow className={classes} p={p} {...props} />;
	}
}

const updatePhaseAndLeagueTopBar = () => {
	// Send to worker, rather than doing `localActions.update({ liveGameInProgress: false });`, so it works in all tabs
	toWorker("main", "uiUpdateLocal", { liveGameInProgress: false });
};

const getSeconds = (time: string | undefined) => {
	if (!time) {
		return 0;
	}

	const parts = time.split(":").map(x => parseInt(x));
	if (parts.length < 2) {
		return 0;
	}
	const [min, sec] = parts;
	return min * 60 + sec;
};

export const DEFAULT_SPORT_STATE = isSport("baseball")
	? ({
			bases: [undefined, undefined, undefined] as [
				number | undefined,
				number | undefined,
				number | undefined,
			],
			outs: 0,
			balls: 0,
			strikes: 0,
			batterPid: -1,
			pitcherPid: -1,
	  } as SportState)
	: undefined;

export const LiveGame = (props: View<"liveGame">) => {
	const [paused, setPaused] = useState(false);
	const pausedRef = useRef(paused);
	const [speed, setSpeed] = useLocalStorageState("live-game-speed", {
		defaultValue: "7",
	});
	const speedRef = useRef(parseInt(speed));
	const [playIndex, setPlayIndex] = useState(-1);
	const [started, setStarted] = useState(false);
	const [confetti, setConfetti] = useState<{
		colors?: [string, string, string];
		display: boolean;
	}>({
		display: false,
	});

	const boxScore = useRef<any>(
		props.initialBoxScore ? props.initialBoxScore : {},
	);

	const overtimes = useRef(0);
	const playByPlayDiv = useRef<HTMLDivElement | null>(null);
	const quarters = useRef([]);
	const possessionChange = useRef<boolean | undefined>();
	const componentIsMounted = useRef(false);
	const events = useRef<any[] | undefined>();
	const sportState = useRef(
		DEFAULT_SPORT_STATE ? { ...DEFAULT_SPORT_STATE } : undefined,
	);

	// Make sure to call setPlayIndex after calling this! Can't be done inside because React is not always smart enough to batch renders
	const processToNextPause = useCallback(
		(force?: boolean): number => {
			if (!componentIsMounted.current || (pausedRef.current && !force)) {
				return 0;
			}

			const startSeconds = getSeconds(boxScore.current.time);

			if (!events.current) {
				throw new Error("events.current is undefined");
			}

			// Save here since it is mutated in processLiveGameEvents
			const prevOuts = sportState.current?.outs;
			const prevPts =
				boxScore.current.teams[0].pts + boxScore.current.teams[1].pts;

			const output = processLiveGameEvents({
				boxScore: boxScore.current,
				events: events.current,
				overtimes: overtimes.current,
				quarters: quarters.current,
				sportState: sportState.current,
			});
			let text = output.text;
			const showOuts =
				isSport("baseball") && output.sportState.outs > prevOuts!;
			const currentPts =
				boxScore.current.teams[0].pts + boxScore.current.teams[1].pts;
			const showScore = isSport("baseball") && currentPts !== prevPts;

			overtimes.current = output.overtimes;
			quarters.current = output.quarters;
			possessionChange.current = output.possessionChange;
			sportState.current = output.sportState;

			if (text !== undefined) {
				if (isSport("baseball")) {
					if (showOuts) {
						let endWithPeriod = true;
						if (!text.endsWith("!") && !text.endsWith(".")) {
							text += ",";
							endWithPeriod = false;
						}

						const outs = output.sportState.outs;

						text += ` ${outs} out${outs === 1 ? "" : "s"}${
							endWithPeriod ? "." : ""
						}`;
					}

					if (showScore) {
						if (!text.endsWith("!") && !text.endsWith(".")) {
							text += ",";
						}

						const tied =
							boxScore.current.teams[0].pts === boxScore.current.teams[1].pts;
						const leader =
							boxScore.current.teams[0].pts > boxScore.current.teams[1].pts
								? 0
								: 1;
						const other = leader === 0 ? 1 : 0;

						if (tied) {
							text += " The game is tied ";
						} else {
							text += ` ${boxScore.current.teams[leader].abbrev} leads `;
						}

						text += `${boxScore.current.teams[leader].pts}-${boxScore.current.teams[other].pts}.`;
					}
				}

				const p = document.createElement("p");
				if (isSport("football") && text.startsWith("Penalty")) {
					p.innerHTML = text
						.replace("accepted", "<b>accepted</b>")
						.replace("declined", "<b>declined</b>")
						.replace("enforced", "<b>enforced</b>")
						.replace("overruled", "<b>overruled</b>")
						.replace("ABBREV0", boxScore.current.teams[1].abbrev)
						.replace("ABBREV1", boxScore.current.teams[0].abbrev);
				} else {
					const node = document.createTextNode(text);
					if (
						text === "End of game" ||
						text.startsWith("Start of") ||
						(isSport("basketball") &&
							text.startsWith("Elam Ending activated! First team to")) ||
						(isSport("hockey") &&
							(text.includes("Goal!") || text.includes("penalty"))) ||
						output.bold
					) {
						const b = document.createElement("b");
						b.appendChild(node);
						p.appendChild(b);
					} else {
						p.appendChild(node);
					}
				}

				if (playByPlayDiv.current) {
					playByPlayDiv.current.insertBefore(
						p,
						playByPlayDiv.current.firstChild,
					);
				}
			}

			if (events.current && events.current.length > 0) {
				if (!pausedRef.current) {
					setTimeout(() => {
						processToNextPause();
						setPlayIndex(prev => prev + 1);
					}, 4000 / 1.2 ** speedRef.current);
				}
			} else {
				boxScore.current.time = "0:00";
				boxScore.current.gameOver = true;
				if (boxScore.current.scoringSummary) {
					for (const event of boxScore.current.scoringSummary) {
						event.hide = false;
					}
				}

				// Update team records with result of game
				// Keep in sync with liveGame.ts
				if (!boxScore.current.exhibition) {
					for (const t of boxScore.current.teams) {
						if (boxScore.current.playoffs) {
							if (t.playoffs) {
								if (boxScore.current.won.tid === t.tid) {
									t.playoffs.won += 1;

									if (props.confetti) {
										setConfetti({
											display: true,
											colors: t.colors,
										});
									}
								} else if (boxScore.current.lost.tid === t.tid) {
									t.playoffs.lost += 1;
								}
							}
						} else {
							if (boxScore.current.won.pts === boxScore.current.lost.pts) {
								// Tied!
								if (t.tied !== undefined) {
									t.tied += 1;
								}
							} else if (boxScore.current.won.tid === t.tid) {
								t.won += 1;
							} else if (boxScore.current.lost.tid === t.tid) {
								if (boxScore.current.overtimes > 0 && props.otl) {
									t.otl += 1;
								} else {
									t.lost += 1;
								}
							}
						}
					}
				}

				updatePhaseAndLeagueTopBar();
			}

			const endSeconds = getSeconds(boxScore.current.time);

			// This is negative when rolling over to a new quarter
			const elapsedSeconds = startSeconds - endSeconds;
			return elapsedSeconds;
		},
		[props.confetti, props.otl],
	);

	useEffect(() => {
		componentIsMounted.current = true;

		const setPlayByPlayDivHeight = () => {
			if (playByPlayDiv.current) {
				// Keep in sync with .live-game-affix
				if (window.matchMedia("(min-width:768px)").matches) {
					playByPlayDiv.current.style.height = `${window.innerHeight - 113}px`;
				} else if (playByPlayDiv.current.style.height !== "") {
					playByPlayDiv.current.style.removeProperty("height");
				}
			}
		};

		// Keep height of plays list equal to window
		setPlayByPlayDivHeight();
		window.addEventListener("optimizedResize", setPlayByPlayDivHeight);

		return () => {
			componentIsMounted.current = false;
			window.removeEventListener("optimizedResize", setPlayByPlayDivHeight);
			updatePhaseAndLeagueTopBar();
		};
	}, []);

	const startLiveGame = useCallback(
		(events2: any[]) => {
			events.current = events2;
			processToNextPause();
			setPlayIndex(prev => prev + 1);
		},
		[processToNextPause],
	);

	useEffect(() => {
		if (props.events && !started) {
			boxScore.current = props.initialBoxScore;
			setStarted(true);
			startLiveGame(props.events.slice());
		}
	}, [props.events, props.initialBoxScore, started, startLiveGame]);

	const handleSpeedChange = (event: ChangeEvent<HTMLInputElement>) => {
		const speed = event.target.value;
		setSpeed(speed);
		speedRef.current = parseInt(speed);
	};

	const handlePause = useCallback(() => {
		setPaused(true);
		pausedRef.current = true;
	}, []);

	const handlePlay = useCallback(() => {
		setPaused(false);

		// Without pausedRef check, this was a race condition and could lead to incorrect post-game records (counting as 2 or more wins)
		if (pausedRef.current) {
			pausedRef.current = false;
			processToNextPause();
		}

		setPlayIndex(prev => prev + 1);
	}, [processToNextPause]);

	const handleNextPlay = useCallback(() => {
		processToNextPause(true);
		setPlayIndex(prev => prev + 1);
	}, [processToNextPause]);

	const fastForwardMenuItems = useMemo(() => {
		// Plays up to `cutoffs` seconds, or until end of quarter
		const playSeconds = (cutoff: number) => {
			let seconds = 0;
			let numPlays = 0;
			while (seconds < cutoff && !boxScore.current.gameOver) {
				const elapsedSeconds = processToNextPause(true);
				numPlays += 1;
				if (elapsedSeconds > 0) {
					seconds += elapsedSeconds;
				} else if (elapsedSeconds < 0) {
					// End of quarter, always stop
					break;
				}
			}
			setPlayIndex(prev => prev + numPlays);
		};

		const playUntilLastTwoMinutes = () => {
			// quarters.current.length can be 0 early in the game
			const initialQuarter = Math.max(1, quarters.current.length);

			const quartersToPlay =
				initialQuarter >= boxScore.current.numPeriods
					? 0
					: boxScore.current.numPeriods - initialQuarter;
			for (let i = 0; i < quartersToPlay; i++) {
				playSeconds(Infinity);
			}

			const currentSeconds = getSeconds(boxScore.current.time);
			const targetSeconds = 125; // 2 minutes plus 5 seconds, cause can't always be exact
			const secoundsToPlay = currentSeconds - targetSeconds;
			if (secoundsToPlay > 0) {
				playSeconds(secoundsToPlay);
			}
		};

		const playUntilElamEnding = () => {
			let numPlays = 0;
			while (
				boxScore.current.elamTarget === undefined &&
				!boxScore.current.gameOver
			) {
				processToNextPause(true);
				numPlays += 1;
			}
			setPlayIndex(prev => prev + numPlays);
		};

		const playUntilNextScore = () => {
			const initialPts =
				boxScore.current.teams[0].pts + boxScore.current.teams[1].pts;
			let currentPts = initialPts;
			let numPlays = 0;
			while (initialPts === currentPts && !boxScore.current.gameOver) {
				processToNextPause(true);
				currentPts =
					boxScore.current.teams[0].pts + boxScore.current.teams[1].pts;
				numPlays += 1;
			}
			setPlayIndex(prev => prev + numPlays);
		};

		const playUntilChangeOfPossession = () => {
			let numPlays = 0;

			// If currently on one, play through it
			if (possessionChange.current) {
				while (possessionChange.current && !boxScore.current.gameOver) {
					processToNextPause(true);
					numPlays += 1;
				}
			}

			// Find next one
			while (!possessionChange.current && !boxScore.current.gameOver) {
				processToNextPause(true);
				numPlays += 1;
			}

			setPlayIndex(prev => prev + numPlays);
		};

		let skipMinutes = isSport("baseball")
			? []
			: [
					{
						minutes: 1,
						key: "O",
					},
					{
						minutes: helpers.bound(
							Math.round(props.quarterLength / 4),
							1,
							Infinity,
						),
						key: "T",
					},
					{
						minutes: helpers.bound(
							Math.round(props.quarterLength / 2),
							1,
							Infinity,
						),
						key: "S",
					},
			  ];

		// Dedupe
		const skipMinutesValues = new Set();
		skipMinutes = skipMinutes.filter(({ minutes }) => {
			if (skipMinutesValues.has(minutes)) {
				return false;
			}

			skipMinutesValues.add(minutes);
			return true;
		});

		const getNumSidesSoFar = () =>
			boxScore.current.teams[0].ptsQtrs.length +
			boxScore.current.teams[1].ptsQtrs.length;

		const menuItems = [
			...skipMinutes.map(({ minutes, key }) => ({
				label: `${minutes} minute${minutes === 1 ? "" : "s"}`,
				key,
				onClick: () => {
					playSeconds(60 * minutes);
				},
			})),
			...(isSport("baseball")
				? [
						{
							label: "Next batter",
							key: "O",
							onClick: () => {
								let numPlays = 0;

								const initialBatter = sportState.current?.batterPid;
								while (!boxScore.current.gameOver) {
									processToNextPause(true);
									numPlays += 1;

									const currentBatter = sportState.current?.batterPid;
									if (
										currentBatter !== undefined &&
										currentBatter >= 0 &&
										initialBatter !== currentBatter
									) {
										break;
									}
								}

								setPlayIndex(prev => prev + numPlays);
							},
						},
						{
							label: "Next baserunner",
							key: "T",
							onClick: () => {
								const initialBases = sportState.current?.bases ?? [];
								const initialBaserunners = new Set(
									initialBases.filter(pid => pid !== undefined),
								);

								const initialHR =
									boxScore.current.teams[0].hr + boxScore.current.teams[1].hr;

								let numPlays = 0;

								while (!boxScore.current.gameOver) {
									processToNextPause(true);
									numPlays += 1;

									// Any new baserunner -> stop
									const baserunners = (sportState.current?.bases ?? []).filter(
										pid => pid !== undefined,
									);
									if (baserunners.length === 0) {
										// Handle case where it's a new inning and the same guy gets on base
										initialBaserunners.clear();
									}
									if (baserunners.some(pid => !initialBaserunners.has(pid))) {
										break;
									}

									// Home run counts as new baserunner
									const currentHR =
										boxScore.current.teams[0].hr + boxScore.current.teams[1].hr;
									if (initialHR !== currentHR) {
										break;
									}
								}

								setPlayIndex(prev => prev + numPlays);
							},
						},
						{
							label: "Side is retired",
							key: "C",
							onClick: () => {
								let numPlays = 0;

								const numSidesSoFar = getNumSidesSoFar();
								while (!boxScore.current.gameOver) {
									processToNextPause(true);
									numPlays += 1;

									if (numSidesSoFar !== getNumSidesSoFar()) {
										break;
									}
								}

								setPlayIndex(prev => prev + numPlays);
							},
						},
						{
							label: "End of inning",
							key: "Q",
							onClick: () => {
								let numPlays = 0;

								const numSidesSoFar = getNumSidesSoFar();
								while (!boxScore.current.gameOver) {
									processToNextPause(true);
									numPlays += 1;

									const newNum = getNumSidesSoFar();
									if (numSidesSoFar !== newNum && newNum % 2 === 1) {
										break;
									}
								}

								setPlayIndex(prev => prev + numPlays);
							},
						},
						{
							label: `${helpers.ordinal(boxScore.current.numPeriods)} inning`,
							key: "U",
							onClick: () => {
								let numPlays = 0;

								while (
									getNumSidesSoFar() <= (boxScore.current.numPeriods - 1) * 2 &&
									!boxScore.current.gameOver
								) {
									processToNextPause(true);
									numPlays += 1;
								}

								setPlayIndex(prev => prev + numPlays);
							},
						},
				  ]
				: [
						{
							label: `End of ${
								boxScore.current.elamTarget !== undefined
									? "game"
									: boxScore.current.overtime
									? "period"
									: getPeriodName(boxScore.current.numPeriods)
							}`,
							key: "Q",
							onClick: () => {
								playSeconds(Infinity);
							},
						},
				  ]),
		];

		if (!boxScore.current.elam && !isSport("baseball")) {
			menuItems.push({
				label: "Last 2 minutes",
				key: "U",
				onClick: () => {
					playUntilLastTwoMinutes();
				},
			});
		}

		if (
			bySport({
				baseball: false,
				basketball: false,
				football: true,
				hockey: false,
			})
		) {
			menuItems.push({
				label: "Change of possession",
				key: "C",
				onClick: () => {
					playUntilChangeOfPossession();
				},
			});
		}

		if (
			bySport({
				baseball: true,
				basketball: false,
				football: true,
				hockey: true,
			})
		) {
			menuItems.push({
				label: `Next ${bySport({
					hockey: "goal",
					default: "score",
				})}`,
				key: "G",
				onClick: () => {
					playUntilNextScore();
				},
			});
		}

		if (
			boxScore.current.elam &&
			!boxScore.current.elamOvertime &&
			boxScore.current.elamTarget === undefined
		) {
			menuItems.push({
				label: "Elam Ending",
				key: "U",
				onClick: () => {
					playUntilElamEnding();
				},
			});
		}

		return menuItems;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		boxScore.current.elam,
		boxScore.current.elamTarget,
		boxScore.current.overtime,
		processToNextPause,
	]);

	const scrollTop = useRef<HTMLDivElement>(null);

	// Needs to return actual div, not fragment, for AutoAffix!!!
	return (
		<div>
			{confetti.display ? <Confetti colors={confetti.colors} /> : null}

			<p className="text-danger">
				{boxScore.current.exhibition
					? "If you navigate away from this page, you won't be able to see this box score again because it is not stored anywhere."
					: "If you navigate away from this page, you won't be able to see these play-by-play results again because they are not stored anywhere. The results of this game are already final, though."}
			</p>

			{boxScore.current.gid >= 0 ? (
				<div className="live-game-affix-mobile mb-3 d-md-none">
					<div className="bg-white pt-2">
						<HeadlineScore boxScore={boxScore.current} small />
						<div className="d-flex align-items-center">
							<PlayPauseNext
								className="me-2"
								disabled={boxScore.current.gameOver}
								fastForwardAlignRight
								fastForwards={fastForwardMenuItems}
								onPlay={handlePlay}
								onPause={handlePause}
								onNext={handleNextPlay}
								paused={paused}
								titlePlay="Resume Simulation"
								titlePause="Pause Simulation"
								titleNext="Show Next Play"
								// Since we have two PlayPauseNexts rendered, ignore shortcuts on one
								ignoreKeyboardShortcuts
							/>
							<input
								type="range"
								className="form-range flex-grow-1"
								disabled={boxScore.current.gameOver}
								min="1"
								max="33"
								step="1"
								value={speed}
								onChange={handleSpeedChange}
								title="Speed"
							/>
						</div>
					</div>
					<div className="d-flex">
						<div className="ms-auto btn-group">
							<button
								className="btn btn-light-bordered"
								onClick={() => {
									scrollTop.current?.scrollIntoView();
								}}
							>
								Top
							</button>
							{!isSport("football") ? (
								<>
									<button
										className="btn btn-light-bordered"
										onClick={() => {
											document
												.getElementById("scroll-team-1")
												?.scrollIntoView();
										}}
									>
										{boxScore.current.teams[0].abbrev}
									</button>
									<button
										className="btn btn-light-bordered"
										onClick={() => {
											document
												.getElementById("scroll-team-2")
												?.scrollIntoView();
										}}
									>
										{boxScore.current.teams[1].abbrev}
									</button>
								</>
							) : null}
							<button
								className="btn btn-light-bordered"
								onClick={() => {
									playByPlayDiv.current?.scrollIntoView();
								}}
							>
								Plays
							</button>
						</div>
					</div>
				</div>
			) : null}

			<div
				className="row"
				ref={scrollTop}
				style={{
					scrollMarginTop: 174,
				}}
			>
				<div className="col-md-9">
					{boxScore.current.gid >= 0 ? (
						<BoxScoreWrapper
							boxScore={boxScore.current}
							Row={PlayerRow}
							playIndex={playIndex}
							sportState={sportState.current}
						/>
					) : (
						<h2>Loading...</h2>
					)}
				</div>
				<div className="col-md-3">
					<div className="live-game-affix">
						<div className="d-none d-md-flex align-items-center mb-3">
							<PlayPauseNext
								className="me-2"
								disabled={boxScore.current.gameOver}
								fastForwardAlignRight
								fastForwards={fastForwardMenuItems}
								onPlay={handlePlay}
								onPause={handlePause}
								onNext={handleNextPlay}
								paused={paused}
								titlePlay="Resume Simulation"
								titlePause="Pause Simulation"
								titleNext="Show Next Play"
							/>
							<input
								type="range"
								className="form-range flex-grow-1"
								disabled={boxScore.current.gameOver}
								min="1"
								max="33"
								step="1"
								value={speed}
								onChange={handleSpeedChange}
								title="Speed"
							/>
						</div>
						<div
							className="live-game-playbyplay"
							ref={c => {
								playByPlayDiv.current = c;
							}}
							style={{
								scrollMarginTop: 174,
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

const LiveGameWrapper = (props: View<"liveGame">) => {
	useTitleBar({ title: "Live Game Simulation", hideNewWindow: true });

	return <LiveGame {...props} />;
};

export default LiveGameWrapper;
