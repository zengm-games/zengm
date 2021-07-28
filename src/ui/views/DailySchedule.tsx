import PropTypes from "prop-types";
import { Fragment, useState } from "react";
import { ForceWin, MoreLinks, ScoreBox } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { toWorker, useLocalShallow } from "../util";
import classNames from "classnames";

const DailySchedule = ({
	completed,
	day,
	days,
	isToday,
	season,
	upcoming,
	userTid,
}: View<"dailySchedule">) => {
	useTitleBar({
		title: "Daily Schedule",
		dropdownView: "daily_schedule",
		dropdownFields: { seasons: season, days: day },
		dropdownCustomOptions: {
			days,
		},
	});
	console.log(days, day);

	const { gameSimInProgress, godMode } = useLocalShallow(state => ({
		gameSimInProgress: state.gameSimInProgress,
		godMode: state.godMode,
	}));

	const [forcingAll, setForcingAll] = useState(false);
	const [forceWinKey, setForceWinKey] = useState(0);

	const handleForceAll = (type: "win" | "lose" | "none") => async () => {
		setForcingAll(true);
		await toWorker("main", "setForceWinAll", tid, type);
		setForceWinKey(key => key + 1);
		setForcingAll(false);
	};

	let simToDay = null;
	if (upcoming.length > 0 && !isToday) {
		const minGid = Math.min(...upcoming.map(game => game.gid));
		simToDay = (
			<div>
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

	let forceWinButtons = null;
	if (godMode && upcoming.length > 0) {
		forceWinButtons = (
			<div
				className={classNames(
					"btn-group",
					simToDay ? "mt-3 mt-sm-0 ml-sm-3" : undefined,
				)}
			>
				<button
					className="btn btn-god-mode"
					onClick={handleForceAll("win")}
					disabled={forcingAll}
				>
					Force win all
				</button>
				<button
					className="btn btn-god-mode"
					onClick={handleForceAll("lose")}
					disabled={forcingAll}
				>
					Force lose all
				</button>
				<button
					className="btn btn-god-mode"
					onClick={handleForceAll("none")}
					disabled={forcingAll}
				>
					Reset all
				</button>
			</div>
		);
	}

	const upcomingAndCompleted = upcoming.length > 0 && completed.length > 0;

	return (
		<>
			<p>MORE LINKS</p>
			{simToDay || forceWinButtons ? (
				<div className="mb-4 d-sm-flex">
					{simToDay}
					{forceWinButtons}
				</div>
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
							const actionStuff = isToday
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
									<ForceWin className="mb-3" key={forceWinKey} game={game} />
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
	);
};

DailySchedule.propTypes = {
	abbrev: PropTypes.string.isRequired,
	completed: PropTypes.arrayOf(PropTypes.object).isRequired,
	upcoming: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DailySchedule;
