import classNames from "classnames";
import PropTypes from "prop-types";
import { helpers } from "../util";

type SeriesTeam = {
	abbrev: string;
	cid: number;
	imgURL?: string;
	imgURLSmall?: string;
	pendingPlayIn?: true;
	pts?: number;
	regularSeason: {
		won: number;
		lost: number;
		tied?: number;
		otl?: number;
	};
	region: string;
	seed: number;
	tid: number;
	winp: number;
	won?: number;
};

const faded = {
	opacity: 0.3,
	padding: 2,
};
const notFaded = {
	padding: 2,
};

const Team = ({
	expandTeamName,
	extraHighlight,
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
	extraHighlight?: boolean;
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

	const highlightUser = team.tid === userTid && !team.pendingPlayIn;

	return (
		<li
			className={classNames("border border-bottom-0", {
				"font-weight-bold": won,
				"table-info": highlightUser,
				"table-warning": won && extraHighlight && !highlightUser,
				"text-muted": lost,
			})}
		>
			<div className="playoff-matchup-logo d-flex align-items-center justify-content-center flex-shrink-0">
				{!team.pendingPlayIn && (team.imgURL || team.imgURLSmall) ? (
					<img
						className="mw-100 mh-100"
						style={lost ? faded : notFaded}
						src={team.imgURLSmall ?? team.imgURL}
						alt=""
					/>
				) : null}
			</div>
			<div className="mx-1 align-self-start">{team.seed}.</div>
			{team.pendingPlayIn ? (
				<div className="align-self-start">
					{expandTeamName ? (
						"Play-In Team"
					) : (
						<>
							<span
								className="d-xxl-none"
								title="Play-in team, to be determined"
							>
								TBD
							</span>
							<span className="d-none d-xxl-inline">Play-In Team</span>
						</>
					)}
				</div>
			) : (
				<div className="mr-1 overflow-hidden">
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
						{team.regularSeason.otl !== undefined &&
						team.regularSeason.otl > 0 ? (
							<>-{team.regularSeason.otl}</>
						) : null}
						{team.regularSeason.tied !== undefined &&
						team.regularSeason.tied > 0 ? (
							<>-{team.regularSeason.tied}</>
						) : null}
					</span>
				</div>
			)}
			{showWon && typeof team.won === "number" ? wonPtsLink(team.won) : null}
			{!showWon && showPts && typeof team.pts === "number"
				? wonPtsLink(team.pts)
				: null}
		</li>
	);
};

const PlayoffMatchup = ({
	expandTeamNames = false,
	extraHighlight,
	numGamesToWinSeries = 7,
	season,
	series,
	userTid,
}: {
	expandTeamNames?: boolean;
	extraHighlight?: boolean;
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
		series.gids && series.gids.length > 0 ? series.gids.at(-1) : undefined;

	return (
		<ul className="playoff-matchup border-bottom">
			<Team
				expandTeamName={expandTeamNames}
				extraHighlight={extraHighlight}
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
				extraHighlight={extraHighlight}
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
