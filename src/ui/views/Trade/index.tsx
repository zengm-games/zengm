import { useState, useRef, useEffect, useCallback } from "react";
import { PHASE } from "../../../common/index.ts";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers, toWorker, useLocal } from "../../util/index.ts";
import AssetList from "./AssetList.tsx";
import Buttons from "./Buttons.tsx";
import type { TradeClearType } from "./Buttons.tsx";
import Summary from "./Summary.tsx";
import type { TradeTeams, View } from "../../../common/types.ts";
import clsx from "clsx";
import { SaveTrade } from "../../components/index.tsx";

export type HandleToggle = (
	userOrOther: "other" | "user",
	playerOrPick: "pick" | "player",
	includeOrExclude: "include" | "exclude",
	id: number,
) => Promise<void>;

const Trade = (props: View<"trade">) => {
	const [state, setState] = useState({
		accepted: false,
		asking: false,
		forceTrade: false,
		message: null as string | null,
		prevTeams: undefined as TradeTeams | undefined,
	});

	const handleChangeAsset: HandleToggle = async (
		userOrOther: "other" | "user",
		playerOrPick: "pick" | "player",
		includeOrExclude: "include" | "exclude",
		id: number,
	) => {
		setState((prevState) => ({
			...prevState,
			accepted: false,
			message: null,
			prevTeams: undefined,
		}));
		const ids = {
			"user-pids": props.userPids,
			"user-pids-excluded": props.userPidsExcluded,
			"user-dpids": props.userDpids,
			"user-dpids-excluded": props.userDpidsExcluded,
			"other-pids": props.otherPids,
			"other-pids-excluded": props.otherPidsExcluded,
			"other-dpids": props.otherDpids,
			"other-dpids-excluded": props.otherDpidsExcluded,
		};
		const idType = playerOrPick === "player" ? "pids" : "dpids";
		const excluded = includeOrExclude === "exclude" ? "-excluded" : "";
		const key = `${userOrOther}-${idType}${excluded}` as keyof typeof ids;

		if (ids[key].includes(id)) {
			ids[key] = ids[key].filter((currId) => currId !== id);
		} else {
			ids[key].push(id);
		}

		const teams = [
			{
				tid: props.userTid,
				pids: ids["user-pids"],
				pidsExcluded: ids["user-pids-excluded"],
				dpids: ids["user-dpids"],
				dpidsExcluded: ids["user-dpids-excluded"],
			},
			{
				tid: props.otherTid,
				pids: ids["other-pids"],
				pidsExcluded: ids["other-pids-excluded"],
				dpids: ids["other-dpids"],
				dpidsExcluded: ids["other-dpids-excluded"],
			},
		] as TradeTeams;
		await toWorker("main", "updateTrade", teams);
	};

	const handleBulk = async (
		type: "check" | "clear",
		userOrOther: "other" | "user",
		playerOrPick: "pick" | "player",
		draftRoundOnly?: number,
	) => {
		const ids = {
			"user-pids": props.userPids,
			"user-pids-excluded": props.userPidsExcluded,
			"user-dpids": props.userDpids,
			"user-dpids-excluded": props.userDpidsExcluded,
			"other-pids": props.otherPids,
			"other-pids-excluded": props.otherPidsExcluded,
			"other-dpids": props.otherDpids,
			"other-dpids-excluded": props.otherDpidsExcluded,
		};
		const idType = playerOrPick === "player" ? "pids" : "dpids";
		const key = `${userOrOther}-${idType}-excluded` as keyof typeof ids;

		if (type === "clear") {
			ids[key] = [];
		} else if (playerOrPick === "player") {
			const players = userOrOther === "other" ? otherRoster : userRoster;
			ids[key] = players.map((p) => p.pid);
		} else {
			let picks = userOrOther === "other" ? otherPicks : userPicks;
			if (draftRoundOnly !== undefined) {
				picks = picks.filter((dp) => dp.round === draftRoundOnly);
			}
			ids[key] = Array.from(
				new Set([...ids[key], ...picks.map((dp) => dp.dpid)]),
			);
		}

		const teams: TradeTeams = [
			{
				tid: props.userTid,
				pids: ids["user-pids"],
				pidsExcluded: ids["user-pids-excluded"],
				dpids: ids["user-dpids"],
				dpidsExcluded: ids["user-dpids-excluded"],
			},
			{
				tid: props.otherTid,
				pids: ids["other-pids"],
				pidsExcluded: ids["other-pids-excluded"],
				dpids: ids["other-dpids"],
				dpidsExcluded: ids["other-dpids-excluded"],
			},
		];
		await toWorker("main", "updateTrade", teams);
	};

	const handleChangeTeam = async (tid: number) => {
		setState((prevState) => ({
			...prevState,
			accepted: false,
			message: null,
			prevTeams: undefined,
		}));

		const teams: TradeTeams = [
			{
				tid: props.userTid,
				pids: props.userPids,
				pidsExcluded: props.userPidsExcluded,
				dpids: props.userDpids,
				dpidsExcluded: props.userDpidsExcluded,
			},
			{
				tid,
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		];

		await toWorker("main", "createTrade", teams);
	};

	const handleClickAsk = async () => {
		let newPrevTeams = [
			{
				tid: props.userTid,
				pids: props.userPids,
				pidsExcluded: props.userPidsExcluded,
				dpids: props.userDpids,
				dpidsExcluded: props.userDpidsExcluded,
			},
			{
				tid: props.otherTid,
				pids: props.otherPids,
				pidsExcluded: props.otherPidsExcluded,
				dpids: props.otherDpids,
				dpidsExcluded: props.otherDpidsExcluded,
			},
		] as TradeTeams | undefined;

		setState((prevState) => ({
			...prevState,
			accepted: false,
			asking: true,
			message: null,
			prevTeams: undefined,
		}));

		const { changed, message } = await toWorker(
			"main",
			"tradeCounterOffer",
			undefined,
		);

		if (!changed) {
			newPrevTeams = undefined;
		}

		setState((prevState) => ({
			...prevState,
			asking: false,
			message,
			prevTeams: newPrevTeams,
		}));
	};

	const handleClickClear = async (type: TradeClearType) => {
		setState((prevState) => ({
			...prevState,
			accepted: false,
			message: null,
			prevTeams: undefined,
		}));
		await toWorker("main", "clearTrade", type);
	};

	const handleClickForceTrade = () => {
		setState((prevState) => ({
			...prevState,
			forceTrade: !prevState.forceTrade,
		}));
	};

	const handleClickPropose = async () => {
		const output = await toWorker("main", "proposeTrade", state.forceTrade);

		if (output) {
			const [accepted, message] = output;
			setState((prevState) => ({
				...prevState,
				accepted,
				message,
				prevTeams: undefined,
			}));
		}
	};

	const {
		challengeNoRatings,
		challengeNoTrades,
		gameOver,
		otherTeamsWantToHire,
		godMode,
		lost,
		luxuryPayroll,
		luxuryTax,
		multiTeamMode,
		numDraftRounds,
		spectator,
		otherPicks,
		otherRoster,
		otherTid,
		otl,
		phase,
		salaryCap,
		salaryCapType,
		summary,
		stats,
		strategy,
		teams,
		tied,
		userPicks,
		userRoster,
		userTeamName,
		won,
		userDpids,
		userPids,
		otherDpids,
		otherPids,
		userTid,
	} = props;

	useTitleBar({
		title: "Trade",
	});

	const summaryText = useRef<HTMLDivElement>(null);
	const summaryControls = useRef<HTMLDivElement>(null);

	const userTids = useLocal((state) => state.userTids);

	const updateSummaryHeight = useCallback(() => {
		if (summaryControls.current && summaryText.current) {
			// Keep in sync with .trade-affix
			if (window.matchMedia("(min-width:768px)").matches) {
				// 60 for top navbar, 24 for spacing between asset list and trade controls
				let newHeight =
					window.innerHeight - 60 - 24 - summaryControls.current.clientHeight;

				// Multi team menu
				if (userTids.length > 1) {
					newHeight -= 40;
				}
				summaryText.current.style.maxHeight = `${newHeight}px`;
			} else if (summaryText.current.style.maxHeight !== "") {
				summaryText.current.style.removeProperty("height");
			}
		}
	}, [userTids]);

	// Run every render, in case it changes
	useEffect(() => {
		updateSummaryHeight();
	}, undefined);

	useEffect(() => {
		window.addEventListener("optimizedResize", updateSummaryHeight);
		return () => {
			window.removeEventListener("optimizedResize", updateSummaryHeight);
		};
	}, [updateSummaryHeight]);

	const noTradingAllowed =
		(phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.PLAYOFFS) ||
		phase === PHASE.FANTASY_DRAFT ||
		phase === PHASE.EXPANSION_DRAFT ||
		gameOver ||
		otherTeamsWantToHire ||
		spectator ||
		challengeNoTrades;

	const numAssets =
		summary.teams[0].picks.length +
		summary.teams[0].trade.length +
		summary.teams[1].picks.length +
		summary.teams[1].trade.length;

	const otherTeamIndex = teams.findIndex((t) => t.tid === otherTid);

	const otherTeam = teams[otherTeamIndex];
	const otherTeamName = otherTeam
		? `${otherTeam.region} ${otherTeam.name}`
		: "Other team";
	const teamNames = [otherTeamName, userTeamName] as [string, string];

	return (
		<>
			<div className="row">
				<div className="col-md-9">
					<div className="d-flex mb-2 align-items-center">
						<div className="btn-group">
							<button
								className="btn btn-light-bordered btn-xs"
								disabled={otherTeamIndex <= 0}
								onClick={() => {
									handleChangeTeam(teams[otherTeamIndex - 1]!.tid);
								}}
								title="Previous"
							>
								<span className="glyphicon glyphicon-menu-left" />
							</button>
							<button
								className="btn btn-light-bordered btn-xs"
								disabled={otherTeamIndex >= teams.length - 1}
								onClick={() => {
									handleChangeTeam(teams[otherTeamIndex + 1]!.tid);
								}}
								title="Next"
							>
								<span className="glyphicon glyphicon-menu-right" />
							</button>
						</div>
						<select
							className="float-start form-select select-team mx-2 flex-shrink-1"
							value={otherTid}
							onChange={(event) => {
								handleChangeTeam(Number.parseInt(event.currentTarget.value));
							}}
						>
							{teams.map((t) => (
								<option key={t.tid} value={t.tid}>
									{t.region} {t.name}
								</option>
							))}
						</select>
						<div className="text-nowrap me-2">
							{won}-{lost}
							{otl > 0 ? <>-{otl}</> : null}
							{tied > 0 ? <>-{tied}</> : null}, {strategy}
						</div>
						<SaveTrade
							className="ms-auto"
							tradeTeams={[
								{
									pids: userPids,
									dpids: userDpids,
									tid: userTid,
								},
								{
									pids: otherPids,
									dpids: otherDpids,
									tid: otherTid,
								},
							]}
						/>
					</div>
					<AssetList
						challengeNoRatings={challengeNoRatings}
						handleBulk={handleBulk}
						handleToggle={handleChangeAsset}
						numDraftRounds={numDraftRounds}
						picks={otherPicks}
						roster={otherRoster}
						stats={stats}
						userOrOther="other"
					/>

					<h2 className="mt-3">{userTeamName}</h2>
					<AssetList
						challengeNoRatings={challengeNoRatings}
						handleBulk={handleBulk}
						handleToggle={handleChangeAsset}
						numDraftRounds={numDraftRounds}
						picks={userPicks}
						roster={userRoster}
						stats={stats}
						userOrOther="user"
					/>
				</div>
				<div className="col-md-3">
					<div className="trade-affix">
						<Summary
							challengeNoRatings={challengeNoRatings}
							handleToggle={handleChangeAsset}
							luxuryPayroll={luxuryPayroll}
							luxuryTax={luxuryTax}
							ref={summaryText}
							salaryCap={salaryCap}
							salaryCapType={salaryCapType}
							summary={summary}
						/>

						<div ref={summaryControls}>
							{summary.warning ? (
								<div className="alert alert-danger mb-0">
									<strong>Warning!</strong> {summary.warning}
								</div>
							) : null}
							{state.message ? (
								<div
									className={clsx(
										"alert mb-0",
										state.accepted ? "alert-success" : "alert-info",
										{
											"mt-2": summary.warning,
										},
									)}
								>
									{state.message}
									{state.prevTeams ? (
										<div className="mt-1 text-end">
											<button
												className="btn btn-secondary btn-sm"
												onClick={async () => {
													if (state.prevTeams) {
														await toWorker(
															"main",
															"updateTrade",
															state.prevTeams,
														);
														setState((prevState) => ({
															...prevState,
															message: null,
															prevTeams: undefined,
														}));
													}
												}}
											>
												Undo
											</button>
										</div>
									) : null}
								</div>
							) : null}

							<div
								className={clsx({
									"trade-extra-margin-bottom": multiTeamMode,
									"mt-3": summary.warning || state.message,
								})}
							>
								{!noTradingAllowed ? (
									<div className="text-center">
										<Buttons
											asking={state.asking}
											enablePropose={summary.enablePropose}
											forceTrade={state.forceTrade}
											godMode={godMode}
											handleClickAsk={handleClickAsk}
											handleClickClear={handleClickClear}
											handleClickForceTrade={handleClickForceTrade}
											handleClickPropose={handleClickPropose}
											numAssets={numAssets}
											teamNames={teamNames}
										/>
									</div>
								) : challengeNoTrades ? (
									<p className="alert alert-danger">
										<b>Challenge Mode:</b> You're not allowed to make trades.
									</p>
								) : spectator ? (
									<p className="alert alert-danger">
										You're not allowed to make trades in spectator mode.
									</p>
								) : otherTeamsWantToHire ? (
									<p className="alert alert-danger">
										You're not allowed to make trades while you have{" "}
										<a href={helpers.leagueUrl(["new_team"])}>
											open job offers from other teams
										</a>
										.
									</p>
								) : (
									<p className="alert alert-danger">
										You're not allowed to make trades{" "}
										{phase === PHASE.AFTER_TRADE_DEADLINE
											? "after the trade deadline"
											: "now"}
										.
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Trade;
