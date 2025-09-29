import clsx from "clsx";
import {
	Fragment,
	useEffect,
	useReducer,
	useRef,
	useState,
	type ReactNode,
} from "react";
import {
	DraftAbbrev,
	MoreLinks,
	PlayPauseNext,
	ResponsiveTableWrapper,
} from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers, toWorker, useLocal } from "../util/index.ts";
import type {
	DraftLotteryResultArray,
	View,
	DraftType,
	DraftPickWithoutKey,
} from "../../common/types.ts";
import useClickable from "../hooks/useClickable.tsx";
import {
	draftTypeDescriptions,
	getDraftLotteryProbs,
} from "../../common/draftLottery.ts";
import useStickyXX from "../components/DataTable/useStickyXX.ts";
import { range } from "../../common/utils.ts";
import { NO_LOTTERY_DRAFT_TYPES } from "../../common/constants.ts";

type Props = View<"draftLottery">;
type State = {
	draftType: Props["draftType"];
	result: Props["result"];
	season: Props["season"];
	toReveal: number[];
	// Values are indexes of props.result, starting with the 14th pick and ending with the 1st pick
	indRevealed: number;
	revealState: "init" | "running" | "paused" | "done";
};

type Action =
	| {
			type: "init";
			props: Pick<Props, "result" | "season" | "draftType">;
	  }
	| {
			type: "startClicked";
	  }
	| {
			type: "start";
			draftType: DraftType;
			result: DraftLotteryResultArray;
			toReveal: number[];
			indRevealed: number;
	  }
	| {
			type: "pause";
	  }
	| {
			type: "resume";
	  }
	| {
			type: "revealOne";
	  };

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "init":
			return {
				draftType: action.props.draftType,
				result: action.props.result,
				toReveal: [],
				indRevealed: -1,
				revealState: "init",
				season: action.props.season,
			};
		case "startClicked":
			return {
				...state,
				revealState: "running",
			};
		case "start":
			return {
				...state,
				draftType: action.draftType,
				result: action.result,
				toReveal: action.toReveal,
				indRevealed: action.indRevealed,
				revealState: "running",
			};
		case "pause":
			return {
				...state,
				revealState: "paused",
			};
		case "resume":
			return {
				...state,
				revealState: "running",
			};
		case "revealOne": {
			const indRevealed = state.indRevealed + 1;
			const revealState =
				indRevealed >= state.toReveal.length - 1 ? "done" : state.revealState;
			return {
				...state,
				indRevealed,
				revealState,
			};
		}
	}
};

