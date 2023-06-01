import { type ReactNode, useState } from "react";
import { DataTable, InjuryIcon, SafeHtml, SkillsBlock } from "../../components";
import Injuries from "./Injuries";
import useTitleBar from "../../hooks/useTitleBar";
import { getCols, helpers, groupAwards } from "../../util";
import type { View } from "../../../common/types";
import classNames from "classnames";
import { formatStatGameHigh } from "../PlayerStats";
import SeasonIcons from "./SeasonIcons";
import TopStuff from "./TopStuff";
import { isSport, PLAYER } from "../../../common";
import { expandFieldingStats } from "../../util/expandFieldingStats.baseball";
import TeamAbbrevLink from "../../components/TeamAbbrevLink";
import hideableSectionFactory from "../../components/hideableSectionFactory";

const SeasonLink = ({
	className,
	pid,
	season,
}: {
	className?: string;
	pid: number;
	season: number;
}) => {
	return (
		<a
			className={className}
			href={helpers.leagueUrl(["player_game_log", pid, season])}
		>
			{season}
		</a>
	);
};

const highlightLeaderText = (
	<>
		<span className="highlight-leader">Bold</span> indicates league leader
	</>
);

const StatsTable = ({
	name,
	onlyShowIf,
	p,
	stats,
	superCols,
	HideableSection,
	leaders,
}: {
	name: string;
	onlyShowIf?: string[];
	p: View<"player">["player"];
	stats: string[];
	superCols?: any[];
	HideableSection: ReturnType<typeof hideableSectionFactory>;
	leaders: View<"player">["leaders"];
}) => {
	const hasRegularSeasonStats = p.careerStats.gp > 0;
	const hasPlayoffStats = p.careerStatsPlayoffs.gp > 0;

	// Show playoffs by default if that's all we have
	const [playoffs, setPlayoffs] = useState(!hasRegularSeasonStats);

	// If game sim means we switch from having no stats to having some stats, make sure we're showing what we have
	if (hasRegularSeasonStats && !hasPlayoffStats && playoffs) {
		setPlayoffs(false);
	}
	if (!hasRegularSeasonStats && hasPlayoffStats && !playoffs) {
		setPlayoffs(true);
	}

	if (!hasRegularSeasonStats && !hasPlayoffStats) {
		return null;
	}

	let playerStats = p.stats.filter(ps => ps.playoffs === playoffs);
	const careerStats = playoffs ? p.careerStatsPlayoffs : p.careerStats;

	if (onlyShowIf !== undefined) {
		let display = false;
		for (const stat of onlyShowIf) {
			if (
				careerStats[stat] > 0 ||
				(Array.isArray(careerStats[stat]) &&
					(careerStats[stat] as any).length > 0)
			) {
				display = true;
				break;
			}
		}

		if (!display) {
			return null;
		}
	}

	const cols = getCols([
		"Year",
		"Team",
		"Age",
		...stats.map(stat =>
			stat === "pos"
				? "Pos"
				: `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`,
		),
	]);

	if (superCols) {
		superCols = helpers.deepCopy(superCols);

		// No name
		superCols[0].colspan -= 1;
	}

	if (isSport("basketball") && name === "Shot Locations") {
		cols.at(-3)!.title = "M";
		cols.at(-2)!.title = "A";
		cols.at(-1)!.title = "%";
	}

	let footer;
	if (isSport("baseball") && name === "Fielding") {
		playerStats = expandFieldingStats({
			rows: playerStats,
			stats,
		});

		footer = expandFieldingStats({
			rows: [careerStats],
			stats,
			addDummyPosIndex: true,
		}).map((object, i) => [
			i === 0 ? "Career" : null,
			null,
			null,
			...stats.map(stat => formatStatGameHigh(object, stat)),
		]);
	} else {
		footer = [
			"Career",
			null,
			null,
			...stats.map(stat => formatStatGameHigh(careerStats, stat)),
		];
	}

	const leadersType = playoffs ? "playoffs" : "regularSeason";

	let hasLeader = false;
	LEADERS_LOOP: for (const row of Object.values(leaders)) {
		if (row?.attrs.has("age")) {
			hasLeader = true;
			break;
		}

		for (const stat of stats) {
			if (row?.[leadersType].has(stat)) {
				hasLeader = true;
				break LEADERS_LOOP;
			}
		}
	}

	return (
		<HideableSection
			title={name}
			description={hasLeader ? highlightLeaderText : null}
		>
			<ul className="nav nav-tabs border-bottom-0">
				{hasRegularSeasonStats ? (
					<li className="nav-item">
						<button
							className={classNames("nav-link", {
								active: !playoffs,
								"border-bottom": !playoffs,
							})}
							onClick={() => {
								setPlayoffs(false);
							}}
						>
							Regular Season
						</button>
					</li>
				) : null}
				{hasPlayoffStats ? (
					<li className="nav-item">
						<button
							className={classNames("nav-link", {
								active: playoffs,
								"border-bottom": playoffs,
							})}
							onClick={() => {
								setPlayoffs(true);
							}}
						>
							Playoffs
						</button>
					</li>
				) : null}
			</ul>
			<DataTable
				className="mb-3"
				cols={cols}
				defaultSort={[0, "asc"]}
				defaultStickyCols={2}
				footer={footer}
				hideAllControls
				name={`Player:${name}`}
				rows={playerStats.map((ps, i) => {
					const className = ps.hasTot ? "text-body-secondary" : undefined;

					return {
						key: i,
						data: [
							{
								searchValue: ps.season,
								sortValue: i,
								value: (
									<>
										<SeasonLink
											className={className}
											pid={p.pid}
											season={ps.season}
										/>{" "}
										<SeasonIcons
											season={ps.season}
											awards={p.awards}
											playoffs={playoffs}
										/>
									</>
								),
							},
							<TeamAbbrevLink
								abbrev={ps.abbrev}
								className={className}
								season={ps.season}
								tid={ps.tid}
							/>,
							<MaybeBold bold={leaders[ps.season]?.attrs.has("age")}>
								{ps.age}
							</MaybeBold>,
							...stats.map(stat => (
								<MaybeBold
									bold={
										!ps.hasTot && leaders[ps.season]?.[leadersType].has(stat)
									}
								>
									{formatStatGameHigh(ps, stat)}
								</MaybeBold>
							)),
						],
						classNames: className,
					};
				})}
				superCols={superCols}
			/>
		</HideableSection>
	);
};

