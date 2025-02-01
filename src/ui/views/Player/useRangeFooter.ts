import { useEffect, useState } from "react";
import type { View } from "../../../common/types";

type PlayerStats = View<"player">["player"]["stats"];

// If 3+ seasons are shown in this table, support selecting a range to sum up. Otherwise, it's redundant with already shown info.
const RANGE_FOOTER_NUM_SEASONS_CUTOFF = 3;
const hasEnoughDistinctSeasons = (playerStats: PlayerStats) => {
	const distinctSeasons = new Set();
	for (const row of playerStats) {
		distinctSeasons.add(row.season);
		if (distinctSeasons.size === RANGE_FOOTER_NUM_SEASONS_CUTOFF) {
			return true;
		}
	}

	return false;
};

export const useRangeFooter = ({
	playerStats,
}: {
	playerStats: PlayerStats;
}) => {
	const [state, setState] = useState<
		"disabled" | "closed" | "loading" | "open"
	>(() => {
		if (hasEnoughDistinctSeasons(playerStats)) {
			return "closed";
		}

		return "disabled";
	});

	useEffect(() => {
		if (hasEnoughDistinctSeasons(playerStats)) {
			if (state === "disabled") {
				setState("closed");
			}
		} else {
			if (state !== "disabled") {
				setState("disabled");
			}
		}

		// Only recalculate if a new season appears
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [playerStats.length]);

	return {
		state,
		setState,
	};
};
