import type { MouseEvent } from "react";
import PlayerNameLabels from "./PlayerNameLabels";
import { helpers } from "../util";
import { isSport } from "../../common";

const width100 = {
	width: "100%",
};

const BoxScoreRow = ({
	className,
	exhibition,
	highlightCols,
	onClick,
	p,
	stats,
	season,
	seasonStats,
}: {
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
					p.w > 0 ? (
						<span className="text-success ms-2">
							{p.bs > 0 ? "B" : ""}W
							{exhibition
								? null
								: ` (${helpers.formatRecord({
										won: p.seasonStats.w,
										lost: p.seasonStats.l,
									})})`}
						</span>
					) : p.l > 0 ? (
						<span className="text-danger ms-2">
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
						<span className="ms-2">
							SV{exhibition ? null : ` (${p.seasonStats.sv})`}
						</span>
					) : p.bs > 0 ? (
						<span className="ms-2">
							BS{exhibition ? null : ` (${p.seasonStats.bs})`}
						</span>
					) : p.hld > 0 ? (
						<span className="ms-2">
							H{exhibition ? null : ` (${p.seasonStats.hld})`}
						</span>
					) : null
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
