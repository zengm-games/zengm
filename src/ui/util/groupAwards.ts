import groupBy from "lodash/groupBy";
import type { Player } from "../../common/types";
import helpers from "./helpers";

const awardsOrder = [
	"Inducted into the Hall of Fame",
	"Most Valuable Player",
	"Won Championship",
	"Finals MVP",
	"Defensive Player of the Year",
	"Sixth Man of the Year",
	"Most Improved Player",
	"Rookie of the Year",
	"Offensive Rookie of the Year",
	"Defensive Rookie of the Year",
	"First Team All-League",
	"Second Team All-League",
	"Third Team All-League",
	"First Team All-Defensive",
	"Second Team All-Defensive",
	"Third Team All-Defensive",
	"All-Rookie Team",
	"All-Star",
	"All-Star MVP",
	"League Scoring Leader",
	"League Rebounding Leader",
	"League Assists Leader",
	"League Steals Leader",
	"League Blocks Leader",
];

const groupAwards = (awards: Player["awards"]) => {
	const awardsGrouped = [];
	const awardsGroupedTemp = groupBy(awards, award => award.type);

	for (const award of awardsOrder) {
		if (awardsGroupedTemp.hasOwnProperty(award)) {
			awardsGrouped.push({
				type: award,
				count: awardsGroupedTemp[award].length,
				seasons: helpers.yearRanges(
					awardsGroupedTemp[award].map(a => a.season),
				),
			});
		}
	}

	// Handle non-default awards, just for fun if someone wants to add more
	for (const award of Object.keys(awardsGroupedTemp).sort()) {
		if (!awardsOrder.includes(award)) {
			awardsGrouped.push({
				type: award,
				count: awardsGroupedTemp[award].length,
				seasons: helpers.yearRanges(
					awardsGroupedTemp[award].map(a => a.season),
				),
			});
		}
	}

	return awardsGrouped;
};

export default groupAwards;
