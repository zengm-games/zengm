import classNames from "classnames";
import PropTypes from "prop-types";
import type { MouseEvent } from "react";
import PlayerNameLabels from "./PlayerNameLabels";
import { helpers } from "../util";

const BoxScoreRow = ({
	className,
	lastStarter,
	liveGameInProgress,
	onClick,
	p,
}: {
	className?: string;
	lastStarter?: boolean;
	liveGameInProgress?: boolean;
	onClick?: (event: MouseEvent) => void;
	p: any;
}) => {
	const showDNP =
		p.min === 0 &&
		(!liveGameInProgress ||
			(p.injury.gamesRemaining > 0 && !p.injury.playingThrough));

	const statCols = showDNP ? (
		<td colSpan={15} className="text-center">
			DNP -{" "}
			{p.injury.gamesRemaining === 0 || p.injury.playingThrough
				? "Coach's decision"
				: p.injury.type}
		</td>
	) : (
		<>
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
		</>
	);

	return (
		<tr
			className={classNames(className, {
				separator: lastStarter,
			})}
			onClick={onClick}
		>
			<td>
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
			{typeof p.abbrev === "string" ? (
				<td>
					<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`])}>
						{p.abbrev}
					</a>
				</td>
			) : null}
			<td>{p.pos}</td>
			{statCols}
		</tr>
	);
};

BoxScoreRow.propTypes = {
	className: PropTypes.string,
	onClick: PropTypes.func,
	p: PropTypes.object.isRequired,
};

export default BoxScoreRow;
