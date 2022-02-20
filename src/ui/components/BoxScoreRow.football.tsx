import type { MouseEvent } from "react";
import PlayerNameLabels2 from "./PlayerNameLabels2";
import { helpers } from "../util";

const width100 = {
	width: "100%",
};

const BoxScoreRow = ({
	className,
	highlightCols,
	onClick,
	p,
	stats,
}: {
	className?: string;
	highlightCols?: number[];
	onClick?: (event: MouseEvent) => void;
	p: any;
	stats: string[];
}) => {
	return (
		<tr className={className} onClick={onClick}>
			<td>{p.pos}</td>
			<td style={width100}>
				<PlayerNameLabels2
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					pid={p.pid}
					skills={p.skills}
					legacyName={p.name}
				/>
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
		</tr>
	);
};

export default BoxScoreRow;
