import classNames from "classnames";
import { isSport } from "../../../common";
import type { Player } from "../../../common/types";

const prefixCount = (text: string, count: number) => {
	if (count <= 1) {
		return text;
	}

	return `${count}x ${text}`;
};

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
			if (isSport("basketball") && award.type === "All-Star") {
				type = award.type;
				countAllStar += 1;
			}
			if (
				!isSport("basketball") &&
				!isSport("baseball") &&
				award.type.includes("All-League")
			) {
				type = award.type;
				countAllLeague += 1;
			}
			if (isSport("baseball") && award.type.includes("All-Offensive")) {
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
				title = prefixCount("Won Championship", countChamp);
				classNameIcon = "ring";
			}
		} else {
			const titles = [];
			if (countMVP > 0) {
				titles.push(prefixCount("Most Valuable Player", countMVP));
			}
			if (countAllStar > 0) {
				titles.push(prefixCount("All-Star", countAllStar));
			}
			if (countAllLeague > 0) {
				titles.push(prefixCount("All-League", countAllLeague));
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
