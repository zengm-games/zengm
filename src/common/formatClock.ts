// For basketball: convert clock in seconds to min:sec, or x.y if under 1 minute
// For other sports: convert clock in minutes to min:sec, like 1.5 -> 1:30
export const formatClock = (clock: number) => {
	if (__SPORT === "basketball") {
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

// Seconds left from clock text in min:sec or seconds only format
export const getSeconds = (time: string | undefined) => {
	if (!time) {
		return 0;
	}

	const parts = time.split(":").map((x) => Number.parseInt(x));
	if (parts.length === 0) {
		return 0;
	}
	if (parts.length === 1) {
		// Seconds only being displayed
		return Number.parseFloat(time);
	}
	const [min, sec] = parts as [number, number];
	return min * 60 + sec;
};
