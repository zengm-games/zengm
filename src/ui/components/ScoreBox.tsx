import classNames from "classnames";
import React from "react";
import { helpers, useLocalShallow } from "../util";

const roundHalf = (x: number) => {
	return Math.round(x * 2) / 2;
};

// pts is undefined for upcoming games. Others are undefined only for legacy objects
type Team = {
	ovr?: number;
	pts?: number;
	tid: number;
	won?: number;
	lost?: number;
	tied?: number;
	playoffs?: {
		seed: number;
		won: number;
		lost: number;
	};
};

const getRecord = (t: Team) => {
	if (t.playoffs) {
		return ` ${t.playoffs.won}`;
	}

	if (t.won === undefined || t.lost === undefined) {
		return "";
	}
	if (t.tied === undefined || t.tied === 0) {
		return ` ${t.won}-${t.lost}`;
	}
	return ` ${t.won}-${t.lost}-${t.tied}`;
};

const smallStyle = {
	display: "inline-block",
};

const ScoreBox = ({
	actionDisabled,
	actionHighlight,
	actionOnClick,
	actionText,
	className,
	game,
	header,
	limitWidthToParent,
	small,
}: {
	actionDisabled?: boolean;
	actionHighlight?: boolean;
	actionOnClick?: () => void;
	actionText?: React.ReactNode;
	className?: string;
	game: {
		forceWin?: number;
		gid: number;
		overtimes?: number;
		season?: number;
		teams: [Team, Team];
	};
	limitWidthToParent?: boolean;
	header?: boolean;
	small?: boolean;
}) => {
	const {
		challengeNoRatings,
		homeCourtAdvantage,
		season,
		teamInfoCache,
		userTid,
	} = useLocalShallow(state => ({
		challengeNoRatings: state.challengeNoRatings,
		homeCourtAdvantage: state.homeCourtAdvantage,
		season: state.season,
		teamInfoCache: state.teamInfoCache,
		userTid: state.userTid,
	}));

	let winner: -1 | 0 | 1 | undefined;
	if (game.teams[0].pts !== undefined && game.teams[1].pts !== undefined) {
		if (game.teams[0].pts > game.teams[1].pts) {
			winner = 0;
		} else if (game.teams[1].pts > game.teams[0].pts) {
			winner = 1;
		} else if (
			typeof game.teams[1].pts === "number" &&
			game.teams[1].pts === game.teams[0].pts
		) {
			winner = -1;
		}
	}

	const final = winner !== undefined;

	const hasOvrs =
		!small &&
		!challengeNoRatings &&
		game.teams[0].ovr !== undefined &&
		game.teams[1].ovr !== undefined;

	const userInGame =
		userTid === game.teams[0].tid || userTid === game.teams[1].tid;

	let spreads: [string | undefined, string | undefined] | undefined;
	if (
		game.teams[0].ovr !== undefined &&
		game.teams[1].ovr !== undefined &&
		(!small || !final)
	) {
		let spread;

		if (process.env.SPORT === "basketball") {
			// From @nicidob https://github.com/nicidob/bbgm/blob/master/team_win_testing.ipynb
			// Default homeCourtAdvantage is 1
			spread = roundHalf(
				(2 / 5) * (game.teams[0].ovr - game.teams[1].ovr) +
					3.3504 * homeCourtAdvantage,
			);
		} else {
			// Just assume similar would work for football
			spread = roundHalf(
				(3 / 10) * (game.teams[0].ovr - game.teams[1].ovr) +
					3 * homeCourtAdvantage,
			);
		}
		if (spread > 0) {
			spreads = [
				(-spread).toLocaleString("en-US", {
					maximumFractionDigits: 1,
				}),
				undefined,
			];
		} else if (spread < 0) {
			spreads = [
				undefined,
				spread.toLocaleString("en-US", {
					maximumFractionDigits: 1,
				}),
			];
		} else {
			spreads = [undefined, "PK"];
		}
	}

	let overtimes;
	if (game.overtimes !== undefined && game.overtimes > 0) {
		if (game.overtimes === 1) {
			overtimes = "OT";
		} else if (game.overtimes > 1) {
			overtimes = `${game.overtimes}OT`;
		}
	}

	const gameSeason = game.season === undefined ? season : game.season;

	const allStarGame = game.teams[0].tid === -1 && game.teams[1].tid === -2;
	const tradeDeadline = game.teams[0].tid === -3 && game.teams[1].tid === -3;

	const scoreBox = (
		<div
			className={classNames(
				"flex-grow-1 score-box",
				limitWidthToParent ? "position-relative" : undefined,
			)}
			style={small ? smallStyle : undefined}
		>
			{header ? (
				<div className="d-flex justify-content-end score-box-header text-muted">
					{hasOvrs ? (
						<div className="p-1" title="Team Overall Rating">
							Ovr
						</div>
					) : null}
					{spreads ? (
						<div
							className={classNames(
								"text-right p-1",
								small ? "score-box-score" : "score-box-spread",
							)}
							title="Predicted Point Spread"
						>
							Spread
						</div>
					) : null}
					{final ? (
						<div className="score-box-score text-right p-1" title="Final Score">
							Score
						</div>
					) : null}
				</div>
			) : null}
			<div
				className={classNames(
					"border-light",
					actionText ? "border-right-0" : undefined,
					limitWidthToParent ? "position-absolute w-100" : undefined,
				)}
			>
				{tradeDeadline ? (
					<div className="score-box-deadline p-1 d-flex align-items-center">
						Trade deadline
					</div>
				) : allStarGame && !final ? (
					[1, 2].map(i => (
						<div className="d-flex align-items-center" key={i}>
							<div className="score-box-logo" />
							<div className={classNames("p-1", { "pr-5": small })}>
								<a href={helpers.leagueUrl(["all_star_draft"])}>
									{small ? `AS${i}` : `All-Star Team ${i}`}
								</a>
							</div>
						</div>
					))
				) : (
					[1, 0].map(i => {
						const t = game.teams[i];
						let scoreClass;
						let scoreClassForceWin;
						if (winner !== undefined) {
							if (winner === i) {
								if (userInGame) {
									if (t.tid === userTid) {
										scoreClass = "alert-success";
									} else {
										scoreClass = "alert-danger";
									}
								} else {
									scoreClass = "alert-secondary";
								}

								if (game.forceWin !== undefined) {
									scoreClassForceWin = "alert-god-mode";
								}
							} else if (winner === -1 && userInGame && t.tid === userTid) {
								// Tie
								scoreClass = "alert-warning";
							}
						}
						if (!scoreClassForceWin) {
							scoreClassForceWin = scoreClass;
						}

						let imgURL;
						let teamName;
						let rosterURL;
						if (allStarGame) {
							imgURL = undefined;
							teamName = small
								? `AS${i === 0 ? 2 : 1}`
								: `All-Star Team ${i === 0 ? 2 : 1}`;
							rosterURL = helpers.leagueUrl(["all_star_history"]);
						} else {
							imgURL = teamInfoCache[t.tid]?.imgURL;
							teamName = small
								? teamInfoCache[t.tid]?.abbrev
								: `${teamInfoCache[t.tid]?.region} ${
										teamInfoCache[t.tid]?.name
								  }`;
							rosterURL = helpers.leagueUrl([
								"roster",
								`${teamInfoCache[t.tid]?.abbrev}_${t.tid}`,
							]);
						}

						return (
							<div
								key={i}
								className={classNames(
									"d-flex align-items-center",
									scoreClassForceWin,
								)}
							>
								{imgURL || allStarGame ? (
									<div className="score-box-logo d-flex align-items-center justify-content-center">
										{imgURL ? (
											<img className="mw-100 mh-100" src={imgURL} alt="" />
										) : null}
									</div>
								) : null}
								<div className="flex-grow-1 p-1 text-truncate">
									{t.playoffs ? (
										<span className="text-dark">{t.playoffs.seed}. </span>
									) : null}
									<a href={rosterURL}>{teamName}</a>
									{!small ? getRecord(t) : null}
								</div>
								{hasOvrs ? <div className="p-1 text-right">{t.ovr}</div> : null}
								{spreads ? (
									<div
										className={classNames(
											"text-right p-1 pr-2",
											small ? "score-box-score" : "score-box-spread",
										)}
									>
										{spreads[i]}
									</div>
								) : null}
								{final ? (
									<div
										className={classNames(
											"score-box-score p-1 text-right font-weight-bold",
											scoreClass,
										)}
									>
										<a
											href={helpers.leagueUrl([
												"game_log",
												allStarGame
													? "special"
													: `${teamInfoCache[t.tid]?.abbrev}_${t.tid}`,
												gameSeason,
												game.gid,
											])}
										>
											{t.pts}
										</a>
									</div>
								) : null}
							</div>
						);
					})
				)}
			</div>
			{!small && overtimes ? (
				<div className="d-flex justify-content-end text-muted">
					<div className="text-right text-muted p-1">{overtimes}</div>
				</div>
			) : null}
		</div>
	);

	if (actionText) {
		return (
			<div className={classNames("d-flex", className)}>
				{scoreBox}
				<button
					className={classNames(
						"btn score-box-action",
						actionHighlight ? "btn-success" : "btn-secondary",
					)}
					disabled={actionDisabled}
					onClick={actionOnClick}
				>
					{actionText}
				</button>
			</div>
		);
	}

	return <div className={className}>{scoreBox}</div>;
};

export default ScoreBox;
