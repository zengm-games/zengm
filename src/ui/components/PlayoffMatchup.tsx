import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../util";

type SeriesTeam = {
	abbrev: string;
	cid: number;
	imgURL?: string;
	pts?: number;
	regularSeason: {
		won: number;
		lost: number;
		tied?: number;
	};
	region: string;
	seed: number;
	tid: number;
	winp: number;
	won?: number;
};

const faded = {
	opacity: 0.3,
};

const Team = ({
	expandTeamName,
	team,
	season,
	showPts,
	showWon,
	userTid,
	won,
	lost,
	gid,
}: {
	expandTeamName: boolean;
	team?: SeriesTeam;
	season: number;
	showPts: boolean;
	showWon: boolean;
	userTid: number;
	won: boolean;
	lost: boolean;
	gid?: number;
}) => {
	if (!team) {
		return null;
	}

	const wonPtsLink = (value: number) => {
		if (gid === undefined) {
			return <div className="ml-auto pr-2">{value}</div>;
		}

		return (
			<a
				className="ml-auto pr-2 h-100 d-flex align-items-center"
				href={helpers.leagueUrl([
					"game_log",
					`${team.abbrev}_${team.tid}`,
					season,
					gid,
				])}
			>
				{value}
			</a>
		);
	};

	return (
		<li
			className={classNames("border border-bottom-0", {
				"font-weight-bold": won,
				"table-info": team.tid === userTid,
				"text-muted": lost,
			})}
		>
			<div className="playoff-matchup-logo d-flex align-items-center justify-content-center">
				{team.imgURL ? (
					<img
						className="mw-100 mh-100"
						style={lost ? faded : undefined}
						src={team.imgURL}
						alt=""
					/>
				) : null}
			</div>
			<div className="mx-1">
				{team.seed}.<br />
				&nbsp;
			</div>
			<div className="mr-1">
				<a
					className={classNames({
						"text-muted": lost,
					})}
					href={helpers.leagueUrl([
						"roster",
						`${team.abbrev}_${team.tid}`,
						season,
					])}
				>
					{expandTeamName ? (
						team.region
					) : (
						<>
							<span className="d-xxl-none">{team.abbrev}</span>
							<span className="d-none d-xxl-inline">{team.region}</span>
						</>
					)}
				</a>
				<br />
				<span className="text-muted">
					{team.regularSeason.won}-{team.regularSeason.lost}
					{team.regularSeason.tied !== undefined &&
					team.regularSeason.tied > 0 ? (
						<>-{team.regularSeason.tied}</>
					) : null}
				</span>
			</div>
			{showWon && typeof team.won === "number" ? wonPtsLink(team.won) : null}
			{!showWon && showPts && typeof team.pts === "number"
				? wonPtsLink(team.pts)
				: null}
		</li>
	);
};

const PlayoffMatchup = ({
	expandTeamNames = false,
	numGamesToWinSeries = 7,
	season,
	series,
	userTid,
}: {
	expandTeamNames?: boolean;
	numGamesToWinSeries?: number;
	season: number;
	series?: {
		away?: SeriesTeam;
		home: SeriesTeam;
		gids?: number[];
	};
	userTid: number;
}) => {
	if (
		series === undefined ||
		series.home === undefined ||
		series.home.tid === undefined
	) {
		return null;
	}

	const homeWon =
		!series.away ||
		(series.home.hasOwnProperty("won") &&
			series.home.won === numGamesToWinSeries);
	const awayWon =
		!!series.away &&
		series.away.hasOwnProperty("won") &&
		series.away.won === numGamesToWinSeries;
	const showPts =
		!!series.away &&
		series.away.pts !== undefined &&
		series.home.pts !== undefined &&
		numGamesToWinSeries === 1;
	const showWon = !!series.away && numGamesToWinSeries > 1;

	const gid =
		series.gids && series.gids.length > 0
			? series.gids[series.gids.length - 1]
			: undefined;

	return (
		<ul className="playoff-matchup border-bottom">
			<Team
				expandTeamName={expandTeamNames}
				team={series.home}
				season={season}
				showPts={showPts}
				showWon={showWon}
				userTid={userTid}
				won={homeWon}
				lost={awayWon}
				gid={gid}
			/>
			<Team
				expandTeamName={expandTeamNames}
				team={series.away}
				season={season}
				showPts={showPts}
				showWon={showWon}
				userTid={userTid}
				won={awayWon}
				lost={homeWon}
				gid={gid}
			/>
		</ul>
	);
};

PlayoffMatchup.propTypes = {
	expandTeamNames: PropTypes.bool,
	numGamesToWinSeries: PropTypes.number,
	season: PropTypes.number.isRequired,
	series: PropTypes.shape({
		away: PropTypes.shape({
			abbrev: PropTypes.string.isRequired,
			region: PropTypes.string.isRequired,
			seed: PropTypes.number.isRequired,
			tid: PropTypes.number.isRequired,
			pts: PropTypes.number,
			won: PropTypes.number,
		}),
		home: PropTypes.shape({
			abbrev: PropTypes.string.isRequired,
			region: PropTypes.string.isRequired,
			seed: PropTypes.number.isRequired,
			tid: PropTypes.number.isRequired,
			pts: PropTypes.number,
			won: PropTypes.number,
		}),
	}),
	userTid: PropTypes.number.isRequired,
};

export default PlayoffMatchup;
