import type { MouseEvent } from "react";
import PlayerNameLabels from "./PlayerNameLabels.tsx";
import { helpers } from "../util/index.ts";
import { isSport } from "../../common/index.ts";
import { BaseballDecision } from "../views/PlayerGameLog.tsx";

const width100 = {
	width: "100%",
};

const BoxScoreRow = ({
	allStarGame,
	className,
	exhibition,
	highlightCols,
	onClick,
	p,
	stats,
	season,
	seasonStats,
}: {
	allStarGame?: boolean;
	className?: string;
	exhibition?: boolean;
	highlightCols?: number[];
	onClick?: (event: MouseEvent) => void;
	p: any;
	stats: string[];
	season: number;
	seasonStats?: string[];
}) => {
	return (
		<tr className={className} onClick={onClick}>
			<td>{isSport("baseball") && !p.gs ? null : p.pos}</td>
			<td style={width100}>
				<PlayerNameLabels
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					pid={p.pid}
					skills={p.skills}
					legacyName={p.name}
					disableNameLink={exhibition}
					season={season}
				/>
				{isSport("baseball") ? (
					<BaseballDecision
						className="ms-2"
						p={p}
						hideRecord={!!(allStarGame || exhibition)}
						wlColors
					/>
				) : null}
			</td>
			{stats.map((stat, i) => (
				<td
					key={stat}
					className={
						highlightCols?.includes(i) ? "sorting_highlight" : undefined
					}
				>
					{helpers.roundStat(p.processed[stat], stat, true)}
				</td>
			))}
			{seasonStats
				? seasonStats.map((stat, i) => (
						<td
							key={stat}
							className={
								highlightCols?.includes(i) ? "sorting_highlight" : undefined
							}
						>
							{helpers.roundStat(p.seasonStats[stat], stat, true)}
						</td>
					))
				: null}
		</tr>
	);
};

export default BoxScoreRow;
