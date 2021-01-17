import classNames from "classnames";
import { useState } from "react";
import { MOOD_TRAITS } from "../../common";
import type { MoodComponents, MoodTrait } from "../../common/types";
import { helpers, useLocalShallow } from "../util"; // Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.
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

type PlayerMood = {
	components: MoodComponents;
	probWilling: number;
	traits: MoodTrait[];
};

type Props = {
	className?: string;
	maxWidth?: boolean;
	p: {
		pid: number;
		name: string;
		mood: {
			user: PlayerMood;
			current?: PlayerMood;
		};
		tid: number;
	};
	defaultType: "user" | "current";
};

const Mood = ({ className, defaultType, maxWidth, p }: Props) => {
	const { teamInfoCache, userTid } = useLocalShallow(state => ({
		teamInfoCache: state.teamInfoCache,
		userTid: state.userTid,
	}));

	const playerIsOnUsersTeam = userTid === p.tid;
	const canShowCurrent = p.mood.current && !playerIsOnUsersTeam;
	const initialType =
		defaultType === "current" && canShowCurrent ? "current" : "user";

	const [type, setType] = useState<"user" | "current">(initialType);

	const mood = p.mood[type];
	const initialMood = p.mood[initialType];

	if (!initialMood) {
		return null;
	}

	if (defaultType === "current" && !p.mood.current) {
		// This handles when it's requested to show the current team, but there is no current team
		return null;
	}

	const showProbWilling = p.tid >= 0;

	const id = `mood-popover-${p.pid}`;

	let signText;
	if (type === "user") {
		if (p.tid === userTid) {
			signText = "re-sign with you";
		} else {
			signText = "sign with you";
		}
	} else {
		signText = "re-sign with his current team";
	}

	const modalHeader = (
		<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>
	);
	let modalBody = null;
	if (mood) {
		const { componentsRounded } = processComponents(mood.components);
		const roundedProbWilling = roundProbWilling(mood.probWilling);

		modalBody = (
			<>
				{mood && mood.traits.length > 0 ? (
					<p className="mb-2">
						Priorities:{" "}
						{mood.traits
							.map(trait => MOOD_TRAITS[trait].toLowerCase())
							.join(", ")}
					</p>
				) : null}
				<ul className="nav nav-tabs mb-2">
					<li className="nav-item">
						<a
							className={classNames("nav-link", {
								active: type === "user",
							})}
							onClick={event => {
								event.preventDefault();
								setType("user");
							}}
						>
							{teamInfoCache[userTid]?.abbrev}
						</a>
					</li>
					{canShowCurrent ? (
						<li className="nav-item">
							<a
								className={classNames("nav-link", {
									active: type === "current",
								})}
								onClick={event => {
									event.preventDefault();
									setType("current");
								}}
							>
								{teamInfoCache[p.tid]?.abbrev}
							</a>
						</li>
					) : null}
				</ul>
				<table>
					<tbody>
						{helpers.keys(componentsRounded).map(key => {
							const text = componentText(key, componentsRounded[key]);
							if (!text) {
								return null;
							}

							return (
								<tr
									key={key}
									className={highlightColor(componentsRounded[key])}
								>
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
					<p className="mt-1 mb-0">
						Odds player would {signText}: {roundedProbWilling}%
					</p>
				) : null}
			</>
		);
	}

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

	const { sum } = processComponents(initialMood.components);
	const roundedProbWilling = roundProbWilling(initialMood.probWilling);
	const renderTarget = ({ onClick }: { onClick?: () => void }) => {
		return (
			<button
				className={classNames(
					"btn btn-xs d-flex",
					className,
					initialType === "user"
						? "btn-light-bordered-primary"
						: "btn-light-bordered",
					{
						"w-100": maxWidth,
					},
				)}
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
					{initialMood.traits.join(" ")}
				</div>
				{showProbWilling ? (
					<span className="text-muted ml-1" data-no-row-highlight="true">
						{roundedProbWilling}%
					</span>
				) : null}
			</button>
		);
	};

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

export const dataTableWrappedMood = (props: Props) => {
	const { defaultType, p } = props;

	if (!p.mood) {
		return null;
	}

	const mood = p.mood[defaultType];

	return {
		value: <Mood {...props} />,
		sortValue: mood ? processComponents(mood.components).sum : null,
		searchValue: mood ? mood.traits.join("") : null,
	};
};
