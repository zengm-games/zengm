import classNames from "classnames";
import {
	Component,
	type ChangeEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
	memo,
} from "react";
import {
	BoxScoreRow,
	BoxScoreWrapper,
	Confetti,
	PlayPauseNext,
	TeamLogoInline,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, processLiveGameEvents, toWorker } from "../util";
import type { View } from "../../common/types";
import { bySport, getPeriodName, isSport } from "../../common";
import useLocalStorageState from "use-local-storage-state";
import { DEFAULT_SPORT_STATE as DEFAULT_SPORT_STATE_BASEBALL } from "../util/processLiveGameEvents.baseball";
import { DEFAULT_SPORT_STATE as DEFAULT_SPORT_STATE_FOOTBALL } from "../util/processLiveGameEvents.football";
import { HeadlineScore } from "../components/BoxScoreWrapper";

type PlayerRowProps = {
	exhibition?: boolean;
	forceUpdate?: boolean;
	i: number;
	liveGameInProgress?: boolean;
	p: any;
	season: number;
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
	if (parts.length === 0) {
		return 0;
	}
	if (parts.length === 1) {
		// Seconds only being displayed
		return parseFloat(time);
	}
	const [min, sec] = parts;
	return min * 60 + sec;
};

const DEFAULT_SPORT_STATE = bySport<any>({
	baseball: DEFAULT_SPORT_STATE_BASEBALL,
	basketball: undefined,
	football: DEFAULT_SPORT_STATE_FOOTBALL,
	hockey: undefined,
});

type PlayByPlayEntryInfo = {
	key: number;
	score: ReactNode | undefined;
	scoreDiff: number;
	scoreType: string | undefined;
	outs: number | undefined;
	t: 0 | 1 | undefined;
	text: ReactNode;
	textOnly: boolean;
	time: string;
};

const PlayByPlayEntry = memo(
	({ boxScore, entry }: { boxScore: any; entry: PlayByPlayEntryInfo }) => {
		let scoreBlock = null;
		if (entry.score) {
			if (isSport("basketball")) {
				scoreBlock = entry.score;
			} else {
				scoreBlock = (
					<>
						<span
							className={`fw-bold ${
								entry.scoreDiff >= 0 &&
								(!isSport("football") || entry.scoreType !== "Safety")
									? "text-success"
									: "text-danger"
							}`}
						>
							{bySport({
								baseball: boxScore.shootout
									? "Home run!"
									: `${entry.scoreDiff} ${helpers.plural(
											"run scores",
											entry.scoreDiff,
											"runs score",
										)}!`,
								basketball: "",
								football: boxScore.shootout
									? "It's good!"
									: `${entry.scoreType ?? "???"}!`,
								hockey: "Goal!",
							})}
						</span>{" "}
						{entry.score}
					</>
				);
			}
		}

		return (
			<div className="d-flex">
				{entry.t !== undefined ? (
					<TeamLogoInline
						alt={boxScore.teams[entry.t].abbrev}
						className={classNames("flex-shrink-0", {
							// If there is a time line, then add some margin to the top, looks better.
							// If it's just score and no time, then that's football, and no margin looks more consistent. So don't check score here.
							"mt-1": !entry.textOnly && entry.time,
						})}
						imgURL={boxScore.teams[entry.t].imgURL}
						imgURLSmall={boxScore.teams[entry.t].imgURLSmall}
						includePlaceholderIfNoLogo
						size={24}
					/>
				) : null}
				<div
					className={classNames(
						"flex-grow-1 align-self-center me-2",
						entry.textOnly ? "fw-bold" : undefined,
						entry.t !== undefined ? "ms-2" : undefined,
					)}
				>
					{!entry.textOnly ? (
						<div className="d-flex">
							{entry.time ? (
								<div className="text-body-secondary me-auto">{entry.time}</div>
							) : null}
							{isSport("basketball") ? scoreBlock : null}
						</div>
					) : null}
					{isSport("hockey") ? scoreBlock : null}
					{entry.text}
					{!isSport("basketball") && !isSport("hockey") ? (
						<div>{scoreBlock}</div>
					) : null}
					{entry.outs !== undefined ? (
						<div className="fw-bold text-danger">
							{entry.outs} {helpers.plural("out", entry.outs)}
						</div>
					) : null}
				</div>
			</div>
		);
	},
	() => true,
);

