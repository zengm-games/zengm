import classNames from "classnames";
import PropTypes from "prop-types";
import React, { MouseEvent } from "react";
import PlayerNameLabels from "./PlayerNameLabels";
import { helpers } from "../util";

const BoxScoreRow = ({
	className,
	i,
	onClick,
	p,
}: {
	className?: string;
	i: number;
	onClick?: (event: MouseEvent) => void;
	p: any;
}) => {
	return (
		<tr
			className={classNames(className, {
				separator: i === 4,
			})}
			onClick={onClick}
		>
			<td>
				<PlayerNameLabels injury={p.injury} pid={p.pid} skills={p.skills}>
					{p.name}
				</PlayerNameLabels>
			</td>
			{typeof p.abbrev === "string" ? (
				<td>
					<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`])}>
						{p.abbrev}
					</a>
				</td>
			) : null}
			<td>{p.pos}</td>
			<td>{p.min.toFixed(1)}</td>
			<td>
				{p.fg}-{p.fga}
			</td>
			<td>
				{p.tp}-{p.tpa}
			</td>
			<td>
				{p.ft}-{p.fta}
			</td>
			<td>{p.orb}</td>
			<td>{p.drb + p.orb}</td>
			<td>{p.ast}</td>
			<td>{p.tov}</td>
			<td>{p.stl}</td>
			<td>{p.blk}</td>
			<td>{p.ba}</td>
			<td>{p.pf}</td>
			<td>{p.pts}</td>
			<td>{helpers.plusMinus(p.pm, 0)}</td>
			<td>{helpers.gameScore(p).toFixed(1)}</td>
		</tr>
	);
};

BoxScoreRow.propTypes = {
	className: PropTypes.string,
	onClick: PropTypes.func,
	p: PropTypes.object.isRequired,
};

export default BoxScoreRow;
