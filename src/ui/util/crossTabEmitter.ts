import { createNanoEvents } from "nanoevents";
import toWorker from "./toWorker.ts";

const crossTabEmitterRaw = createNanoEvents<{
	// This is for any RatingsStatsOverview with uncontrolled watch (such as watch is undefined, or initialWatch) so they can update
	updateWatch: (pids: number[]) => void;
}>();
export type CrossTabeEmitterParameters = Parameters<
	(typeof crossTabEmitterRaw)["emit"]
>;
export const crossTabEmitter = {
	...crossTabEmitterRaw,
	async emitAllTabs(...parameters: CrossTabeEmitterParameters) {
		await toWorker("main", "crossTabEmit", parameters);
	},
};
