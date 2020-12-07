import PropTypes from "prop-types";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { PHASE } from "../../../common";
import useTitleBar from "../../hooks/useTitleBar";
import { toWorker } from "../../util";
import AssetList from "./AssetList";
import Buttons from "./Buttons";
import Summary from "./Summary";
import type { View } from "../../../common/types";
import classNames from "classnames";

const Trade = (props: View<"trade">) => {
	const [state, setState] = useState({
		accepted: false,
		asking: false,
		forceTrade: false,
		message: null,
	});

	const handleChangeAsset = async (
		userOrOther: "other" | "user",
		playerOrPick: "pick" | "player",
		includeOrExclude: "include" | "exclude",
		id: number,
	) => {
		setState(prevState => ({ ...prevState, message: null }));
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
			ids[key] = ids[key].filter(currId => currId !== id);
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
		];
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
			ids[key] = players.map(p => p.pid);
		} else {
			let picks = userOrOther === "other" ? otherPicks : userPicks;
			if (draftRoundOnly !== undefined) {
				picks = picks.filter(dp => dp.round === draftRoundOnly);
			}
			ids[key] = Array.from(
				new Set([...ids[key], ...picks.map(dp => dp.dpid)]),
			);
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
		];
		await toWorker("main", "updateTrade", teams);
	};

	const handleChangeTeam = async (tid: number) => {
		setState(prevState => ({ ...prevState, message: null }));

		const teams = [
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
		setState(prevState => ({ ...prevState, asking: true, message: null }));
		const message = await toWorker("main", "tradeCounterOffer");
		setState(prevState => ({ ...prevState, asking: false, message }));
	};

	const handleClickClear = async () => {
		setState(prevState => ({ ...prevState, message: null }));
		await toWorker("main", "clearTrade");
	};

	const handleClickForceTrade = () => {
		setState(prevState => ({
			...prevState,
			forceTrade: !prevState.forceTrade,
		}));
	};

	const handleClickPropose = async () => {
		const [accepted, message] = await toWorker(
			"main",
			"proposeTrade",
			state.forceTrade,
		);
		setState(prevState => ({ ...prevState, accepted, message }));
	};

	const {
		challengeNoRatings,
		challengeNoTrades,
		gameOver,
		godMode,
		lost,
		multiTeamMode,
		numDraftRounds,
		spectator,
		otherPicks,
		otherRoster,
		otherTid,
		phase,
		salaryCap,
		summary,
		showResigningMsg,
		stats,
		strategy,
		teams,
		tied,
		userPicks,
		userRoster,
		userTeamName,
		won,
	} = props;

	useTitleBar({
		title: "Trade",
	});

	const summaryText = useRef<HTMLDivElement>(null);
	const summaryControls = useRef<HTMLDivElement>(null);

	const updateSummaryHeight = useCallback(() => {
		if (summaryControls.current && summaryText.current) {
			// Keep in sync with .trade-affix
			if (window.matchMedia("(min-width:768px)").matches) {
				const newHeight =
					window.innerHeight - 60 - summaryControls.current.clientHeight;
				summaryText.current.style.maxHeight = `${newHeight}px`;
			} else if (summaryText.current.style.maxHeight !== "") {
				summaryText.current.style.removeProperty("height");
			}
		}
	}, []);

	// Run every render, in case it changes
	useEffect(() => {
		updateSummaryHeight();
	});

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
		spectator ||
		challengeNoTrades;

	const numAssets =
		summary.teams[0].picks.length +
		summary.teams[0].trade.length +
		summary.teams[1].picks.length +
		summary.teams[1].trade.length;

	const otherTeamIndex = teams.findIndex(t => t.tid === otherTid);

	return (
		<>
			<div className="row">
				<div className="col-md-9">
					{showResigningMsg ? (
						<p>
							You can't trade players whose contracts expired this season, but
							their old contracts still count against team salary caps until
							they are either re-signed or become free agents.
						</p>
					) : null}

					<p>
						If a player has been signed within the past 14 days, he is not
						allowed to be traded.
					</p>

					<div className="d-flex mb-2">
						<div className="btn-group">
							<button
								className="btn btn-light-bordered btn-xs"
								disabled={otherTeamIndex <= 0}
								onClick={() => {
									handleChangeTeam(teams[otherTeamIndex - 1].tid);
								}}
								title="Previous"
							>
								<span className="glyphicon glyphicon-menu-left" />
							</button>
							<button
								className="btn btn-light-bordered btn-xs"
								disabled={otherTeamIndex >= teams.length - 1}
								onClick={() => {
									handleChangeTeam(teams[otherTeamIndex + 1].tid);
								}}
								title="Next"
							>
								<span className="glyphicon glyphicon-menu-right" />
							</button>
						</div>
						<select
							className="float-left form-control select-team mx-2"
							value={otherTid}
							onChange={event => {
								handleChangeTeam(parseInt(event.currentTarget.value));
							}}
						>
							{teams.map(t => (
								<option key={t.tid} value={t.tid}>
									{t.region} {t.name}
								</option>
							))}
						</select>
						<div
							style={{
								paddingTop: 7,
							}}
						>
							{won}-{lost}
							{tied > 0 ? <>-{tied}</> : null}, {strategy}
						</div>
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
							ref={summaryText}
							salaryCap={salaryCap}
							summary={summary}
						/>

						<div className="py-1" ref={summaryControls}>
							{summary.warning ? (
								<div className="alert alert-danger mb-0">
									<strong>Warning!</strong> {summary.warning}
								</div>
							) : null}
							{state.message ? (
								<div
									className={classNames(
										"alert mb-0",
										state.accepted ? "alert-success" : "alert-info",
										{
											"mt-2": summary.warning,
										},
									)}
								>
									{state.message}
								</div>
							) : null}

							<div
								className={classNames({
									"trade-extra-margin-bottom": multiTeamMode,
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

Trade.propTypes = {
	gameOver: PropTypes.bool.isRequired,
	godMode: PropTypes.bool.isRequired,
	lost: PropTypes.number.isRequired,
	otherDpids: PropTypes.arrayOf(PropTypes.number).isRequired,
	otherDpidsExcluded: PropTypes.arrayOf(PropTypes.number).isRequired,
	otherPicks: PropTypes.array.isRequired,
	otherPids: PropTypes.arrayOf(PropTypes.number).isRequired,
	otherPidsExcluded: PropTypes.arrayOf(PropTypes.number).isRequired,
	otherRoster: PropTypes.array.isRequired,
	otherTid: PropTypes.number.isRequired,
	phase: PropTypes.number.isRequired,
	salaryCap: PropTypes.number.isRequired,
	summary: PropTypes.object.isRequired,
	showResigningMsg: PropTypes.bool.isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	strategy: PropTypes.string.isRequired,
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			region: PropTypes.string.isRequired,
			tid: PropTypes.number.isRequired,
		}),
	).isRequired,
	tied: PropTypes.number,
	userDpids: PropTypes.arrayOf(PropTypes.number).isRequired,
	userDpidsExcluded: PropTypes.arrayOf(PropTypes.number).isRequired,
	userPicks: PropTypes.array.isRequired,
	userPids: PropTypes.arrayOf(PropTypes.number).isRequired,
	userPidsExcluded: PropTypes.arrayOf(PropTypes.number).isRequired,
	userRoster: PropTypes.array.isRequired,
	userTid: PropTypes.number.isRequired,
	userTeamName: PropTypes.string.isRequired,
	won: PropTypes.number.isRequired,
};

export default Trade;
