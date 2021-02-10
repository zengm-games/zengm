import { isSport } from "../../common";
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
	// pts and oppPts already come scaled in basketball
	const pts = isSport("basketball") ? stats.pts * stats.gp : stats.pts;
	const oppPts = isSport("basketball") ? stats.oppPts * stats.gp : stats.oppPts;

	let value = pts - oppPts;
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
