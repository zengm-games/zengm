import PropTypes from "prop-types";
import React, { ReactNode } from "react";
import {
	DataTable,
	Height,
	PlayerPicture,
	SafeHtml,
	SkillsBlock,
	WatchBlock,
	Weight,
	JerseyNumber,
	Mood,
} from "../../components";
import Injuries from "./Injuries";
import RatingsOverview from "./RatingsOverview";
import useTitleBar from "../../hooks/useTitleBar";
import {
	confirm,
	getCols,
	helpers,
	toWorker,
	realtimeUpdate,
} from "../../util";
import type { View, Player, Phase } from "../../../common/types";
import { PHASE, PLAYER } from "../../../common";
import classNames from "classnames";
import { formatStatGameHigh } from "../PlayerStats";

const Relatives = ({
	pid,
	relatives,
}: {
	pid: number;
	relatives: Player["relatives"];
}) => {
	if (relatives.length === 0) {
		return null;
	}

	return (
		<>
			{relatives.map(rel => {
				return (
					<React.Fragment key={rel.pid}>
						{helpers.upperCaseFirstLetter(rel.type)}:{" "}
						<a href={helpers.leagueUrl(["player", rel.pid])}>{rel.name}</a>
						<br />
					</React.Fragment>
				);
			})}
			<a href={helpers.leagueUrl(["frivolities", "relatives", pid])}>
				(Family details)
			</a>
			<br />
		</>
	);
};

