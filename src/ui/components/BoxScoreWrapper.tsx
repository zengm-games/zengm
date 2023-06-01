import classNames from "classnames";
import range from "lodash-es/range";
import { useCallback, useEffect, useState, useRef } from "react";
import { isSport, PHASE } from "../../common";
import { helpers, realtimeUpdate, toWorker, useLocalPartial } from "../util";
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
		otl?: number;
	};
}) => {
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
				<div className="mt-1 mb-3 fw-bold">{helpers.formatRecord(t)}</div>
			</div>
		</div>
	) : null;
};

export const HeadlineScore = ({
	boxScore,
	small,
}: {
	boxScore: any;
	small?: boolean;
}) => {
	// Historical games will have boxScore.won.name and boxScore.lost.name so use that for ordering, but live games
	// won't. This is hacky, because the existence of this property is just a historical coincidence, and maybe it'll
	// change in the future.
	const liveGameSim = boxScore.won?.name === undefined;
	const t0 =
		boxScore.won?.name !== undefined ? boxScore.won : boxScore.teams[0];
	const t1 =
		boxScore.lost?.name !== undefined ? boxScore.lost : boxScore.teams[1];

	const className = small
		? "d-none"
		: `d-none d-${boxScore.exhibition ? "md" : "sm"}-inline`;

	return (
		<div
			className={
				small
					? "d-flex align-items-center flex-wrap justify-content-between gap-3 row-gap-0 mb-2"
					: liveGameSim
					? "d-none d-md-block"
					: undefined
			}
		>
			<h2 className={small ? "mb-0" : liveGameSim ? "mb-1" : "mb-2"}>
				{t0.playoffs ? (
					<span className="text-body-secondary">{t0.playoffs.seed}. </span>
				) : null}
				<TeamNameLink season={boxScore.season} t={t0}>
					{t0.season !== undefined ? `${t0.season} ` : null}
					<span className={className}>{t0.region} </span>
					{t0.name}
				</TeamNameLink>{" "}
				{t0.pts},{" "}
				{t1.playoffs ? (
					<span className="text-body-secondary">{t1.playoffs.seed}. </span>
				) : null}
				<TeamNameLink season={boxScore.season} t={t1}>
					{t1.season !== undefined ? `${t1.season} ` : null}
					<span className={className}>{t1.region} </span>
					{t1.name}
				</TeamNameLink>{" "}
				{t1.pts}
				{boxScore.overtime}
			</h2>
			{liveGameSim ? (
				<div className={small ? undefined : "mb-2"}>
					<span className="d-none d-sm-inline">
						{boxScore.gameOver
							? "Final score"
							: boxScore.elamTarget !== undefined
							? `Elam Ending target: ${boxScore.elamTarget} points`
							: isSport("baseball")
							? `${
									boxScore.teams[0].ptsQtrs.length ===
									boxScore.teams[1].ptsQtrs.length
										? "Bottom"
										: "Top"
							  } of the ${boxScore.quarter}`
							: `${boxScore.quarter}, ${boxScore.time} remaining`}
					</span>
					<span className="d-sm-none">
						{boxScore.gameOver
							? "F"
							: boxScore.elamTarget !== undefined
							? `Elam Ending target: ${boxScore.elamTarget} points`
							: isSport("baseball")
							? `${
									boxScore.teams[0].ptsQtrs.length ===
									boxScore.teams[1].ptsQtrs.length
										? "B"
										: "T"
							  }${boxScore.quarterShort}`
							: `${boxScore.quarterShort}, ${boxScore.time}`}
					</span>
				</div>
			) : null}
		</div>
	);
};

