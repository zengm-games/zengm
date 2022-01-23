import classNames from "classnames";
import range from "lodash-es/range";
import { useEffect, useReducer, useRef } from "react";
import {
	DraftAbbrev,
	MoreLinks,
	PlayPauseNext,
	ResponsiveTableWrapper,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker, useLocal } from "../util";
import type {
	DraftLotteryResultArray,
	View,
	DraftType,
} from "../../common/types";
import useClickable from "../hooks/useClickable";
import { getDraftLotteryProbs } from "../../common";

const draftTypeDescriptions: Record<DraftType | "dummy", string> = {
	nba2019: "Weighted lottery for the top 4 picks, like the NBA since 2019",
	nba1994: "Weighted lottery for the top 3 picks, like the NBA from 1994-2018",
	nba1990: "Weighted lottery for the top 3 picks, like the NBA from 1990-1993",
	nhl2017: "Weighted lottery for the top 3 picks, like the NHL since 2017",
	randomLotteryFirst3:
		"Random lottery for the top 3 picks, like the NBA from 1987-1989",
	randomLottery:
		"Non-playoff teams draft in random order, like the NBA from 1985-1986",
	coinFlip:
		"Coin flip to determine the top 2 picks, like the NBA from 1966-1984",
	noLottery:
		"No lottery, teams draft in order of their record, from worst to best with non-playoff teams coming first",
	noLotteryReverse:
		"No lottery, teams draft in order of their record, from best to worst with playoff teams coming first",
	random: "Teams draft in random order, including playoff teams",
	freeAgents:
		"There is no draft and all, rookies simply become free agents who can be signed by any team",
	dummy: "From historical data",
};

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
			props: Props;
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
	season,
	t,
	userTid,
	indRevealed,
	toReveal,
	probs,
}: {
	NUM_PICKS: number;
	i: number;
	season: number;
	t: DraftLotteryResultArray[number];
	userTid: number;
	indRevealed: State["indRevealed"];
	toReveal: State["toReveal"];
	probs: NonNullable<ReturnType<typeof getDraftLotteryProbs>>;
}) => {
	const { clicked, toggleClicked } = useClickable();

	const { tid, originalTid, chances, pick, won, lost, otl, tied, pts } = t;

	const pickCols = range(NUM_PICKS).map(j => {
		const prob = probs[i][j];
		const pct = prob !== undefined ? `${(prob * 100).toFixed(1)}%` : undefined;
		let highlighted = false;

		if (pick !== undefined) {
			highlighted = pick === j + 1;
		} else if (NUM_PICKS - 1 - j <= indRevealed) {
			// Has this round been revealed?
			// Is this pick revealed?
			const ind = toReveal.findIndex(ind2 => ind2 === i);

			if (ind === NUM_PICKS - 1 - j) {
				highlighted = true;
			}
		}

		return (
			<td
				className={classNames({
					"table-success": highlighted,
				})}
				key={j}
			>
				{pct}
			</td>
		);
	});
	const row = (
		<tr
			className={classNames({
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			<td
				className={classNames({
					"table-info": tid === userTid,
				})}
			>
				<DraftAbbrev tid={tid} originalTid={originalTid} season={season} />
			</td>
			<td>
				<a href={helpers.leagueUrl(["standings", season])}>
					{pts ? `${pts} pts (` : null}
					{won}-{lost}
					{otl > 0 ? <>-{otl}</> : null}
					{tied > 0 ? <>-{tied}</> : null}
					{pts ? `)` : null}
				</a>
			</td>
			<td>{chances}</td>
			{pickCols}
		</tr>
	);
	return row;
};

const Rigged = ({
	numToPick,
	result,
	rigged,
	type,
}: Pick<Props, "numToPick" | "result" | "rigged" | "type">) => {
	const teamInfoCache = useLocal(state => state.teamInfoCache);

	if (!rigged || !result || type === "projected") {
		return null;
	}

	const actualRigged = rigged.slice(0, numToPick);
	while (actualRigged.length < numToPick) {
		actualRigged.push(null);
	}

	return (
		<tr>
			<td colSpan={3} />
			{actualRigged.map((selected, i) => (
				<td key={i}>
					<select
						className="form-select form-select-sm px-1 god-mode"
						onChange={async event => {
							const value = parseInt(event.target.value);

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

	const timeoutID = useRef<number | undefined>();

	const [state, dispatch] = useReducer(reducer, {
		draftType: props.draftType,
		result: props.result,
		toReveal: [],
		indRevealed: -1,
		revealState: "init",
		season: props.season,
	});

	if (props.season !== state.season) {
		numLeftToReveal.current = 0;
		revealState.current = "init";
		dispatch({ type: "init", props: props });
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

			for (let i = 0; i < result.length; i++) {
				const pick = result[i].pick;
				if (pick !== undefined) {
					toReveal[pick - 1] = i;
				}
				result[i].pick = undefined;
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

	const { godMode, numToPick, rigged, season, type, userTid } = props;
	const { draftType, result } = state;
	const probs = getDraftLotteryProbs(result, draftType);
	const NUM_PICKS = result !== undefined ? result.length : 14;

	const showStartButton =
		type === "readyToRun" &&
		state.revealState === "init" &&
		result &&
		result.length > 0;

	const showRigButton = showStartButton && godMode && rigged === undefined;

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

	if (result && probs) {
		// Checking both is redundant, but flow wants it
		table = (
			<>
				<p />
				<ResponsiveTableWrapper nonfluid>
					<table className="table table-striped table-sm table-hover">
						<thead>
							<tr>
								<th colSpan={3} />
								<th colSpan={NUM_PICKS} className="text-center">
									Pick Probabilities
								</th>
							</tr>
							<tr>
								<th>Team</th>
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
									season={season}
									t={t}
									userTid={userTid}
									indRevealed={state.indRevealed}
									toReveal={state.toReveal}
									probs={probs}
								/>
							))}
						</tbody>
					</table>
				</ResponsiveTableWrapper>
			</>
		);
	} else {
		table = <p>No draft lottery results for {season}.</p>;
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
			{showStartButton ? (
				<button
					className="btn btn-large btn-success"
					onClick={() => startLottery()}
				>
					Start Lottery
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
					Rig Lottery
				</button>
			) : null}
			{type === "readyToRun" &&
			(state.revealState === "running" || state.revealState === "paused") ? (
				<PlayPauseNext
					onPlay={handleResume}
					onPause={handlePause}
					onNext={handleShowOne}
					paused={state.revealState === "paused"}
					titlePlay="Resume Lottery"
					titlePause="Pause Lottery"
					titleNext="Show Next Pick"
				/>
			) : null}

			{table}
		</>
	);
};

const DraftLottery = (props: Props) => {
	useTitleBar({
		title: "Draft Lottery",
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
				draftType="nba1994"
				season={props.season}
			/>

			{props.type === "projected" ? (
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
