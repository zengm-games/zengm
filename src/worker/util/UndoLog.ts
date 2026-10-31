// Return true for success, false for failure
type Undo = () => Promise<boolean>;

type InvalidateOn = "advanceDay" | "leagueChange" | "newPhase";

export class UndoLog {
	private nextKey = 0;
	private log: Map<
		number,
		{
			invalidateOn: Set<InvalidateOn>;
			undo: Undo;
		}
	> = new Map();

	add(undo: Undo, invalidateOn: InvalidateOn[]) {
		const key = this.nextKey;
		this.nextKey += 1;

		this.log.set(key, { invalidateOn: new Set(invalidateOn), undo });

		return key;
	}

	remove(key: number) {
		this.log.delete(key);
	}

	invalidate(type: InvalidateOn) {
		for (const [key, entry] of this.log) {
			if (entry.invalidateOn.has(type)) {
				this.remove(key);
			}
		}
	}

	async undo(key: number) {
		const entry = this.log.get(key);
		if (entry) {
			const response = await entry.undo();
			this.remove(key);
			return response;
		}

		return false;
	}
}
