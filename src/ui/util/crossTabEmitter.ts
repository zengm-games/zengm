import { createNanoEvents } from "nanoevents";

export const crossTabEmitter = createNanoEvents<{
	// This is for any RatingsStatsOverview with uncontrolled watch (such as watch is undefined, or defaultWatch) so they can update
	updateWatch: (watchByPid: Record<number, number>) => void;
}>();
