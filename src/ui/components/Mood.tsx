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

const componentText = (component: keyof MoodComponents, value: number) => {
	if (value === 0) {
		return;
	}

	if (value > 0) {
		switch (component) {
			case "marketSize":
				return "Enjoys playing in a large market";
			case "facilities":
				return "Likes the lavish team facilities";
			case "teamPerformance":
				return "Happy with the team's performance";
			case "hype":
				return "Likes the energy from the fan base";
			case "loyalty":
				return "Is loyal to the franchise";
			case "trades":
				throw new Error("Should never happen");
			case "playingTime":
				return "Likes the amount of playing time he's receiving";
		}
	}

	switch (component) {
		case "marketSize":
			return "Dislikes playing in a small market";
		case "facilities":
			return "Dislikes the outdated team facilities";
		case "teamPerformance":
			return "Unhappy with the team's performance";
		case "hype":
			return "Wishes the fan base was more engaged";
		case "loyalty":
			throw new Error("Should never happen");
		case "trades":
			return "Thinks you're too quick to trade away players";
		case "playingTime":
			return "Wants more playing time";
	}
};

const highlightColor = (sum: number) =>
	classNames({
		"text-danger": sum < 0,
		"text-success": sum > 0,
	});

const plusMinus = (sum: number) => `${sum > 0 ? "+" : ""}${sum}`;

const Mood = ({
	p,
}: {
	p: {
		pid: number;
		name: string;
		mood: {
			components: MoodComponents;
			traits: MoodTrait[];
		};
	};
}) => {
	const componentsRounded = {
		...p.mood.components,
	};
	let sum = 0;
	for (const key of helpers.keys(componentsRounded)) {
		componentsRounded[key] = Math.round(componentsRounded[key]);
		sum += componentsRounded[key];
	}

	const id = `mood-popover-${p.pid}`;

	const modalHeader = "TODO";
	const modalBody = "TODO2";

	const popoverContent = (
		<div
			className="text-nowrap"
			style={{
				minWidth: 250,
			}}
		>
			<p className="mb-2">{p.name}</p>
			<p className="mb-2">Priorities: {p.mood.traits.join(", ")}</p>
			<table>
				<tbody>
					{helpers.keys(componentsRounded).map(key => {
						const text = componentText(key, componentsRounded[key]);
						if (!text) {
							return null;
						}

						return (
							<tr key={key} className={highlightColor(componentsRounded[key])}>
								<td className="text-right">
									{plusMinus(componentsRounded[key])}
								</td>
								<td className="pl-1">{text}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{p.mood.probWilling} {p.mood.willing}
		</div>
	);

	const renderTarget = ({ onClick }: { onClick?: () => void }) => (
		<button className="btn btn-light-bordered btn-xs" onClick={onClick}>
			<span className={highlightColor(sum)} data-no-row-highlight="true">
				{plusMinus(sum)}{" "}
			</span>
			{p.mood.traits.map(formatTrait).join(" ")}
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
