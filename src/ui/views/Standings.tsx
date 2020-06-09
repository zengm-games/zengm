import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { ResponsiveTableWrapper } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import useClickable from "../hooks/useClickable";
import type { View } from "../../common/types";

const record = (
	seasonAttrs: View<"standings">["teams"][number]["seasonAttrs"],
	type: "Home" | "Away" | "Div" | "Conf",
	ties: boolean,
) => {
	const won = `won${type}` as "wonHome" | "wonAway" | "wonDiv" | "wonConf";
	const lost = `lost${type}` as
		| "lostHome"
		| "lostAway"
		| "lostDiv"
		| "lostConf";
	const tied = `tied${type}` as
		| "tiedHome"
		| "tiedAway"
		| "tiedDiv"
		| "tiedConf";

	const val = `${seasonAttrs[won]}-${seasonAttrs[lost]}`;
	if (ties) {
		return `${val}-${seasonAttrs[tied]}`;
	}
	return val;
};

type Div = View<"standings">["confs"][number]["divs"][number];

const DivStandingsRow = ({
	season,
	t,
	ties,
}: {
	season: number;
	t: Div["teams"][number];
	ties: boolean;
}) => {
	const { clicked, toggleClicked } = useClickable();

	return (
		<tr
			key={t.tid}
			className={classNames({
				"table-info": t.highlight,
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			<td>
				{t.playoffsRank ? `${t.playoffsRank}. ` : null}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${t.seasonAttrs.abbrev}_${t.tid}`,
						season,
					])}
				>
					{t.seasonAttrs.region} {t.seasonAttrs.name}
				</a>
				{t.clinchedPlayoffs ? ` ${t.clinchedPlayoffs}` : null}
			</td>
			<td>{t.seasonAttrs.won}</td>
			<td>{t.seasonAttrs.lost}</td>
			{ties ? <td>{t.seasonAttrs.tied}</td> : null}
			<td>{helpers.roundWinp(t.seasonAttrs.winp)}</td>
			<td>{t.gb}</td>
			<td>{record(t.seasonAttrs, "Home", ties)}</td>
			<td>{record(t.seasonAttrs, "Away", ties)}</td>
			<td>{record(t.seasonAttrs, "Div", ties)}</td>
			<td>{record(t.seasonAttrs, "Conf", ties)}</td>
			<td>{t.seasonAttrs.streak}</td>
			<td>{t.seasonAttrs.lastTen}</td>
		</tr>
	);
};

DivStandingsRow.propTypes = {
	season: PropTypes.number.isRequired,
	t: PropTypes.object.isRequired,
	ties: PropTypes.bool.isRequired,
};

const width100 = {
	width: "100%",
};

const DivStandings = ({
	div,
	season,
	ties,
}: {
	div: Div;
	season: number;
	ties: boolean;
}) => {
	return (
		<ResponsiveTableWrapper>
			<table className="table table-striped table-bordered table-sm table-hover">
				<thead>
					<tr>
						<th style={width100}>{div.name}</th>
						<th>W</th>
						<th>L</th>
						{ties ? <th>T</th> : null}
						<th>%</th>
						<th>GB</th>
						<th>Home</th>
						<th>Road</th>
						<th>Div</th>
						<th>Conf</th>
						<th>Streak</th>
						<th>L10</th>
					</tr>
				</thead>
				<tbody>
					{div.teams.map(t => (
						<DivStandingsRow key={t.tid} t={t} season={season} ties={ties} />
					))}
				</tbody>
			</table>
		</ResponsiveTableWrapper>
	);
};

DivStandings.propTypes = {
	div: PropTypes.shape({
		name: PropTypes.string.isRequired,
		teams: PropTypes.arrayOf(PropTypes.object).isRequired,
	}).isRequired,
	season: PropTypes.number.isRequired,
	ties: PropTypes.bool.isRequired,
};

const SmallStandingsRow = ({
	i,
	numPlayoffTeams,
	season,
	t,
}: {
	i: number;
	numPlayoffTeams: number;
	season: number;
	t: View<"standings">["teams"][number];
}) => {
	const { clicked, toggleClicked } = useClickable();

	return (
		<tr
			key={t.tid}
			className={classNames({
				"table-info": t.highlight,
				"table-warning": clicked,
				separator: i === numPlayoffTeams - 1,
			})}
			onClick={toggleClicked}
		>
			<td>
				{t.rank}.{" "}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${t.seasonAttrs.abbrev}_${t.tid}`,
						season,
					])}
				>
					{t.seasonAttrs.region}
				</a>
				{t.clinchedPlayoffs ? ` ${t.clinchedPlayoffs}` : null}
			</td>
			<td style={{ textAlign: "right" }}>{t.gb}</td>
		</tr>
	);
};

