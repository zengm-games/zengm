import { SPORTS, type Sport } from "../lib/getSport.ts";
import * as render from "./render/index.ts";

const colors: Record<
	Sport,
	{
		gold: [string, string];
		normal: [string, string];
	}
> = {
	baseball: {
		gold: ["#ffd700", "#ffffff"],
		normal: ["#ff7f2a", "#ffd52a"],
	},
	basketball: {
		gold: ["#ffd700", "#ffffff"],
		normal: ["#ff7f2a", "#ffd52a"],
	},
	football: {
		gold: ["#ffd700", "#ffffff"],
		normal: ["#ff7f2a", "#ffd52a"],
	},
	hockey: {
		gold: ["#ffd700", "#ffffff"],
		normal: ["#ff7f2a", "#ffd52a"],
	},
};

const variantsBase: {
	colors: (keyof (typeof colors)["basketball"])[];
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

const variants = [];
for (const sport of SPORTS) {
	for (const base of variantsBase) {
		for (const color of base.colors) {
			const gold = color === "gold";

			for (const sizeMultiplier of sizeMultipliers) {
				const size = sizeMultiplier * base.size;
				//const filename = `public/${sport}/ico/spinner-${size}${gold ? "-gold" : ""}.avif`;
				const filename = `tools/logo-spinners/${sport}-${size}${gold ? "-gold" : ""}.avif`;

				variants.push({
					colors: colors[sport][color],
					filename,
					size,
					sport,
				});
			}
		}
	}
}

for (const variant of variants) {
	await render[variant.sport](variant);
}