const MaybeBold = ({
	bold,
	children,
}: {
	bold: boolean | undefined;
	children: ReactNode;
}) => {
	if (bold) {
		return <span className="highlight-leader">{children}</span>;
	}

	return children as JSX.Element;
};

const Player2 = ({
	currentSeason,
	customMenu,
	events,
	feats,
	freeAgent,
	gender,
	godMode,
	injured,
	jerseyNumberInfos,
	leaders,
	phase,
	player,
	ratings,
	retired,
	showContract,
	showRatings,
	showTradeFor,
	showTradingBlock,
	spectator,
	statTables,
	statSummary,
	teamColors,
	teamJersey,
	teamName,
	teamURL,
	userTid,
	willingToSign,
}: View<"player">) => {
	useTitleBar({
		title: player.name,
		customMenu,
		dropdownView: "player",
		dropdownFields:
			player.tid !== PLAYER.UNDRAFTED
				? {
						playerProfile: "overview",
				  }
				: undefined,
		dropdownCustomURL: fields => {
			let gameLogSeason;
			if (player.stats.length > 0) {
				gameLogSeason = player.stats.at(-1)!.season;
			} else if (player.ratings.length > 0) {
				gameLogSeason = player.ratings.at(-1)!.season;
			} else {
				gameLogSeason = currentSeason;
			}

			const parts =
				fields.playerProfile === "gameLog"
					? ["player_game_log", player.pid, gameLogSeason]
					: ["player", player.pid];

			return helpers.leagueUrl(parts);
		},
	});

	const awardsGrouped = groupAwards(player.awards);

	const HideableSection = hideableSectionFactory(undefined);

	let hasLeader = false;
	for (const row of Object.values(leaders)) {
		if (row && (row.attrs.has("age") || row.ratings.size > 0)) {
			hasLeader = true;
			break;
		}
	}

	return (
		<>
			<TopStuff
				currentSeason={currentSeason}
				freeAgent={freeAgent}
				gender={gender}
				godMode={godMode}
				injured={injured}
				jerseyNumberInfos={jerseyNumberInfos}
				phase={phase}
				player={player}
				retired={retired}
				showContract={showContract}
				showRatings={showRatings}
				showTradeFor={showTradeFor}
				showTradingBlock={showTradingBlock}
				spectator={spectator}
				statSummary={statSummary}
				teamColors={teamColors}
				teamJersey={teamJersey}
				teamName={teamName}
				teamURL={teamURL}
				userTid={userTid}
				willingToSign={willingToSign}
			/>

			{statTables.map(({ name, onlyShowIf, stats, superCols }) => (
				<StatsTable
					key={name}
					name={name}
					onlyShowIf={onlyShowIf}
					stats={stats}
					superCols={superCols}
					p={player}
					HideableSection={HideableSection}
					leaders={leaders}
				/>
			))}

			<HideableSection
				title="Ratings"
				description={hasLeader && showRatings ? highlightLeaderText : null}
			>
				<DataTable
					className="mb-3"
					cols={getCols([
						"Year",
						"Team",
						"Age",
						"Pos",
						"Ovr",
						"Pot",
						...ratings.map(rating => `rating:${rating}`),
						"Skills",
					])}
					defaultSort={[0, "asc"]}
					defaultStickyCols={2}
					hideAllControls
					name="Player:Ratings"
					rows={player.ratings.map((r, i) => {
						return {
							key: i,
							data: [
								{
									searchValue: r.season,
									sortValue: i,
									value: (
										<>
											<SeasonLink pid={player.pid} season={r.season} />{" "}
											<SeasonIcons season={r.season} awards={player.awards} />
											{r.injuryIndex !== undefined &&
											player.injuries[r.injuryIndex] ? (
												<InjuryIcon
													injury={{
														type: player.injuries[r.injuryIndex].type,
														gamesRemaining: -1,
													}}
												/>
											) : null}
										</>
									),
								},
								<TeamAbbrevLink
									abbrev={r.abbrev}
									season={r.season}
									tid={r.tid}
								/>,
								<MaybeBold bold={leaders[r.season]?.attrs.has("age")}>
									{r.age}
								</MaybeBold>,
								r.pos,
								showRatings ? (
									<MaybeBold bold={leaders[r.season]?.ratings.has("ovr")}>
										{r.ovr}
									</MaybeBold>
								) : null,
								showRatings ? (
									<MaybeBold bold={leaders[r.season]?.ratings.has("pot")}>
										{r.pot}
									</MaybeBold>
								) : null,
								...ratings.map(rating =>
									showRatings ? (
										<MaybeBold bold={leaders[r.season]?.ratings.has(rating)}>
											{(r as any)[rating]}
										</MaybeBold>
									) : null,
								),
								<SkillsBlock className="skills-alone" skills={r.skills} />,
							],
						};
					})}
				/>
			</HideableSection>

			<div className="row">
				<div className="col-6 col-md-3">
					<HideableSection title="Awards">
						{awardsGrouped.length > 0 ? (
							<table className="table table-nonfluid table-striped table-borderless table-sm player-awards">
								<tbody>
									{awardsGrouped.map((a, i) => {
										return (
											<tr key={i}>
												<td>
													{a.count > 1 ? `${a.count}x ` : null}
													{a.type} ({a.seasons.join(", ")})
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						) : null}
						{awardsGrouped.length === 0 ? <p>None</p> : null}
					</HideableSection>
				</div>
				<div className="col-6 col-md-3">
					<HideableSection title="Salaries">
						<DataTable
							className="mb-3"
							cols={getCols(["Year", "Amount"])}
							defaultSort={[0, "asc"]}
							footer={[
								"Total",
								helpers.formatCurrency(player.salariesTotal, "M"),
							]}
							hideAllControls
							name="Player:Salaries"
							rows={player.salaries.map((s, i) => {
								return {
									key: i,
									data: [
										{
											searchValue: s.season,
											sortValue: i,
											value: (
												<>
													<SeasonLink pid={player.pid} season={s.season} />{" "}
													<SeasonIcons
														season={s.season}
														awards={player.awards}
													/>
												</>
											),
										},
										helpers.formatCurrency(s.amount, "M"),
									],
								};
							})}
						/>
					</HideableSection>
				</div>
				<div className="col-md-6">
					<HideableSection title="Statistical Feats">
						<div
							className="small-scrollbar"
							style={{
								maxHeight: 500,
								overflowY: "auto",
							}}
						>
							{feats.map(e => {
								return (
									<p key={e.eid}>
										<b>{e.season}</b>: <SafeHtml dirty={e.text} />
									</p>
								);
							})}
						</div>
						{feats.length === 0 ? <p>None</p> : null}
					</HideableSection>
				</div>
			</div>

			<div className="row" style={{ marginBottom: "-1rem" }}>
				<div className="col-md-6 col-lg-4">
					<HideableSection title="Injuries">
						<Injuries injuries={player.injuries} showRatings={showRatings} />
					</HideableSection>
				</div>
				<div className="col-md-6 col-lg-8">
					<HideableSection title="Transactions">
						{events.map(e => {
							return (
								<p key={e.eid}>
									<b>{e.season}</b>: <SafeHtml dirty={e.text} />
								</p>
							);
						})}
						{events.length === 0 ? <p>None</p> : null}
					</HideableSection>
				</div>
			</div>
		</>
	);
};

export default Player2;