Relatives.propTypes = {
	pid: PropTypes.number.isRequired,
	relatives: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const StatsTable = ({
	name,
	onlyShowIf,
	p,
	playoffs = false,
	stats,
	superCols,
}: {
	name: string;
	onlyShowIf?: string[];
	p: View<"player">["player"];
	playoffs?: boolean;
	stats: string[];
	superCols?: any[];
}) => {
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

	const cols = getCols(
		"Year",
		"Team",
		"Age",
		...stats.map(
			stat => `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`,
		),
	);

	if (superCols) {
		superCols = helpers.deepCopy(superCols);

		// No name
		superCols[0].colspan -= 1;
	}

	if (name === "Shot Locations") {
		cols[cols.length - 3].title = "M";
		cols[cols.length - 2].title = "A";
		cols[cols.length - 1].title = "%";
	}

	return (
		<>
			<h3>{name}</h3>
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
				name={`Player:${name}${playoffs ? ":Playoffs" : ""}`}
				rows={playerStats.map((ps, i) => {
					return {
						key: i,
						data: [
							{
								value: ps.season,
								sortValue: i,
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

StatsTable.propTypes = {
	name: PropTypes.string.isRequired,
	onlyShowIf: PropTypes.arrayOf(PropTypes.string),
	p: PropTypes.object.isRequired,
	playoffs: PropTypes.bool,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	superCols: PropTypes.array,
};

const StatsSummary = ({
	name,
	onlyShowIf,
	p,
	phase,
	position,
	season,
	stats,
}: {
	name: string;
	onlyShowIf?: string[];
	p: View<"player">["player"];
	phase: Phase;
	position: string;
	season: number;
	stats: string[];
}) => {
	if (onlyShowIf !== undefined) {
		if (!onlyShowIf.includes(position)) {
			return null;
		}
	}

	const playerStats = p.stats.filter(
		ps =>
			!ps.playoffs &&
			(ps.season === season ||
				(ps.season === season - 1 && phase === PHASE.PRESEASON)),
	);
	const ps = playerStats[playerStats.length - 1];

	const cols = getCols("Summary", ...stats.map(stat => `stat:${stat}`));

	if (name === "Shot Locations") {
		cols[cols.length - 3].title = "M";
		cols[cols.length - 2].title = "A";
		cols[cols.length - 1].title = "%";
	}

	const separatorAfter =
		process.env.SPORT === "basketball" ? [0, 4, 8] : [0, 2];

	return (
		<div className="player-stats-summary">
			<table className="table table-sm table-condensed table-nonfluid text-center mt-3 mb-0">
				<thead>
					<tr>
						{cols.map((col, i) => {
							return (
								<th
									key={i}
									title={col.desc}
									className={classNames({
										"table-separator-right": separatorAfter.includes(i),
										"table-separator-left": separatorAfter.includes(i - 1),
										"text-left": i === 0,
									})}
								>
									{col.title}
								</th>
							);
						})}
					</tr>
				</thead>
				{ps ? (
					<tbody>
						<tr>
							<th className="table-separator-right text-left">{ps.season}</th>
							{stats.map((stat, i) => {
								return (
									<td
										key={stat}
										className={classNames({
											"table-separator-right": separatorAfter.includes(i + 1),
											"table-separator-left": separatorAfter.includes(i),
										})}
									>
										{helpers.roundStat((ps as any)[stat], stat)}
									</td>
								);
							})}
						</tr>
					</tbody>
				) : null}

				<tfoot>
					<tr>
						<th className="table-separator-right text-left">Career</th>
						{stats.map((stat, i) => {
							return (
								<td
									key={stat}
									className={classNames({
										"table-separator-right": separatorAfter.includes(i + 1),
										"table-separator-left": separatorAfter.includes(i),
									})}
								>
									{helpers.roundStat(p.careerStats[stat], stat)}
								</td>
							);
						})}
					</tr>
				</tfoot>
			</table>
		</div>
	);
};

StatsSummary.propTypes = {
	name: PropTypes.string.isRequired,
	onlyShowIf: PropTypes.arrayOf(PropTypes.string),
	retired: PropTypes.bool,
	p: PropTypes.object.isRequired,
	playoffs: PropTypes.bool,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const Player2 = ({
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
	season,
	showContract,
	showRatings,
	showTradeFor,
	showTradingBlock,
	spectator,
	statTables,
	statSummary,
	teamColors,
	teamName,
	willingToSign,
}: View<"player">) => {
	useTitleBar({ title: player.name });

	let draftInfo: ReactNode = null;
	if (player.draft.round > 0) {
		draftInfo = (
			<>
				Draft:{" "}
				<a href={helpers.leagueUrl(["draft_history", player.draft.year])}>
					{player.draft.year}
				</a>{" "}
				- Round {player.draft.round} (Pick {player.draft.pick}) by{" "}
				{player.draft.abbrev}
				<br />
			</>
		);
	} else {
		draftInfo = (
			<>
				Undrafted:{" "}
				<a href={helpers.leagueUrl(["draft_history", player.draft.year])}>
					{player.draft.year}
				</a>
				<br />
			</>
		);
	}

	let contractInfo: ReactNode = null;
	if (showContract) {
		contractInfo = (
			<>
				{freeAgent ? "Asking for" : "Contract"}:{" "}
				{helpers.formatCurrency(player.contract.amount, "M")}
				/yr thru {player.contract.exp}
				<br />
			</>
		);
	}

	let statusInfo: ReactNode = null;
	if (!retired) {
		const dayOrWeek = process.env.SPORT === "basketball" ? "day" : "week";
		statusInfo = (
			<div className="d-flex">
				{injured ? (
					<span
						className="badge badge-danger badge-injury"
						style={{ marginLeft: 0 }}
						title={`${player.injury.type} (out ${
							player.injury.gamesRemaining
						} more ${
							player.injury.gamesRemaining === 1 ? dayOrWeek : `${dayOrWeek}s`
						})`}
					>
						{player.injury.gamesRemaining}
					</span>
				) : null}
				<SkillsBlock
					className={injured ? undefined : "skills-alone"}
					skills={player.ratings[player.ratings.length - 1].skills}
				/>
				<WatchBlock className="ml-2" pid={player.pid} watch={player.watch} />
				{player.tid === PLAYER.FREE_AGENT ||
				player.tid === PLAYER.UNDRAFTED ||
				player.tid >= 0 ? (
					<Mood className="ml-2" p={player} />
				) : null}
			</div>
		);
	}

	// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
	// @ts-ignore
	const height = <Height inches={player.hgt} />;

	// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
	// @ts-ignore
	const weight = <Weight pounds={player.weight} />;

	let teamURL;
	if (player.tid >= 0) {
		teamURL = helpers.leagueUrl(["roster", `${player.abbrev}_${player.tid}`]);
	} else if (player.tid === PLAYER.FREE_AGENT) {
		teamURL = helpers.leagueUrl(["free_agents"]);
	} else if (
		player.tid === PLAYER.UNDRAFTED ||
		player.tid === PLAYER.UNDRAFTED_FANTASY_TEMP
	) {
		teamURL = helpers.leagueUrl(["draft_scouting"]);
	}

	const college =
		player.college && player.college !== "" ? player.college : "None";

	return (
		<>
			<div className="row mb-3">
				<div className="col-sm-6">
					<div className="d-flex">
						<div
							className="player-picture mb-2"
							style={{
								marginTop: player.imgURL ? 0 : -20,
							}}
						>
							<PlayerPicture
								face={player.face}
								imgURL={player.imgURL}
								teamColors={teamColors}
							/>
						</div>
						<div>
							<strong>
								{player.ratings[player.ratings.length - 1].pos},{" "}
								{teamURL ? <a href={teamURL}>{teamName}</a> : teamName}
								{player.jerseyNumber ? (
									<>
										,{" "}
										<a
											href={helpers.leagueUrl([
												"frivolities",
												"most",
												"jersey_number",
												player.jerseyNumber,
											])}
										>
											#{player.jerseyNumber}
										</a>
									</>
								) : null}
							</strong>
							<br />
							{height}, {weight}
							<br />
							Born: {player.born.year} -{" "}
							<a
								href={helpers.leagueUrl([
									"frivolities",
									"most",
									"country",
									window.encodeURIComponent(helpers.getCountry(player)),
								])}
							>
								{player.born.loc}
							</a>
							<br />
							{typeof player.diedYear !== "number" ? (
								<>
									Age: {player.age}
									<br />
								</>
							) : (
								<>
									Died: {player.diedYear}
									<br />
								</>
							)}
							<Relatives pid={player.pid} relatives={player.relatives} />
							{draftInfo}
							College:{" "}
							<a
								href={helpers.leagueUrl([
									"frivolities",
									"most",
									"college",
									window.encodeURIComponent(college),
								])}
							>
								{college}
							</a>
							<br />
							{contractInfo}
							{statusInfo}
						</div>
					</div>

					<div className="btn-group">
						<a
							href={helpers.leagueUrl(["customize_player", player.pid])}
							className={classNames(
								"btn",
								godMode ? "btn-god-mode" : "btn-light-bordered",
							)}
						>
							Edit Player
						</a>
						{godMode ? (
							<button
								className="btn btn-god-mode"
								onClick={async () => {
									const proceed = await confirm(
										`Are you sure you want to delete ${player.name}?`,
										{
											okText: "Delete Player",
										},
									);
									if (proceed) {
										await toWorker("main", "removePlayer", player.pid);

										realtimeUpdate([], helpers.leagueUrl([]));
									}
								}}
							>
								Delete Player
							</button>
						) : null}
						{showTradeFor || showTradingBlock ? (
							<button
								className="btn btn-light-bordered"
								disabled={player.untradable}
								onClick={() => {
									if (showTradeFor) {
										toWorker("actions", "tradeFor", { pid: player.pid });
									} else {
										toWorker("actions", "addToTradingBlock", player.pid);
									}
								}}
								title={player.untradableMsg}
							>
								{showTradeFor ? (
									"Trade For"
								) : (
									<>
										<span className="d-none d-md-inline">Add To </span>Trading
										Block
									</>
								)}
							</button>
						) : null}
						{!spectator && freeAgent ? (
							<button
								className="btn btn-light-bordered"
								disabled={!willingToSign}
								onClick={() => toWorker("actions", "negotiate", player.pid)}
								title={
									willingToSign
										? undefined
										: `${player.name} refuses to negotiate with you`
								}
							>
								Negotiate Contract
							</button>
						) : null}
					</div>
					{player.careerStats.gp > 0 ? (
						<>
							{statSummary.map(({ name, onlyShowIf, stats }) => (
								<StatsSummary
									key={name}
									name={name}
									onlyShowIf={onlyShowIf}
									position={player.ratings[player.ratings.length - 1].pos}
									phase={phase}
									season={season}
									stats={stats}
									p={player}
								/>
							))}
						</>
					) : null}
				</div>

				<div className="col-sm-6 mt-3 mt-sm-0 text-nowrap">
					{!retired && showRatings ? (
						<RatingsOverview ratings={player.ratings} />
					) : null}
					{jerseyNumberInfos.length > 0 ? (
						<div
							className={classNames("d-flex flex-wrap", {
								"mt-2": !retired && showRatings,
							})}
							style={{
								gap: "0.5em",
							}}
						>
							{jerseyNumberInfos.map((info, i) => (
								<JerseyNumber key={i} {...info} />
							))}
						</div>
					) : null}
				</div>
			</div>

			{player.careerStats.gp > 0 ? (
				<>
					<h2>Regular Season</h2>
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
				</>
			) : null}

			{player.careerStatsPlayoffs.gp > 0 ? (
				<>
					<h2>Playoffs</h2>
					{statTables.map(({ name, onlyShowIf, stats, superCols }) => (
						<StatsTable
							key={name}
							name={name}
							onlyShowIf={onlyShowIf}
							stats={stats}
							superCols={superCols}
							p={player}
							playoffs
						/>
					))}
				</>
			) : null}

			<>
				<h2>Ratings</h2>
				<DataTable
					className="mb-3"
					cols={getCols(
						"Year",
						"Team",
						"Age",
						"Pos",
						"Ovr",
						"Pot",
						...ratings.map(rating => `rating:${rating}`),
						"Skills",
					)}
					defaultSort={[0, "asc"]}
					hideAllControls
					name="Player:Ratings"
					rows={player.ratings.map((r, i) => {
						return {
							key: i,
							data: [
								{
									sortValue: i,
									value:
										r.injuryIndex !== undefined &&
										player.injuries[r.injuryIndex] ? (
											<>
												{r.season}
												<span
													className="badge badge-danger badge-injury"
													title={player.injuries[r.injuryIndex].type}
												>
													+
												</span>
											</>
										) : (
											r.season
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
					{player.awardsGrouped.length > 0 ? (
						<table className="table table-nonfluid table-striped table-bordered table-sm player-awards">
							<tbody>
								{player.awardsGrouped.map((a, i) => {
									return (
										<tr key={i}>
											<td>
												{a.count > 1 ? <span>{a.count}x </span> : null}
												{a.type} ({a.seasons.join(", ")})
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					) : null}
					{player.awardsGrouped.length === 0 ? <p>None</p> : null}
				</div>
				<div className="col-6 col-md-3">
					<h2>Salaries</h2>
					<DataTable
						className="mb-3"
						cols={getCols("Year", "Amount")}
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
								data: [s.season, helpers.formatCurrency(s.amount, "M")],
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

Player2.propTypes = {
	events: PropTypes.arrayOf(
		PropTypes.shape({
			eid: PropTypes.number.isRequired,
			season: PropTypes.number.isRequired,
			text: PropTypes.string.isRequired,
		}),
	).isRequired,
	feats: PropTypes.arrayOf(
		PropTypes.shape({
			eid: PropTypes.number.isRequired,
			season: PropTypes.number.isRequired,
			text: PropTypes.string.isRequired,
		}),
	).isRequired,
	freeAgent: PropTypes.bool.isRequired,
	godMode: PropTypes.bool.isRequired,
	injured: PropTypes.bool.isRequired,
	player: PropTypes.object.isRequired,
	ratings: PropTypes.arrayOf(PropTypes.string).isRequired,
	retired: PropTypes.bool.isRequired,
	showContract: PropTypes.bool.isRequired,
	showTradeFor: PropTypes.bool.isRequired,
	statTables: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			stats: PropTypes.arrayOf(PropTypes.string).isRequired,
		}),
	).isRequired,
	teamColors: PropTypes.arrayOf(PropTypes.string),
	willingToSign: PropTypes.bool.isRequired,
};

export default Player2;
