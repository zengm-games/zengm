import { useState } from "react";
import { DataTable, SafeHtml, SkillsBlock } from "../../components";
import Injuries from "./Injuries";
import useTitleBar from "../../hooks/useTitleBar";
import { getCols, helpers, groupAwards } from "../../util";
import type { View } from "../../../common/types";
import classNames from "classnames";
import { formatStatGameHigh } from "../PlayerStats";
import SeasonIcons from "./SeasonIcons";
import TopStuff from "./TopStuff";
import { PLAYER } from "../../../common";

const SeasonLink = ({ pid, season }: { pid: number; season: number }) => {
	return (
		<a href={helpers.leagueUrl(["player_game_log", pid, season])}>{season}</a>
	);
};

const StatsTable = ({
	name,
	onlyShowIf,
	p,
	stats,
	superCols,
}: {
	name: string;
	onlyShowIf?: string[];
	p: View<"player">["player"];
	stats: string[];
	superCols?: any[];
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

	const playerStats = p.stats.filter(ps => ps.playoffs === playoffs);
	const careerStats = playoffs ? p.careerStatsPlayoffs : p.careerStats;

	if (onlyShowIf !== undefined) {
		let display = false;
		for (const stat of onlyShowIf) {
			if (careerStats[stat] > 0) {
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
		...stats.map(
			stat => `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`,
		),
	]);

	if (superCols) {
		superCols = helpers.deepCopy(superCols);

		// No name
		superCols[0].colspan -= 1;
	}

	if (name === "Shot Locations") {
		cols[cols.length - 3].title = "M";
		cols[cols.length - 2].title = "A";
		cols.at(-1).title = "%";
	}

	return (
		<>
			<h2>{name}</h2>
			<ul className="nav nav-tabs border-bottom-0">
				{hasRegularSeasonStats ? (
					<li className="nav-item">
						<a
							className={classNames("nav-link", {
								active: !playoffs,
								"border-bottom": !playoffs,
							})}
							onClick={event => {
								event.preventDefault();
								setPlayoffs(false);
							}}
						>
							Regular Season
						</a>
					</li>
				) : null}
				{hasPlayoffStats ? (
					<li className="nav-item">
						<a
							className={classNames("nav-link", {
								active: playoffs,
								"border-bottom": playoffs,
							})}
							onClick={event => {
								event.preventDefault();
								setPlayoffs(true);
							}}
						>
							Playoffs
						</a>
					</li>
				) : null}
			</ul>
			<DataTable
				className="mb-3"
				cols={cols}
				defaultSort={[0, "asc"]}
				footer={[
					"Career",
					null,
					null,
					...stats.map(stat => formatStatGameHigh(careerStats, stat)),
				]}
				hideAllControls
				name={`Player:${name}`}
				rows={playerStats.map((ps, i) => {
					return {
						key: i,
						data: [
							{
								searchValue: ps.season,
								sortValue: i,
								value: (
									<>
										<SeasonLink pid={p.pid} season={ps.season} />{" "}
										<SeasonIcons
											season={ps.season}
											awards={p.awards}
											playoffs={playoffs}
										/>
									</>
								),
							},
							<a
								href={helpers.leagueUrl([
									"roster",
									`${ps.abbrev}_${ps.tid}`,
									ps.season,
								])}
							>
								{ps.abbrev}
							</a>,
							ps.age,
							...stats.map(stat => formatStatGameHigh(ps, stat)),
						],
					};
				})}
				superCols={superCols}
			/>
		</>
	);
};

const Player2 = ({
	currentSeason,
	customMenu,
	events,
	feats,
	freeAgent,
	godMode,
	injured,
	jerseyNumberInfos,
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
				gameLogSeason = player.stats.at(-1).season;
			} else if (player.ratings.length > 0) {
				gameLogSeason = player.ratings.at(-1).season;
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

	return (
		<>
			<TopStuff
				currentSeason={currentSeason}
				freeAgent={freeAgent}
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
				/>
			))}

			<>
				<h2>Ratings</h2>
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
												<span
													className="badge bg-danger badge-injury"
													title={player.injuries[r.injuryIndex].type}
												>
													+
												</span>
											) : null}
										</>
									),
								},
								r.abbrev ? (
									<a
										href={helpers.leagueUrl([
											"roster",
											`${r.abbrev}_${r.tid}`,
											r.season,
										])}
									>
										{r.abbrev}
									</a>
								) : null,
								r.age,
								r.pos,
								showRatings ? r.ovr : null,
								showRatings ? r.pot : null,
								...ratings.map(rating =>
									showRatings ? (r as any)[rating] : null,
								),
								<SkillsBlock className="skills-alone" skills={r.skills} />,
							],
						};
					})}
				/>
			</>

			<div className="row">
				<div className="col-6 col-md-3">
					<h2>Awards</h2>
					{awardsGrouped.length > 0 ? (
						<table className="table table-nonfluid table-striped table-sm player-awards">
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
				</div>
				<div className="col-6 col-md-3">
					<h2>Salaries</h2>
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
												<SeasonIcons season={s.season} awards={player.awards} />
											</>
										),
									},
									helpers.formatCurrency(s.amount, "M"),
								],
							};
						})}
					/>
				</div>
				<div className="col-md-6">
					<h2>Statistical Feats</h2>
					<div
						style={{
							maxHeight: 500,
							overflowY: "scroll",
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
				</div>
			</div>

			<div className="row" style={{ marginBottom: "-1rem" }}>
				<div className="col-md-6 col-lg-4">
					<h2>Injuries</h2>
					<Injuries injuries={player.injuries} showRatings={showRatings} />
				</div>
				<div className="col-md-6 col-lg-8">
					<h2>Transactions</h2>
					{events.map(e => {
						return (
							<p key={e.eid}>
								<b>{e.season}</b>: <SafeHtml dirty={e.text} />
							</p>
						);
					})}
					{events.length === 0 ? <p>None</p> : null}
				</div>
			</div>
		</>
	);
};

export default Player2;
