import classNames from "classnames";
import { bySport, getBestPlayerBoxScore, isSport } from "../../../common";
import { getCols, helpers, useLocalPartial } from "../../util";
import React, { memo, type ReactNode } from "react";
import TeamLogoInline from "../TeamLogoInline";
import defaultGameAttributes from "../../../common/defaultGameAttributes";
import PlayerNameLabels from "../PlayerNameLabels";

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
		return <b>{t.playoffs.won}</b>;
	}

	if (t.won === undefined || t.lost === undefined) {
		return "";
	}

	return helpers.formatRecord(t as any);
};

const smallStyle = {
	display: "inline-block",
};

// memo is to prevent completed games from re-rendering in LeagueTopBar
const ScoreBox = memo(
	({
		actions = [],
		boxScoreTeamOverride,
		className,
		game,
		playersUpcoming,
		playersUpcomingAbbrev,
		small,
	}: {
		actions?: {
			disabled?: boolean;
			highlight?: boolean;
			href?: string;
			onClick?: () => void;
			text: ReactNode;
		}[];
		boxScoreTeamOverride?: string;
		className?: string;
		game: {
			forceWin?: number;
			gid: number;
			season?: number;
			teams: [Team, Team];
			numPeriods?: number;
			overtimes?: number;
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
		} = useLocalPartial([
			"challengeNoRatings",
			"homeCourtAdvantage",
			"numPeriods",
			"quarterLength",
			"season",
			"teamInfoCache",
			"userTid",
		]);

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
			const ovr0 = game.teams[0].ovr;
			const ovr1 = game.teams[1].ovr;
			let spread = bySport({
				baseball: () => (1 / 10) * (ovr0 - ovr1) + 1 * homeCourtAdvantage,

				// From @nicidob https://github.com/nicidob/bbgm/blob/master/team_win_testing.ipynb
				// Default homeCourtAdvantage is 1
				basketball: () =>
					(15 / 50) * (ovr0 - ovr1) + 3.3504 * homeCourtAdvantage,

				football: () => (3 / 10) * (ovr0 - ovr1) + 3 * homeCourtAdvantage,

				hockey: () => (1.8 / 100) * (ovr0 - ovr1) + 0.25 * homeCourtAdvantage,
			})();

			// Adjust for game length
			spread *=
				(numPeriods * quarterLength) /
				(defaultGameAttributes.numPeriods *
					defaultGameAttributes.quarterLength);

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

		const overtimes = helpers.overtimeText(game.overtimes, game.numPeriods);

		const gameSeason = game.season ?? season;

		const allStarGame = game.teams[0].tid === -1 && game.teams[1].tid === -2;
		const tradeDeadline = game.teams[0].tid === -3 && game.teams[1].tid === -3;

		if (actions.length === 0 && final && !small) {
			actions = [
				{
					text: "Box score",
					href: helpers.leagueUrl([
						"game_log",
						allStarGame
							? "special"
							: boxScoreTeamOverride !== undefined
							? boxScoreTeamOverride
							: `${teamInfoCache[game.teams[0].tid]?.abbrev}_${
									game.teams[0].tid
							  }`,
						gameSeason,
						game.gid,
					]),
				},
			];
		}

		const scoreBox = (
			<div
				className={classNames(
					"flex-grow-1 w-100",
					small ? "d-flex" : undefined,
				)}
				style={small ? smallStyle : undefined}
			>
				<div
					className={classNames(
						"border-light",
						actions.length > 0 ? "border-end-0" : undefined,
					)}
				>
					{tradeDeadline ? (
						<div
							className={`${
								small ? "score-box-deadline-small" : "score-box-deadline"
							} p-1 d-flex align-items-center ms-1`}
						>
							{small ? (
								"Trade Deadline"
							) : (
								<h2 className="mb-0">Trade Deadline</h2>
							)}
						</div>
					) : allStarGame && !final ? (
						[1, 2].map(i => (
							<div
								className={classNames("d-flex align-items-center", {
									"score-box-all-star": !small,
								})}
								key={i}
							>
								<div className={classNames("p-1", { "pe-5": small })}>
									<a
										href={helpers.leagueUrl(["all_star", "teams"])}
										className={!small ? "fw-bold" : undefined}
									>
										{small ? `AS${i}` : `All-Stars ${i}`}
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
								imgURL = `https://zengm.com/files/logo-${process.env.SPORT}.svg`;
								teamName = small
									? `AS${i === 0 ? 2 : 1}`
									: `All-Stars ${i === 0 ? 2 : 1}`;
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
										{!challengeNoRatings ? `${p.ratings.ovr} ovr` : null}
										{bySport({
											baseball: `${!challengeNoRatings ? ", " : ""}${
												p.stats.keyStatsShort
											}`,
											basketball: `${
												!challengeNoRatings ? ", " : ""
											}${p.stats.pts.toFixed(1)} / ${p.stats.trb.toFixed(
												1,
											)} / ${p.stats.ast.toFixed(1)}`,
											football: null,
											hockey: `${!challengeNoRatings ? ", " : ""}${
												p.stats.keyStats
											}`,
										})}
									</>
								);
							} else if (final && t.players) {
								const best = getBestPlayerBoxScore(t.players);
								if (best) {
									p = best.p;
									playerStatText = best.statTexts.map((stat, i) => {
										const col = getCols([`stat:${stat}`])[0];

										let title = col.title;
										// Add back in prefix for some football ones
										if (isSport("football")) {
											if (!stat.startsWith("def")) {
												title = helpers.upperCaseFirstLetter(stat);
											}
										}

										return (
											<React.Fragment key={stat}>
												{i > 0 ? ", " : null}
												<span title={col.desc}>
													{best.processedStats[stat]} {title}
												</span>
											</React.Fragment>
										);
									});
								}
							}

							return (
								<div
									key={i}
									className={classNames(
										"d-flex align-items-center alert-bg-color",
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
												className="ms-1"
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
												className={!small ? "fw-bold" : undefined}
											>
												{teamName}
											</a>
											{!small ? (
												<div className="text-body-secondary text-truncate">
													{getRecord(t)}
													{hasOvrs ? (
														<>
															,{" "}
															<span title="Team overall rating">
																{t.ovr} ovr
															</span>
														</>
													) : null}
													{spreads?.[i] ? (
														<>
															,{" "}
															<span title="Point spread or betting line">
																<span
																	className={
																		!final ? "text-success" : undefined
																	}
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
											<div className="text-end score-box-score me-2">
												{spreads[i]}
											</div>
										) : null}
										{final ? (
											<div
												className={classNames(
													"text-body text-end align-self-stretch d-flex align-items-center alert-bg-color",
													scoreClass,
													userTeamClass,
													{
														"fw-bold score-box-score": small,
														"px-2": !small,
														"pe-1": small,
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
											className="align-self-stretch border-start ps-2 flex-grow-1 text-body-secondary d-none d-sm-flex align-items-center overflow-hidden text-nowrap"
											style={{
												backgroundColor: "var(--bs-white)",
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
														legacyName={p.name}
													/>
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
						className="text-end text-body-secondary px-1 d-flex align-items-center"
						style={{ height: 28 }}
					>
						{overtimes}
					</div>
				) : null}
			</div>
		);

		if (actions.length > 0) {
			return (
				<div className={className}>
					<div className="d-flex">
						{scoreBox}
						<div className="btn-group-vertical score-box-action">
							{actions.map((action, i) => {
								const classNameAction = classNames(
									"btn",
									action.highlight ? "btn-success" : "btn-light-bordered-2",
								);

								return action.onClick ? (
									<button
										key={i}
										className={classNameAction}
										disabled={action.disabled}
										onClick={action.onClick}
									>
										{action.text}
									</button>
								) : (
									<a
										key={i}
										className={`${classNameAction} d-flex align-items-center`}
										href={action.href}
									>
										{action.text}
									</a>
								);
							})}
						</div>
					</div>
					{!small && overtimes ? (
						<div className="text-body-secondary p-1">{overtimes}</div>
					) : null}
				</div>
			);
		}

		return <div className={className}>{scoreBox}</div>;
	},
);

export default ScoreBox;