const PlayByPlay = ({
	boxScore,
	entries,
	playByPlayDivRef,
}: {
	boxScore: any;
	entries: PlayByPlayEntryInfo[];
	playByPlayDivRef: React.MutableRefObject<HTMLDivElement | null>;
}) => {
	useEffect(() => {
		const setPlayByPlayDivHeight = () => {
			if (playByPlayDivRef.current) {
				// Keep in sync with .live-game-affix
				if (window.matchMedia("(min-width:768px)").matches) {
					playByPlayDivRef.current.style.height = `${
						window.innerHeight - 113
					}px`;
				} else if (playByPlayDivRef.current.style.height !== "") {
					playByPlayDivRef.current.style.removeProperty("height");
				}
			}
		};

		// Keep height of plays list equal to window
		setPlayByPlayDivHeight();
		window.addEventListener("optimizedResize", setPlayByPlayDivHeight);

		return () => {
			window.removeEventListener("optimizedResize", setPlayByPlayDivHeight);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div
			className="live-game-playbyplay d-flex flex-column gap-3"
			ref={playByPlayDivRef}
			style={{
				scrollMarginTop: 174,
			}}
		>
			{entries.map(entry => (
				<PlayByPlayEntry key={entry.key} boxScore={boxScore} entry={entry} />
			))}
		</div>
	);
};

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

	const playByPlayEntries = useRef<PlayByPlayEntryInfo[]>([]);

	// Make sure to call setPlayIndex after calling this! Can't be done inside because React is not always smart enough to batch renders
	const processToNextPause = useCallback(
		(force?: boolean): number => {
			if (
				!componentIsMounted.current ||
				(pausedRef.current && !force) ||
				!events.current
			) {
				return 0;
			}

			const startSeconds = getSeconds(boxScore.current.time);

			const shootout = !!boxScore.current.shootout;
			const ptsKey = shootout ? "sPts" : "pts";

			// Save here since it is mutated in processLiveGameEvents
			const prevOuts = sportState.current?.outs;
			const prevPts =
				boxScore.current.teams[0][ptsKey] + boxScore.current.teams[1][ptsKey];

			const output = processLiveGameEvents({
				boxScore: boxScore.current,
				events: events.current,
				overtimes: overtimes.current,
				quarters: quarters.current,
				sportState: sportState.current,
			});
			const text = output.text;
			const currentPts =
				boxScore.current.teams[0][ptsKey] + boxScore.current.teams[1][ptsKey];
			const scoreDiff = currentPts - prevPts;

			overtimes.current = output.overtimes;
			quarters.current = output.quarters;
			possessionChange.current = output.possessionChange;
			sportState.current = output.sportState;

			if (text !== undefined) {
				let outs;
				if (isSport("baseball") && output.sportState.outs > prevOuts) {
					outs = output.sportState.outs;
				}

				// For baseball, always show logo of the batting team, since t is not always sent in output (or maybe never sent)
				const t = isSport("baseball") ? sportState.current.o : output.t;

				let score;
				let scoreType;
				if (scoreDiff !== 0) {
					// Swap team for safety
					const scoreT =
						isSport("football") &&
						sportState.current.plays.at(-1)?.scoreInfo?.type === "SF"
							? t === 0
								? 1
								: 0
							: t;

					score =
						scoreT === 0 ? (
							<>
								<b>{boxScore.current.teams[0][ptsKey]}</b>-
								<span className="text-body-secondary">
									{boxScore.current.teams[1][ptsKey]}
								</span>
							</>
						) : scoreT === 1 ? (
							<>
								<span className="text-body-secondary">
									{boxScore.current.teams[0][ptsKey]}
								</span>
								-<b>{boxScore.current.teams[1][ptsKey]}</b>
							</>
						) : undefined;

					if (isSport("football")) {
						// If no score type, then it must be a penalty overturning a score
						scoreType =
							sportState.current.plays.at(-1)?.scoreInfo?.long ??
							"Penalty overturned score";
					}
				}

				let time;
				// Baseball has no time, football it's displayed with down/distance before play. In both cases, skip showing time for individual entries.
				if (
					bySport({
						baseball: false,
						basketball: true,
						football: false,
						hockey: true,
					})
				) {
					if (shootout && t !== undefined) {
						time = `Attempt ${boxScore.current.teams[t].sAtt}`;
					} else if (
						isSport("basketball") &&
						boxScore.current.elamTarget !== undefined
					) {
						time = `Target: ${boxScore.current.elamTarget}`;
					} else {
						time = boxScore.current.time;
					}
				}

				playByPlayEntries.current.unshift({
					key: playByPlayEntries.current.length,
					score,
					scoreDiff,
					scoreType,
					outs,
					text,
					textOnly: output.textOnly,
					t,
					time,
				});
			}

			if (events.current && events.current.length > 0) {
				if (!pausedRef.current) {
					setTimeout(
						() => {
							processToNextPause();
							setPlayIndex(prev => prev + 1);
						},
						4000 / 1.2 ** speedRef.current,
					);
				}
			} else {
				boxScore.current.time = "0:00";
				boxScore.current.gameOver = true;
				boxScore.current.possession = undefined;

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
							if (
								boxScore.current.won.pts === boxScore.current.lost.pts &&
								boxScore.current.won.sPts === boxScore.current.lost.sPts
							) {
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

		return () => {
			componentIsMounted.current = false;
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

			// Stop at shootout, unless we're already in a shootout
			const initialShootout = boxScore.current.shootout;

			while (
				seconds < cutoff &&
				!boxScore.current.gameOver &&
				(initialShootout || !boxScore.current.shootout)
			) {
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
			while (
				initialPts === currentPts &&
				!boxScore.current.gameOver &&
				!boxScore.current.shootout
			) {
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

		// elamTarget check is because clock is set to Infinity in Elam ending, so we can't skip ahead minutes
		let skipMinutes =
			isSport("baseball") ||
			boxScore.current.elamTarget !== undefined ||
			boxScore.current.shootout
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
			boxScore.current.teams === undefined
				? 0
				: boxScore.current.teams[0].ptsQtrs.length +
					boxScore.current.teams[1].ptsQtrs.length;

		const menuItems = [
			...skipMinutes.map(({ minutes, key }) => ({
				label: `${minutes} ${helpers.plural("minute", minutes)}`,
				key,
				onClick: () => {
					playSeconds(60 * minutes);
				},
			})),
			...(isSport("baseball")
				? !boxScore.current.shootout
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
									const sportStateBaseball =
										sportState.current as typeof DEFAULT_SPORT_STATE_BASEBALL;
									const initialBases = sportStateBaseball.bases ?? [];
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
										const baserunners = (sportStateBaseball.bases ?? []).filter(
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
											boxScore.current.teams[0].hr +
											boxScore.current.teams[1].hr;
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
									while (
										!boxScore.current.gameOver &&
										!boxScore.current.shootout
									) {
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
									while (
										!boxScore.current.gameOver &&
										!boxScore.current.shootout
									) {
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
							...(getNumSidesSoFar() <= (boxScore.current.numPeriods - 1) * 2
								? [
										{
											label: `${helpers.ordinal(boxScore.current.numPeriods)} inning`,
											key: "U",
											onClick: () => {
												let numPlays = 0;

												while (
													getNumSidesSoFar() <=
														(boxScore.current.numPeriods - 1) * 2 &&
													!boxScore.current.gameOver
												) {
													processToNextPause(true);
													numPlays += 1;
												}

												setPlayIndex(prev => prev + numPlays);
											},
										},
									]
								: []),
						]
					: [
							{
								label: "End of shootout",
								key: "Q",
								onClick: () => {
									playSeconds(Infinity);
								},
							},
						]
				: [
						{
							label: `End of ${
								boxScore.current.elamTarget !== undefined
									? "game"
									: boxScore.current.shootout
										? "shootout"
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

		if (
			!boxScore.current.elam &&
			!boxScore.current.shootout &&
			!isSport("baseball")
		) {
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
			}) &&
			!boxScore.current.shootout
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
			}) &&
			!boxScore.current.shootout
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
		boxScore.current.shootout,
		quarters.current.length,
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
								min="1"
								max="33"
								step="1"
								value={speed}
								onChange={handleSpeedChange}
								title="Speed"
							/>
						</div>
						<PlayByPlay
							boxScore={boxScore.current}
							entries={playByPlayEntries.current}
							playByPlayDivRef={playByPlayDiv}
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
