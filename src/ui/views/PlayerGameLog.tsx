import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import TopStuff from "./Player/TopStuff";
import { getCols, helpers } from "../util";
import { DataTable } from "../components";
import { NoGamesMessage } from "./GameLog";

const PlayerGameLog = ({
	currentSeason,
	customMenu,
	freeAgent,
	godMode,
	injured,
	jerseyNumberInfos,
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
			seasons: seasonsWithStats,
		},
		dropdownCustomURL: fields => {
			const parts =
				fields.playerProfile === "gameLog"
					? ["player_game_log", player.pid, fields.seasons]
					: ["player", player.pid];

			return helpers.leagueUrl(parts);
		},
	});

	const cols = getCols(
		"#",
		"Team",
		"Opp",
		"Result",
		...stats.map(stat => `stat:${stat}`),
	);

	const makeRow = (game: typeof gameLog[number], i: number) => {
		const oppAbbrevWithAway = `${game.away ? "@" : ""}${game.oppAbbrev}`;

		return {
			key: i,
			data: [
				i + 1,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${game.abbrev}_${game.tid}`,
						season,
					])}
				>
					{game.abbrev}
				</a>,
				{
					value: (
						<a
							href={helpers.leagueUrl([
								"roster",
								`${game.oppAbbrev}_${game.oppTid}`,
								season,
							])}
						>
							{oppAbbrevWithAway}
						</a>
					),
					sortValue: game.oppAbbrev,
					searchValue: oppAbbrevWithAway,
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
				...stats.map(stat => helpers.roundStat(game.stats[stat], stat, true)),
			],
		};
	};

	const rowsRegularSeason = gameLog.filter(game => !game.playoffs).map(makeRow);
	const rowsPlayoffs = gameLog.filter(game => game.playoffs).map(makeRow);

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
