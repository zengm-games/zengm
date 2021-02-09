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
		value /= stats.gp;
	}

	const decimalPlaces = type === "mov" ? 1 : 0;

	return <PlusMinus decimalPlaces={decimalPlaces}>{value}</PlusMinus>;
};

export default MovOrDiff;
