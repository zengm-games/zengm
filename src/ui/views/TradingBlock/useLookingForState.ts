import React, { useState } from "react";
import {
	bySport,
	COMPOSITE_WEIGHTS,
	NOT_REAL_POSITIONS,
	POSITIONS,
	SKILLS,
} from "../../../common/index.ts";

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
	default: POSITIONS.filter((pos) => !NOT_REAL_POSITIONS.includes(pos)),
});
const positionNames = bySport<Record<string, string> | undefined>({
	baseball: undefined,
	basketball: {
		G: "Guard",
		F: "Forward",
		C: "Center",
	},
	football: undefined,
	hockey: {
		C: "Center",
		W: "Wing",
		D: "Defenseman",
		G: "Goalie",
	},
	default: undefined,
});

const skillOptions = [];
for (const [key, compositeWeight] of Object.entries(COMPOSITE_WEIGHTS)) {
	if (compositeWeight.skill) {
		skillOptions.push({
			key,
			name: compositeWeight.skill.label,
			tooltip: SKILLS[compositeWeight.skill.label],
		});
	}
}

export const categories: Categories = {
	positions: {
		name: "Positions",
		options: positions.map((pos) => {
			return {
				key: pos,
				name: positionNames?.[pos] ?? pos,
			};
		}),
	},
	skills: {
		name: "Skills",
		options: skillOptions,
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

const getInitialState = () => {
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
};

export type LookingForState = ReturnType<typeof getInitialState>;
export type SetLookingForState = React.Dispatch<
	React.SetStateAction<LookingForState>
>;

const useLookingForState = (savedLookingFor: LookingForState | undefined) => {
	const [state, setState] = useState(savedLookingFor ?? getInitialState);

	const resetState = () => {
		setState(getInitialState());
	};

	return [state, setState, resetState] as const;
};

export default useLookingForState;
