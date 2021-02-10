import PlusMinus from "./PlusMinus";

const MovOrDiff = ({
	stats,
	type,
}: {
	stats: {
		pts: number;
		oppPts: number;
		gp: number;
	};
	type: "mov" | "diff";
}) => {
	let value = stats.pts - stats.oppPts;
	if (type === "mov") {
		if (stats.gp > 0) {
			value /= stats.gp;
		} else {
			value = 0;
		}
	}

	const decimalPlaces = type === "mov" ? 1 : 0;

	return <PlusMinus decimalPlaces={decimalPlaces}>{value}</PlusMinus>;
};

export default MovOrDiff;
