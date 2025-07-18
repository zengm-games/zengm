import clsx from "clsx";
import { type CSSProperties, Fragment } from "react";
import {
	ResponsiveTableWrapper,
	MovOrDiff,
	TeamLogoInline,
} from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCol, helpers } from "../util/index.ts";
import useClickable from "../hooks/useClickable.tsx";
import type { TeamSeason, View } from "../../common/types.ts";
import { bySport, isSport, TIEBREAKERS } from "../../common/index.ts";

type StandingsTeam =
	View<"standings">["rankingGroups"]["league"][number][number];

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

// These styles, and flex-nowrap, are to handle overflow for long region names on the dashboard like https://stackoverflow.com/a/11877033/786644
const tdStyle = {
	maxWidth: 0,
};

export const TeamColumn = ({
	maxRank,
	rank,
	season,
	t,
	includeName,
}: {
	maxRank: number;
	rank: number | null;
	season?: number;
	t: {
		tid: number;
		seasonAttrs: Pick<
			TeamSeason,
			"abbrev" | "clinchedPlayoffs" | "imgURL" | "imgURLSmall" | "region"
		> & {
			// Only required with includeName
			name?: string;
		};
	};
	includeName?: boolean;
}) => {
	const rankMinWidth = 8 + 7 * (String(maxRank).length - 1);

	// Why is this one column, rather than two (one for rank, one for team) which would be simpler and avoid rankMinWidth? Because the header on the dashboard table - colspan 2 works weirdly, and colspan 1 leaves padding on the left.
	return (
		<td style={tdStyle}>
			<div className="d-flex align-items-center">
				<div
					className="text-end"
					style={{
						minWidth: rankMinWidth,
					}}
				>
					{rank !== null ? rank : null}
				</div>
				<TeamLogoInline
					imgURL={t.seasonAttrs.imgURL}
					imgURLSmall={t.seasonAttrs.imgURLSmall}
					className="mx-1 flex-shrink-0"
				/>
				<div className="text-truncate">
					<a
						href={helpers.leagueUrl([
							"roster",
							`${t.seasonAttrs.abbrev}_${t.tid}`,
							season,
						])}
					>
						<span className="d-none d-sm-inline">
							{t.seasonAttrs.region}
							{includeName ? ` ${t.seasonAttrs.name}` : null}
						</span>
						<span className="d-sm-none">{t.seasonAttrs.abbrev}</span>
					</a>
					{t.seasonAttrs.clinchedPlayoffs
						? ` ${t.seasonAttrs.clinchedPlayoffs}`
						: null}
				</div>
			</div>
		</td>
	);
};

