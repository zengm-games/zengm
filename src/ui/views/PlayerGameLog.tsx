import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import TopStuff from "./Player/TopStuff";
import { getCols, helpers } from "../util";
import { DataTable, InjuryIcon } from "../components";
import { NoGamesMessage } from "./GameLog";
import type { DataTableRow } from "../components/DataTable";
import { isSport } from "../../common";
import clsx from "clsx";

export const BaseballDecision = ({
	className,
	exhibition,
	p,
	wlColors,
}: {
	className?: string;
	exhibition?: boolean;
	p: {
		w: number;
		l: number;
		sv: number;
		bs: number;
		hld: number;
		seasonStats: {
			w: number;
			l: number;
			sv: number;
			bs: number;
			hld: number;
		};
	};
	wlColors?: boolean;
}) => {
	return p.w > 0 ? (
		<span className={clsx(wlColors ? "text-success" : undefined, className)}>
			{p.bs > 0 ? "B" : ""}W
			{exhibition
				? null
				: ` (${helpers.formatRecord({
						won: p.seasonStats.w,
						lost: p.seasonStats.l,
					})})`}
		</span>
	) : p.l > 0 ? (
		<span className={clsx(wlColors ? "text-danger" : undefined, className)}>
			{p.bs > 0 ? "B" : ""}
			{p.hld > 0 ? "H" : ""}L
			{exhibition
				? null
				: ` (${helpers.formatRecord({
						won: p.seasonStats.w,
						lost: p.seasonStats.l,
					})})`}
		</span>
	) : p.sv > 0 ? (
		<span className={className}>
			SV{exhibition ? null : ` (${p.seasonStats.sv})`}
		</span>
	) : p.bs > 0 ? (
		<span className={className}>
			BS{exhibition ? null : ` (${p.seasonStats.bs})`}
		</span>
	) : p.hld > 0 ? (
		<span className={className}>
			H{exhibition ? null : ` (${p.seasonStats.hld})`}
		</span>
	) : null;
};

const PlayerGameLog = ({
	bestPos,
	currentSeason,
	customMenu,
	freeAgent,
	gender,
	godMode,
	injured,
	jerseyNumberInfos,
	numGamesPlayoffSeires,
	phase,
	player,
	retired,
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
	gameLog,
	season,
	seasonsWithStats,
	showDecisionColumn,
	stats,
	superCols,
}: View<"playerGameLog">) => {
	useTitleBar({
		title: player.name,
		customMenu,
		dropdownView: "player_game_log",
		dropdownFields: {
			playerProfile: "gameLog",
			seasons: season,
		},
		dropdownCustomOptions: {
			seasons: seasonsWithStats.map(season => ({
				key: season,
				value: String(season),
			})),
		},
		dropdownCustomURL: fields => {
			const parts =
				fields.playerProfile === "gameLog"
					? ["player_game_log", player.pid, fields.seasons]
					: ["player", player.pid];

			return helpers.leagueUrl(parts);
		},
	});

	const cols = getCols([
		"#",
		"Team",
		"@",
		"Opp",
		"Result",
		"Record",
		"",
		...(isSport("baseball") && showDecisionColumn ? ["Decision"] : []),
		...stats.map(stat => `stat:${stat}`),
	]);

	const makeRow = (game: (typeof gameLog)[number], i: number): DataTableRow => {
		return {
			key: i,
			data: [
				i + 1,
				<>
					{game.seed !== undefined ? `${game.seed}. ` : null}
					<a
						href={helpers.leagueUrl([
							"roster",
							`${game.abbrev}_${game.tid}`,
							season,
						])}
					>
						{game.abbrev}
					</a>
				</>,
				game.away ? "@" : "",
				{
					value: (
						<>
							{game.oppSeed !== undefined ? `${game.oppSeed}. ` : null}
							<a
								href={helpers.leagueUrl([
									"roster",
									`${game.oppAbbrev}_${game.oppTid}`,
									season,
								])}
							>
								{game.oppAbbrev}
							</a>
						</>
					),
					sortValue: game.oppAbbrev,
					searchValue: game.oppAbbrev,
				},
				{
					value: (
						<a
							href={helpers.leagueUrl([
								"game_log",
								game.tid < 0 ? "special" : `${game.abbrev}_${game.tid}`,
								season,
								game.gid,
							])}
						>
							{game.result}
						</a>
					),
					sortValue: game.diff,
					searchValue: game.result,
				},
				helpers.formatRecord(game),
				{
					value: <InjuryIcon className="ms-0" injury={game.injury} />,
					sortValue: game.injury.gamesRemaining,
					searchValue: game.injury.gamesRemaining,
					classNames: "text-center",
				},
				...(isSport("baseball") && showDecisionColumn
					? [<BaseballDecision p={game.stats as any} />]
					: []),
				...stats.map(stat =>
					game.stats[stat] === undefined
						? undefined
						: helpers.roundStat(game.stats[stat], stat, true),
				),
			],
		};
	};

	const rowsRegularSeason = gameLog.filter(game => !game.playoffs).map(makeRow);

	const playoffGames = gameLog.filter(game => game.playoffs);
	const rowsPlayoffs = playoffGames.map(makeRow);

	// Add separators to playoff series when there is one more than a single game
	let striped;
	if (numGamesPlayoffSeires.some(numGames => numGames > 1)) {
		striped = false;

		let prevOppTid;
		let oppTidCounter = -1;
		const classes = [
			"",
			"table-info",
			"table-primary",
			"table-success",
			"table-light",
			"table-danger",
			"table-warning",
			"table-secondary",
			"table-active",
		];
		for (let i = 0; i < playoffGames.length; i++) {
			const game = playoffGames[i];
			if (game.oppTid !== prevOppTid) {
				prevOppTid = game.oppTid;
				oppTidCounter += 1;
			}

			rowsPlayoffs[i].classNames = classes[oppTidCounter % classes.length];
		}
	} else {
		striped = true;
	}

	let noGamesMessage;
	if (gameLog.length === 0) {
		noGamesMessage = (
			<NoGamesMessage warnAboutDelete={season < currentSeason} />
		);
	}

	return (
		<>
			<TopStuff
				bestPos={bestPos}
				currentSeason={currentSeason}
				freeAgent={freeAgent}
				gender={gender}
				godMode={godMode}
				injured={injured}
				jerseyNumberInfos={jerseyNumberInfos}
				phase={phase}
				player={player}
				retired={retired}
				season={season}
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

			{noGamesMessage ? (
				noGamesMessage
			) : (
				<>
					{rowsRegularSeason.length > 0 ? (
						<>
							<DataTable
								cols={cols}
								defaultSort={[0, "asc"]}
								name="PlayerGameLog"
								rows={rowsRegularSeason}
								superCols={superCols}
							/>
						</>
					) : null}
					{rowsPlayoffs.length > 0 ? (
						<>
							<h2 className={rowsRegularSeason.length > 0 ? "mt-5" : undefined}>
								Playoffs
							</h2>
							<DataTable
								className="datatable-negative-margin-top"
								cols={cols}
								defaultSort={[0, "asc"]}
								name="PlayerGameLogPlayoffs"
								rows={rowsPlayoffs}
								striped={striped}
								superCols={superCols}
							/>
						</>
					) : null}
				</>
			)}
		</>
	);
};

export default PlayerGameLog;
