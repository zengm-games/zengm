import classNames from "classnames";
import { CSSProperties, Fragment } from "react";
import { ResponsiveTableWrapper, MovOrDiff } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import useClickable from "../hooks/useClickable";
import type { View } from "../../common/types";
import { isSport, TIEBREAKERS } from "../../common";

type StandingsTeam = View<"standings">["rankingGroups"]["league"][number][number];

const MAX_WIDTH = 1320;

const record = (
	seasonAttrs: StandingsTeam["seasonAttrs"],
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
	showTiebreakers,
	t,
	ties,
	otl,
	type,
	usePts,
	userTid,
}: Pick<
	View<"standings">,
	"season" | "showTiebreakers" | "ties" | "otl" | "type" | "usePts" | "userTid"
> & {
	separator: boolean;
	t: StandingsTeam;
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
			{usePts ? null : <td>{helpers.roundWinp(t.seasonAttrs.winp)}</td>}
			<td>{usePts ? Math.round(t.seasonAttrs.pts) : t.gb[type]}</td>
			<td>{record(t.seasonAttrs, "Home")}</td>
			<td>{record(t.seasonAttrs, "Away")}</td>
			<td>{record(t.seasonAttrs, "Div")}</td>
			<td>{record(t.seasonAttrs, "Conf")}</td>
			<td>{helpers.roundStat(t.stats.pts, "pts")}</td>
			<td>{helpers.roundStat(t.stats.oppPts, "oppPts")}</td>
			<td>
				<MovOrDiff
					stats={
						isSport("basketball")
							? {
									pts: t.stats.pts * t.stats.gp,
									oppPts: t.stats.oppPts * t.stats.gp,
									gp: t.stats.gp,
							  }
							: t.stats
					}
					type={isSport("basketball") ? "mov" : "diff"}
				/>
			</td>
			<td>{t.seasonAttrs.streak}</td>
			<td>{t.seasonAttrs.lastTen}</td>
			<td>
				{showTiebreakers && t.tiebreaker ? TIEBREAKERS[t.tiebreaker] : null}
			</td>
		</tr>
	);
};

export const ColPtsOrGB = ({
	alignRight,
	pointsFormula,
	usePts,
}: {
	alignRight?: true;
	pointsFormula: string;
	usePts: boolean;
}) => {
	const col = getCols(usePts ? "Pts" : "GB")[0];
	if (usePts) {
		col.desc = `Points (${pointsFormula})`;
	}

	const style: CSSProperties | undefined = alignRight
		? { textAlign: "right" }
		: undefined;

	return (
		<th style={style} title={col.desc}>
			{col.title}
		</th>
	);
};

const width100 = {
	width: "100%",
};

