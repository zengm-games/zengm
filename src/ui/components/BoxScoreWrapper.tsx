import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { PHASE } from "../../common";
import { helpers, realtimeUpdate, toWorker, useLocalShallow } from "../util";
import BoxScore from "./BoxScore";

const TeamNameLink = ({
	children,
	season,
	t,
}: {
	children: any;
	season: number;
	t: {
		abbrev: string;
		name: string;
		region: string;
		tid: number;
	};
}) => {
	return t.tid >= 0 ? (
		<a href={helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`, season])}>
			{children}
		</a>
	) : (
		<>{children}</>
	);
};
TeamNameLink.propTypes = {
	season: PropTypes.number.isRequired,
	t: PropTypes.object.isRequired,
};

const TeamLogo = ({
	season,
	t,
}: {
	season: number;
	t: {
		abbrev: string;
		imgURL?: string;
		name: string;
		region: string;
		tid: number;
		won: number;
		lost: number;
		tied?: number;
	};
}) => {
	let record = `${t.won}-${t.lost}`;
	if (typeof t.tied === "number" && !Number.isNaN(t.tied) && t.tied > 0) {
		record += `-${t.tied}`;
	}

	return t.imgURL !== undefined && t.imgURL !== "" ? (
		<div className="w-100 d-none d-lg-flex justify-content-center">
			<div>
				<div style={{ height: 100 }} className="d-flex align-items-center">
					<TeamNameLink season={season} t={t}>
						<img
							src={t.imgURL}
							alt=""
							style={{ maxWidth: 120, maxHeight: 100 }}
						/>
					</TeamNameLink>
				</div>
				<div className="mt-1 mb-3 font-weight-bold">{record}</div>
			</div>
		</div>
	) : null;
};

const HeadlineScore = ({ boxScore }: any) => {
	// Historical games will have boxScore.won.name and boxScore.lost.name so use that for ordering, but live games
	// won't. This is hacky, because the existence of this property is just a historical coincidence, and maybe it'll
	// change in the future.
	const liveGameSim = !boxScore.won || !boxScore.won.name;
	const t0 =
		boxScore.won && boxScore.won.name ? boxScore.won : boxScore.teams[0];
	const t1 =
		boxScore.lost && boxScore.lost.name ? boxScore.lost : boxScore.teams[1];

	return (
		<>
			<h2>
				{t0.playoffs ? (
					<span className="text-muted">{t0.playoffs.seed}. </span>
				) : null}
				<TeamNameLink season={boxScore.season} t={t0}>
					<span className="d-none d-sm-inline">{t0.region} </span>
					{t0.name}
				</TeamNameLink>{" "}
				{t0.pts},{" "}
				{t1.playoffs ? (
					<span className="text-muted">{t1.playoffs.seed}. </span>
				) : null}
				<TeamNameLink season={boxScore.season} t={t1}>
					<span className="d-none d-sm-inline">{t1.region} </span>
					{t1.name}
				</TeamNameLink>{" "}
				{t1.pts}
				{boxScore.overtime}
			</h2>
			{liveGameSim ? (
				<div className="mb-2">
					{boxScore.gameOver
						? "Final score"
						: boxScore.elamTarget !== undefined
						? `Elam Ending target: ${boxScore.elamTarget} points`
						: `${boxScore.quarter}, ${boxScore.time} remaining`}
				</div>
			) : null}
		</>
	);
};
HeadlineScore.propTypes = {
	boxScore: PropTypes.object.isRequired,
};

const FourFactors = ({ teams }: { teams: any[] }) => {
	return (
		<table className="table table-bordered table-sm mb-2 mb-sm-0">
			<thead>
				<tr />
				<tr>
					<th title="Four Factors: Effective Field Goal Percentage">eFG%</th>
					<th title="Four Factors: Turnover Percentage">TOV%</th>
					<th title="Four Factors: Offensive Rebound Percentage">ORB%</th>
					<th title="Four Factors: Free Throws Made Over Field Goal Attempts">
						FT/FGA
					</th>
				</tr>
			</thead>
			<tbody>
				{teams.map((t, i) => {
					const t2 = teams[1 - i];

					const efg = (100 * (t.fg + t.tp / 2)) / t.fga;
					const tovp = (100 * t.tov) / (t.fga + 0.44 * t.fta + t.tov);
					const orbp = (100 * t.orb) / (t.orb + t2.drb);
					const ftpfga = t.ft / t.fga;

					const efg2 = (100 * (t2.fg + t2.tp / 2)) / t2.fga;
					const tovp2 = (100 * t2.tov) / (t2.fga + 0.44 * t2.fta + t2.tov);
					const orbp2 = (100 * t2.orb) / (t2.orb + t.drb);
					const ftpfga2 = t2.ft / t2.fga;

					return (
						<tr key={t.abbrev}>
							<td className={efg > efg2 ? "table-success" : undefined}>
								{helpers.roundStat(efg, "efg")}
							</td>
							<td className={tovp < tovp2 ? "table-success" : undefined}>
								{helpers.roundStat(tovp, "tovp")}
							</td>
							<td className={orbp > orbp2 ? "table-success" : undefined}>
								{helpers.roundStat(orbp, "orbp")}
							</td>
							<td className={ftpfga > ftpfga2 ? "table-success" : undefined}>
								{helpers.roundStat(ftpfga, "ftpfga")}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};
FourFactors.propTypes = {
	teams: PropTypes.array.isRequired,
};

const NextButton = ({
	abbrev,
	boxScore,
	currentGidInList,
	nextGid,
	tid,
}: {
	abbrev?: string;
	boxScore: any;
	currentGidInList?: boolean;
	nextGid?: number;
	tid?: number;
}) => {
	const [autoGoToNext, setAutoGoToNext] = useState(false);
	const [clickedGoToNext, setClickedGoToNext] = useState(false);

	const simNext = useCallback(async () => {
		setAutoGoToNext(true);
		setClickedGoToNext(true);
		await toWorker("playMenu", "day");
	}, []);

	useEffect(() => {
		let mounted = true;
		const whatever = async () => {
			if (autoGoToNext && nextGid !== undefined) {
				setAutoGoToNext(false);
				// Hack, because otherwise the updateEvent with "gameSim" comes before this one, but doesn't finish yet, so in updatePage this update gets cancelled even though it's a new URL (because it's the same page)
				setTimeout(() => {
					realtimeUpdate(
						[],
						helpers.leagueUrl([
							"game_log",
							`${abbrev}_${tid}`,
							boxScore.season,
							nextGid,
						]),
					);

					if (mounted) {
						setClickedGoToNext(false);
					}
				}, 10);
			}
		};

		whatever();

		return () => {
			mounted = false;
		};
	}, [abbrev, autoGoToNext, boxScore.season, nextGid, tid]);

	const { phase, playMenuOptions, season } = useLocalShallow(state => ({
		phase: state.phase,
		playMenuOptions: state.playMenuOptions,
		season: state.season,
	}));

	const canPlay = playMenuOptions.some(
		option => option.id === "day" || option.id === "week",
	);

	return (
		<div className="ml-4">
			{boxScore.season === season &&
			currentGidInList &&
			(nextGid === undefined || clickedGoToNext || autoGoToNext) &&
			phase >= PHASE.REGULAR_SEASON &&
			phase <= PHASE.PLAYOFFS ? (
				<button
					className="btn btn-light-bordered"
					disabled={!canPlay}
					onClick={simNext}
				>
					Sim
					<br />
					Next
				</button>
			) : (
				<a
					className={classNames("btn", "btn-light-bordered", {
						disabled: nextGid === undefined,
					})}
					href={helpers.leagueUrl([
						"game_log",
						`${abbrev}_${tid}`,
						boxScore.season,
						nextGid,
					])}
				>
					Next
				</a>
			)}
		</div>
	);
};
NextButton.propTypes = {
	abbrev: PropTypes.string,
	boxScore: PropTypes.object.isRequired,
	currentGidInList: PropTypes.bool,
	nextGid: PropTypes.number,
};

const DetailedScore = ({
	abbrev,
	boxScore,
	currentGidInList,
	nextGid,
	prevGid,
	showNextPrev,
	tid,
}: {
	abbrev?: string;
	boxScore: any;
	currentGidInList?: boolean;
	nextGid?: number;
	prevGid?: number;
	showNextPrev?: boolean;
	tid?: number;
}) => {
	// Quarter/overtime labels
	const qtrs = boxScore.teams[1].ptsQtrs.map((pts: number, i: number) => {
		return i < 4 ? `Q${i + 1}` : `OT${i - 3}`;
	});
	qtrs.push("F");

	return (
		<div className="d-flex align-items-center justify-content-center">
			{showNextPrev ? (
				<div className="mr-4">
					<a
						className={classNames("btn", "btn-light-bordered", {
							disabled: prevGid === undefined,
						})}
						href={helpers.leagueUrl([
							"game_log",
							`${abbrev}_${tid}`,
							boxScore.season,
							prevGid,
						])}
					>
						Prev
					</a>
				</div>
			) : null}
			<div>
				<div className="mr-4 mx-xs-auto table-nonfluid text-center">
					<table className="table table-bordered table-sm mb-2 mb-sm-0">
						<thead>
							<tr>
								<th />
								{qtrs.map((qtr: number) => (
									<th key={qtr}>{qtr}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{boxScore.teams.map((t: any) => (
								<tr key={t.abbrev}>
									<th>
										{t.tid >= 0 ? (
											<a
												href={helpers.leagueUrl([
													"roster",
													t.abbrev,
													boxScore.season,
												])}
											>
												{t.abbrev}
											</a>
										) : (
											t.abbrev
										)}
									</th>
									{t.ptsQtrs.map((pts: number, i: number) => (
										<td key={i}>{pts}</td>
									))}
									<th>{t.pts}</th>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{process.env.SPORT === "basketball" ? (
					<div className="mx-xs-auto table-nonfluid text-center">
						<FourFactors teams={boxScore.teams} />
					</div>
				) : null}
			</div>
			{showNextPrev ? (
				<NextButton
					abbrev={abbrev}
					boxScore={boxScore}
					currentGidInList={currentGidInList}
					nextGid={nextGid}
					tid={tid}
				/>
			) : null}
		</div>
	);
};

DetailedScore.propTypes = {
	abbrev: PropTypes.string,
	boxScore: PropTypes.object.isRequired,
	currentGidInList: PropTypes.bool,
	nextGid: PropTypes.number,
	prevGid: PropTypes.number,
	showNextPrev: PropTypes.bool,
	tid: PropTypes.number,
};

const PlayoffRecord = ({
	numGamesToWinSeries,
	season,
	t0,
	t1,
}: {
	numGamesToWinSeries: number;
	season: number;
	t0: {
		abbrev: string;
		playoffs?: { won: number; lost: number };
	};
	t1: {
		abbrev: string;
		playoffs?: { won: number; lost: number };
	};
}) => {
	if (
		numGamesToWinSeries === undefined ||
		numGamesToWinSeries <= 1 ||
		!t0.playoffs ||
		!t1.playoffs
	) {
		return null;
	}

	type RequiredPlayoffsTeam = Required<typeof t0>;
	let winning: RequiredPlayoffsTeam;
	let losing: RequiredPlayoffsTeam;
	if (t0.playoffs.won > t1.playoffs.won) {
		winning = t0 as RequiredPlayoffsTeam;
		losing = t1 as RequiredPlayoffsTeam;
	} else {
		winning = t1 as RequiredPlayoffsTeam;
		losing = t0 as RequiredPlayoffsTeam;
	}

	const record = (
		<a href={helpers.leagueUrl(["playoffs", season])}>
			{winning.playoffs.won}-{losing.playoffs.won}
		</a>
	);

	if (winning.playoffs.won === losing.playoffs.won) {
		return <>Series tied {record}</>;
	}

	const winningAbbrevLink = (
		<a href={helpers.leagueUrl(["roster", winning.abbrev, season])}>
			{winning.abbrev}
		</a>
	);

	if (winning.playoffs.won === numGamesToWinSeries) {
		return (
			<>
				{winningAbbrevLink} won series {record}
			</>
		);
	}

	return (
		<>
			{winningAbbrevLink} leads series {record}
		</>
	);
};

const BoxScoreWrapper = ({
	abbrev,
	boxScore,
	currentGidInList,
	injuredToBottom,
	nextGid,
	playIndex,
	prevGid,
	showNextPrev,
	tid,
	Row,
}: {
	abbrev?: string;
	boxScore: any;
	currentGidInList?: boolean;
	injuredToBottom?: boolean;
	nextGid?: number;
	playIndex?: number;
	prevGid?: number;
	showNextPrev?: boolean;
	tid?: number;
	Row: any;
}) => {
	const prevPlayIndex = useRef(playIndex);
	useEffect(() => {
		prevPlayIndex.current = playIndex;
	});
	// If more than one play has happend between renders, force update of every row of the live box score, in case a player was subbed out in the missing play
	const forceRowUpdate =
		playIndex !== undefined &&
		prevPlayIndex.current !== undefined &&
		playIndex - prevPlayIndex.current > 1;

	const handleKeydown = useCallback(
		e => {
			if (showNextPrev) {
				if (e.altKey || e.ctrlKey || e.shiftKey || e.isComposing || e.metaKey) {
					return;
				}

				if (e.keyCode === 37 && boxScore && prevGid !== undefined) {
					// prev
					realtimeUpdate(
						[],
						helpers.leagueUrl([
							"game_log",
							`${abbrev}_${tid}`,
							boxScore.season,
							prevGid,
						]),
					);
				} else if (e.keyCode === 39 && boxScore && nextGid !== undefined) {
					// next
					realtimeUpdate(
						[],
						helpers.leagueUrl([
							"game_log",
							`${abbrev}_${tid}`,
							boxScore.season,
							nextGid,
						]),
					);
				}
			}
		},
		[abbrev, boxScore, nextGid, prevGid, showNextPrev, tid],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [handleKeydown]);

	// Historical games will have boxScore.won.name and boxScore.lost.name so use that for ordering, but live games
	// won't. This is hacky, because the existence of this property is just a historical coincidence, and maybe it'll
	// change in the future.
	const t0 =
		boxScore.won && boxScore.won.name ? boxScore.won : boxScore.teams[0];
	const t1 =
		boxScore.lost && boxScore.lost.name ? boxScore.lost : boxScore.teams[1];

	let forcedWinText = null;
	if (boxScore.forceWin !== undefined) {
		const pure = boxScore.forceWin <= 500;
		forcedWinText = (
			<>
				<br />
				Forced win in{" "}
				<span
					className={pure ? "text-success" : "text-danger"}
					title={
						pure
							? "Win was forced without giving a bonus to the winning team"
							: "Forcing the win required giving the winning team a bonus"
					}
				>
					{helpers.numberWithCommas(boxScore.forceWin)}
				</span>{" "}
				{boxScore.forceWin === 1 ? "try" : "tries"}.
			</>
		);
	}

	return (
		<>
			<div className="d-flex text-center">
				<TeamLogo season={boxScore.season} t={t0} />
				<div className="mx-auto flex-shrink-0 mb-2">
					<HeadlineScore boxScore={boxScore} />
					<DetailedScore
						abbrev={abbrev}
						boxScore={boxScore}
						currentGidInList={currentGidInList}
						key={boxScore.gid}
						nextGid={nextGid}
						prevGid={prevGid}
						showNextPrev={showNextPrev}
						tid={tid}
					/>
					<div className="mt-sm-1">
						<PlayoffRecord
							numGamesToWinSeries={boxScore.numGamesToWinSeries}
							season={boxScore.season}
							t0={t0}
							t1={t1}
						/>
					</div>
				</div>
				<TeamLogo season={boxScore.season} t={t1} />
			</div>
			<BoxScore
				boxScore={boxScore}
				Row={Row}
				forceRowUpdate={forceRowUpdate}
				injuredToBottom={injuredToBottom}
			/>
			Attendance: {helpers.numberWithCommas(boxScore.att)}
			{forcedWinText}
		</>
	);
};

BoxScoreWrapper.propTypes = {
	abbrev: PropTypes.string,
	boxScore: PropTypes.object.isRequired,
	currentGidInList: PropTypes.bool,
	nextGid: PropTypes.number,
	prevGid: PropTypes.number,
	showNextPrev: PropTypes.bool,
	tid: PropTypes.number,
	Row: PropTypes.any,
};

export default BoxScoreWrapper;
