import classNames from "classnames";
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

	for (const award of awards) {
		if (season !== undefined && award.season !== season) {
			continue;
		}

		if (playoffs) {
			if (award.type === "Won Championship") {
				countChamp += 1;
				if (season !== undefined) {
					break;
				}
			}
		} else {
			if (award.type === "Most Valuable Player") {
				countMVP += 1;
				if (season !== undefined) {
					break;
				}
			}

			// Only show these if not MVP, so no "break" statement inside
			if (award.type === "All-Star") {
				countAllStar += 1;
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
				classNameIcon = "glyphicon glyphicon-star text-body-secondary";
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

			if (titles.length > 0) {
				title = titles.join(", ");

				if (countMVP > 0) {
					classNameIcon = "glyphicon glyphicon-star text-yellow";
				} else {
					classNameIcon = "glyphicon glyphicon-star text-body-secondary";
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
