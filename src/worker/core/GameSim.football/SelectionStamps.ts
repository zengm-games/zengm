import type { PlayerGameSim } from "./types.ts";

type DepthSlots = {
	ids: number[];
	slots: number[];
};

// Reusable "already selected" set for one team's lineup. start() logically clears
// it before every team selection, including repeated selections within one play.
// Only ID-to-slot bookkeeping persists: energy, injury state, and selection
// decisions are never cached. The caller reads current player state each time.
// Storage belongs to one game. Map's SameValueZero ID equality matches Set even
// when separate player objects share an ID.
export default class SelectionStamps {
	private slotsById = new Map<number, number>();
	private slotsByDepth = new WeakMap<PlayerGameSim[], DepthSlots>();
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
			cached = { ids: [], slots: [] };
			this.slotsByDepth.set(depth, cached);
		}
		return cached;
	}

	private getSlot(id: number) {
		let slot = this.slotsById.get(id);
		if (slot === undefined) {
			slot = this.slotsById.size;
			this.slotsById.set(id, slot);
			if (slot === this.used.length) {
				const used = new Uint32Array(this.used.length * 2);
				used.set(this.used);
				this.used = used;
			}
		}
		return slot;
	}

	has(id: number, depth: DepthSlots, index: number) {
		let slot = depth.slots[index];
		// Validate each live ID so in-place depth edits and ID changes remain valid.
		// NaN takes the refresh path, where Map still resolves the same slot.
		if (slot === undefined || depth.ids[index] !== id) {
			slot = this.getSlot(id);
			depth.ids[index] = id;
			depth.slots[index] = slot;
		}
		return this.used[slot] === this.stamp;
	}

	mark(id: number) {
		const slot = this.getSlot(id);
		this.used[slot] = this.stamp;
	}
}
