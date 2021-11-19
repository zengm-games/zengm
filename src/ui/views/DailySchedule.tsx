import { ForceWin, MoreLinks, ScoreBox } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { toWorker, useLocalShallow } from "../util";
import { DAILY_SCHEDULE } from "../../common";
import { NoGamesMessage } from "./GameLog";
import allowForceTie from "../../common/allowForceTie";

const DailySchedule = ({
	completed,
	currentSeason,
	day,
	days,
	elam,
	elamASG,
	isToday,
	phase,
	season,
	ties,
	topPlayers,
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
					) : null}

					{upcoming.length > 0 ? (
						<>
							{upcomingAndCompleted ? <h2>Upcoming Games</h2> : null}
							<div className="d-flex flex-wrap" style={{ gap: "1rem 2rem" }}>
								{upcoming.map(game => {
									const actions =
										isToday && !tradeDeadline
											? [
													{
														disabled: gameSimInProgress,
														highlight:
															game.teams[0].tid === userTid ||
															game.teams[1].tid === userTid,
														text: (
															<>
																Watch
																<br />
																game
															</>
														),
														onClick: () =>
															toWorker("actions", "liveGame", game.gid),
													},
													{
														disabled: gameSimInProgress,
														highlight:
															game.teams[0].tid === userTid ||
															game.teams[1].tid === userTid,
														text: (
															<>
																Sim
																<br />
																game
															</>
														),
														onClick: () =>
															toWorker("actions", "simGame", game.gid),
													},
											  ]
											: undefined;

									const allowTie = allowForceTie({
										homeTid: game.teams[0].tid,
										awayTid: game.teams[1].tid,
										elam,
										elamASG,
										phase,
										ties,
									});

									return (
										<div
											className="flex-grow-1"
											key={game.gid}
											style={{ maxWidth: 510 }}
										>
											<ScoreBox
												game={{
													// Leave out forceTie, since ScoreBox wants the value for finished games
													gid: game.gid,
													season: game.season,
													teams: game.teams,
												}}
												playersUpcoming={[
													// ?. is for All-Star Game
													topPlayers[game.teams[0].tid]?.[0],
													topPlayers[game.teams[1].tid]?.[0],
												]}
												actions={actions}
											/>
											<ForceWin allowTie={allowTie} game={game} />
										</div>
									);
								})}
							</div>
						</>
					) : null}

					{completed.length > 0 ? (
						<>
							{upcomingAndCompleted ? (
								<h2 className="mt-3">Completed Games</h2>
							) : null}

							<div className="d-flex flex-wrap" style={{ gap: "1rem 2rem" }}>
								{completed.map(game => {
									return (
										<div
											className="flex-grow-1"
											key={game.gid}
											style={{ maxWidth: 510 }}
										>
											<ScoreBox game={game} />
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
