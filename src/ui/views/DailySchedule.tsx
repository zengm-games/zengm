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

	return (
		<>
			<p>MORE LINKS</p>
			{simToDay || forceWinButtons ? (
				<div className="mb-3 d-sm-flex">
					{simToDay}
					{forceWinButtons}
				</div>
			) : null}
			<div className="row">
				<div className="col-sm-6">
					<h2>Upcoming Games</h2>
					<ul className="list-group">
						{upcoming.map((game, i) => {
							return (
								<Fragment key={game.gid}>
									<ScoreBox game={game} header={i === 0} />
									<ForceWin key={forceWinKey} className="mb-3" game={game} />
								</Fragment>
							);
						})}
					</ul>
				</div>
				<div className="col-sm-6">
					<h2>Completed Games</h2>
					{completed.map((game, i) => (
						<ScoreBox
							className="mb-3"
							key={game.gid}
							game={game}
							header={i === 0}
						/>
					))}
				</div>
			</div>
		</>
	);
};

DailySchedule.propTypes = {
	abbrev: PropTypes.string.isRequired,
	completed: PropTypes.arrayOf(PropTypes.object).isRequired,
	upcoming: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DailySchedule;