const FourFactors = ({ teams }: { teams: any[] }) => {
	return (
		<table className="table table-sm mb-2 mb-sm-0">
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
					const ftpFga = t.ft / t.fga;

					const efg2 = (100 * (t2.fg + t2.tp / 2)) / t2.fga;
					const tovp2 = (100 * t2.tov) / (t2.fga + 0.44 * t2.fta + t2.tov);
					const orbp2 = (100 * t2.orb) / (t2.orb + t.drb);
					const ftpFga2 = t2.ft / t2.fga;

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
							<td className={ftpFga > ftpFga2 ? "table-success" : undefined}>
								{helpers.roundStat(ftpFga, "ftpFga")}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

const FourFactorsFootball = ({ teams }: { teams: any[] }) => {
	return (
		<table className="table table-sm mb-2 mb-sm-0">
			<thead>
				<tr />
				<tr>
					<th title="Passing Yards">PssYds</th>
					<th title="Rushing Yards">RusYds</th>
					<th title="Penalties">Pen</th>
					<th title="Turnovers">TOV</th>
				</tr>
			</thead>
			<tbody>
				{teams.map((t, i) => {
					const t2 = teams[1 - i];

					const tov = t.pssInt + t.fmbLost;
					const tov2 = t2.pssInt + t2.fmbLost;

					return (
						<tr key={t.abbrev}>
							<td
								className={t.pssYds > t2.pssYds ? "table-success" : undefined}
							>
								{t.pssYds}
							</td>
							<td
								className={t.rusYds > t2.rusYds ? "table-success" : undefined}
							>
								{t.rusYds}
							</td>
							<td
								className={t.penYds < t2.penYds ? "table-success" : undefined}
							>
								{t.pen}-{t.penYds}
							</td>
							<td className={tov < tov2 ? "table-success" : undefined}>
								{tov}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

const FourFactorsHockey = ({ teams }: { teams: any[] }) => {
	return (
		<table className="table table-sm mb-2 mb-sm-0">
			<thead>
				<tr />
				<tr>
					<th title="Shots">S</th>
					<th title="Power Plays">PP</th>
					<th title="Takeaways">TK</th>
					<th title="Giveaway">GV</th>
					<th title="Faceoff Win Percentage">FO%</th>
				</tr>
			</thead>
			<tbody>
				{teams.map((t, i) => {
					const t2 = teams[1 - i];

					const foPct = t.fow / (t.fow + t.fol);
					const foPct2 = t2.fow / (t2.fow + t2.fol);

					return (
						<tr key={t.abbrev}>
							<td className={t.s > t2.s ? "table-success" : undefined}>
								{t.s}
							</td>
							<td className={t.ppG > t2.ppG ? "table-success" : undefined}>
								{t.ppG}/{t.ppo}
							</td>
							<td className={t.tk > t2.tk ? "table-success" : undefined}>
								{t.tk}
							</td>
							<td className={t.gv < t2.gv ? "table-success" : undefined}>
								{t.gv}
							</td>
							<td className={foPct > foPct2 ? "table-success" : undefined}>
								{helpers.roundStat(100 * foPct, "foPct")}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
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
		await toWorker("playMenu", "day", undefined);
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

	const { phase, playMenuOptions, season } = useLocalPartial([
		"phase",
		"playMenuOptions",
		"season",
	]);

	const canPlay = playMenuOptions.some(
		option => option.id === "day" || option.id === "week",
	);

	return (
		<div className="ms-4">
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
						abbrev === "special" ? abbrev : `${abbrev}_${tid}`,
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

const Base = ({
	pid,
	shiftDown,
}: {
	pid: number | undefined;
	shiftDown?: boolean;
}) => {
	const [state, setState] = useState<
		| {
				name: string;
				spd: number;
		  }
		| undefined
	>();
	useEffect(() => {
		if (pid === undefined) {
			setState(undefined);
		} else {
			let active = true;
			const run = async () => {
				const info = await toWorker("main", "getDiamondInfo", pid);
				if (active && info) {
					setState(info);
				}
			};

			run();

			return () => {
				active = false;
			};
		}
	}, [pid]);

	return (
		<div
			className={`baseball-base ${
				pid !== undefined ? "bg-secondary" : "border border-secondary"
			}`}
			style={shiftDown ? { marginTop: 20 } : undefined}
			title={state ? `${state.name} (${state.spd} spd)` : undefined}
		></div>
	);
};

const BaseballDiamond = ({
	bases,
	outs,
	balls,
	strikes,
}: {
	bases: [number | undefined, number | undefined, number | undefined];
	outs: number;
	balls: number;
	strikes: number;
}) => {
	return (
		<div>
			<div className="text-center mb-2">
				{outs} out{outs === 1 ? "" : "s"}
			</div>
			<div className="d-flex justify-content-center">
				<div className="d-flex mx-1">
					<Base pid={bases[2]} shiftDown />
					<Base pid={bases[1]} />
					<Base pid={bases[0]} shiftDown />
				</div>
			</div>
			<div className="text-center mt-1">
				{balls}-{strikes}
			</div>
		</div>
	);
};

const DetailedScore = ({
	abbrev,
	boxScore,
	currentGidInList,
	nextGid,
	prevGid,
	showNextPrev,
	sportState,
	tid,
}: {
	abbrev?: string;
	boxScore: any;
	currentGidInList?: boolean;
	nextGid?: number;
	prevGid?: number;
	showNextPrev?: boolean;
	sportState: any;
	tid?: number;
}) => {
	// Quarter/overtime labels
	const numPeriods = Math.max(
		boxScore.teams[0].ptsQtrs.length,
		boxScore.numPeriods ?? 0,
	);
	const qtrs: string[] = range(numPeriods).map(i => {
		return i < boxScore.numPeriods || isSport("baseball")
			? `${i + 1}`
			: `OT${i - boxScore.numPeriods + 1}`;
	});

	if (isSport("baseball")) {
		qtrs.push("R", "H", "E");
	} else {
		qtrs.push("F");
	}

	const liveGameSim = boxScore.won?.name === undefined;

	return (
		<div className="d-flex align-items-center justify-content-center">
			{showNextPrev ? (
				<div className="me-4">
					<a
						className={classNames("btn", "btn-light-bordered", {
							disabled: prevGid === undefined,
						})}
						href={helpers.leagueUrl([
							"game_log",
							abbrev === "special" ? abbrev : `${abbrev}_${tid}`,
							boxScore.season,
							prevGid,
						])}
					>
						Prev
					</a>
				</div>
			) : null}
			<div className="d-sm-flex">
				<div className="mx-xs-auto text-center">
					<table className="table table-sm mb-2 mb-sm-0">
						<thead>
							<tr>
								<th />
								{qtrs.map((qtr, i) => (
									<th
										key={qtr}
										className={
											i < qtrs.length - (isSport("baseball") ? 3 : 1)
												? "text-body-secondary"
												: undefined
										}
									>
										{qtr}
									</th>
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
									{range(numPeriods - t.ptsQtrs.length).map(i => (
										<td key={i}>-</td>
									))}
									<th>{t.pts}</th>
									{isSport("baseball") ? (
										<>
											<th>{t.h}</th>
											<th>
												{Array.isArray(t.e)
													? (t.e as (number | undefined)[]).reduce<number>(
															(prev, current) => prev + (current ?? 0),
															0,
													  )
													: t.e}
											</th>
										</>
									) : null}
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{isSport("baseball") && liveGameSim ? (
					<div className="ms-4 mx-xs-auto d-sm-inline-block text-start">
						<BaseballDiamond {...sportState} />
					</div>
				) : null}
				{isSport("basketball") ? (
					<div className="ms-4 mx-xs-auto d-sm-inline-block text-center">
						<FourFactors teams={boxScore.teams} />
					</div>
				) : null}
				{isSport("football") ? (
					<div className="ms-4 mx-xs-auto d-sm-inline-block text-center">
						<FourFactorsFootball teams={boxScore.teams} />
					</div>
				) : null}
				{isSport("hockey") ? (
					<div className="ms-4 mx-xs-auto d-sm-inline-block text-center">
						<FourFactorsHockey teams={boxScore.teams} />
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
	nextGid,
	playIndex,
	prevGid,
	showNextPrev,
	sportState,
	tid,
	Row,
}: {
	abbrev?: string;
	boxScore: any;
	currentGidInList?: boolean;
	nextGid?: number;
	playIndex?: number;
	prevGid?: number;
	showNextPrev?: boolean;
	sportState: any;
	tid?: number;
	Row: any;
}) => {
	const prevPlayIndex = useRef(playIndex);
	useEffect(() => {
		prevPlayIndex.current = playIndex;
	});
	// If more than one play has happend between renders, force update of every row of the live box score, in case a player was subbed out in the missing play
	let forceRowUpdate =
		playIndex !== undefined &&
		prevPlayIndex.current !== undefined &&
		playIndex - prevPlayIndex.current > 1;

	// Always update when game ends (needed to show DNPs after live sim ends)
	if (boxScore.gameOver) {
		forceRowUpdate = true;
	}

	const handleKeydown = useCallback(
		(e: KeyboardEvent) => {
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
		boxScore.won?.name !== undefined ? boxScore.won : boxScore.teams[0];
	const t1 =
		boxScore.lost?.name !== undefined ? boxScore.lost : boxScore.teams[1];

	let forcedWinText = null;
	if (boxScore.forceWin !== undefined) {
		const pure = boxScore.forceWin <= 500;

		// Live game sim still has final score in won/lost.pts
		const tie = boxScore.won.pts === boxScore.lost.pts;

		forcedWinText = (
			<>
				<br />
				Forced {tie ? "tie" : "win"} in{" "}
				<span
					className={pure ? "text-success" : "text-danger"}
					title={
						pure
							? `${tie ? "Tie" : "Win"} was forced without giving a bonus to ${
									tie ? "either" : "the winning"
							  } team`
							: `Forcing the ${tie ? "tie" : "win"} required giving ${
									tie ? "a" : "the winning"
							  } team a bonus`
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
						sportState={sportState}
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
				sportState={sportState}
			/>
			Attendance: {helpers.numberWithCommas(boxScore.att)}
			{forcedWinText}
		</>
	);
};

export default BoxScoreWrapper;
