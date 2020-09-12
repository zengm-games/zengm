import classNames from "classnames";
import React from "react";
import { MOOD_TRAITS } from "../../common";
import type { MoodComponents, MoodTrait } from "../../common/types";
import { helpers, useLocal } from "../util"; // Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.
import ResponsivePopover from "./ResponsivePopover";

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
				return "Happy with his playing time";
			case "rookieContract":
				return "Eager to sign first non-rookie contract";
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
			return "Wishes fans were more excited";
		case "loyalty":
			throw new Error("Should never happen");
		case "trades":
			return "Worried he'll be traded away";
		case "playingTime":
			return "Wants more playing time";
		case "rookieContract":
			throw new Error("Should never happen");
	}
};

const highlightColor = (sum: number) =>
	classNames({
		"text-danger": sum < 0,
		"text-success": sum > 0,
		"text-muted": sum === 0,
	});

const plusMinus = (sum: number) => `${sum > 0 ? "+" : ""}${sum}`;

const plusMinusStyle = {
	minWidth: 14,
};

const roundProbWilling = (probWilling: number) => {
	if (probWilling < 1 && probWilling > 0.99) {
		return ">99";
	}
	if (probWilling > 0 && probWilling < 0.01) {
		return "<1";
	}

	return Math.round(probWilling * 100);
};

export const processComponents = (components: MoodComponents) => {
	const componentsRounded = {
		...components,
	};
	let sum = 0;
	for (const key of helpers.keys(componentsRounded)) {
		componentsRounded[key] = Math.round(componentsRounded[key]);
		sum += componentsRounded[key];
	}

	return {
		componentsRounded,
		sum,
	};
};

const Mood = ({
	className,
	maxWidth,
	p,
}: {
	className?: string;
	maxWidth?: boolean;
	p: {
		pid: number;
		name: string;
		mood: {
			components: MoodComponents;
			probWilling: number;
			traits: MoodTrait[];
		};
		tid: number;
	};
}) => {
	const userTid = useLocal(state => state.userTid);

	if (!p.mood) {
		return null;
	}

	const { componentsRounded, sum } = processComponents(p.mood.components);

	const showProbWilling = p.tid >= 0;
	const roundedProbWilling = roundProbWilling(p.mood.probWilling);

	const id = `mood-popover-${p.pid}`;

	const modalHeader = (
		<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>
	);
	const modalBody = (
		<>
			{p.mood.traits.length > 0 ? (
				<p className="mb-2">
					Priorities:{" "}
					{p.mood.traits
						.map(trait => MOOD_TRAITS[trait].toLowerCase())
						.join(", ")}
				</p>
			) : null}
			<table>
				<tbody>
					{helpers.keys(componentsRounded).map(key => {
						const text = componentText(key, componentsRounded[key]);
						if (!text) {
							return null;
						}

						return (
							<tr key={key} className={highlightColor(componentsRounded[key])}>
								<td className="text-right p-0">
									{plusMinus(componentsRounded[key])}
								</td>
								<td className="p-0 pl-1">{text}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{showProbWilling ? (
				<p className="mt-2 mb-0">
					Odds player will {p.tid === userTid ? "re-sign" : "sign"} with you:{" "}
					{roundedProbWilling}%
				</p>
			) : null}
			{p.tid !== userTid ? (
				<p className="mt-2 mb-0 text-muted">
					This is his mood towards your team if you acquired him, not towards
					his current team
				</p>
			) : null}
		</>
	);

	const popoverContent = (
		<div
			style={{
				minWidth: 250,
			}}
		>
			<p className="mb-2">{modalHeader}</p>
			{modalBody}
		</div>
	);

	const renderTarget = ({ onClick }: { onClick?: () => void }) => (
		<button
			className={classNames("btn btn-light-bordered btn-xs d-flex", className, {
				"w-100": maxWidth,
			})}
			onClick={onClick}
		>
			<span
				className={`text-right ${highlightColor(sum)}`}
				data-no-row-highlight="true"
				style={plusMinusStyle}
			>
				{plusMinus(sum)}
			</span>
			<div className="ml-1 mr-auto" data-no-row-highlight="true">
				{p.mood.traits.join(" ")}
			</div>
			{showProbWilling ? (
				<span className="text-muted ml-1" data-no-row-highlight="true">
					{roundedProbWilling}%
				</span>
			) : null}
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
