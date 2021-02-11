import PlusMinus from "./PlusMinus";

type Stats = {
	pts: number;
	oppPts: number;
	gp: number;
};

type Type = "mov" | "diff";

const getValue = (stats: Stats, type: Type) => {
	let value = stats.pts - stats.oppPts;
	if (type === "mov") {
		if (stats.gp > 0) {
			value /= stats.gp;
		} else {
			value = 0;
		}
	}

	return value;
};

const MovOrDiff = ({ stats, type }: { stats: Stats; type: Type }) => {
	const value = getValue(stats, type);
	const decimalPlaces = type === "mov" ? 1 : 0;
	return <PlusMinus decimalPlaces={decimalPlaces}>{value}</PlusMinus>;
};

export default MovOrDiff;

export const wrappedMovOrDiff = (stats: Stats, type: Type) => {
	const value = getValue(stats, type);
	const decimalPlaces = type === "mov" ? 1 : 0;

	return {
		value: <PlusMinus decimalPlaces={decimalPlaces}>{value}</PlusMinus>,
		searchValue: value,
		sortValue: value,
	};
};
