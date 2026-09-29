// Spinning logos are sprite sheets: a single row of frames, stepped through by a
// CSS animation. This is shared by the generator in tools/logo-spinners and by
// the UI, so they agree on the number of frames.

const SPINNERS = {
	baseball: { duration: 2, frames: 40 },
	basketball: { duration: 4, frames: 80 },
	football: { duration: 2, frames: 40 },
	hockey: { duration: 1.5, frames: 30 },
};

type Sport = keyof typeof SPINNERS;

export const getLogoSpinnerInfo = (sport: Sport) => {
	const { duration, frames } = SPINNERS[sport];

	return {
		duration, // [seconds]
		frames,
	};
};

export const getLogoSpinnerCssVars = (sport: Sport, size: number) => {
	const { duration, frames } = getLogoSpinnerInfo(sport);
	return {
		"--logo-spinner-size": `${size}px`,
		"--logo-spinner-frames": String(frames),
		"--logo-spinner-duration": `${duration}s`,
	};
};

export const getLogoSpinnerUrl = (gold: boolean) =>
	`/ico/spinner.svg${gold ? "#gold" : ""}`;
