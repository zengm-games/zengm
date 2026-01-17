import { useEffect, useRef, useState } from "react";
import type { View } from "../../../common/types.ts";
import { toWorker } from "../../util/index.ts";

type Player = View<"player">["player"];
type PlayerStats = Player["stats"];
type RangeFooterPlayer = Pick<
	Player,
	"careerStats" | "careerStatsCombined" | "careerStatsPlayoffs"
>;

// If 3+ seasons are shown in this table, support selecting a range to sum up. Otherwise, it's redundant with already shown info.
const RANGE_FOOTER_NUM_SEASONS_CUTOFF = 3;

type State =
	| {
			type: "disabled";
	  }
	| {
			type: "closed";
			seasons: number[];
	  }
	| {
			type: "loading";
			seasons: number[];
			seasonRange: [number, number];
			p?: RangeFooterPlayer;
	  }
	| {
			type: "error";
			seasons: number[];
			seasonRange: [number, number];
			p?: RangeFooterPlayer;
	  }
	| {
			type: "open";
			seasons: number[];
			seasonRange: [number, number];
			p: RangeFooterPlayer;
	  };

const getSeasons = (playerStats: PlayerStats) => {
	const seasons = Array.from(new Set(playerStats.map((row) => row.season)));
	seasons.sort((a, b) => a - b);

	return seasons;
};

export const useRangeFooter = (pid: number, playerStats: PlayerStats) => {
	const getInitialState = (): State => {
		const seasons = getSeasons(playerStats);

		const type =
			seasons.length >= RANGE_FOOTER_NUM_SEASONS_CUTOFF ? "closed" : "disabled";

		return {
			type,
			seasons,
		};
	};
	const [state, setState] = useState(getInitialState);

	const latestLoadCount = useRef(0);
	const prevPid = useRef(pid);

	const loadData = async (seasons: number[], seasonRange: [number, number]) => {
		latestLoadCount.current += 1;
		const loadCount = latestLoadCount.current;
		setState({
			type: "loading",
			seasons,
			seasonRange,
			p:
				state.type === "loading" ||
				state.type === "open" ||
				state.type === "error"
					? state.p
					: undefined,
		});

		let p;

		try {
			p = await toWorker("main", "getPlayerRangeFooterStats", {
				pid,
				seasonRange,
			});

			if (latestLoadCount.current !== loadCount) {
				// Another load must have started after this one
				return;
			}
		} catch (error) {
			console.log(error);
		}

		if (!p) {
			setState({
				type: "error",
				seasons,
				seasonRange,
				p:
					state.type === "loading" ||
					state.type === "open" ||
					state.type === "error"
						? state.p
						: undefined,
			});
		} else {
			setState({
				type: "open",
				seasons,
				seasonRange,
				p: p as any,
			});
		}
	};

	useEffect(() => {
		if (prevPid.current !== pid) {
			// Reset state when player changes
			setState(getInitialState());
			prevPid.current = pid;
			return;
		}

		const seasons = getSeasons(playerStats);

		if (seasons.length < RANGE_FOOTER_NUM_SEASONS_CUTOFF) {
			setState({
				type: "disabled",
			});
		} else if (state.type === "closed" || state.type === "disabled") {
			setState({
				type: "closed",
				seasons,
			});
		} else if (JSON.stringify(seasons) !== JSON.stringify(state.seasons)) {
			if (
				!seasons.includes(state.seasonRange[0]) ||
				!seasons.includes(state.seasonRange[1])
			) {
				// If loading/open in an invalid state, set to valid state
				const newSeasonRange: [number, number] = [0, 0];
				if (!seasons.includes(state.seasonRange[0])) {
					newSeasonRange[0] = seasons[0]!;
				}
				if (!seasons.includes(state.seasonRange[1])) {
					newSeasonRange[1] = seasons.at(-1)!;
				}

				loadData(seasons, newSeasonRange);
			} else {
				setState({
					...state,
					seasons,
				});
			}
		}

		// Only recalculate if a new season appears or if this is a new player
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [playerStats.length, pid]);

	const onOpen = async () => {
		if (state.type !== "closed") {
			return;
		}

		await loadData(state.seasons, [state.seasons[0]!, state.seasons.at(-1)!]);
	};

	const setSeasonRange = async (seasonRange: [number, number]) => {
		if (state.type === "closed" || state.type === "disabled") {
			return;
		}

		await loadData(state.seasons, seasonRange);
	};

	return {
		onOpen,
		setSeasonRange,
		state,
	};
};