SmallStandingsRow.propTypes = {
	i: PropTypes.number.isRequired,
	numPlayoffTeams: PropTypes.number.isRequired,
	season: PropTypes.number.isRequired,
	t: PropTypes.object.isRequired,
};

const SmallStandings = ({
	numPlayoffTeams,
	season,
	teams,
}: Pick<View<"standings">, "numPlayoffTeams" | "season" | "teams">) => {
	return (
		<table className="table table-striped table-bordered table-sm">
			<thead>
				<tr>
					<th style={width100}>Team</th>
					<th style={{ textAlign: "right" }}>GB</th>
				</tr>
			</thead>
			<tbody>
				{teams.map((t, i) => (
					<SmallStandingsRow
						key={t.tid}
						i={i}
						numPlayoffTeams={numPlayoffTeams}
						season={season}
						t={t}
					/>
				))}
			</tbody>
		</table>
	);
};

SmallStandings.propTypes = {
	numPlayoffTeams: PropTypes.number.isRequired,
	season: PropTypes.number.isRequired,
	teams: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const Standings = ({
	teams,
	confs,
	numPlayoffByes,
	numPlayoffTeams,
	playoffsByConference,
	season,
	ties,
}: View<"standings">) => {
	useTitleBar({
		title: "Standings",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "standings",
		dropdownFields: {
			seasons: season,
		},
	});

	let showClinchedPlayoffsText = false;
	for (const conf of confs) {
		for (const t of conf.teams) {
			if (t.clinchedPlayoffs !== undefined) {
				showClinchedPlayoffsText = true;
				break;
			}
		}
	}

	return (
		<>
			<div className="row" style={{ maxWidth: 1000 }}>
				<div className={!playoffsByConference ? "col-md-9" : "col-12"}>
					{confs.map((conf, i) => (
						<div
							key={conf.cid}
							style={{
								marginBottom: i < confs.length - 1 ? "1rem" : 0,
							}}
						>
							<h2>{conf.name}</h2>
							<div className="row">
								<div className={playoffsByConference ? "col-md-9" : "col-12"}>
									{conf.divs.map(div => (
										<DivStandings
											key={div.did}
											div={div}
											season={season}
											ties={ties}
										/>
									))}
								</div>

								{playoffsByConference ? (
									<div className="col-md-3 d-none d-md-block">
										<SmallStandings
											numPlayoffTeams={Math.floor(
												numPlayoffTeams / confs.length,
											)}
											season={season}
											teams={conf.teams}
										/>
									</div>
								) : null}
							</div>
						</div>
					))}
				</div>
				{!playoffsByConference ? (
					<div
						className="col-md-3 d-none d-md-block"
						style={{ paddingTop: 39 }}
					>
						<SmallStandings
							numPlayoffTeams={numPlayoffTeams}
							season={season}
							teams={teams}
						/>
					</div>
				) : null}
			</div>
			{showClinchedPlayoffsText ? (
				<div>
					z - clinched #1 overall seed and home{" "}
					{process.env.SPORT === "basketball" ? "court" : "field"} advantage
					<br />
					{numPlayoffByes > 0 ? (
						<>
							y - clinched first round bye
							<br />
						</>
					) : null}
					x - clinched playoffs
					<br />o - eliminated from playoff contention
				</div>
			) : null}
		</>
	);
};

Standings.propTypes = {
	teams: PropTypes.arrayOf(PropTypes.object).isRequired,
	confs: PropTypes.arrayOf(
		PropTypes.shape({
			cid: PropTypes.number.isRequired,
			name: PropTypes.string.isRequired,
			divs: PropTypes.arrayOf(PropTypes.object).isRequired,
		}),
	).isRequired,
	numPlayoffTeams: PropTypes.number.isRequired,
	playoffsByConference: PropTypes.bool.isRequired,
	season: PropTypes.number.isRequired,
	ties: PropTypes.bool.isRequired,
};

export default Standings;
