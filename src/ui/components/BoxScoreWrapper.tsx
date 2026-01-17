import clsx from "clsx";
import {
	useCallback,
	useEffect,
	useState,
	useRef,
	type CSSProperties,
} from "react";
import { isSport, PHASE, STARTING_NUM_TIMEOUTS } from "../../common/index.ts";
import {
	gradientStyleFactory,
	helpers,
	realtimeUpdate,
	toWorker,
	useLocalPartial,
} from "../util/index.ts";
import BoxScore from "./BoxScore.tsx";
import { range } from "../../common/utils.ts";
import getWinner from "../../common/getWinner.ts";
import { OverlayTrigger, Popover } from "react-bootstrap";
import Note from "../views/Player/Note.tsx";
import TeamLogoInline from "./TeamLogoInline.tsx";

const TeamNameLink = ({
	children,
	className,
	season,
	style,
	t,
}: {
	children: any;
	className?: string;
	season: number;
	style?: CSSProperties;
	t: {
		abbrev: string;
		name: string;
		region: string;
		tid: number;
	};
}) => {
	return (
		<>
			{t.tid >= 0 ? (
				<a
					href={helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`, season])}
					className={className}
					style={style}
				>
					{children}
				</a>
			) : (
				<>{children}</>
			)}
		</>
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
		timeouts?: number;
	};
}) => {
	return t.imgURL !== undefined && t.imgURL !== "" ? (
		<div className="w-100 d-none d-lg-flex justify-content-center">
			<div>
				<TeamNameLink
					season={season}
					t={t}
					className="d-flex align-items-center justify-content-center"
					style={{ height: 100, width: 120 }}
				>
					<img className="mw-100 mh-100" src={t.imgURL} alt="" />
				</TeamNameLink>
				<div className="mt-1 mb-3 fw-bold text-center">
					{helpers.formatRecord(t)}
				</div>
			</div>
		</div>
	) : null;
};

const TeamNameAndScore = ({
	boxScore,
	live,
	possessionNum,
	shootout,
	t,
}: {
	boxScore: any;
	live: boolean | undefined;
	possessionNum: 0 | 1;
	shootout: boolean;
	t: any;
}) => {
	const LOGO_SIZE = 24;

	return (
		<div className="d-flex">
			{live && !boxScore.gameOver ? (
				<div
					className={
						boxScore.possession === possessionNum ? "text-warning" : "opacity-0"
					}
					style={{ marginTop: -1 }}
				>
					●&nbsp;
				</div>
			) : null}
			{t.playoffs ? (
				<div
					className="text-body-secondary fs-5 align-self-end"
					style={{ paddingBottom: STARTING_NUM_TIMEOUTS !== undefined ? 8 : 1 }}
				>
					{t.playoffs.seed}.&nbsp;
				</div>
			) : null}
			<div>
				<TeamNameLink
					className="d-flex align-items-center gap-1"
					season={boxScore.season}
					t={t}
				>
					<TeamLogoInline
						imgURL={t.imgURL}
						imgURLSmall={t.imgURLSmall}
						size={LOGO_SIZE}
					/>
					<div>
						{t.season !== undefined ? `${t.season} ` : null}
						<span className="d-none d-xl-inline">
							{t.region} {t.name}
						</span>
						<span className="d-none d-lg-inline d-xl-none">
							{boxScore.exhibition ? "" : `${t.region} `}
							{t.name}
						</span>
						<span className="d-none d-sm-inline d-lg-none">
							{boxScore.exhibition ? t.abbrev : t.name}
						</span>
						<span className="d-inline d-sm-none">{t.abbrev}</span>
					</div>
				</TeamNameLink>
				{t.timeouts !== undefined && STARTING_NUM_TIMEOUTS !== undefined ? (
					<div
						className="d-flex gap-1 pt-1"
						title={`${t.timeouts} ${helpers.plural("timeout", t.timeouts)} remaining`}
						style={{ marginLeft: LOGO_SIZE + 4 }}
					>
						{range(STARTING_NUM_TIMEOUTS).map((i) => (
							<div
								key={i}
								style={{ width: 12, height: 3 }}
								className={i < t.timeouts ? "bg-warning" : "bg-tertiary"}
							/>
						))}
					</div>
				) : null}
			</div>
			<div>&nbsp;{t.pts}</div>
			{shootout ? (
				<div className="text-body-secondary">&nbsp;({t.sPts})</div>
			) : null}
		</div>
	);
};

export const HeadlineScoreLive = ({
	boxScore,
	isStuck,
}: {
	boxScore: any;
	isStuck: boolean;
}) => {
	// Historical games will have boxScore.won.name and boxScore.lost.name so use that for ordering, but live games
	// won't. This is hacky, because the existence of this property is just a historical coincidence, and maybe it'll
	// change in the future.
	const t0 =
		boxScore.won?.name !== undefined ? boxScore.won : boxScore.teams[0];
	const t1 =
		boxScore.lost?.name !== undefined ? boxScore.lost : boxScore.teams[1];

	const shootout = t0.sPts !== undefined;

	const clockText = boxScore.gameOver
		? "F"
		: boxScore.elamTarget !== undefined
			? `Target: ${boxScore.elamTarget} pts`
			: isSport("baseball")
				? `${
						boxScore.teams[0].ptsQtrs.length ===
						boxScore.teams[1].ptsQtrs.length
							? "B"
							: "T"
					}${boxScore.quarterShort}`
				: `${boxScore.quarterShort}, ${boxScore.time}`;

	return (
		<div className="d-flex justify-content-center">
			<div
				className={`d-flex flex-wrap align-items-center ${isStuck ? "live-game-score-actual-stuck" : "bg-white"} py-md-1 px-md-2 rounded-bottom-4 live-game-score-actual`}
			>
				<div className="d-flex h2 mb-0">
					<TeamNameAndScore
						boxScore={boxScore}
						possessionNum={0}
						live
						shootout={shootout}
						t={t0}
					/>
				</div>
				<div className="d-flex h2 mb-0 ms-3">
					<TeamNameAndScore
						boxScore={boxScore}
						possessionNum={1}
						live
						shootout={shootout}
						t={t1}
					/>
					{boxScore.overtime ? <div>&nbsp;{boxScore.overtime}</div> : null}
				</div>
				<div className="d-flex h2 mb-0 ms-auto ms-md-3">
					<div
						className="text-nowrap fs-6 align-self-end"
						style={{
							paddingBottom: 2,
							paddingTop: STARTING_NUM_TIMEOUTS !== undefined ? 0 : 7,
						}}
					>
						{clockText}
					</div>
				</div>
			</div>
		</div>
	);
};

const HeadlineScore = ({ boxScore }: { boxScore: any }) => {
	// Historical games will have boxScore.won.name and boxScore.lost.name so use that for ordering, but live games
	// won't. This is hacky, because the existence of this property is just a historical coincidence, and maybe it'll
	// change in the future.
	const t0 =
		boxScore.won?.name !== undefined ? boxScore.won : boxScore.teams[0];
	const t1 =
		boxScore.lost?.name !== undefined ? boxScore.lost : boxScore.teams[1];

	const shootout = t0.sPts !== undefined;

	return (
		<div>
			<h2 className="d-flex flex-wrap justify-content-center mb-2 gap-3">
				<div className="d-flex">
					<TeamNameAndScore
						boxScore={boxScore}
						possessionNum={0}
						live={false}
						shootout={shootout}
						t={t0}
					/>
				</div>
				<div className="d-flex">
					<TeamNameAndScore
						boxScore={boxScore}
						possessionNum={1}
						live={false}
						shootout={shootout}
						t={t1}
					/>
					{boxScore.overtime ? <div>&nbsp;{boxScore.overtime}</div> : null}
				</div>
			</h2>
		</div>
	);
};

/**
 * https://mail.google.com/mail/u/0/#inbox/FMfcgzQXJkPnPxpcVRXBlWLkzstDqRhL?compose=DmwnWsCZDhLblTHmqrNNxtXpHpcPFDdgTvQWnRHjZxklJKgDrKvMXQjlFhvrMzWLxNgRsnbTGzqv
 * Shooting factor: FG Pts - FGM*LgEffic - (1-LgOR%)*FGX*LgEffic
 * Turnover factor: -LgEffic*TOV
 * Rebound factor: [(1-LgOR%)*OREB - LgOR%*OppDREB]*LgEffic
 * Free throw factor: FTM - 0.4*FTA*LgEffic + 0.06*(FTA-FTM)*LgEffic
 * LgEffic is the league average points per possession (like 1.06, for example). In the NBA, it's about 1.15. In the Olympics, it was about 1.11. In the WNBA it's around 1.02. Lower at lower levels, usually.
 * LgOR% is the league average offensive rebounding percentage. It tends to be about 0.28, though can be higher at lower levels.
 * Do those calculations for each team, then do the difference so things approximately add up to the final score difference.
 */
const getFourFactorsNetPoints = (teams: any[]) => {
	// These should be adjusted for league averages, but doens't seem to matter much, so whatever
	const lgEffic = 1.15;
	const lgOrbPct = 0.28;

	// For testing with data from https://x.com/DeanO_Lytics/status/1846229178808406137
	/*const teams = [
		{
			fg: 43,
			fga: 92,
			tp: 16,
			tov: 16,
			ft: 18,
			fta: 28,
			drb: 30,
			orb: 17,
		},
		{
			fg: 43,
			fga: 79,
			tp: 13,
			tov: 18,
			ft: 17,
			fta: 29,
			drb: 33,
			orb: 7,
		},
	];*/

	const fourFactorsNetPoints = {
		efg: 0,
		tov: 0,
		orb: 0,
		ft: 0,
	};
	for (let i = 0; i < teams.length; i++) {
		const t = teams[i];
		const t2 = teams[1 - i];

		const sign = i === 0 ? 1 : -1;

		const fgPts = 2 * t.fg + t.tp;

		fourFactorsNetPoints.efg +=
			sign *
			(fgPts - t.fg * lgEffic - (1 - lgOrbPct) * (t.fga - t.fg) * lgEffic);
		fourFactorsNetPoints.tov += sign * (-lgEffic * t.tov);
		fourFactorsNetPoints.orb +=
			sign * ((1 - lgOrbPct) * t.orb - lgOrbPct * t2.drb) * lgEffic;
		fourFactorsNetPoints.ft +=
			sign * (t.ft - 0.4 * t.fta * lgEffic + 0.06 * (t.fta - t.ft) * lgEffic);
	}

	return fourFactorsNetPoints;
};

const FourFactorsAmountLine = ({
	amount,
	teams,
}: {
	amount: number;
	teams: any[];
}) => {
	const abbrev = amount > 0 ? teams[0].abbrev : teams[1].abbrev;
	const amountFixed = Math.abs(amount).toFixed(1);
	if (amountFixed === "0.0") {
		return "even";
	}

	return (
		<>
			+{amountFixed} for {abbrev}
		</>
	);
};

const FourFactorsTotalLine = ({
	fourFactorsNetPoints,
	teams,
}: {
	fourFactorsNetPoints: ReturnType<typeof getFourFactorsNetPoints>;
	teams: any[];
}) => {
	const total =
		fourFactorsNetPoints.efg +
		fourFactorsNetPoints.tov +
		fourFactorsNetPoints.orb +
		fourFactorsNetPoints.ft;
	const totalFixed = Math.abs(total).toFixed(1);
	if (totalFixed === "0.0") {
		return "even";
	}

	const abbrev = total > 0 ? teams[0].abbrev : teams[1].abbrev;
	return (
		<>
			+{totalFixed} for {abbrev}
		</>
	);
};

const FourFactors = ({ teams }: { teams: any[] }) => {
	const fourFactorsNetPoints = getFourFactorsNetPoints(teams);

	// +10 shows up in the gradient as maximum color, unless there is one component beyond that, in which case we use that value to highlight how extreme it is. But keeping +10 as the minumum possible max is good to show when they are all pretty close.
	const maxMagnitude = Math.max(
		Math.max(...Object.values(fourFactorsNetPoints).map((x) => Math.abs(x))),
		10,
	);

	const gradientStyle = gradientStyleFactory(-maxMagnitude, 0, 0, maxMagnitude);

	return (
		<OverlayTrigger
			overlay={
				<Popover>
					<Popover.Body style={{ width: 170 }}>
						<p>Estimated value of four factors in net points:</p>
						<ul className="list-unstyled mb-0">
							<li>
								eFG%:{" "}
								<FourFactorsAmountLine
									amount={fourFactorsNetPoints.efg}
									teams={teams}
								/>
							</li>
							<li>
								TOV%:{" "}
								<FourFactorsAmountLine
									amount={fourFactorsNetPoints.tov}
									teams={teams}
								/>
							</li>
							<li>
								ORB%:{" "}
								<FourFactorsAmountLine
									amount={fourFactorsNetPoints.orb}
									teams={teams}
								/>
							</li>
							<li>
								FT/FGA:{" "}
								<FourFactorsAmountLine
									amount={fourFactorsNetPoints.ft}
									teams={teams}
								/>
							</li>
							<li className="fw-bold">
								Total:{" "}
								<FourFactorsTotalLine
									fourFactorsNetPoints={fourFactorsNetPoints}
									teams={teams}
								/>
							</li>
						</ul>
					</Popover.Body>
				</Popover>
			}
			placement="bottom"
			rootClose
			trigger="click"
		>
			<table className="table table-sm mb-2 mb-sm-0 cursor-pointer">
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

						// Can't always take Math.abs because sometimes the 4 factors leader is not the net pts leader, since the 4 factors values are not used directly in the net pts formulas
						const gradientSign = i === 0 ? 1 : -1;

						return (
							<tr key={t.abbrev}>
								<td
									style={
										efg > efg2
											? gradientStyle(gradientSign * fourFactorsNetPoints.efg)
											: undefined
									}
								>
									{helpers.roundStat(efg, "efg")}
								</td>
								<td
									style={
										tovp < tovp2
											? gradientStyle(gradientSign * fourFactorsNetPoints.tov)
											: undefined
									}
								>
									{helpers.roundStat(tovp, "tovp")}
								</td>
								<td
									style={
										orbp > orbp2
											? gradientStyle(gradientSign * fourFactorsNetPoints.orb)
											: undefined
									}
								>
									{helpers.roundStat(orbp, "orbp")}
								</td>
								<td
									style={
										ftpFga > ftpFga2
											? gradientStyle(gradientSign * fourFactorsNetPoints.ft)
											: undefined
									}
								>
									{helpers.roundStat(ftpFga, "ftpFga")}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</OverlayTrigger>
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
				// Hack, because otherwise the updateEvent with "gameSim" comes before this one, but doesn't finish yet, so in updatePage this update gets canceled even though it's a new URL (because it's the same page)
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
		(option) => option.id === "day" || option.id === "week",
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
					className={clsx("btn", "btn-light-bordered", {
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
				{outs} {helpers.plural("out", outs)}
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
	const qtrs: {
		title?: string;
		label: string;
		bold?: boolean;
	}[] = range(numPeriods).map((i) => {
		return {
			label:
				i < boxScore.numPeriods || isSport("baseball")
					? `${i + 1}`
					: `OT${i - boxScore.numPeriods + 1}`,
		};
	});

	if (isSport("baseball")) {
		qtrs.push(
			{
				label: "R",
				title: "Runs",
				bold: true,
			},
			{
				label: "H",
				title: "Hits",
				bold: true,
			},
			{
				label: "E",
				title: "Errors",
				bold: true,
			},
		);
	} else {
		qtrs.push({
			label: "F",
			title: "Final score",
			bold: true,
		});
	}

	const shootout = boxScore.teams[0].sPts !== undefined;

	if (shootout) {
		qtrs.push({
			label: "S",
			title: "Shootout",
			bold: true,
		});
	}

	// Historical games will have boxScore.won.name and boxScore.lost.name so use that for ordering, but live games
	// won't. This is hacky, because the existence of this property is just a historical coincidence, and maybe it'll
	// change in the future.
	const liveGameSim = boxScore.won?.name === undefined;

	return (
		<div className="d-flex align-items-center justify-content-center">
			{showNextPrev ? (
				<div className="me-4">
					<a
						className={clsx("btn", "btn-light-bordered", {
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
								{qtrs.map((info) => (
									<th
										key={info.label}
										className={info.bold ? undefined : "text-body-secondary"}
										title={info.title}
									>
										{info.label}
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
									{range(numPeriods - t.ptsQtrs.length).map((i) => (
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
									{shootout ? <th>{t.sPts}</th> : null}
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
	live,
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
	live?: boolean;
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
	}, [playIndex]);
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
		const tie = getWinner([boxScore.won, boxScore.lost]) === -1;

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
			<div className="d-flex align-items-center">
				<TeamLogo season={boxScore.season} t={t0} />
				<div className="mx-auto flex-shrink-0 mb-2 mw-100">
					{!live ? <HeadlineScore boxScore={boxScore} /> : null}
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
					<div className="mt-sm-1 text-center">
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
			{boxScore.neutralSite ? (
				<>
					<br />
					Played at a neutral site
				</>
			) : null}
			{forcedWinText}
			{boxScore.exhibition ? null : (
				<div className="mt-3">
					<Note
						key={boxScore.gid}
						initialNote={boxScore.note}
						info={{
							type: "game",
							gid: boxScore.gid,
						}}
						infoLink
					/>
				</div>
			)}
		</>
	);
};

export default BoxScoreWrapper;
