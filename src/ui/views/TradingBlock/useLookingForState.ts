import { useState } from "react";
import {
	bySport,
	NOT_REAL_POSITIONS,
	POSITIONS,
	SKILLS,
} from "../../../common";

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

export const categories: Categories = {
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

const useLookingForState = () => {
	const [state, setState] = useState(getInitialState);

	const resetState = () => {
		setState(getInitialState());
	};

	return [state, setState, resetState] as const;
};

export default useLookingForState;
