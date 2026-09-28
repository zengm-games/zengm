import { SPORTS, type Sport } from "../lib/getSport.ts";
import * as render from "./render/index.ts";
import type { SpinnerOptions } from "./render/renderSpinner.ts";

// Each sport has its own set of colors
type Colors = {
	[S in Sport]: Parameters<(typeof render)[S]>[0]["colors"];
};

const colors: {
	[S in Sport]: {
		gold: Colors[S];
		normal: Colors[S];
	};
} = {
	baseball: {
		gold: {
			ball: "#ffdb1a",
			stitches: "#c03018",
		},
		normal: {
			ball: "#e3dcda",
			stitches: "#c03018",
		},
	},
	basketball: {
		gold: ["#ffd700", "#ffffff"],
		normal: ["#ff7f2a", "#ffd52a"],
	},
	football: {
		gold: {
			ball: "#ffd700",
			seam: "#996515",
			stripes: ["#bbbbbb", "#cccccc"],
			laceBackbone: "#996515",
			laces: "#996515",
		},
		normal: {
			ball: "#ad4700",
			seam: "#722e00",
			stripes: ["#dcdcdc", "#ffffff"],
			laceBackbone: "#ececec",
			laces: "#ffffff",
		},
	},
	hockey: {
		gold: {
			top: "#aa8f00",
			side: "#d0af00",
			sideGradient: ["#e6c200", "#ffdc1e", "#d0af0000"],
			rings: ["#ffd700", "#ffd700"],
		},
		normal: {
			top: "#000000",
			side: "#333333",
			sideGradient: ["#000000", "#ffffff34", "#00000000"],
			rings: ["#393939", "#272d39"],
		},
	},
};

// Typed per sport, so each sport's render function gets its own colors
const renderers: {
	[S in Sport]: (options: SpinnerOptions<Colors[S]>) => Promise<void>;
} = render;

const variantsBase: {
	colors: ("gold" | "normal")[];
	size: number;
}[] = [
	{
		colors: ["gold", "normal"],
		size: 18,
	},
	{
		colors: ["normal"],
		size: 48,
	},
];

// For 2x resolution on mobile
const sizeMultipliers = [1, 2];

const renderSport = async <S extends Sport>(sport: S) => {
	for (const base of variantsBase) {
		for (const color of base.colors) {
			const gold = color === "gold";

			for (const sizeMultiplier of sizeMultipliers) {
				const size = sizeMultiplier * base.size;
				//const filename = `public/${sport}/ico/spinner-${size}${gold ? "-gold" : ""}.avif`;
				const filename = `tools/logo-spinners/${sport}-${size}${gold ? "-gold" : ""}.avif`;

				await renderers[sport]({
					colors: colors[sport][color],
					filename,
					size,
				});
			}
		}
	}
};

for (const sport of SPORTS) {
	await renderSport(sport);
}
