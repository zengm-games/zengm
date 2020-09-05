import classNames from "classnames";
import React from "react";
import type { MoodComponents, MoodTrait } from "../../common/types";
import { helpers, useLocal } from "../util"; // Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.
import ResponsivePopover from "./ResponsivePopover";

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
	pid,
	components,
	traits,
}: {
	pid: number;
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

	const id = `mood-popover-${pid}`;

	const modalHeader = "TODO";
	const modalBody = "TODO2";

	const popoverContent = (
		<div
			className="text-nowrap"
			style={{
				minWidth: 250,
				minHeight: 225,
			}}
		>
			TODO3
		</div>
	);

	const renderTarget = ({ onClick }: { onClick?: () => void }) => (
		<button className="btn btn-light-bordered btn-xs" onClick={onClick}>
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
	);

	return (
		<ResponsivePopover
			id={id}
			modalHeader={modalHeader}
			modalBody={modalBody}
			popoverContent={popoverContent}
			renderTarget={renderTarget}
		/>
	);
};

export default Mood;