const GroupStandingsRow = ({
	maxRank,
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
	maxRank: number;
	separator: boolean;
	t: StandingsTeam;
}) => {
	const { clicked, toggleClicked } = useClickable();

	return (
		<tr
			key={t.tid}
			className={clsx({
				"table-info": t.tid === userTid,
				"table-warning": clicked,
				separator,
			})}
			onClick={toggleClicked}
		>
			<TeamColumn
				maxRank={maxRank}
				rank={t.rank.playoffs > 0 ? t.rank.playoffs : null}
				season={season}
				t={t}
				includeName
			/>
			<td>{t.seasonAttrs.won}</td>
			<td>{t.seasonAttrs.lost}</td>
			{otl ? <td>{t.seasonAttrs.otl}</td> : null}
			{ties ? <td>{t.seasonAttrs.tied}</td> : null}
			{usePts ? null : <td>{helpers.roundWinp(t.seasonAttrs.winp)}</td>}
			<td>{usePts ? Math.round(t.seasonAttrs.pts) : t.gb[type]}</td>
			{usePts ? <td>{helpers.roundWinp(t.seasonAttrs.ptsPct)}</td> : null}
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
	const col = getCol(usePts ? "PTS" : "GB");
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
	separatorIndexes,
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
	separatorIndexes: number[];
	teams: StandingsTeam[];
}) => {
	const maxRank = Math.max(...teams.map((t) => t.rank.playoffs));

	return (
		<ResponsiveTableWrapper>
			<table className="table table-striped table-borderless table-sm table-hover sticky-x">
				<thead>
					<tr>
						<th className="standings-name">{name}</th>
						<th>W</th>
						<th>L</th>
						{otl ? <th>OTL</th> : null}
						{ties ? <th>T</th> : null}
						{usePts ? null : <th>%</th>}
						<ColPtsOrGB pointsFormula={pointsFormula} usePts={usePts} />
						{usePts ? <th>PTS%</th> : null}
						<th>Home</th>
						<th>Road</th>
						<th>Div</th>
						<th>Conf</th>
						{bySport({
							baseball: <th title="Runs Scored">RS</th>,
							hockey: <th title="Goals For">GF</th>,
							default: <th title="Points Scored">PS</th>,
						})}
						{bySport({
							baseball: <th title="Runs Allowed">RA</th>,
							hockey: <th title="Goals Against">GA</th>,
							default: <th title="Points Against">PA</th>,
						})}
						{bySport({
							baseball: <th title="Run Differential">Diff</th>,
							basketball: <th title="Average Margin of Victory">MOV</th>,
							football: <th title="Point Differential">Diff</th>,
							hockey: <th title="Goal Differential">Diff</th>,
						})}
						<th>Streak</th>
						<th>L10</th>
						<th style={{ minWidth: 191 }}>Tiebreaker</th>
					</tr>
				</thead>
				<tbody>
					{teams.map((t, i) => (
						<GroupStandingsRow
							key={t.tid}
							maxRank={maxRank}
							t={t}
							season={season}
							separator={separatorIndexes.includes(i)}
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
	maxPlayoffSeedNoPlayIn,
	maxRank,
	playoffsByConf,
	season,
	t,
	usePts,
	userTid,
}: {
	i: number;
	maxPlayoffSeed: number;
	maxPlayoffSeedNoPlayIn: number;
	maxRank: number;
	playoffsByConf: boolean;
	season: number;
	t: StandingsTeam;
	usePts: boolean;
	userTid: number;
}) => {
	const { clicked, toggleClicked } = useClickable();

	return (
		<tr
			key={t.tid}
			className={clsx({
				"table-info": t.tid === userTid,
				"table-warning": clicked,
				separator: i === maxPlayoffSeed - 1 || i === maxPlayoffSeedNoPlayIn - 1,
			})}
			onClick={toggleClicked}
		>
			<TeamColumn
				maxRank={maxRank}
				rank={playoffsByConf ? t.rank.conf : t.rank.league}
				season={season}
				t={t}
			/>
			<td className="text-end">
				{usePts
					? Math.round(t.seasonAttrs.pts)
					: playoffsByConf
						? t.gb.conf
						: t.gb.league}
			</td>
		</tr>
	);
};

const SmallStandings = ({
	maxPlayoffSeed,
	maxPlayoffSeedNoPlayIn,
	playoffsByConf,
	pointsFormula,
	season,
	teams,
	userTid,
	usePts,
}: Pick<
	View<"standings">,
	| "maxPlayoffSeed"
	| "maxPlayoffSeedNoPlayIn"
	| "playoffsByConf"
	| "pointsFormula"
	| "season"
	| "usePts"
	| "userTid"
> & {
	teams: StandingsTeam[];
}) => {
	const maxRank = Math.max(
		...teams.map((t) => (playoffsByConf ? t.rank.conf : t.rank.league)),
	);

	return (
		<table className="table table-striped table-borderless table-hover table-sm">
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
						maxPlayoffSeedNoPlayIn={maxPlayoffSeedNoPlayIn}
						maxRank={maxRank}
						playoffsByConf={playoffsByConf}
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
	maxPlayoffSeedNoPlayIn,
	numPlayoffByes,
	playIn,
	playoffsByConf,
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
		(conf) => divs.filter((div) => div.cid === conf.cid).length > 1,
	);
	const showSmallPlayoffStandings =
		type === "div" &&
		((playoffsByConf && confHasMultipleDivs) ||
			(!playoffsByConf && divs.length > 1));

	let groups: {
		name?: string;
		subgroups: {
			name?: string;
			separatorIndexes: number[];
			teams: StandingsTeam[];
		}[];
	}[];
	if (type === "league") {
		const separatorIndexes: number[] = [];
		if (!playoffsByConf) {
			separatorIndexes.push(maxPlayoffSeed - 1);
			if (maxPlayoffSeed !== maxPlayoffSeedNoPlayIn) {
				separatorIndexes.push(maxPlayoffSeedNoPlayIn - 1);
			}
		}
		groups = [
			{
				subgroups: [
					{
						separatorIndexes,
						teams: rankingGroups.league[0]!,
					},
				],
			},
		];
	} else if (type === "conf") {
		const separatorIndexes: number[] = [];
		if (playoffsByConf || confs.length === 1) {
			separatorIndexes.push(maxPlayoffSeed - 1);
			if (maxPlayoffSeed !== maxPlayoffSeedNoPlayIn) {
				separatorIndexes.push(maxPlayoffSeedNoPlayIn - 1);
			}
		}
		groups = confs.map((conf, i) => ({
			name: conf.name,
			subgroups: [
				{
					separatorIndexes,
					teams: rankingGroups.conf[i]!,
				},
			],
		}));
	} else {
		const separatorIndexes: number[] = [];
		if ((playoffsByConf && !confHasMultipleDivs) || divs.length === 1) {
			separatorIndexes.push(maxPlayoffSeed - 1);
			if (maxPlayoffSeed !== maxPlayoffSeedNoPlayIn) {
				separatorIndexes.push(maxPlayoffSeedNoPlayIn - 1);
			}
		}
		groups = confs.map((conf) => ({
			name: conf.name,
			subgroups: divs
				.filter((div) => div.cid === conf.cid)
				.map((div) => {
					const j = divs.indexOf(div);
					return {
						name: div.name,
						separatorIndexes,
						teams: rankingGroups.div[j]!,
					};
				}),
		}));
	}

	const footer = (
		<>
			<div className="float-md-start">
				z - clinched {playoffsByConf ? "a" : "the"} #1 seed
				<br />
				{numPlayoffByes > 0 ? (
					<>
						y - clinched first round bye
						<br />
					</>
				) : null}
				x - clinched playoffs
				<br />
				{playIn ? (
					<>
						w - clinched play-in tournament
						<br />
					</>
				) : null}
				o - eliminated from playoff contention
			</div>
			<div className="float-md-end mt-3 mt-md-0" style={{ maxWidth: 400 }}>
				<p>Tiebreakers for the {season} season:</p>
				<ol>
					{tiebreakers.map((key) => (
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

	const SMALL_STANDINGS_WIDTH = 200;

	let allStandings;

	if (!showSmallPlayoffStandings) {
		// No small standings
		allStandings = (
			<div className="d-flex">
				<div style={{ minWidth: 0 }}>{groupStandings}</div>
			</div>
		);
	} else if (playoffsByConf) {
		// Show small standings alongside each conference
		allStandings = (
			<Fragment>
				{groupStandings.map((confStandings, i) => {
					return (
						<div className="d-flex" key={i}>
							<div style={{ minWidth: 0 }}>{confStandings}</div>
							<div
								className="d-none d-md-block ms-3"
								style={{ minWidth: SMALL_STANDINGS_WIDTH }}
							>
								<h2>&nbsp;</h2>
								<SmallStandings
									maxPlayoffSeed={maxPlayoffSeed}
									maxPlayoffSeedNoPlayIn={maxPlayoffSeedNoPlayIn}
									playoffsByConf={playoffsByConf}
									pointsFormula={pointsFormula}
									season={season}
									teams={rankingGroups.conf[i]!}
									userTid={userTid}
									usePts={usePts}
								/>
							</div>
						</div>
					);
				})}
			</Fragment>
		);
	} else {
		// Show small standings for whole league
		allStandings = (
			<div className="d-flex">
				<div>{groupStandings}</div>
				<div
					className="d-none d-md-block ms-3"
					style={{ minWidth: SMALL_STANDINGS_WIDTH }}
				>
					<h2>&nbsp;</h2>
					<SmallStandings
						maxPlayoffSeed={maxPlayoffSeed}
						maxPlayoffSeedNoPlayIn={maxPlayoffSeedNoPlayIn}
						playoffsByConf={playoffsByConf}
						pointsFormula={pointsFormula}
						season={season}
						teams={rankingGroups.league[0]!}
						userTid={userTid}
						usePts={usePts}
					/>
				</div>
			</div>
		);
	}

	return allStandings;
};

export default Standings;
