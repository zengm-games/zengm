import classNames from "classnames";
import type { View } from "../../common/types";
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

type TeamToEdit = View<"playoffs">["teamsToEdit"][number];

type Editing = {
	byConf: boolean;
	onChange: (prevTeam: TeamToEdit, newTeam: TeamToEdit) => void;
	teams: TeamToEdit[];
};

const faded = {
	opacity: 0.3,
	padding: 2,
};
const notFaded = {
	padding: 2,
};

const TeamLogo = ({
	lost,
	team,
}: {
	lost?: boolean;
	team: {
		imgURL?: string;
		imgURLSmall?: string;
		pendingPlayIn?: boolean;
	};
}) => {
	return (
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
	);
};

const Team = ({
	editing,
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
	editing?: Editing;
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

	if (!team.pendingPlayIn && editing) {
		const { teams, byConf } = editing;

		// If byConf, we need to find the seed in the same conference, cause multiple teams will have this seed. Otherwise, can just check seed.
		const teamEdited = teams.find(
			t => team.seed === t.seed && (!byConf || team.cid === t.cid),
		);

		if (teamEdited) {
			const highlightUser = teamEdited.tid === userTid;

			let teamsFiltered = teams;
			if (byConf) {
				teamsFiltered = teams.filter(t => t.cid === teamEdited.cid);
			}

			return (
				<li
					className={classNames("border border-bottom-0", {
						"table-info": highlightUser,
					})}
				>
					<TeamLogo team={teamEdited} />
					<select
						className="form-select god-mode"
						onChange={event => {
							const tid = parseInt(event.target.value);
							const newTeam = teams.find(t => t.tid === tid);
							if (newTeam) {
								editing.onChange(teamEdited, newTeam);
							}
						}}
						value={teamEdited.tid}
					>
						{teamsFiltered.map(t => {
							return (
								<option key={t.tid} value={t.tid}>
									{t.seed !== undefined ? `${t.seed}.` : null} {t.region}{" "}
									{t.name} ({t.record})
								</option>
							);
						})}
					</select>
				</li>
			);
		}
	}

	const wonPtsLink = (value: number) => {
		if (gid === undefined) {
			return <div className="ms-auto pe-2">{value}</div>;
		}

		return (
			<a
				className="ms-auto pe-2 h-100 d-flex align-items-center"
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
				"fw-bold": won,
				"table-info": highlightUser,
				"table-warning": won && extraHighlight && !highlightUser,
				"text-muted": lost,
			})}
		>
			<TeamLogo team={team} lost={lost} />
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
				<div className="me-1 overflow-hidden">
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
	editing,
	expandTeamNames = false,
	extraHighlight,
	numGamesToWinSeries = 7,
	season,
	series,
	userTid,
}: {
	editing?: Editing;
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
				editing={editing}
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
				editing={editing}
			/>
		</ul>
	);
};

export default PlayoffMatchup;
