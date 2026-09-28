// Spinning logos are sprite sheets: a grid of frames (cols x rows, left to
// right then top to bottom) stepped through by a CSS animation. This is shared
// by the generator in tools/logo-spinners and by the UI, so they agree on the
// layout.

const SPINNERS = {
	baseball: { duration: 2, frames: 40 },
	basketball: { duration: 4, frames: 80 },
	football: { duration: 2, frames: 40 },
	hockey: { duration: 1.5, frames: 30 },
};

type Sport = keyof typeof SPINNERS;

// Sizes the logo is displayed at, in CSS pixels. Each has a 2x version too.
export type LogoSpinnerSize = 18 | 48;

export const getLogoSpinnerInfo = (sport: Sport) => {
	const { duration, frames } = SPINNERS[sport];

	// Most square grid, to keep the sheet's dimensions small
	let cols = 1;
	for (let c = 1; c * c <= frames; c++) {
		if (frames % c === 0) {
			cols = c;
		}
	}

	return {
		cols,
		duration, // [seconds]
		frames,
		rows: frames / cols,
	};
};

// CSS variables used by the .logo-spinner styles
export const getLogoSpinnerCssVars = (sport: Sport, size: LogoSpinnerSize) => {
	const { cols, duration, rows } = getLogoSpinnerInfo(sport);
	return {
		"--logo-spinner-size": `${size}px`,
		"--logo-spinner-cols": String(cols),
		"--logo-spinner-rows": String(rows),
		"--logo-spinner-duration": `${duration}s`,
	};
};

// URL of a sprite sheet, relative to the site root. size is in actual pixels,
// so 2x the display size for the high-DPI versions.
export const getLogoSpinnerUrl = (size: number, gold: boolean) =>
	`/ico/spinner-${size}${gold ? "-gold" : ""}.avif`;
