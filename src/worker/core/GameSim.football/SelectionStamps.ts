// When updating playersOnField, we need each player to only be used once, but they might appear on the depth chart in multiple positions. To do this, we use `SelectionStamps.mark` to label a player as being used. This not that different than just using a `Set` of pids but it does wind up being a little faster by reusing the same variable `SelectionStamps.mark` rather than creating a new `Set` every possession.
export default class SelectionStamps {
	private selected = new Map<number, number>();
	private stamp = 0;

	start() {
		this.stamp++;
	}

	has(pid: number) {
		return this.selected.get(pid) === this.stamp;
	}

	mark(pid: number) {
		this.selected.set(pid, this.stamp);
	}
}
