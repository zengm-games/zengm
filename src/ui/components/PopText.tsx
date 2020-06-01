import PropTypes from "prop-types";
import React from "react";

const PopText = ({
	numActiveTeams,
	teams,
	tid,
}: {
	numActiveTeams: number;
	teams: {
		tid: number;
		pop?: number;
		popRank: number;
	}[];
	tid: number | undefined;
}) => {
	if (tid === undefined) {
		return null;
	}

	if (tid >= 0) {
		const t = teams.find(t2 => t2.tid === tid);
		if (t) {
			let size;
			if (t.popRank <= Math.ceil((3 / 30) * numActiveTeams)) {
				size = "very large";
			} else if (t.popRank <= Math.ceil((8 / 30) * numActiveTeams)) {
				size = "large";
			} else if (t.popRank <= Math.ceil((16 / 30) * numActiveTeams)) {
				size = "normal";
			} else if (t.popRank <= Math.ceil((24 / 30) * numActiveTeams)) {
				size = "small";
			} else {
				size = "very small";
			}

			return (
				<span className="text-muted">
					Region population:{" "}
					{t.pop !== undefined ? `${t.pop.toFixed(1)} million ` : ""}(#
					{t.popRank})<br />
					Size: {size}
				</span>
			);
		}
	}

	return (
		<span className="text-muted">
			Region population: ?<br />
			Difficulty: ?
		</span>
	);
};

PopText.propTypes = {
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			// pop and popRank not required for Random Team
			pop: PropTypes.number,
			popRank: PropTypes.number,
			tid: PropTypes.number.isRequired,
		}),
	).isRequired,
	tid: PropTypes.number.isRequired,
};

export default PopText;
