import clsx from "clsx";
import {
	bySport,
	getBestPlayerBoxScore,
	isSport,
	PHASE,
} from "../../../common/index.ts";
import { getCol, helpers, useLocalPartial } from "../../util/index.ts";
import React, { memo, type ReactNode } from "react";
import TeamLogoInline from "../TeamLogoInline.tsx";
import defaultGameAttributes from "../../../common/defaultGameAttributes.ts";
import PlayerNameLabels from "../PlayerNameLabels.tsx";
import getWinner from "../../../common/getWinner.ts";

const roundHalf = (x: number) => {
	return Math.round(x * 2) / 2;
};

type Team = {
	// pts/players are undefined for upcoming games. Others are undefined only for legacy objects
	ovr?: number;
	pts?: number;
	sPts?: number;
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

	// Not needed for current season, just use the ones in teamInfoCache. But for past seasons (like on Daily Schedule), this is nice
	branding?: {
		region: string;
		name: string;
		abbrev: string;
		imgURL?: string;
		imgURLSmall?: string;
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
			finals?: boolean;
			forceWin?: number;
			gid: number;
			neutralSite?: boolean;
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
			neutralSite,
			numPeriods,
			phase,
			quarterLength,
			season,
			teamInfoCache,
			userTid,
		} = useLocalPartial([
			"challengeNoRatings",
			"homeCourtAdvantage",
			"neutralSite",
			"numPeriods",
			"phase",
			"quarterLength",
			"season",
			"teamInfoCache",
			"userTid",
		]);

		const winner = getWinner(game.teams);

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
			let actualHomeCourtAdvantage;
			if (game.neutralSite) {
				// Completed game at neutral site
				actualHomeCourtAdvantage = 0;
			} else if (neutralSite === "finals" && game.finals) {
				// Upcoming game at neutral site
				actualHomeCourtAdvantage = 0;
			} else if (neutralSite === "playoffs" && phase === PHASE.PLAYOFFS) {
				// Upcoming game at neutral site
				actualHomeCourtAdvantage = 0;
			} else {
				// From @nicidob https://github.com/nicidob/bbgm/blob/master/team_win_testing.ipynb
				// Default homeCourtAdvantage is 1
				actualHomeCourtAdvantage =
					bySport({
						baseball: 1,
						basketball: 3.3504,
						football: 3,
						hockey: 0.25,
					}) * homeCourtAdvantage;
			}

			const ovr0 = game.teams[0].ovr;
			const ovr1 = game.teams[1].ovr;
			let spread = bySport({
				baseball: () => (1 / 10) * (ovr0 - ovr1) + actualHomeCourtAdvantage,

				basketball: () => (15 / 50) * (ovr0 - ovr1) + actualHomeCourtAdvantage,

				football: () => (3 / 10) * (ovr0 - ovr1) + actualHomeCourtAdvantage,

				hockey: () => (1.8 / 100) * (ovr0 - ovr1) + actualHomeCourtAdvantage,
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
								: `${game.teams[0].branding?.abbrev ?? teamInfoCache[game.teams[0].tid]?.abbrev}_${
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
				className={clsx("flex-grow-1 w-100", small ? "d-flex" : undefined)}
				style={small ? smallStyle : undefined}
			>
				<div
					className={clsx(
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
						[1, 2].map((i) => (
							<div
								className={clsx("d-flex align-items-center", {
									"score-box-all-star": !small,
								})}
								key={i}
							>
								<div className={clsx("p-1", { "pe-5": small })}>
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
						[1, 0].map((i) => {
							const t = game.teams[i]!;
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
								const branding = t.branding ?? teamInfoCache[t.tid];
								imgURL = branding?.imgURLSmall ?? branding?.imgURL;
								teamName = small
									? branding?.abbrev
									: `${branding?.region} ${branding?.name}`;
								rosterURL = helpers.leagueUrl([
									"roster",
									`${branding?.abbrev}_${t.tid}`,
									gameSeason,
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
											baseball: `${!challengeNoRatings && p.stats.keyStatsShort ? ", " : ""}${
												p.stats.keyStatsShort
											}`,
											basketball: `${
												!challengeNoRatings ? ", " : ""
											}${p.stats.pts.toFixed(1)} / ${p.stats.trb.toFixed(
												1,
											)} / ${p.stats.ast.toFixed(1)}`,
											football: null,
											hockey: `${!challengeNoRatings && p.stats.keyStats ? ", " : ""}${
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
										const col = getCol(`stat:${stat}`);

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

							const WINNER_ARROW_WIDTH = 6;

							return (
								<div
									key={i}
									className={clsx(
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
										className={clsx(
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
												className={clsx(
													"text-body text-end align-self-stretch d-flex align-items-center alert-bg-color",
													scoreClass,
													userTeamClass,
													{
														"fw-bold score-box-score": small,
														"ps-2": !small,
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
														{t.sPts !== undefined ? (
															<span className="fw-normal">
																&nbsp;({t.sPts})
															</span>
														) : null}
													</a>
												) : (
													<>
														<span
															className={
																winner !== i && winner !== -1
																	? "text-body-secondary"
																	: undefined
															}
														>
															{t.pts}
														</span>
														{t.sPts !== undefined ? (
															<span className="text-body-secondary">
																&nbsp;({t.sPts})
															</span>
														) : null}
														<div className="ms-1">
															{winner === i ? (
																<svg
																	viewBox="0 0 50 100"
																	xmlns="http://www.w3.org/2000/svg"
																	width={WINNER_ARROW_WIDTH}
																	height={WINNER_ARROW_WIDTH * 2}
																	className="align-baseline"
																	style={{ fill: "var(--bs-gray-600)" }}
																>
																	<polygon points="0,50 50,0 50,100 0,50" />
																</svg>
															) : (
																<div style={{ width: WINNER_ARROW_WIDTH }} />
															)}
														</div>
													</>
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
								const classNameAction = clsx(
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
