import { Fragment } from "react";
import type { ReactNode } from "react";
import {
	CountryFlag,
	Height,
	PlayerPicture,
	SkillsBlock,
	WatchBlock,
	Weight,
	JerseyNumber,
	Mood,
} from "../../components";
import {
	confirm,
	helpers,
	toWorker,
	realtimeUpdate,
	getCols,
} from "../../util";
import type { Phase, Player, View } from "../../../common/types";
import { bySport, isSport, PHASE, PLAYER } from "../../../common";
import classNames from "classnames";
import AwardsSummary from "./AwardsSummary";
import RatingsOverview from "./RatingsOverview";
import Note from "./Note";

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
					<Fragment key={rel.pid}>
						{helpers.upperCaseFirstLetter(rel.type)}:{" "}
						<a href={helpers.leagueUrl(["player", rel.pid])}>{rel.name}</a>
						<br />
					</Fragment>
				);
			})}
			<a href={helpers.leagueUrl(["frivolities", "relatives", pid])}>
				(Family details)
			</a>
			<br />
		</>
	);
};

const StatsSummary = ({
	name,
	onlyShowIf,
	p,
	phase,
	position,
	currentSeason,
	season,
	stats,
}: {
	name: string;
	onlyShowIf?: string[];
	p: View<"player">["player"];
	phase: Phase;
	position: string;
	currentSeason: number;
	season?: number;
	stats: string[];
}) => {
	if (onlyShowIf !== undefined) {
		if (!onlyShowIf.includes(position)) {
			return null;
		}
	}

	let ps: typeof p["stats"][number] | undefined;
	if (season !== undefined) {
		// Specific season was requested
		const playerStats = p.stats.filter(
			ps => !ps.playoffs && ps.season === season,
		);
		ps = playerStats.at(-1);
	}

	if (!ps) {
		if (p.tid === PLAYER.RETIRED) {
			// Find best season for retired player
			let maxValue = -Infinity;
			for (const row of p.stats) {
				if (row.playoffs) {
					continue;
				}

				const value = bySport({
					basketball: row.ws,
					football: row.av,
					hockey: row.ps,
				});
				if (value > maxValue) {
					ps = row;
					maxValue = value;
				}
			}
		} else {
			// Find current season for active player
			const playerStats = p.stats.filter(
				ps =>
					!ps.playoffs &&
					(ps.season === currentSeason ||
						(ps.season === currentSeason - 1 && phase === PHASE.PRESEASON)),
			);
			ps = playerStats.at(-1);
		}
	}

	const cols = getCols(["Summary", ...stats.map(stat => `stat:${stat}`)]);

	if (name === "Shot Locations") {
		cols[cols.length - 3].title = "M";
		cols[cols.length - 2].title = "A";
		cols.at(-1).title = "%";
	}

	const separatorAfter = bySport({
		basketball: [0, 4, 8],
		football: [0, 2],
		hockey: onlyShowIf?.includes("G") ? [0, 3] : [0, 5],
	});

	const showPeakSeason = p.tid === PLAYER.RETIRED && season === undefined;

	return (
		<div className="player-stats-summary">
			<table className="table table-sm table-borderless table-nonfluid text-center mt-3 mb-0">
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
										"text-start": i === 0,
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
							<th
								className="table-separator-right text-start"
								title={showPeakSeason ? String(ps.season) : undefined}
							>
								{showPeakSeason ? "Peak" : ps.season}
							</th>
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
						<th className="table-separator-right text-start">Career</th>
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

const TopStuff = ({
	currentSeason,
	freeAgent,
	godMode,
	injured,
	jerseyNumberInfos,
	phase,
	player,
	retired,
	season,
	showContract,
	showRatings,
	showTradeFor,
	showTradingBlock,
	spectator,
	statSummary,
	teamColors,
	teamJersey,
	teamName,
	teamURL,
	willingToSign,
}: Pick<
	View<"player">,
	| "currentSeason"
	| "freeAgent"
	| "godMode"
	| "injured"
	| "jerseyNumberInfos"
	| "phase"
	| "player"
	| "retired"
	| "showContract"
	| "showRatings"
	| "showTradeFor"
	| "showTradingBlock"
	| "spectator"
	| "statSummary"
	| "teamColors"
	| "teamJersey"
	| "teamName"
	| "teamURL"
	| "willingToSign"
> & {
	season?: number;
}) => {
	let draftInfo: ReactNode = null;
	if (player.draft.round > 0) {
		draftInfo = (
			<>
				Draft:{" "}
				<a href={helpers.leagueUrl(["draft_history", player.draft.year])}>
					{player.draft.year}
				</a>{" "}
				- Round {player.draft.round} (Pick {player.draft.pick}) by{" "}
				<a
					href={helpers.leagueUrl([
						"draft_team_history",
						`${player.draft.abbrev}_${player.draft.tid}`,
					])}
				>
					{player.draft.abbrev}
				</a>
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
	if (season !== undefined || showContract) {
		let amount;
		let exp;
		if (season === undefined || season === currentSeason) {
			amount = player.contract.amount;
			exp = player.contract.exp;
		} else {
			for (let i = player.salaries.length - 1; i >= 0; i--) {
				const row = player.salaries[i];
				if (row.season === season) {
					amount = row.amount;
					break;
				}
			}
		}

		contractInfo = (
			<>
				{freeAgent ? "Asking for" : "Contract"}:{" "}
				{amount !== undefined ? helpers.formatCurrency(amount, "M") : "???"}/yr
				{exp !== undefined ? ` thru ${exp}` : null}
				<br />
			</>
		);
	}

	let statusInfo: ReactNode = null;
	if (retired && season === undefined) {
		statusInfo = (
			<div className="d-flex align-items-center">
				<WatchBlock className="ms-0" pid={player.pid} watch={player.watch} />
			</div>
		);
	} else {
		const gameOrWeek = bySport({ default: "game", football: "week" });

		let skills;
		if (season !== undefined) {
			skills = player.ratings.find(row => row.season === season)?.skills;
		}
		if (!skills) {
			skills = player.ratings.at(-1).skills;
		}

		statusInfo = (
			<div className="d-flex align-items-center">
				{injured ? (
					<span
						className="badge bg-danger badge-injury ms-0"
						title={`${player.injury.type} (out ${
							player.injury.gamesRemaining
						} more ${
							player.injury.gamesRemaining === 1 ? gameOrWeek : `${gameOrWeek}s`
						})`}
					>
						{player.injury.gamesRemaining}
					</span>
				) : null}
				<SkillsBlock
					className={injured ? undefined : "skills-alone"}
					skills={skills}
				/>
				<WatchBlock className="ms-2" pid={player.pid} watch={player.watch} />
				{player.tid === PLAYER.FREE_AGENT ||
				player.tid === PLAYER.UNDRAFTED ||
				player.tid >= PLAYER.FREE_AGENT ? (
					<Mood
						className="ms-2"
						defaultType={
							player.tid === PLAYER.FREE_AGENT ||
							player.tid === PLAYER.UNDRAFTED
								? "user"
								: "current"
						}
						p={player}
					/>
				) : null}
			</div>
		);
	}

	const height = <Height inches={player.hgt} />;

	const weight = <Weight pounds={player.weight} />;

	const college =
		player.college && player.college !== "" ? player.college : "None";

	const buttonsAvailableOutsideGodMode = (
		<>
			{!spectator && (showTradeFor || showTradingBlock) ? (
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
					{showTradeFor ? "Trade For" : <>Add To Trading Block</>}
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
		</>
	);

	const showRatingsOverview = (!retired || season !== undefined) && showRatings;

	return (
		<div className="mb-3">
			<div className="d-sm-flex">
				<div className="player-bio">
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
								colors={teamColors}
								jersey={teamJersey}
							/>
						</div>
						<div>
							<strong>
								{player.ratings.at(-1).pos},{" "}
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
									window.encodeURIComponent(
										helpers.getCountry(player.born.loc),
									),
								])}
							>
								{player.born.loc}
								<CountryFlag className="ms-1" country={player.born.loc} />
							</a>
							<br />
							{player.ageAtDeath === null ? (
								<>
									Age: {player.age}
									<br />
								</>
							) : (
								<>
									Died: {player.diedYear} ({player.ageAtDeath} years old)
									<br />
								</>
							)}
							<Relatives pid={player.pid} relatives={player.relatives} />
							{draftInfo}
							{isSport("hockey") && college === "None" ? null : (
								<>
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
								</>
							)}
							Experience:{" "}
							{player.experience === 0
								? "none"
								: `${player.experience} year${
										player.experience > 1 ? "s" : ""
								  }`}
							<br />
							{contractInfo}
							{statusInfo}
						</div>
					</div>

					<div className="btn-group mt-2">
						<a
							href={helpers.leagueUrl(["customize_player", player.pid])}
							className={classNames(
								"btn",
								godMode ? "btn-outline-god-mode" : "btn-light-bordered",
							)}
						>
							Edit
						</a>
						{godMode ? (
							<button
								className="btn btn-outline-god-mode"
								onClick={async () => {
									const proceed = await confirm(
										`Are you sure you want to delete ${player.name}?`,
										{
											okText: "Delete Player",
										},
									);
									if (proceed) {
										await toWorker("main", "removePlayers", [player.pid]);

										realtimeUpdate([], helpers.leagueUrl([]));
									}
								}}
							>
								Delete
							</button>
						) : null}
						{godMode ? (
							<a
								href={helpers.leagueUrl([
									"customize_player",
									player.pid,
									"clone",
								])}
								className="btn btn-outline-god-mode"
							>
								Clone
							</a>
						) : null}
						{godMode && injured ? (
							<button
								className="btn btn-outline-god-mode"
								onClick={async () => {
									await toWorker("main", "clearInjury", player.pid);
								}}
							>
								Heal Injury
							</button>
						) : null}
						{!godMode ? buttonsAvailableOutsideGodMode : null}
					</div>
					{godMode ? (
						<div className="mt-2">{buttonsAvailableOutsideGodMode}</div>
					) : null}
					{player.careerStats.gp > 0 ? (
						<>
							{statSummary.map(({ name, onlyShowIf, stats }) => (
								<StatsSummary
									key={name}
									name={name}
									onlyShowIf={onlyShowIf}
									position={player.ratings.at(-1).pos}
									phase={phase}
									currentSeason={currentSeason}
									season={season}
									stats={stats}
									p={player}
								/>
							))}
						</>
					) : null}
				</div>

				<div className="mt-3 mt-sm-0 text-nowrap">
					{showRatingsOverview ? (
						<RatingsOverview ratings={player.ratings} season={season} />
					) : null}
					{jerseyNumberInfos.length > 0 ? (
						<div
							className={classNames("d-flex flex-wrap", {
								"mt-2": showRatingsOverview || player.awards.length > 0,
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

			<AwardsSummary awards={player.awards} />

			<Note note={player.note} pid={player.pid} />
		</div>
	);
};

export default TopStuff;
