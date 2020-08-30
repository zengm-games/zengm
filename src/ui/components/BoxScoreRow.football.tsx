import PropTypes from "prop-types";
import React, { MouseEvent } from "react";
import PlayerNameLabels from "./PlayerNameLabels";
import { helpers } from "../util";

const width100 = {
	width: "100%",
};

const BoxScoreRow = ({
	className,
	onClick,
	p,
	stats,
}: {
	className?: string;
	onClick?: (event: MouseEvent) => void;
	p: any;
	stats: string[];
}) => {
	return (
		<tr className={className} onClick={onClick}>
			<td>{p.pos}</td>
			<td style={width100}>
				<PlayerNameLabels
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					pid={p.pid}
					skills={p.skills}
					watch={p.watch}
					disableWatchToggle
				>
					{p.name}
				</PlayerNameLabels>
			</td>
			{stats.map(stat => (
				<td key={stat}>{helpers.roundStat(p.processed[stat], stat, true)}</td>
			))}
		</tr>
	);
};

BoxScoreRow.propTypes = {
	className: PropTypes.string,
	onClick: PropTypes.func,
	p: PropTypes.object.isRequired,
};

export default BoxScoreRow;
