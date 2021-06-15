import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import TopStuff from "./Player/TopStuff";
import { getCols, helpers } from "../util";
import { DataTable } from "../components";

const PlayerGameLog = ({
	currentSeason,
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
	willingToSign,
	gameLog,
	season,
	stats,
	superCols,
}: View<"playerGameLog">) => {
	useTitleBar({
		title: `${player.name} Game Log`,
		dropdownView: "player_game_log",
		dropdownFields: {
			seasons: season,
		},
		dropdownExtraBefore: [player.pid],
	});

	const cols = getCols(
		"#",
		"Team",
		"Opp",
		"Result",
		...stats.map(stat => `stat:${stat}`),
	);

	const rows = gameLog.map((game, i) => {
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
				<a
					href={helpers.leagueUrl([
						"roster",
						`${game.oppAbbrev}_${game.oppTid}`,
						season,
					])}
				>
					{game.oppAbbrev}
				</a>,
				game.result,
				...stats.map(stat => helpers.roundStat(game.stats[stat], stat, true)),
			],
		};
	});

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
				willingToSign={willingToSign}
			/>

			{rows.length === 0 ? (
				<p>No games found</p>
			) : (
				<DataTable
					cols={cols}
					defaultSort={[0, "asc"]}
					name="PlayerGameLog"
					rows={rows}
					superCols={superCols}
				/>
			)}
		</>
	);
};

export default PlayerGameLog;
