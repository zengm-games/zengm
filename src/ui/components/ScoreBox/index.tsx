import classNames from "classnames";
import { bySport, isSport } from "../../../common";
import { helpers, useLocalShallow } from "../../util";
import type { ReactNode } from "react";
import TeamLogoInline from "../TeamLogoInline";
import defaultGameAttributes from "../../../common/defaultGameAttributes";
import { PlayerNameLabels } from "..";
import getBestPlayer from "./getBestPlayer";

const roundHalf = (x: number) => {
	return Math.round(x * 2) / 2;
};

// pts/players are undefined for upcoming games. Others are undefined only for legacy objects
type Team = {
	ovr?: number;
	pts?: number;
	tid: number;
	won?: number;
	lost?: number;
	tied?: number;
	otl?: number;
	players?: any[];
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
	playersUpcoming,
	playersUpcomingAbbrev,
	small,
}: {
	action?: {
		disabled?: boolean;
		highlight?: boolean;
		href?: string;
		onClick?: () => void;
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
	playersUpcoming?: any[];
	playersUpcomingAbbrev?: boolean;
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

	if (!action && final && !small) {
		action = {
			text: "Box score",
			href: helpers.leagueUrl([
				"game_log",
				allStarGame
					? "special"
					: `${teamInfoCache[game.teams[0].tid]?.abbrev}_${game.teams[0].tid}`,
				gameSeason,
				game.gid,
			]),
		};
	}

	const scoreBox = (
		<div
			className={classNames("flex-grow-1 w-100", small ? "d-flex" : undefined)}
			style={small ? smallStyle : undefined}
		>
			<div
				className={classNames(
					"border-light",
					action ? "border-right-0" : undefined,
				)}
			>
				{tradeDeadline ? (
					<div className="score-box-deadline p-1 d-flex align-items-center ml-1">
						Trade deadline
					</div>
				) : allStarGame && !final ? (
					[1, 2].map(i => (
						<div
							className="score-box-all-star d-flex align-items-center"
							key={i}
						>
							<div className={classNames("p-1", { "pr-5": small })}>
								<a
									href={helpers.leagueUrl(["all_star", "draft"])}
									className={!small ? "font-weight-bold" : undefined}
								>
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
							imgURL = "https://zengm.com/files/logo-basketball.png";
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

						let p;
						let playerStatText;
						if (playersUpcoming?.[i]) {
							p = playersUpcoming?.[i];
							playerStatText = (
								<>
									{playersUpcomingAbbrev ? (
										<>
											<a href={rosterURL}>{p.abbrev}</a>,{" "}
										</>
									) : null}
									{p.ratings.ovr} ovr
									{bySport({
										basketball: `, ${p.stats.pts.toFixed(
											1,
										)} / ${p.stats.trb.toFixed(1)} / ${p.stats.ast.toFixed(1)}`,
										football: null,
										hockey: `, ${p.stats.keyStats}`,
									})}
								</>
							);
						} else if (final && t.players) {
							const best = getBestPlayer(t.players);
							if (best) {
								p = best.p;
								playerStatText = best.statText;
							}
						}

						return (
							<div
								key={i}
								className={classNames(
									"d-flex align-items-center",
									scoreClassForceWin,
									userTeamClass,
								)}
							>
								{imgURL ? (
									<a href={rosterURL}>
										<TeamLogoInline
											imgURL={imgURL}
											includePlaceholderIfNoLogo
											size={small ? 24 : 36}
											className="ml-1"
										/>
									</a>
								) : null}
								<div
									className={classNames(
										"d-flex align-items-center score-box-left-wrapper",
										{
											"flex-grow-1": small,
										},
									)}
									style={
										!small
											? {
													width: 210,
											  }
											: undefined
									}
								>
									<div className="flex-grow-1 text-truncate p-1">
										{t.playoffs ? (
											<span className="text-dark">{t.playoffs.seed}. </span>
										) : null}
										<a
											href={rosterURL}
											className={!small ? "font-weight-bold" : undefined}
										>
											{teamName}
										</a>
										{!small ? (
											<div className="text-muted text-truncate">
												{getRecord(t)}
												{hasOvrs ? (
													<>
														,{" "}
														<span title="Team overall rating">{t.ovr} ovr</span>
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
											</div>
										) : null}
									</div>
									{spreads && small ? (
										<div className="text-right score-box-score mr-2">
											{spreads[i]}
										</div>
									) : null}
									{final ? (
										<div
											className={classNames(
												"text-body text-right align-self-stretch d-flex align-items-center",
												scoreClass,
												userTeamClass,
												{
													"font-weight-bold score-box-score": small,
													"px-2": !small,
													"pr-1": small,
												},
											)}
											style={!small ? { fontSize: 16 } : undefined}
										>
											{small ? (
												<a
													href={helpers.leagueUrl([
														"game_log",
														allStarGame
															? "special"
															: `${teamInfoCache[t.tid]?.abbrev}_${t.tid}`,
														gameSeason,
														game.gid,
													])}
													className="d-block w-100 h-100"
													style={{
														// Vertical center
														paddingTop: 4,
													}}
												>
													{t.pts}
												</a>
											) : (
												t.pts
											)}
										</div>
									) : null}
								</div>
								{p ? (
									<div
										className="align-self-stretch border-left pl-2 flex-grow-1 text-muted d-none d-sm-flex align-items-center overflow-hidden text-nowrap"
										style={{
											backgroundColor: "var(--white)",
											width: 200,
										}}
									>
										<div>
											<div>
												<PlayerNameLabels
													pid={p.pid}
													injury={p.injury}
													pos={p.ratings?.pos ?? p.pos}
													season={season}
													watch={p.watch}
												>
													{p.name}
												</PlayerNameLabels>
											</div>
											<div>{playerStatText}</div>
										</div>
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
		</div>
	);

	if (action) {
		const classNameAction = classNames(
			"btn score-box-action",
			action.highlight ? "btn-success" : "btn-light-bordered-2",
		);

		return (
			<div className={className}>
				<div className="d-flex">
					{scoreBox}
					{action.onClick ? (
						<button
							className={classNameAction}
							disabled={action.disabled}
							onClick={action.onClick}
						>
							{action.text}
						</button>
					) : (
						<a
							className={`${classNameAction} d-flex align-items-center`}
							href={action.href}
						>
							{action.text}
						</a>
					)}
				</div>
				{!small && overtimes ? (
					<div className="text-muted p-1">{overtimes}</div>
				) : null}
			</div>
		);
	}

	return <div className={className}>{scoreBox}</div>;
};

export default ScoreBox;
