import classNames from "classnames";
import { Fragment } from "react";
import { ResponsiveTableWrapper, MarginOfVictory } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import useClickable from "../hooks/useClickable";
import type { View } from "../../common/types";
import { COURT } from "../../common";

const MAX_WIDTH = 1120;

const record = (
	seasonAttrs: View<"standings">["teams"][number]["seasonAttrs"],
	type: "Home" | "Away" | "Div" | "Conf",
) => {
	const won = `won${type}` as const;
	const lost = `lost${type}` as const;
	const otl = `otl${type}` as const;
	const tied = `tied${type}` as const;

	let text = `${seasonAttrs[won]}-${seasonAttrs[lost]}`;
	if (seasonAttrs[otl] > 0) {
		text += `-${seasonAttrs[otl]}`;
	}
	if (seasonAttrs[tied] > 0) {
		text += `-${seasonAttrs[tied]}`;
	}
	return text;
};

const GroupStandingsRow = ({
	season,
	separator,
	t,
	ties,
	otl,
	type,
	userTid,
}: Pick<View<"standings">, "season" | "ties" | "otl" | "type" | "userTid"> & {
	separator: boolean;
	t: View<"standings">["teams"][number];
}) => {
	const { clicked, toggleClicked } = useClickable();

	return (
		<tr
			key={t.tid}
			className={classNames({
				"table-info": t.tid === userTid,
				"table-warning": clicked,
				separator,
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
			{otl ? <td>{t.seasonAttrs.otl}</td> : null}
			{ties ? <td>{t.seasonAttrs.tied}</td> : null}
			<td>{helpers.roundWinp(t.seasonAttrs.winp)}</td>
			<td>{t.gb[type]}</td>
			<td>{record(t.seasonAttrs, "Home")}</td>
			<td>{record(t.seasonAttrs, "Away")}</td>
			<td>{record(t.seasonAttrs, "Div")}</td>
			<td>{record(t.seasonAttrs, "Conf")}</td>
			<td>{helpers.roundStat(t.stats.pts, "pts")}</td>
			<td>{helpers.roundStat(t.stats.oppPts, "oppPts")}</td>
			<td>
				<MarginOfVictory>{t.stats.mov}</MarginOfVictory>
			</td>
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
	separatorIndex,
	teams,
	ties,
	otl,
	type,
	userTid,
}: Pick<
	View<"standings">,
	"season" | "teams" | "ties" | "otl" | "type" | "userTid"
> & {
	name?: string;
	separatorIndex?: number;
}) => {
	return (
		<ResponsiveTableWrapper>
			<table className="table table-striped table-bordered table-sm table-hover">
				<thead>
					<tr>
						<th style={width100}>{name}</th>
						<th>W</th>
						<th>L</th>
						{otl ? <th>OTL</th> : null}
						{ties ? <th>T</th> : null}
						<th>%</th>
						<th>GB</th>
						<th>Home</th>
						<th>Road</th>
						<th>Div</th>
						<th>Conf</th>
						<th title="Points Per Game">Pts</th>
						<th title="Opponent Points Per Game">Opp</th>
						<th title="Average Margin of Victory">MOV</th>
						<th>Streak</th>
						<th>L10</th>
					</tr>
				</thead>
				<tbody>
					{teams.map((t, i) => (
						<GroupStandingsRow
							key={t.tid}
							t={t}
							season={season}
							separator={separatorIndex === i}
							otl={otl}
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
	otl,
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

	// Show small playoff standings if we're currently viewing the division standings and if the playoff standings differ from the division standings (like multiple divisions get grouped together to determine playoff ranking)
	const confHasMultipleDivs = confs.some(
		conf => divs.filter(div => div.cid === conf.cid).length > 1,
	);
	const showSmallPlayoffStandings =
		type === "div" &&
		((playoffsByConference && confHasMultipleDivs) ||
			(!playoffsByConference && divs.length > 1));

	let groups: {
		name?: string;
		subgroups: {
			name?: string;
			separatorIndex?: number;
			teams: typeof teams;
		}[];
	}[];
	if (type === "league") {
		let separatorIndex: number | undefined;
		if (!playoffsByConference) {
			separatorIndex = maxPlayoffSeed - 1;
		}
		groups = [
			{
				subgroups: [
					{
						separatorIndex,
						teams,
					},
				],
			},
		];
	} else if (type === "conf") {
		let separatorIndex: number | undefined;
		if (playoffsByConference || confs.length === 1) {
			separatorIndex = maxPlayoffSeed - 1;
		}
		groups = confs.map(conf => ({
			name: conf.name,
			subgroups: [
				{
					separatorIndex,
					teams: teams.filter(t => t.seasonAttrs.cid === conf.cid),
				},
			],
		}));
	} else {
		let separatorIndex: number | undefined;
		if ((playoffsByConference && !confHasMultipleDivs) || divs.length === 1) {
			separatorIndex = maxPlayoffSeed - 1;
		}
		groups = confs.map(conf => ({
			name: conf.name,
			subgroups: divs
				.filter(div => div.cid === conf.cid)
				.map(div => ({
					name: div.name,
					separatorIndex,
					teams: teams.filter(t => t.seasonAttrs.did === div.did),
				})),
		}));
	}

	const groupStandings = groups.map(({ name, subgroups }, i) => (
		<Fragment key={i}>
			{name ? <h2>{name}</h2> : null}
			{subgroups.map((subgroup, j) => (
				<GroupStandings
					key={j}
					{...subgroup}
					season={season}
					otl={otl}
					ties={ties}
					type={type}
					userTid={userTid}
				/>
			))}
		</Fragment>
	));

	let allStandings;

	if (!showSmallPlayoffStandings) {
		// No small standings
		allStandings = (
			<div style={{ maxWidth: 0.75 * MAX_WIDTH - 30 }}>{groupStandings}</div>
		);
	} else if (playoffsByConference) {
		// Show small standings alongside each conference
		allStandings = (
			<div className="row" style={{ maxWidth: MAX_WIDTH }}>
				{groupStandings.map((confStandings, i) => {
					return (
						<Fragment key={i}>
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
						</Fragment>
					);
				})}
			</div>
		);
	} else {
		// Show small standings for whole league
		allStandings = (
			<div className="row" style={{ maxWidth: MAX_WIDTH }}>
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
				z - clinched #1 overall seed and home {COURT} advantage
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
