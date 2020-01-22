import PropTypes from "prop-types";
import React, { MouseEvent } from "react";
import { PlayerNameLabels } from "../../../deion/ui/components";
import { helpers } from "../../../deion/ui/util";

const width100 = {
	width: "100%",
};

const BoxScoreRow = ({
	className,
	onClick,
	p,
	stats,
}: {
	className: string;
	onClick?: (a: MouseEvent) => void;
	p: any;
	stats: string[];
}) => {
	return (
		<tr className={className} onClick={onClick}>
			<td>{p.pos}</td>
			<td style={width100}>
				<PlayerNameLabels injury={p.injury} pid={p.pid} skills={p.skills}>
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
