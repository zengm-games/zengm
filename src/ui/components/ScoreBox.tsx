import classNames from "classnames";
import { isSport } from "../../common";
import { helpers, useLocalShallow } from "../util";
import type { ReactNode } from "react";
import TeamLogoInline from "./TeamLogoInline";
import defaultGameAttributes from "../../common/defaultGameAttributes";

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
	otl?: number;
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

	let record = `${t.won}-${t.lost}`;
	if (t.tied !== undefined && t.tied > 0) {
		record += `-${t.tied}`;
	}
	if (t.otl !== undefined && t.otl > 0) {
		record += `-${t.otl}`;
	}
	return ` ${record}`;
};

const smallStyle = {
	display: "inline-block",
};

const ScoreBox = ({
	action,
	className,
	game,
	limitWidthToParent,
	small,
}: {
	action?: {
		disabled?: boolean;
		highlight?: boolean;
		onClick: () => void;
		text: ReactNode;
	};
	className?: string;
	game: {
		forceWin?: number;
		gid: number;
		overtimes?: number;
		season?: number;
		teams: [Team, Team];
	};
	limitWidthToParent?: boolean;
	small?: boolean;
}) => {
	const {
		challengeNoRatings,
		homeCourtAdvantage,
		numPeriods,
		quarterLength,
		season,
		teamInfoCache,
		userTid,
	} = useLocalShallow(state => ({
		challengeNoRatings: state.challengeNoRatings,
		homeCourtAdvantage: state.homeCourtAdvantage,
		numPeriods: state.numPeriods,
		quarterLength: state.quarterLength,
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

		if (isSport("basketball")) {
			// From @nicidob https://github.com/nicidob/bbgm/blob/master/team_win_testing.ipynb
			// Default homeCourtAdvantage is 1
			spread =
				(2 / 5) * (game.teams[0].ovr - game.teams[1].ovr) +
				3.3504 * homeCourtAdvantage;
		} else if (isSport("hockey")) {
			spread =
				(1.8 / 100) * (game.teams[0].ovr - game.teams[1].ovr) +
				0.25 * homeCourtAdvantage;
		} else {
			spread =
				(3 / 10) * (game.teams[0].ovr - game.teams[1].ovr) +
				3 * homeCourtAdvantage;
		}

		// Adjust for game length
		spread *=
			(numPeriods * quarterLength) /
			(defaultGameAttributes.numPeriods * defaultGameAttributes.quarterLength);

		spread = roundHalf(spread);

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

	const gameSeason = game.season ?? season;

	const allStarGame = game.teams[0].tid === -1 && game.teams[1].tid === -2;
	const tradeDeadline = game.teams[0].tid === -3 && game.teams[1].tid === -3;

	const scoreBox = (
		<div
			className={classNames(
				"flex-grow-1 score-box",
				limitWidthToParent ? "position-relative" : undefined,
				small ? "d-flex" : undefined,
			)}
			style={small ? smallStyle : undefined}
		>
			<div
				className={classNames(
					"border-light",
					action ? "border-right-0" : undefined,
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
								<a href={helpers.leagueUrl(["all_star", "draft"])}>
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

								if (game.forceWin !== undefined) {
									scoreClassForceWin = "alert-god-mode";
								}
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
							rosterURL = helpers.leagueUrl(["all_star", "history"]);
						} else {
							imgURL =
								teamInfoCache[t.tid]?.imgURLSmall ??
								teamInfoCache[t.tid]?.imgURL;
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

						// For @MikeHoudini on Discord
						const userTeamClass =
							t.tid === userTid && final ? "user-team" : undefined;

						return (
							<div
								key={i}
								className={classNames(
									"d-flex align-items-center",
									scoreClassForceWin,
									userTeamClass,
								)}
							>
								{imgURL || allStarGame ? (
									<TeamLogoInline
										imgURL={imgURL}
										size={small ? 24 : 36}
										style={{ marginLeft: 1 }}
									/>
								) : null}
								<div className="flex-grow-1 p-1 text-truncate">
									{t.playoffs ? (
										<span className="text-dark">{t.playoffs.seed}. </span>
									) : null}
									<a href={rosterURL}>{teamName}</a>
									{!small ? (
										<>
											<br />
											{getRecord(t)}
											{hasOvrs ? (
												<>
													, <span title="Team overall rating">{t.ovr} ovr</span>
												</>
											) : null}
											{spreads?.[i] ? (
												<>
													,{" "}
													<span title="Point spread or betting line">
														<span
															className={!final ? "text-success" : undefined}
														>
															{spreads[i]}
														</span>{" "}
														spread
													</span>
												</>
											) : null}
										</>
									) : null}
								</div>
								{spreads && small ? (
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
											userTeamClass,
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
			{small && overtimes ? (
				<div
					className="text-right text-muted px-1 d-flex align-items-center"
					style={{ height: 28 }}
				>
					{overtimes}
				</div>
			) : null}
			{!small && overtimes ? (
				<div className="text-right text-muted p-1">{overtimes}</div>
			) : null}
		</div>
	);

	if (action) {
		return (
			<div className={classNames("d-flex", className)}>
				{scoreBox}
				<button
					className={classNames(
						"btn score-box-action",
						action.highlight ? "btn-success" : "btn-light-bordered",
					)}
					disabled={action.disabled}
					onClick={action.onClick}
				>
					{action.text}
				</button>
			</div>
		);
	}

	return <div className={className}>{scoreBox}</div>;
};

export default ScoreBox;
