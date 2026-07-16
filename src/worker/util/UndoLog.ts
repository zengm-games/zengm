// Return true for success, false for failure
type Undo = () => Promise<boolean>;

type InvalidateOn = "advanceDay" | "leagueChange" | "newPhase";

// NOTIFICATION_TIMEOUT is 8 seconds, but we need this to be longer in case the user hovers a while
const MAX_UNDO_TIME = 30_000;

export class UndoLog {
	private nextKey = 0;
	private log: Map<
		number,
		{
			invalidateOn: Set<InvalidateOn>;
			undo: Undo;
			timeoutId: number;
		}
	> = new Map();

	add(undo: Undo, invalidateOn: InvalidateOn[]) {
		const key = this.nextKey;
		this.nextKey += 1;

		const timeoutId = setTimeout(() => {
			this.log.delete(key);
		}, MAX_UNDO_TIME);

		this.log.set(key, { invalidateOn: new Set(invalidateOn), undo, timeoutId });

		return key;
	}

	private remove(key: number) {
		const entry = this.log.get(key);
		if (entry) {
			this.log.delete(key);
			clearTimeout(entry.timeoutId);
		}
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