const Row = ({
	NUM_PICKS,
	i,
	pickAlreadyMade,
	season,
	t,
	usePts,
	userTid,
	indRevealed,
	toReveal,
	probs,
	spectator,
	teams,
}: Pick<Props, "teams" | "usePts" | "userTid"> & {
	NUM_PICKS: number;
	i: number;
	pickAlreadyMade: boolean;
	season: number;
	t: DraftLotteryResultArray[number];
	indRevealed: State["indRevealed"];
	toReveal: State["toReveal"];
	probs: NonNullable<ReturnType<typeof getDraftLotteryProbs>["probs"]>;
	spectator: boolean;
}) => {
	const { clicked, toggleClicked } = useClickable();

	const { tid, originalTid, chances, pick, dpid } = t;

	const userTeam = tid === userTid;

	let revealedPickNumber = null;
	const pickCols = range(NUM_PICKS).map((j) => {
		const prob = probs[i]![j]!;
		const pct = prob !== undefined ? `${(prob * 100).toFixed(1)}%` : undefined;

		let highlighted = false;

		if (pick !== undefined) {
			highlighted = pick === j + 1;
			revealedPickNumber = pick;
		} else if (NUM_PICKS - 1 - j <= indRevealed) {
			// Has this round been revealed?
			// Is this pick revealed?
			const ind = toReveal.indexOf(i);

			if (ind === NUM_PICKS - 1 - j) {
				highlighted = true;
				revealedPickNumber = j + 1;
			}
		}

		return (
			<td
				className={clsx({
					"table-success": highlighted && !userTeam,
					"table-info": highlighted && userTeam,
				})}
				key={j}
			>
				{pct}
			</td>
		);
	});

	return (
		<tr
			className={clsx({
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			<td
				className={clsx(
					{
						"table-info": userTeam,
					},
					"text-end",
				)}
			>
				{revealedPickNumber}
			</td>
			<td
				className={clsx({
					"table-info": userTeam,
				})}
			>
				<DraftAbbrev
					t={teams[tid]?.seasonAttrs}
					tid={tid}
					originalT={teams[originalTid]?.seasonAttrs}
					originalTid={originalTid}
					season={season}
					showLogos
				/>
			</td>
			<td className={spectator ? "p-0" : undefined}>
				{userTeam || spectator || pickAlreadyMade ? null : (
					<button
						className="btn btn-xs btn-light-bordered"
						onClick={async () => {
							await toWorker("actions", "tradeFor", {
								dpid,
								tid,
							});
						}}
					>
						Trade
					</button>
				)}
			</td>
			<td>
				{usePts ? `${teams[originalTid]?.seasonAttrs.pts ?? 0} pts (` : null}
				{helpers.formatRecord(
					teams[originalTid]?.seasonAttrs ?? {
						won: 0,
						lost: 0,
					},
				)}
				{usePts ? `)` : null}
			</td>
			<td>{chances}</td>
			{pickCols}
		</tr>
	);
};

const RowNonLottery = ({
	dp,
	pickAlreadyMade,
	spectator,
	teams,
	usePts,
	userTid,
}: Pick<Props, "teams" | "usePts" | "userTid"> & {
	dp: DraftPickWithoutKey;
	pickAlreadyMade: boolean;
	spectator: boolean;
}) => {
	const { clicked, toggleClicked } = useClickable();

	const userTeam = dp.tid === userTid;
	const season = dp.season as number;

	const t = teams[dp.tid];

	return (
		<tr
			className={clsx({
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			<td
				className={clsx(
					{
						"table-info": userTeam,
					},
					"text-end",
				)}
			>
				{dp.pick}
			</td>
			<td
				className={clsx({
					"table-info": userTeam,
				})}
			>
				<DraftAbbrev
					t={t?.seasonAttrs}
					tid={dp.tid}
					originalT={teams[dp.originalTid]?.seasonAttrs}
					originalTid={dp.originalTid}
					season={season}
					showLogos
				/>
			</td>
			<td className={spectator ? "p-0" : undefined}>
				{userTeam || spectator || pickAlreadyMade ? null : (
					<button
						className="btn btn-xs btn-light-bordered"
						onClick={async () => {
							await toWorker("actions", "tradeFor", {
								dpid: dp.dpid,
								tid: dp.tid,
							});
						}}
					>
						Trade
					</button>
				)}
			</td>
			<td>
				{usePts ? `${t?.seasonAttrs.pts ?? 0} pts (` : null}
				{helpers.formatRecord(
					t?.seasonAttrs ?? {
						won: 0,
						lost: 0,
					},
				)}
				{usePts ? `)` : null}
			</td>
		</tr>
	);
};

const Rigged = ({
	numToPick,
	result,
	rigged,
	type,
}: Pick<Props, "numToPick" | "result" | "rigged" | "type">) => {
	const teamInfoCache = useLocal((state) => state.teamInfoCache);

	if (!rigged || !result || type === "projected") {
		return null;
	}

	const actualRigged = rigged.slice(0, numToPick);
	while (actualRigged.length < numToPick) {
		actualRigged.push(null);
	}

	return (
		<tr>
			<th />
			<th />
			<th />
			<th />
			<th />
			{actualRigged.map((selected, i) => (
				<td key={i}>
					<select
						className="form-select form-select-sm px-1 god-mode"
						onChange={async (event) => {
							const value = Number.parseInt(event.target.value);

							// Unset any other selection of this team
							if (value !== -1) {
								for (let j = 0; j < actualRigged.length; j++) {
									if (actualRigged[j] === value) {
										actualRigged[j] = null;
									}
								}
							}

							actualRigged[i] = value === -1 ? null : value;

							await toWorker("main", "updateGameAttributes", {
								riggedLottery: actualRigged,
							});
						}}
						style={{ minWidth: 50 }}
						value={selected === null ? "-1" : String(selected)}
						disabled={type === "completed"}
					>
						<option value="-1">???</option>
						{result.map(({ dpid, tid, originalTid }) => {
							const abbrev = teamInfoCache[tid]?.abbrev;
							const originalAbbrev = teamInfoCache[originalTid]?.abbrev;
							return (
								<option key={dpid} value={dpid}>
									{abbrev === originalAbbrev
										? abbrev
										: `${abbrev} (from ${originalAbbrev})`}
								</option>
							);
						})}
					</select>
				</td>
			))}
			<td colSpan={result.length - actualRigged.length} />
		</tr>
	);
};

const NonLotteryHeader = ({ children }: { children: ReactNode }) => {
	return (
		<tr>
			<th colSpan={4} className="text-center table-secondary">
				{children}
			</th>
		</tr>
	);
};

const DraftLotteryTable = (props: Props) => {
	const isMounted = useRef(true);
	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	// This is redundant with state because of https://github.com/facebook/react/issues/14010
	const numLeftToReveal = useRef(0); // Like indRevealed
	const revealState = useRef<State["revealState"]>("init");

	const timeoutID = useRef<number | undefined>(undefined);

	const [state, dispatch] = useReducer(reducer, {
		draftType: props.draftType,
		result: props.result,
		toReveal: [],
		indRevealed: -1,
		revealState: "init",
		season: props.season,
	});

	// Handle changing season, and updating state.result due to game sim
	if (
		props.season !== state.season ||
		props.draftType !== state.draftType ||
		(revealState.current === "init" && props.result !== state.result)
	) {
		numLeftToReveal.current = 0;
		revealState.current = "init";
		dispatch({ type: "init", props });
	}

	const revealPickAuto = () => {
		if (
			!isMounted.current ||
			numLeftToReveal.current <= 0 ||
			revealState.current !== "running"
		) {
			return;
		}

		numLeftToReveal.current -= 1;
		dispatch({ type: "revealOne" });

		if (numLeftToReveal.current >= 1) {
			timeoutID.current = window.setTimeout(revealPickAuto, 1000);
		}
	};

	const startLottery = async () => {
		dispatch({ type: "startClicked" });
		const draftLotteryResult = await toWorker(
			"main",
			"draftLottery",
			undefined,
		);
		if (draftLotteryResult) {
			const { draftType, result } = draftLotteryResult;

			const toReveal: number[] = [];

			for (const [i, row] of result.entries()) {
				const pick = row.pick;
				if (pick !== undefined) {
					toReveal[pick - 1] = i;
				}
				row.pick = undefined;
			}
			toReveal.reverse();

			revealState.current = "running";
			numLeftToReveal.current = toReveal.length;
			dispatch({ type: "start", draftType, result, toReveal, indRevealed: -1 });

			revealPickAuto();
		}
	};

	const handleResume = () => {
		revealState.current = "running";
		dispatch({ type: "resume" });

		revealPickAuto();
	};

	const handlePause = () => {
		clearTimeout(timeoutID.current);
		timeoutID.current = undefined;
		revealState.current = "paused";
		dispatch({ type: "pause" });
	};

	const handleShowOne = () => {
		numLeftToReveal.current -= 1;
		dispatch({ type: "revealOne" });
	};

	const {
		dpidsAvailableToTrade,
		draftPicks,
		godMode,
		numToPick,
		rigged,
		season,
		teams,
		type,
		usePts,
		userTid,
	} = props;
	const { draftType, result } = state;
	const { tooSlow, probs } = getDraftLotteryProbs(result, draftType, numToPick);
	const NUM_PICKS = result !== undefined ? result.length : 14;

	const [showAll, setShowAll] = useState(false);

	const showStartButton =
		type === "readyToRun" &&
		state.revealState === "init" &&
		result &&
		result.length > 0;

	const showRigButton = showStartButton && godMode && rigged === undefined;

	const { stickyClass, tableRef } = useStickyXX(2, false);

	let table;

	if (props.notEnoughTeams) {
		return (
			<div className="alert alert-danger d-inline-block">
				<p>
					<b>Error:</b> Not enough teams for your selected lottery type, so
					there will be no draft lottery.
				</p>
				{props.challengeWarning ? (
					<p>
						This is probably because you're using the "no draft picks" challenge
						mode and controlling many teams in multi team mode, so not enough
						teams are eligible for the draft lottery.
					</p>
				) : null}
			</div>
		);
	}

	let seenRound = 1;
	const otherDraftPicksToShow = draftPicks?.filter(
		(dp) => showAll || dp.round === 1,
	);

	const otherDraftPickRows =
		otherDraftPicksToShow && otherDraftPicksToShow.length > 0 ? (
			<>
				{otherDraftPicksToShow.some((dp) => dp.round === 1) ? (
					<NonLotteryHeader>Non-lottery picks</NonLotteryHeader>
				) : null}
				{otherDraftPicksToShow.map((dp, i) => {
					const showRoundHeader = seenRound !== dp.round;
					if (showRoundHeader) {
						seenRound = dp.round;
					}

					return (
						<Fragment key={i}>
							{showRoundHeader ? (
								<NonLotteryHeader>
									{helpers.ordinal(dp.round)} round
								</NonLotteryHeader>
							) : null}
							<RowNonLottery
								dp={dp}
								pickAlreadyMade={!dpidsAvailableToTrade.has(dp.dpid)}
								spectator={props.spectator}
								teams={teams}
								usePts={usePts}
								userTid={userTid}
							/>
						</Fragment>
					);
				})}
			</>
		) : null;

	// Checking both is redundant, but TypeScript wants it
	if (result && probs) {
		table = (
			<ResponsiveTableWrapper nonfluid className="mb-0">
				<table
					className={clsx(
						"table table-striped table-borderless table-sm table-hover",
						stickyClass,
					)}
					ref={tableRef}
				>
					<thead>
						<tr>
							<th />
							<th />
							<th className={props.spectator ? "p-0" : undefined} />
							<th />
							<th />
							<th colSpan={NUM_PICKS} className="text-center">
								Pick Probabilities
							</th>
						</tr>
						<tr>
							<th title="Pick number">#</th>
							<th>Team</th>
							<th className={props.spectator ? "p-0" : undefined} />
							<th>Record</th>
							<th>Chances</th>
							{result.map((row, i) => (
								<th key={i}>{helpers.ordinal(i + 1)}</th>
							))}
						</tr>
						<Rigged
							numToPick={numToPick}
							rigged={rigged}
							result={props.result}
							type={props.type}
						/>
					</thead>
					<tbody>
						{result.map((t, i) => (
							<Row
								key={i}
								NUM_PICKS={NUM_PICKS}
								i={i}
								pickAlreadyMade={!dpidsAvailableToTrade.has(t.dpid)}
								season={season}
								t={t}
								userTid={userTid}
								indRevealed={state.indRevealed}
								toReveal={state.toReveal}
								probs={probs}
								spectator={props.spectator}
								teams={teams}
								usePts={usePts}
							/>
						))}
						{otherDraftPickRows}
					</tbody>
				</table>
			</ResponsiveTableWrapper>
		);
	} else if (otherDraftPickRows) {
		table = (
			<ResponsiveTableWrapper nonfluid className="mb-0">
				<table
					className={clsx(
						"table table-striped table-borderless table-sm table-hover",
					)}
				>
					<thead>
						<tr>
							<th title="Pick number">#</th>
							<th>Team</th>
							<th className={props.spectator ? "p-0" : undefined} />
							<th>Record</th>
						</tr>
					</thead>
					<tbody>{otherDraftPickRows}</tbody>
				</table>
			</ResponsiveTableWrapper>
		);
	} else {
		table = <p className="mt-3">No draft lottery results for {season}.</p>;
	}

	return (
		<>
			<p>
				{draftType !== undefined ? (
					<>
						<b>Draft lottery type:</b> {draftTypeDescriptions[draftType]}
					</>
				) : null}
			</p>
			<div className="mb-3">
				{showStartButton ? (
					<button
						className="btn btn-large btn-success"
						onClick={() => startLottery()}
					>
						Start lottery
					</button>
				) : null}
				{showRigButton ? (
					<button
						className="btn btn-large btn-god-mode ms-2"
						onClick={async () => {
							await toWorker("main", "updateGameAttributes", {
								riggedLottery: [],
							});
						}}
					>
						Rig lottery
					</button>
				) : null}
				{type === "readyToRun" &&
				(state.revealState === "running" || state.revealState === "paused") ? (
					<PlayPauseNext
						onPlay={handleResume}
						onPause={handlePause}
						onNext={handleShowOne}
						paused={state.revealState === "paused"}
						titlePlay="Resume lottery"
						titlePause="Pause lottery"
						titleNext="Show next pick"
					/>
				) : null}
			</div>
			{tooSlow ? (
				<div className="text-warning mb-3">
					<b>Warning:</b> Computing exact odds for so many teams and picks is
					slow, so estimates are shown below. When the actual lottery occurs it
					is simulated done with complete accuracy.
				</div>
			) : null}

			{table}

			{!showAll && draftPicks?.some((dp) => dp.round > 1) ? (
				<button
					className="btn btn-secondary mt-3"
					onClick={() => {
						setShowAll(true);
					}}
				>
					Show all rounds
				</button>
			) : null}
		</>
	);
};

const DraftLottery = (props: Props) => {
	useTitleBar({
		title: NO_LOTTERY_DRAFT_TYPES.includes(props.draftType as any)
			? "Draft Order"
			: "Draft Lottery",
		jumpTo: true,
		jumpToSeason: props.season,
		dropdownView: "draft_lottery",
		dropdownFields: {
			seasons: props.season,
		},
	});

	return (
		<>
			<MoreLinks
				type="draft"
				page="draft_lottery"
				draftType={props.draftType}
				season={props.season}
			/>

			{props.type === "projected" && props.draftType !== "noLottery" ? (
				<p>
					This is what the draft lottery probabilities would be if the lottery
					was held right now.
				</p>
			) : null}

			{props.showExpansionTeamMessage ? (
				<p>
					New expansion teams are treated as if they won half their games but
					missed the playoffs.
				</p>
			) : null}

			<DraftLotteryTable {...props} />
		</>
	);
};

export default DraftLottery;
