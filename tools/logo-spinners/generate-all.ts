import { getLogoSpinnerUrl } from "../../common/logoSpinners.ts";
import { SPORTS, type Sport } from "../lib/getSport.ts";
import * as render from "./render/index.ts";
import type { SpinnerOptions } from "./render/renderSpinner.ts";

// Each sport has its own set of colors
type Colors = {
	[S in Sport]: Parameters<(typeof render)[S]>[0]["colors"]["normal"];
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

// Normal and gold are in one file, see renderSpinner
const renderSport = async <S extends Sport>(sport: S) => {
	await renderers[sport]({
		colors: colors[sport],
		filename: `public/${sport}${getLogoSpinnerUrl(false)}`,
	});
};

for (const sport of SPORTS) {
	await renderSport(sport);
}
