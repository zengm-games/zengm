import classNames from "classnames";
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

const GroupStandingsRow = ({
	season,
	t,
	ties,
	type,
	userTid,
}: Pick<View<"standings">, "season" | "ties" | "type" | "userTid"> & {
	t: View<"standings">["teams"][number];
}) => {
	const { clicked, toggleClicked } = useClickable();

	return (
		<tr
			key={t.tid}
			className={classNames({
				"table-info": t.tid === userTid,
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			<td>
				{t.rank.playoffs > 0 ? `${t.rank.playoffs}. ` : null}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${t.seasonAttrs.abbrev}_${t.tid}`,
						season,
					])}
				>
					{t.seasonAttrs.region} {t.seasonAttrs.name}
				</a>
				{t.seasonAttrs.clinchedPlayoffs
					? ` ${t.seasonAttrs.clinchedPlayoffs}`
					: null}
			</td>
			<td>{t.seasonAttrs.won}</td>
			<td>{t.seasonAttrs.lost}</td>
			{ties ? <td>{t.seasonAttrs.tied}</td> : null}
			<td>{helpers.roundWinp(t.seasonAttrs.winp)}</td>
			<td>{t.gb[type]}</td>
			<td>{record(t.seasonAttrs, "Home", ties)}</td>
			<td>{record(t.seasonAttrs, "Away", ties)}</td>
			<td>{record(t.seasonAttrs, "Div", ties)}</td>
			<td>{record(t.seasonAttrs, "Conf", ties)}</td>
			<td>{t.seasonAttrs.streak}</td>
			<td>{t.seasonAttrs.lastTen}</td>
		</tr>
	);
};

const width100 = {
	width: "100%",
};

const GroupStandings = ({
	name,
	season,
	teams,
	ties,
	type,
	userTid,
}: Pick<View<"standings">, "season" | "teams" | "ties" | "type" | "userTid"> & {
	name?: string;
}) => {
	return (
		<ResponsiveTableWrapper>
			<table className="table table-striped table-bordered table-sm table-hover">
				<thead>
					<tr>
						<th style={width100}>{name}</th>
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
					{teams.map(t => (
						<GroupStandingsRow
							key={t.tid}
							t={t}
							season={season}
							ties={ties}
							type={type}
							userTid={userTid}
						/>
					))}
				</tbody>
			</table>
		</ResponsiveTableWrapper>
	);
};

const SmallStandingsRow = ({
	i,
	maxPlayoffSeed,
	playoffsByConference,
	season,
	t,
	userTid,
}: {
	i: number;
	maxPlayoffSeed: number;
	playoffsByConference: boolean;
	season: number;
	t: View<"standings">["teams"][number];
	userTid: number;
}) => {
	const { clicked, toggleClicked } = useClickable();

	return (
		<tr
			key={t.tid}
			className={classNames({
				"table-info": t.tid === userTid,
				"table-warning": clicked,
				separator: i === maxPlayoffSeed - 1,
			})}
			onClick={toggleClicked}
		>
			<td>
				{playoffsByConference ? t.rank.conf : t.rank.league}.{" "}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${t.seasonAttrs.abbrev}_${t.tid}`,
						season,
					])}
				>
					{t.seasonAttrs.region}
				</a>
				{t.seasonAttrs.clinchedPlayoffs
					? ` ${t.seasonAttrs.clinchedPlayoffs}`
					: null}
			</td>
			<td className="text-right">
				{playoffsByConference ? t.gb.conf : t.gb.league}
			</td>
		</tr>
	);
};

const SmallStandings = ({
	maxPlayoffSeed,
	playoffsByConference,
	season,
	teams,
	userTid,
}: Pick<
	View<"standings">,
	"maxPlayoffSeed" | "playoffsByConference" | "season" | "teams" | "userTid"
>) => {
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
						maxPlayoffSeed={maxPlayoffSeed}
						playoffsByConference={playoffsByConference}
						season={season}
						t={t}
						userTid={userTid}
					/>
				))}
			</tbody>
		</table>
	);
};

const Standings = ({
	confs,
	divs,
	maxPlayoffSeed,
	numPlayoffByes,
	playoffsByConference,
	season,
	teams,
	ties,
	type,
	userTid,
}: View<"standings">) => {
	useTitleBar({
		title: "Standings",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "standings",
		dropdownFields: {
			seasons: season,
			standingsType: type,
		},
	});

	let groups: {
		name?: string;
		subgroups: {
			name?: string;
			teams: typeof teams;
		}[];
	}[];
	if (type === "league") {
		groups = [
			{
				subgroups: [
					{
						teams,
					},
				],
			},
		];
	} else if (type === "conf") {
		groups = confs.map(conf => ({
			name: conf.name,
			subgroups: [
				{
					teams: teams.filter(t => t.seasonAttrs.cid === conf.cid),
				},
			],
		}));
	} else {
		groups = confs.map(conf => ({
			name: conf.name,
			subgroups: divs
				.filter(div => div.cid === conf.cid)
				.map(div => ({
					name: div.name,
					teams: teams.filter(t => t.seasonAttrs.did === div.did),
				})),
		}));
	}

	const groupStandings = groups.map(({ name, subgroups }, i) => (
		<React.Fragment key={i}>
			{name ? <h2>{name}</h2> : null}
			{subgroups.map((subgroup, j) => (
				<GroupStandings
					key={j}
					{...subgroup}
					season={season}
					ties={ties}
					type={type}
					userTid={userTid}
				/>
			))}
		</React.Fragment>
	));

	// Show small playoff standings if we're currently viewing the division standings and if the playoff standings differ from the division standings (like multiple divisions get grouped together to determine playoff ranking)
	const confHasMultipleDivs = confs.some(
		conf => divs.filter(div => div.cid === conf.cid).length > 1,
	);
	const showSmallPlayoffStandings =
		type === "div" &&
		((playoffsByConference && confHasMultipleDivs) ||
			(!playoffsByConference && divs.length > 1));

	let allStandings;

	if (!showSmallPlayoffStandings) {
		// No small standings
		allStandings = <div style={{ maxWidth: 750 }}>{groupStandings}</div>;
	} else if (playoffsByConference) {
		// Show small standings alongside each conference
		allStandings = (
			<div className="row" style={{ maxWidth: 1000 }}>
				{groupStandings.map((confStandings, i) => {
					return (
						<React.Fragment key={i}>
							<div className="col-md-9">{confStandings}</div>
							<div className="col-md-3 d-none d-md-block">
								<h2>&nbsp;</h2>
								<SmallStandings
									maxPlayoffSeed={maxPlayoffSeed}
									season={season}
									teams={teams.filter(t => t.seasonAttrs.cid === confs[i].cid)}
									userTid={userTid}
									playoffsByConference={playoffsByConference}
								/>
							</div>
						</React.Fragment>
					);
				})}
			</div>
		);
	} else {
		// Show small standings for whole league
		allStandings = (
			<div className="row" style={{ maxWidth: 1000 }}>
				<div className="col-md-9">{groupStandings}</div>
				<div className="col-md-3 d-none d-md-block">
					<h2>&nbsp;</h2>
					<SmallStandings
						maxPlayoffSeed={maxPlayoffSeed}
						season={season}
						teams={teams}
						userTid={userTid}
						playoffsByConference={playoffsByConference}
					/>
				</div>
			</div>
		);
	}

	return (
		<>
			{allStandings}
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
		</>
	);
};

export default Standings;
