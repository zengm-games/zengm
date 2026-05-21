let relativeTimeFormatter: Intl.RelativeTimeFormat | undefined;

const minute = 60 * 1000;
const hour = minute * 60;
const day = hour * 24;
const month = day * 30;
const year = day * 365;

export const relativeTime = (date: Date) => {
	if (!relativeTimeFormatter) {
		relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
			numeric: "auto",
		});
	}

	const diff = date.getTime() - Date.now();
	const diffAbs = Math.abs(diff);

	if (diffAbs < minute) {
		return "just now";
	} else if (diffAbs < hour) {
		return relativeTimeFormatter.format(Math.round(diff / minute), "minute");
	} else if (diffAbs < day) {
		return relativeTimeFormatter.format(Math.round(diff / hour), "hour");
	} else if (diffAbs < month) {
		return relativeTimeFormatter.format(Math.round(diff / day), "day");
	} else if (diffAbs < year) {
		return relativeTimeFormatter.format(Math.round(diff / month), "month");
	} else {
		return relativeTimeFormatter.format(Math.round(diff / year), "year");
	}
};
