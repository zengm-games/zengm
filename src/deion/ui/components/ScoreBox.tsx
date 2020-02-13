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
};

const getRecord = (t: Team) => {
	if (t.won === undefined || t.lost === undefined) {
		return "";
	}
	if (t.tied === undefined) {
		return ` ${t.won}-${t.lost}`;
	}
	return ` ${t.won}-${t.lost}-${t.tied}`;
};

const ScoreBox = ({
	game,
	header,
}: {
	displayAbbrevs?: boolean;
	game: {
		gid: number;
		overtimes?: number;
		season: number;
		teams: [Team, Team];
	};
	header?: boolean;
}) => {
	const {
		homeCourtAdvantage,
		teamAbbrevsCache,
		teamImgURLsCache,
		teamNamesCache,
		teamRegionsCache,
		userTid,
	} = useLocalShallow(state => ({
		homeCourtAdvantage: state.homeCourtAdvantage,
		teamAbbrevsCache: state.teamAbbrevsCache,
		teamImgURLsCache: state.teamImgURLsCache,
		teamNamesCache: state.teamNamesCache,
		teamRegionsCache: state.teamRegionsCache,
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
		game.teams[0].ovr !== undefined && game.teams[1].ovr !== undefined;

	let spreads: [string | undefined, string | undefined] | undefined;
	if (game.teams[0].ovr !== undefined && game.teams[1].ovr !== undefined) {
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

	return (
		<div className="score-box mb-3">
			{header ? (
				<div className="d-flex justify-content-end score-box-header text-muted">
					{hasOvrs ? (
						<div className="p-1" title="Team Overall Rating">
							Ovr
						</div>
					) : null}
					{spreads ? (
						<div
							className="score-box-spread text-right p-1"
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
			<div className="border-light">
				{[1, 0].map(i => {
					const t = game.teams[i];
					let scoreClasses;
					if (winner !== undefined && t.tid === userTid) {
						scoreClasses = {
							"alert-success": winner === i,
							"alert-danger": winner !== i,
							"alert-warning": winner === -1,
						};
					}

					const imgURL = teamImgURLsCache[t.tid];

					return (
						<div
							key={i}
							className={classNames("d-flex align-items-center", scoreClasses)}
						>
							{imgURL ? (
								<div className="score-box-logo d-flex align-items-center justify-content-center">
									<img className="mw-100 mh-100" src={imgURL} alt="" />
								</div>
							) : null}
							<div className="flex-grow-1 p-1 text-truncate">
								<a
									href={helpers.leagueUrl(["roster", teamAbbrevsCache[t.tid]])}
								>
									{teamRegionsCache[t.tid]} {teamNamesCache[t.tid]}
								</a>
								{getRecord(t)}
							</div>
							{hasOvrs ? <div className="p-1 text-right">{t.ovr}</div> : null}
							{spreads ? (
								<div className="score-box-spread p-1 text-right">
									{spreads[i]}
								</div>
							) : null}
							{final ? (
								<div
									className={classNames(
										"score-box-score p-1 text-right font-weight-bold",
										scoreClasses,
									)}
								>
									<a
										href={helpers.leagueUrl([
											"game_log",
											teamAbbrevsCache[t.tid],
											game.season,
											game.gid,
										])}
									>
										{t.pts}
									</a>
								</div>
							) : null}
						</div>
					);
				})}
			</div>
			{overtimes ? (
				<div className="d-flex justify-content-end text-muted">
					<div className="text-right text-muted p-1">{overtimes}</div>
				</div>
			) : null}
		</div>
	);
};

export default ScoreBox;
