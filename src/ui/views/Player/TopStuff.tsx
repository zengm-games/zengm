import { Fragment, useState } from "react";
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
	InjuryIcon,
} from "../../components";
import {
	confirm,
	helpers,
	toWorker,
	realtimeUpdate,
	getCols,
} from "../../util";
import type {
	GameAttributesLeague,
	Phase,
	Player,
	View,
} from "../../../common/types";
import { bySport, isSport, PHASE, PLAYER } from "../../../common";
import classNames from "classnames";
import AwardsSummary from "./AwardsSummary";
import RatingsOverview from "./RatingsOverview";
import Note from "./Note";

const Relatives = ({
	gender,
	pid,
	relatives,
}: {
	gender: GameAttributesLeague["gender"];
	pid: number;
	relatives: Player["relatives"];
}) => {
	const [showAll, setShowAll] = useState(false);

	if (relatives.length === 0) {
		return null;
	}

	const numToShow = showAll || relatives.length <= 3 ? relatives.length : 2;
	const numToHide = relatives.length - numToShow;

	return (
		<>
			{relatives.slice(0, numToShow).map(rel => {
				return (
					<Fragment key={rel.pid}>
						{helpers.getRelativeType(gender, rel.type)}:{" "}
						<a href={helpers.leagueUrl(["player", rel.pid])}>{rel.name}</a>
						<br />
					</Fragment>
				);
			})}
			{numToHide > 0 ? (
				<>
					<button
						className="btn btn-link p-0 m-0 border-0"
						onClick={() => {
							setShowAll(true);
						}}
					>
						...show {numToHide} more relatives
					</button>
					<br />
				</>
			) : null}
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

	let ps: (typeof p)["stats"][number] | undefined;
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
					baseball: row.war,
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
		cols.at(-3)!.title = "M";
		cols.at(-2)!.title = "A";
		cols.at(-1)!.title = "%";
	}

	const separatorAfter = bySport({
		baseball: onlyShowIf?.includes("SP") ? [0, 4, 7] : [0, 5, 8],
		basketball: [0, 4, 8],
		football: [0, 2],
		hockey: onlyShowIf?.includes("G") ? [0, 3] : [0, 5],
	});

	const showPeakSeason = p.tid === PLAYER.RETIRED && season === undefined;

	return (
		<div className="player-stats-summary small-scrollbar">
			<table className="table table-sm table-borderless border-top-0 table-nonfluid text-center mt-3 mb-0">
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
	gender,
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
	userTid,
	willingToSign,
}: Pick<
	View<"player">,
	| "currentSeason"
	| "freeAgent"
	| "gender"
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
	| "userTid"
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
		let skills;
		if (season !== undefined) {
			skills = player.ratings.find(row => row.season === season)?.skills;
		}
		if (!skills) {
			skills = player.ratings.at(-1)!.skills;
		}

		statusInfo = (
			<div className="d-flex align-items-center">
				{injured ? (
					<InjuryIcon className="ms-0" injury={player.injury} />
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
							toWorker("actions", "addToTradingBlock", { pid: player.pid });
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
			<div className="d-sm-flex align-items-start">
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
								{player.ratings.at(-1)!.pos},{" "}
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
							{player.srID && !player.srID.startsWith("dp_") ? (
								<>
									{" "}
									-{" "}
									<a
										href={`https://www.basketball-reference.com/players/${player.srID[0]}/${player.srID}.html`}
									>
										BBRef
									</a>
								</>
							) : null}
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
							<Relatives
								gender={gender}
								pid={player.pid}
								relatives={player.relatives}
							/>
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
									await toWorker("main", "clearInjuries", [player.pid]);
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
									position={player.ratings.at(-1)!.pos}
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

				<div className="mt-3 mt-sm-0 text-nowrap overflow-auto small-scrollbar">
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
							{jerseyNumberInfos.map((info, i) => {
								let onClick;
								let extraText;
								const t = info.t;
								if (t && (t.tid === userTid || godMode)) {
									const isCurrentTeamAndNumber =
										info.end >= currentSeason && t.tid === player.tid;

									// Don't allow retiring current number, cause it behaves weirdly
									if (!isCurrentTeamAndNumber) {
										onClick = async () => {
											if (info.retiredIndex >= 0) {
												await toWorker("main", "retiredJerseyNumberDelete", {
													tid: t.tid,
													i: info.retiredIndex,
												});
											} else {
												await toWorker("main", "retiredJerseyNumberUpsert", {
													tid: t.tid,
													info: {
														number: info.number,
														seasonRetired: currentSeason,
														seasonTeamInfo: info.end,
														pid: player.pid,
														text: "",
													},
												});
											}
										};
										extraText = `click to ${
											info.retiredIndex >= 0 ? "unretire" : "retire"
										} jersey`;
									}
								}
								return (
									<JerseyNumber
										key={i}
										onClick={onClick}
										extraText={extraText}
										retired={info.retiredIndex >= 0}
										{...info}
									/>
								);
							})}
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
