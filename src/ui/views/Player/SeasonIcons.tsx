import React from "react";
import type { Player } from "../../../common/types";

const SeasonIcons = ({
	season,
	awards,
	playoffs,
}: {
	season: number;
	awards: Player["awards"];
	playoffs?: boolean;
}) => {
	let type;
	let icon;
	for (const award of awards) {
		if (award.season !== season) {
			continue;
		}

		if (playoffs) {
			if (award.type === "Won Championship") {
				type = award.type;
				icon = "🏆";
				break;
			}
		} else {
			if (award.type === "Most Valuable Player") {
				type = award.type;
				icon = "🏅";
				break;
			}

			// Only show these if not MVP, so no "break" statement inside
			if (process.env.SPORT === "basketball" && award.type === "All-Star") {
				type = award.type;
				icon = "⭐";
			}
			if (
				process.env.SPORT === "football" &&
				award.type.includes("All-League")
			) {
				type = award.type;
				icon = "⭐";
			}
		}
	}

	if (type && icon) {
		return (
			<span
				className="cursor-default"
				role="img"
				aria-label={type}
				title={type}
			>
				{icon}
			</span>
		);
	}

	return null;
};

export default SeasonIcons;
