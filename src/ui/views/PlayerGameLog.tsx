import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import TopStuff from "./Player/TopStuff";
import { getCols, helpers } from "../util";
import { DataTable, InjuryIcon } from "../components";
import { NoGamesMessage } from "./GameLog";
import type { DataTableRow } from "../components/DataTable";

const PlayerGameLog = ({
	currentSeason,
	customMenu,
	freeAgent,
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
	willingToSign,
	gameLog,
	season,
	seasonsWithStats,
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
		...stats.map(stat => `stat:${stat}`),
	]);

	const makeRow = (game: typeof gameLog[number], i: number): DataTableRow => {
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
			"table-secondary",
			"table-info",
			"table-primary",
			"table-success",
			"table-danger",
			"table-warning",
			"table-active",
			"table-light",
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
				currentSeason={currentSeason}
				freeAgent={freeAgent}
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
