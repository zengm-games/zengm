import type { PlayerGameSim } from "./types.ts";

type DepthSlots = {
	pids: number[];
	slots: number[];
};

// When updating playersOnField, we need each player to only be used once, but they might appear on the depth chart in multiple positions. To do this, we use `SelectionStamps.mark` to label a player as being used. This not that different than just using a `Set<number` but it does wind up being a little faster by keeping track of "slots"
export default class SelectionStamps {
	private slotsByPid = new Map<number, number>();
	private slotsByDepth = new Map<PlayerGameSim[], DepthSlots>();
	private used = new Uint32Array(128);
	private stamp = 0;

	start() {
		// Earlier marks no longer match, so no ID is marked as already selected.
		this.stamp = (this.stamp + 1) >>> 0;
		if (this.stamp === 0) {
			this.used.fill(0);
			this.stamp = 1;
		}
	}

	getDepthSlots(depth: PlayerGameSim[]) {
		let cached = this.slotsByDepth.get(depth);
		if (!cached) {
			cached = { pids: [], slots: [] };
			this.slotsByDepth.set(depth, cached);
		}
		return cached;
	}

	private getSlot(pid: number) {
		let slot = this.slotsByPid.get(pid);
		if (slot === undefined) {
			slot = this.slotsByPid.size;
			this.slotsByPid.set(pid, slot);
			if (slot === this.used.length) {
				const used = new Uint32Array(this.used.length * 2);
				used.set(this.used);
				this.used = used;
			}
		}
		return slot;
	}

	has(pid: number, depth: DepthSlots, index: number) {
		let slot = depth.slots[index];
		// Validate each live ID so in-place depth edits and ID changes remain valid.
		if (slot === undefined || depth.pids[index] !== pid) {
			slot = this.getSlot(pid);
			depth.pids[index] = pid;
			depth.slots[index] = slot;
		}
		return this.used[slot] === this.stamp;
	}

	mark(pid: number) {
		const slot = this.getSlot(pid);
		this.used[slot] = this.stamp;
	}
}
