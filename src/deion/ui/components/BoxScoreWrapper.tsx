import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";
import { PHASE } from "../../common";
import {
	helpers,
	overrides,
	realtimeUpdate,
	toWorker,
	useLocalShallow,
} from "../util";

const TeamNameLink = ({
	season,
	t,
}: {
	season: number;
	t: {
		abbrev: string;
		name: string;
		region: string;
		tid: number;
	};
}) => {
	return t.tid >= 0 ? (
		<a href={helpers.leagueUrl(["roster", t.abbrev, season])}>
			{t.region} {t.name}
		</a>
	) : (
		<>
			{t.region} {t.name}
		</>
	);
};
TeamNameLink.propTypes = {
	season: PropTypes.number.isRequired,
	t: PropTypes.object.isRequired,
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
				<TeamNameLink season={boxScore.season} t={t0} /> {t0.pts},{" "}
				<TeamNameLink season={boxScore.season} t={t1} /> {t1.pts}
				{boxScore.overtime}
			</h2>
			{liveGameSim ? (
				<div className="mb-2">
					{boxScore.gameOver
						? "Final score"
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
		<table className="table table-bordered table-sm">
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
}: {
	abbrev?: string;
	boxScore: any;
	currentGidInList?: boolean;
	nextGid?: number;
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

				await realtimeUpdate(
					[],
					helpers.leagueUrl(["game_log", abbrev, boxScore.season, nextGid]),
				);

				if (mounted) {
					setClickedGoToNext(false);
				}
			}
		};

		whatever();

		return () => {
			mounted = false;
		};
	}, [abbrev, autoGoToNext, boxScore.season, nextGid]);

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
			(nextGid === undefined || clickedGoToNext) &&
			(phase === PHASE.REGULAR_SEASON || phase === PHASE.PLAYOFFS) ? (
				<button
					className="btn btn-light-bordered"
					disabled={!canPlay || autoGoToNext}
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
						abbrev,
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
}: {
	abbrev?: string;
	boxScore: any;
	currentGidInList?: boolean;
	nextGid?: number;
	prevGid?: number;
	showNextPrev?: boolean;
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
							abbrev,
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
					<table className="table table-bordered table-sm">
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
};

const BoxScore = ({
	abbrev,
	boxScore,
	currentGidInList,
	nextGid,
	prevGid,
	showNextPrev,
	Row,
}: {
	abbrev?: string;
	boxScore: any;
	currentGidInList?: boolean;
	nextGid?: number;
	prevGid?: number;
	showNextPrev?: boolean;
	Row: any;
}) => {
	const handleKeydown = useCallback(
		e => {
			if (showNextPrev) {
				if (e.keyCode === 37 && boxScore && prevGid !== undefined) {
					// prev
					realtimeUpdate(
						[],
						helpers.leagueUrl(["game_log", abbrev, boxScore.season, prevGid]),
					);
				} else if (e.keyCode === 39 && boxScore && nextGid !== undefined) {
					// next
					realtimeUpdate(
						[],
						helpers.leagueUrl(["game_log", abbrev, boxScore.season, nextGid]),
					);
				}
			}
		},
		[abbrev, boxScore, nextGid, prevGid, showNextPrev],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [handleKeydown]);

	return (
		<>
			<div className="text-center">
				<HeadlineScore boxScore={boxScore} />
				<DetailedScore
					abbrev={abbrev}
					boxScore={boxScore}
					currentGidInList={currentGidInList}
					key={boxScore.gid}
					nextGid={nextGid}
					prevGid={prevGid}
					showNextPrev={showNextPrev}
				/>
			</div>
			<overrides.components.BoxScore boxScore={boxScore} Row={Row} />
			Attendance: {helpers.numberWithCommas(boxScore.att)}
		</>
	);
};

BoxScore.propTypes = {
	abbrev: PropTypes.string,
	boxScore: PropTypes.object.isRequired,
	currentGidInList: PropTypes.bool,
	nextGid: PropTypes.number,
	prevGid: PropTypes.number,
	showNextPrev: PropTypes.bool,
	Row: PropTypes.any,
};

export default BoxScore;
