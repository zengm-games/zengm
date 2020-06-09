import PropTypes from "prop-types";
import React from "react";
import HelpPopover from "./HelpPopover";
import { POSITION_COUNTS } from "../../common";

type Players = {
	ratings: {
		pos: string;
	};
}[];

const PositionFraction = ({
	players,
	pos,
}: {
	players: Players;
	pos: string;
}) => {
	const count = players.filter(p => p.ratings.pos === pos).length;
	const target = POSITION_COUNTS[pos];
	const ratio = count / target;

	let classes: string | undefined;
	if (count === 0 || ratio < 2 / 3) {
		classes = "text-danger";
	}

	return (
		<span className={classes}>
			{pos}: {count}/{target}
		</span>
	);
};
PositionFraction.propTypes = {
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	pos: PropTypes.string.isRequired,
};

const RosterComposition = ({
	className = "",
	players,
}: {
	className: string;
	players: Players;
}) => {
	return (
		<div className={`${className} text-nowrap`}>
			<b>
				Roster Composition{" "}
				<HelpPopover title="Roster Composition">
					<p>
						This shows the number of players you have at each position, compared
						to the recommended number. For example, if you see:
					</p>
					<p>QB: 2/3</p>
					<p>
						That means you have two quarterbacks, but it is recommended you have
						three.
					</p>
					<p>
						You don't have to follow these recommendations. You can make an
						entire team of punters if you want. But if your roster is too
						unbalanced, your team may not perform very well, particularly when
						there are injuries and you have to go deep into your bench.
					</p>
				</HelpPopover>
			</b>
			<div className="row">
				<div className="col-4">
					<PositionFraction players={players} pos="QB" />
					<br />
					<PositionFraction players={players} pos="RB" />
					<br />
					<PositionFraction players={players} pos="WR" />
					<br />
					<PositionFraction players={players} pos="TE" />
				</div>
				<div className="col-4">
					<PositionFraction players={players} pos="OL" />
					<br />
					<br />
					<PositionFraction players={players} pos="K" />
					<br />
					<PositionFraction players={players} pos="P" />
				</div>
				<div className="col-4">
					<PositionFraction players={players} pos="DL" />
					<br />
					<PositionFraction players={players} pos="LB" />
					<br />
					<PositionFraction players={players} pos="CB" />
					<br />
					<PositionFraction players={players} pos="S" />
				</div>
			</div>
		</div>
	);
};
RosterComposition.propTypes = {
	className: PropTypes.string,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default RosterComposition;
