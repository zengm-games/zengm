import { Fragment, useState } from "react";
import { ForceWin, MoreLinks, ScoreBox } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { toWorker, useLocalShallow } from "../util";
import classNames from "classnames";
import { DAILY_SCHEDULE } from "../../common";
import { NoGamesMessage } from "./GameLog";

const DailySchedule = ({
	completed,
	currentSeason,
	day,
	days,
	isToday,
	season,
	upcoming,
	userTid,
}: View<"dailySchedule">) => {
	useTitleBar({
		title: DAILY_SCHEDULE,
		dropdownView: "daily_schedule",
		dropdownFields: { seasons: season, days: day },
		dropdownCustomOptions: {
			days,
		},
	});

	const { gameSimInProgress } = useLocalShallow(state => ({
		gameSimInProgress: state.gameSimInProgress,
		godMode: state.godMode,
	}));

	let simToDay = null;
	if (upcoming.length > 0 && !isToday) {
		const minGid = Math.min(...upcoming.map(game => game.gid));
		simToDay = (
			<div className="mb-3">
				<button
					className="btn btn-secondary"
					disabled={gameSimInProgress}
					onClick={() => {
						toWorker("actions", "simToGame", minGid);
					}}
				>
					Sim to day
				</button>
			</div>
		);
	}

	const upcomingAndCompleted = upcoming.length > 0 && completed.length > 0;

	const tradeDeadline =
		upcoming.length === 1 &&
		upcoming[0].teams[0].tid === -3 &&
		upcoming[0].teams[1].tid === -3;

	let noGamesMessage;
	if (days.length === 0) {
		noGamesMessage = (
			<NoGamesMessage warnAboutDelete={season < currentSeason} />
		);
	}

	return (
		<>
			<MoreLinks type="schedule" page="daily_schedule" />

			{noGamesMessage ? (
				noGamesMessage
			) : (
				<>
					{simToDay}

					{tradeDeadline ? (
						<p>
							Sim one day to move past the trade deadline, and then the next
							day's games will be available here.
						</p>
					) : isToday ? (
						<p>
							To view a live play-by-play summary of a game, select one of
							today's games below.
						</p>
					) : null}

					{upcoming.length > 0 ? (
						<>
							<div className="row">
								<div className="col-xl-4 col-md-6 col-12">
									{/* Copy-pasted from ScoreBox, so all the rows below can remain aligned */}
									<div
										className="d-flex"
										style={{ maxWidth: 400, marginRight: isToday ? 62 : 0 }}
									>
										{upcomingAndCompleted ? <h2>Upcoming Games</h2> : null}
										<div
											className="p-1 ml-auto text-muted"
											title="Team Overall Rating"
										>
											Ovr
										</div>
										<div
											className={classNames(
												"text-right p-1 text-muted",
												"score-box-spread",
											)}
											title="Predicted Point Spread"
										>
											Spread
										</div>
									</div>
								</div>
							</div>

							<div className="row">
								{upcoming.map(game => {
									const actionStuff =
										isToday && !tradeDeadline
											? {
													actionDisabled: gameSimInProgress,
													actionHighlight:
														game.teams[0].tid === userTid ||
														game.teams[1].tid === userTid,
													actionText: (
														<>
															Watch
															<br />
															Game
														</>
													),
													actionOnClick: () =>
														toWorker("actions", "liveGame", game.gid),
													limitWidthToParent: true,
											  }
											: {};

									return (
										<div className="col-xl-4 col-md-6 col-12" key={game.gid}>
											<ScoreBox game={game} {...actionStuff} />
											<ForceWin className="mb-3" game={game} />
										</div>
									);
								})}
							</div>
						</>
					) : null}

					{completed.length > 0 ? (
						<>
							<div
								className={classNames("row", {
									"mt-3": upcomingAndCompleted,
								})}
							>
								<div className="col-xl-4 col-md-6 col-12">
									{/* Copy-pasted from ScoreBox, so all the rows below can remain aligned */}
									<div className="d-flex" style={{ maxWidth: 400 }}>
										{upcomingAndCompleted ? <h2>Completed Games</h2> : null}
										<div
											className="p-1 ml-auto text-muted"
											title="Team Overall Rating"
										>
											Ovr
										</div>
										<div
											className={classNames(
												"text-right p-1 text-muted",
												"score-box-spread",
											)}
											title="Predicted Point Spread"
										>
											Spread
										</div>
										<div
											className="score-box-score text-right text-muted p-1"
											title="Final Score"
										>
											Score
										</div>
									</div>
								</div>
							</div>

							<div className="row">
								{completed.map(game => {
									return (
										<div className="col-xl-4 col-md-6 col-12" key={game.gid}>
											<ScoreBox game={game} className="mb-3" />
										</div>
									);
								})}
							</div>
						</>
					) : null}
				</>
			)}
		</>
	);
};

export default DailySchedule;
