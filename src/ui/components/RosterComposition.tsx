import HelpPopover from "./HelpPopover";
import { bySport, isSport, POSITION_COUNTS } from "../../common";

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

const RosterComposition = ({
	className = "",
	players,
}: {
	className?: string;
	players: Players;
}) => {
	if (isSport("basketball")) {
		return null;
	}

	return (
		<div className={`${className} text-nowrap`}>
			<b>
				Roster Composition{" "}
				<HelpPopover title="Roster Composition">
					<p>
						This shows the number of players you have at each position, compared
						to the recommended number. For example, if you see:
					</p>
					<p>
						{bySport({
							basketball: "?",
							football: "QB",
							hockey: "G",
						})}
						: 2/3
					</p>
					<p>
						That means you have two{" "}
						{bySport({
							basketball: "?",
							football: "quarterbacks",
							hockey: "goalies",
						})}
						, but it is recommended you have three.
					</p>
					<p>
						You don't have to follow these recommendations. You can make an
						entire team of{" "}
						{bySport({
							basketball: "?",
							football: "punters",
							hockey: "goalies",
						})}{" "}
						if you want. But if your roster is too unbalanced, your team may not
						perform very well, particularly when there are injuries and you have
						to go deep into your bench.
					</p>
				</HelpPopover>
			</b>
			{bySport({
				basketball: null,
				football: (
					<div className="mt-2 row">
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
				),
				hockey: (
					<div className="mt-2 row">
						<div className="col-6">
							<PositionFraction players={players} pos="C" />
							<br />
							<PositionFraction players={players} pos="D" />
						</div>
						<div className="col-6">
							<PositionFraction players={players} pos="W" />
							<br />
							<PositionFraction players={players} pos="G" />
						</div>
					</div>
				),
			})}
		</div>
	);
};

export default RosterComposition;