const GroupStandings = ({
	name,
	pointsFormula,
	season,
	separatorIndex,
	showTiebreakers,
	teams,
	ties,
	otl,
	type,
	usePts,
	userTid,
}: Pick<
	View<"standings">,
	| "pointsFormula"
	| "season"
	| "showTiebreakers"
	| "ties"
	| "otl"
	| "usePts"
	| "type"
	| "userTid"
> & {
	name?: string;
	separatorIndex?: number;
	teams: StandingsTeam[];
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
						{usePts ? null : <th>%</th>}
						<ColPtsOrGB pointsFormula={pointsFormula} usePts={usePts} />
						<th>Home</th>
						<th>Road</th>
						<th>Div</th>
						<th>Conf</th>
						{isSport("hockey") ? (
							<th title="Goals For">GF</th>
						) : (
							<th title="Points Scored">PS</th>
						)}
						{isSport("hockey") ? (
							<th title="Goals Against">GA</th>
						) : (
							<th title="Points Against">PA</th>
						)}
						{isSport("basketball") ? (
							<th title="Average Margin of Victory">MOV</th>
						) : (
							<th title="Point Differential">Diff</th>
						)}
						<th>Streak</th>
						<th>L10</th>
						<th style={{ minWidth: 191 }}>Tiebreaker</th>
					</tr>
				</thead>
				<tbody>
					{teams.map((t, i) => (
						<GroupStandingsRow
							key={t.tid}
							t={t}
							season={season}
							separator={separatorIndex === i}
							showTiebreakers={showTiebreakers}
							otl={otl}
							ties={ties}
							type={type}
							usePts={usePts}
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
	usePts,
	userTid,
}: {
	i: number;
	maxPlayoffSeed: number;
	playoffsByConference: boolean;
	season: number;
	t: StandingsTeam;
	usePts: boolean;
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
				{usePts
					? Math.round(t.seasonAttrs.pts)
					: playoffsByConference
					? t.gb.conf
					: t.gb.league}
			</td>
		</tr>
	);
};

const SmallStandings = ({
	maxPlayoffSeed,
	playoffsByConference,
	pointsFormula,
	season,
	teams,
	userTid,
	usePts,
}: Pick<
	View<"standings">,
	| "maxPlayoffSeed"
	| "playoffsByConference"
	| "pointsFormula"
	| "season"
	| "usePts"
	| "userTid"
> & {
	teams: StandingsTeam[];
}) => {
	return (
		<table className="table table-striped table-bordered table-sm">
			<thead>
				<tr>
					<th style={width100}>Team</th>
					<ColPtsOrGB
						alignRight
						pointsFormula={pointsFormula}
						usePts={usePts}
					/>
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
						usePts={usePts}
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
	pointsFormula,
	rankingGroups,
	season,
	showTiebreakers,
	tiebreakers,
	ties,
	otl,
	type,
	usePts,
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
			teams: StandingsTeam[];
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
						teams: rankingGroups.league[0],
					},
				],
			},
		];
	} else if (type === "conf") {
		let separatorIndex: number | undefined;
		if (playoffsByConference || confs.length === 1) {
			separatorIndex = maxPlayoffSeed - 1;
		}
		groups = confs.map((conf, i) => ({
			name: conf.name,
			subgroups: [
				{
					separatorIndex,
					teams: rankingGroups.conf[i],
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
				.map(div => {
					const j = divs.findIndex(div2 => div2 === div);
					return {
						name: div.name,
						separatorIndex,
						teams: rankingGroups.div[j],
					};
				}),
		}));
	}

	const footer = (
		<>
			<div className="float-md-left">
				z - clinched {playoffsByConference ? "a" : "the"} #1 seed
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
			<div className="float-md-right mt-3 mt-md-0" style={{ maxWidth: 400 }}>
				<p>Tiebreakers for the {season} season:</p>
				<ol>
					{tiebreakers.map(key => (
						<li key={key}>{TIEBREAKERS[key]}</li>
					))}
				</ol>
				<p>
					The value shown in the "Tiebreaker" column above means "reason this
					team is ahead of all the tied teams below it, for this level of
					standings". You can switch between division/conference/league
					standings to view the tiebreaker results at different levels.
				</p>
			</div>
		</>
	);

	const groupStandings = groups.map(({ name, subgroups }, i) => (
		<Fragment key={i}>
			{name ? <h2>{name}</h2> : null}
			{subgroups.map((subgroup, j) => (
				<GroupStandings
					key={j}
					{...subgroup}
					pointsFormula={pointsFormula}
					season={season}
					showTiebreakers={showTiebreakers}
					otl={otl}
					ties={ties}
					type={type}
					usePts={usePts}
					userTid={userTid}
				/>
			))}
			{i === groups.length - 1 ? footer : null}
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
									playoffsByConference={playoffsByConference}
									pointsFormula={pointsFormula}
									season={season}
									teams={rankingGroups.conf[i]}
									userTid={userTid}
									usePts={usePts}
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
						playoffsByConference={playoffsByConference}
						pointsFormula={pointsFormula}
						season={season}
						teams={rankingGroups.league[0]}
						userTid={userTid}
						usePts={usePts}
					/>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="d-inline-block">{allStandings}</div>
		</>
	);
};

export default Standings;
