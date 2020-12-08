import classNames from "classnames";
import React from "react";
import type { Player } from "../../../common/types";

// If no season, then check whole career
const SeasonIcons = ({
	className,
	season,
	awards,
	playoffs,
}: {
	className?: string;
	season?: number;
	awards: Player["awards"];
	playoffs?: boolean;
}) => {
	let countChamp = 0;
	let countMVP = 0;
	let countAllStar = 0;
	let countAllLeague = 0;

	let type;
	for (const award of awards) {
		if (season !== undefined && award.season !== season) {
			continue;
		}

		if (playoffs) {
			if (award.type === "Won Championship") {
				type = award.type;
				countChamp += 1;
				if (season !== undefined) {
					break;
				}
			}
		} else {
			if (award.type === "Most Valuable Player") {
				type = award.type;
				countMVP += 1;
				if (season !== undefined) {
					break;
				}
			}

			// Only show these if not MVP, so no "break" statement inside
			if (process.env.SPORT === "basketball" && award.type === "All-Star") {
				type = award.type;
				countAllStar += 1;
			}
			if (
				process.env.SPORT === "football" &&
				award.type.includes("All-League")
			) {
				type = award.type;
				countAllLeague += 1;
			}
		}
	}

	let classNameIcon;
	let title;
	if (season !== undefined) {
		if (playoffs) {
			if (countChamp > 0) {
				title = "Won Championship";
				classNameIcon = "ring";
			}
		} else {
			if (countMVP > 0) {
				title = "Most Valuable Player";
				classNameIcon = "glyphicon glyphicon-star text-yellow";
			} else if (countAllStar > 0) {
				title = "All-Star";
				classNameIcon = "glyphicon glyphicon-star text-muted";
			} else if (countAllLeague > 0) {
				// So it gets First Team or Second Team included
				title = type;
				classNameIcon = "glyphicon glyphicon-star text-muted";
			}
		}
	} else {
		if (playoffs) {
			if (countChamp > 0) {
				title = `${countChamp}x Won Championship`;
				classNameIcon = "ring";
			}
		} else {
			const titles = [];
			if (countMVP > 0) {
				titles.push(`${countMVP}x Most Valuable Player`);
			}
			if (countAllStar > 0) {
				titles.push(`${countAllStar}x All-Star`);
			}
			if (countAllLeague > 0) {
				titles.push(`${countAllLeague}x All-League`);
			}

			if (titles.length > 0) {
				title = titles.join(", ");

				if (countMVP > 0) {
					classNameIcon = "glyphicon glyphicon-star text-yellow";
				} else {
					classNameIcon = "glyphicon glyphicon-star text-muted";
				}
			}
		}
	}

	if (title) {
		return (
			<span
				className={classNames(classNameIcon, className)}
				role="img"
				aria-label={title}
				title={title}
			/>
		);
	}

	return null;
};

export default SeasonIcons;
