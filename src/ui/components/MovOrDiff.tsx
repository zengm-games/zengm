import { PlusMinus } from "./PlusMinus.tsx";

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

export const MovOrDiff = ({ stats, type }: { stats: Stats; type: Type }) => {
	const value = getValue(stats, type);
	const decimalPlaces = type === "mov" ? 1 : 0;
	return <PlusMinus decimalPlaces={decimalPlaces}>{value}</PlusMinus>;
};

export const wrappedMovOrDiff = (stats: Stats, type: Type) => {
	const value = getValue(stats, type);
	const decimalPlaces = type === "mov" ? 1 : 0;

	return {
		value: <PlusMinus decimalPlaces={decimalPlaces}>{value}</PlusMinus>,
		searchValue: value,
		sortValue: value,
	};
};

// Team stats from the worker are per game in basketball and totals in other sports
const teamStatsToTotals = (stats: Stats): Stats =>
	__SPORT === "basketball"
		? {
				pts: stats.pts * stats.gp,
				oppPts: stats.oppPts * stats.gp,
				gp: stats.gp,
			}
		: stats;

// Basketball shows margin of victory, other sports show point differential. Also the stat name for column headers.
export const teamMovOrDiffStat: Type =
	__SPORT === "basketball" ? "mov" : "diff";

export const TeamMovOrDiff = ({ stats }: { stats: Stats }) => {
	return (
		<MovOrDiff stats={teamStatsToTotals(stats)} type={teamMovOrDiffStat} />
	);
};

export const wrappedTeamMovOrDiff = (stats: Stats) => {
	return wrappedMovOrDiff(teamStatsToTotals(stats), teamMovOrDiffStat);
};

export const getTeamMov = (stats: Stats) => {
	return getValue(teamStatsToTotals(stats), "mov");
};
