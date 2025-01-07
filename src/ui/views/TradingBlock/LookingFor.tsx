import { useState } from "react";
import {
	bySport,
	NOT_REAL_POSITIONS,
	POSITIONS,
	SKILLS,
} from "../../../common";
import clsx from "clsx";
import { helpers } from "../../util";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

type Category = {
	name: string;
	options: {
		key: string;
		name: string;
		tooltip?: string;
	}[];
};
type Categories = Record<"positions" | "skills" | "assets", Category>;

const positions = bySport({
	basketball: ["G", "F", "C"],
	default: POSITIONS.filter(pos => !NOT_REAL_POSITIONS.includes(pos)),
});
const positionNames = bySport<Record<string, string> | undefined>({
	basketball: {
		G: "Guards",
		F: "Forwards",
		C: "Centers",
	},
	default: undefined,
});

const categories: Categories = {
	positions: {
		name: "Positions",
		options: positions.map(pos => {
			return {
				key: pos,
				name: positionNames?.[pos] ?? pos,
			};
		}),
	},
	skills: {
		name: "Skills",
		options: Object.entries(SKILLS).map(([key, tooltip]) => {
			return {
				key,
				name: key,
				tooltip,
			};
		}),
	},
	assets: {
		name: "Assets",
		options: [
			{
				key: "draftPicks",
				name: "Draft picks",
			},
			{
				key: "prospects",
				name: "Prospects",
			},
			{
				key: "bestCurrentPlayers",
				name: "Best current players",
			},
		],
	},
};

const LookingFor = () => {
	const [state, setState] = useState(() => {
		const makeObj = (category: Category) => {
			const obj: Record<string, boolean> = {};
			for (const { key } of category.options) {
				obj[key] = false;
			}
			return obj;
		};

		return {
			positions: makeObj(categories.positions),
			skills: makeObj(categories.skills),
			assets: makeObj(categories.assets),
		};
	});

	return (
		<>
			<h3 className="mb-0">What are you looking for?</h3>
			<table>
				<tbody>
					{helpers.keys(categories).map(categoryKey => {
						const category = categories[categoryKey];
						return (
							<tr className="pt-2" key={categoryKey}>
								<td style={{ width: 0 }} className="p-0 pt-2 text-end">
									{category.name}
								</td>
								<td className="p-0 ps-2 pt-2 d-flex gap-3">
									{category.options.map(option => {
										const toggleButton = (
											<label
												key={option.key}
												className={clsx(
													"rounded-pill py-1 px-2",
													state[categoryKey][option.key]
														? "bg-secondary"
														: "bg-body-secondary",
												)}
											>
												<input
													type="checkbox"
													className="form-check-input me-1"
													onChange={() => {
														setState(state => {
															return {
																...state,
																[categoryKey]: {
																	...state[categoryKey],
																	[option.key]: !state[categoryKey][option.key],
																},
															};
														});
													}}
												/>
												{option.name}
											</label>
										);

										if (option.tooltip === undefined) {
											return toggleButton;
										}

										// position-fixed is for https://stackoverflow.com/a/75264190/786644
										return (
											<OverlayTrigger
												overlay={
													<Tooltip className="position-fixed">
														{option.tooltip}
													</Tooltip>
												}
											>
												{toggleButton}
											</OverlayTrigger>
										);
									})}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</>
	);
};

export default LookingFor;
