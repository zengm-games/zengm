import isSport from "./isSport.ts";

// For basketball: convert clock in seconds to min:sec, or x.y if under 1 minute
// For other sports: convert clock in minutes to min:sec, like 1.5 -> 1:30
export const formatClock = (clock: number) => {
	if (isSport("basketball")) {
		if (clock <= 59.9) {
			const centiSecondsRounded = Math.ceil(clock * 10);
			const remainingSeconds = Math.floor(centiSecondsRounded / 10);
			const remainingCentiSeconds = centiSecondsRounded % 10;
			return `${remainingSeconds}.${remainingCentiSeconds}`;
		} else {
			const secondsRounded = Math.ceil(clock);
			const minutes = Math.floor(secondsRounded / 60);
			const remainingSeconds = secondsRounded % 60;
			const formattedSeconds =
				remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
			return `${minutes}:${formattedSeconds}`;
		}
	}

	const secNum = Math.ceil((clock % 1) * 60);

	let sec;
	if (secNum >= 60) {
		sec = "59";
	} else if (secNum < 10) {
		sec = `0${secNum}`;
	} else {
		sec = `${secNum}`;
	}

	return `${Math.floor(clock)}:${sec}`;
};
