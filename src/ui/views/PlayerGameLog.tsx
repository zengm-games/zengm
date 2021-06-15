import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import TopStuff from "./Player/TopStuff";

const PlayerGameLog = ({
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
	willingToSign,
}: View<"playerGameLog">) => {
	useTitleBar({
		title: `${player.name} Game Log`,
		dropdownView: "playerGameLog",
		dropdownFields: {
			seasons: season,
		},
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
		</>
	);
};

export default PlayerGameLog;
