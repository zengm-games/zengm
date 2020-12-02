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
	let count = 0;

	let type;
	let classNameIcon;
	for (const award of awards) {
		if (season !== undefined && award.season !== season) {
			continue;
		}

		if (playoffs) {
			if (award.type === "Won Championship") {
				type = award.type;
				classNameIcon = "ring";
				if (season !== undefined) {
					break;
				}
				count += 1;
			}
		} else {
			if (award.type === "Most Valuable Player") {
				if (type !== award.type) {
					count = 0;
				}
				type = award.type;
				classNameIcon = "glyphicon glyphicon-star text-yellow";
				if (season !== undefined) {
					break;
				}
				count += 1;
			}

			if (type !== "Most Valuable Player") {
				// Only show these if not MVP, so no "break" statement inside
				if (process.env.SPORT === "basketball" && award.type === "All-Star") {
					type = award.type;
					classNameIcon = "glyphicon glyphicon-star text-muted";
					count += 1;
				}
				if (
					process.env.SPORT === "football" &&
					award.type.includes("All-League")
				) {
					type = award.type;
					classNameIcon = "glyphicon glyphicon-star text-muted";
					count += 1;
				}
			}
		}
	}

	if (type && classNameIcon) {
		const title = season === undefined ? `${count}x ${type}` : type;

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
