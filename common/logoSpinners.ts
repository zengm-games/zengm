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

export const getLogoSpinnerInfo = (sport: Sport) => {
	const { duration, frames } = SPINNERS[sport];

	// Most square grid. Browsers rasterize the whole sheet at its displayed size
	// times the screen density, and a single long row of frames could exceed GPU
	// texture limits.
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

// CSS variables used by the .logo-spinner styles. size is the display size, in
// CSS pixels.
export const getLogoSpinnerCssVars = (sport: Sport, size: number) => {
	const { cols, duration, rows } = getLogoSpinnerInfo(sport);
	return {
		"--logo-spinner-size": `${size}px`,
		"--logo-spinner-cols": String(cols),
		"--logo-spinner-rows": String(rows),
		"--logo-spinner-duration": `${duration}s`,
	};
};

// URL of a sprite sheet, relative to the site root. They're SVGs, so the same
// file works at any size. The gold version is in the same file, selected by the
// #gold fragment (see tools/logo-spinners/render/renderSpinner.ts), so both
// share one download.
export const getLogoSpinnerUrl = (gold: boolean) =>
	`/ico/spinner.svg${gold ? "#gold" : ""}`;
