import clsx from "clsx";
import type { ByConf, View } from "../../common/types.ts";
import { helpers } from "../util/helpers.ts";
import type { ReactNode } from "react";

type SeriesTeam = {
	abbrev: string;
	cid: number;
	colors: [string, string, string];
	imgURL?: string;
	imgURLSmall?: string;
	pendingPlayIn?: true;
	pts?: number;
	sPts?: number;
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
	byConf: ByConf;
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
			(t) => team.seed === t.seed && (!byConf || team.cid === t.cid),
		);

		if (teamEdited) {
			const highlightUser = teamEdited.tid === userTid;

			let teamsFiltered = teams;
			if (byConf) {
				teamsFiltered = teams.filter((t) => t.cid === teamEdited.cid);
			}

			return (
				<li
					className={clsx("border border-bottom-0", {
						"table-info": highlightUser,
					})}
				>
					<TeamLogo team={teamEdited} />
					<select
						className="form-select god-mode"
						onChange={(event) => {
							const tid = Number.parseInt(event.target.value);
							const newTeam = teams.find((t) => t.tid === tid);
							if (newTeam) {
								editing.onChange(teamEdited, newTeam);
							}
						}}
						value={teamEdited.tid}
					>
						{teamsFiltered.map((t) => {
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

	const wonPtsLink = (value: ReactNode) => {
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
			className={clsx("border border-bottom-0", {
				"fw-bold": won,
				"table-info": highlightUser,
				"table-warning": won && extraHighlight && !highlightUser,
				"text-body-secondary": lost,
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
						className={clsx({
							"text-body-secondary": lost,
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
					<span className="text-body-secondary">
						{helpers.formatRecord(team.regularSeason)}
					</span>
				</div>
			)}
			{showWon && typeof team.won === "number" ? wonPtsLink(team.won) : null}
			{!showWon && showPts && typeof team.pts === "number"
				? wonPtsLink(
						<>
							{team.pts}
							{team.sPts !== undefined ? (
								<span className="fw-normal">&nbsp;({team.sPts})</span>
							) : null}
						</>,
					)
				: null}
		</li>
	);
};

const ChampionshipBanner = ({
	season,
	t,
}: {
	season: number;
	t: SeriesTeam;
}) => {
	return (
		<div
			style={{
				position: "absolute",
				top: "100%",
				left: 0,
			}}
		>
			<svg
				fill="none"
				preserveAspectRatio="xMidYMid meet"
				viewBox="0 0 182 247"
				width="100%"
				xmlns="http://www.w3.org/2000/svg"
			>
				{[14, 165.5].map((x, i) => {
					return (
						<rect
							key={i}
							style={{ fill: "var(--bs-border-color)" }}
							height="16.3951"
							width="2.5"
							x={x}
						></rect>
					);
				})}
				<path
					d="M12 24.5C12 23.6716 12.6716 23 13.5 23H168.5C169.328 23 170 23.6716 170 24.5V222.874L91 247L12 222.874V24.5Z"
					fill={t.colors[0]}
				></path>
				<path
					d="M14 221.394V25H168V221.394L91 244.909L14 221.394Z"
					stroke={t.colors[2]}
					strokeWidth="4"
				></path>
				<rect
					fill={t.colors[0]}
					height="16"
					rx="6"
					stroke={t.colors[2]}
					strokeWidth="3"
					width="164"
					x="9"
					y="16"
				></rect>
				<foreignObject
					height="100%"
					width="100%"
					x="0"
					y="50"
					style={{ color: t.colors[1] }}
				>
					<div className="text-center" style={{ fontSize: 36, lineHeight: 1 }}>
						{season}
					</div>
					<div
						className="d-flex align-items-center justify-content-center my-3"
						style={{ height: 74 }}
					>
						{t.imgURL || t.imgURLSmall ? (
							<img
								className="mw-100 mh-100"
								src={t.imgURL ?? t.imgURLSmall}
								alt=""
							/>
						) : null}
					</div>
					<div className="text-center" style={{ fontSize: 16, lineHeight: 1 }}>
						League Champions
					</div>
				</foreignObject>
			</svg>
		</div>
	);
};

export const PlayoffMatchup = ({
	bannerForWinner,
	editing,
	expandTeamNames = false,
	extraHighlight,
	numGamesToWinSeries = 7,
	season,
	series,
	userTid,
}: {
	bannerForWinner?: boolean;
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

	const homeWon = !series.away || series.home.won === numGamesToWinSeries;
	const awayWon = series.away?.won === numGamesToWinSeries;
	const showPts =
		!!series.away &&
		series.away.pts !== undefined &&
		series.home.pts !== undefined &&
		numGamesToWinSeries === 1;
	const showWon = !!series.away && numGamesToWinSeries > 1;

	const gid =
		series.gids && series.gids.length > 0 ? series.gids.at(-1) : undefined;

	const bannerTeam = bannerForWinner
		? homeWon
			? series.home
			: awayWon
				? series.away
				: undefined
		: undefined;

	return (
		<div className="position-relative">
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
			{bannerTeam ? (
				<ChampionshipBanner season={season} t={bannerTeam} />
			) : null}
		</div>
	);
};
