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
import type { View, Player } from "../../../common/types";
import { PLAYER } from "../../../common";
import classNames from "classnames";

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
		...stats.map(stat => `stat:${stat}`),
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
					...stats.map(stat => helpers.roundStat(careerStats[stat], stat)),
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
							...stats.map(stat => helpers.roundStat(ps[stat], stat)),
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

const Player2 = ({
	events,
	feats,
	freeAgent,
	godMode,
	injured,
	jerseyNumberInfos,
	player,
	ratings,
	retired,
	showContract,
	showRatings,
	showTradeFor,
	showTradingBlock,
	statTables,
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
		statusInfo = (
			<>
				{injured ? (
					<span
						className="badge badge-danger badge-injury"
						style={{ marginLeft: 0 }}
						title={`${player.injury.type} (out ${player.injury.gamesRemaining} more games)`}
					>
						{player.injury.gamesRemaining}
					</span>
				) : null}
				<SkillsBlock
					className={injured ? undefined : "skills-alone"}
					skills={player.ratings[player.ratings.length - 1].skills}
				/>
				<WatchBlock pid={player.pid} watch={player.watch} />
				<br />
			</>
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

	return (
		<>
			<div className="row mb-3">
				<div className="col-sm-6">
					<div className="d-flex">
						<div
							className="player-picture"
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
								{player.jerseyNumber ? `, #${player.jerseyNumber}` : null}
							</strong>
							<br />
							Height: {height}
							<br />
							Weight: {weight}
							<br />
							Born: {player.born.year} - {player.born.loc}
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
							{player.college && player.college !== ""
								? player.college
								: "None"}
							<br />
							{contractInfo}
							{godMode ? (
								<>
									<a
										href={helpers.leagueUrl(["customize_player", player.pid])}
										className="btn btn-god-mode btn-xs mr-1 mb-1"
									>
										Edit Player
									</a>
									<button
										className="btn btn-god-mode btn-xs mb-1"
										disabled={status === "exporting" || status === "loading"}
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
									<br />
								</>
							) : null}
							{statusInfo}
						</div>
					</div>

					<div>
						{showTradeFor || showTradingBlock ? (
							<span title={player.untradableMsg}>
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
								>
									{showTradeFor ? "Trade For" : "Add To Trading Block"}
								</button>
							</span>
						) : null}
						{freeAgent ? (
							<span
								title={
									willingToSign
										? undefined
										: `${player.name} refuses to negotiate with you`
								}
							>
								<button
									className="btn btn-light-bordered"
									disabled={!willingToSign}
									onClick={() => toWorker("actions", "negotiate", player.pid)}
								>
									Negotiate Contract
								</button>
							</span>
						) : null}
					</div>
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
