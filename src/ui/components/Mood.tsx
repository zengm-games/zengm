import classNames from "classnames";
import React from "react";
import type { MoodComponents, MoodTrait } from "../../common/types";
import { helpers, useLocal } from "../util"; // Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.

const formatTrait = (trait: MoodTrait) => {
	switch (trait) {
		case "fame":
			return "F";
		case "loyalty":
			return "L";
		case "money":
			return "$";
		case "winning":
			return "W";
	}
};

const Mood = ({
	components,
	traits,
}: {
	components: MoodComponents;
	traits: MoodTrait[];
}) => {
	const componentsRounded = {
		...components,
	};
	let sum = 0;
	for (const key of helpers.keys(componentsRounded)) {
		componentsRounded[key] = Math.round(componentsRounded[key]);
		sum += componentsRounded[key];
	}

	return (
		<>
			<button className="btn btn-light-bordered btn-xs">
				<span
					className={classNames({
						"text-danger": sum < 0,
						"text-success": sum > 0,
					})}
				>
					{sum > 0 ? "+" : ""}
					{sum}{" "}
				</span>
				{traits.map(formatTrait).join(" ")}
			</button>
		</>
	);
};

export default Mood;
