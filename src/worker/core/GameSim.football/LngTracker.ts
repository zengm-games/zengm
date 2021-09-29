// Used to track history of lng stats, in case a penalty means we need to roll back to the previous value

// Just store previous and current values. That's enough for everything except the very rare case of multiple long fumble returns by the same player in the same possession, but oh well.
type Values = Record<
	number,
	Record<
		string,
		{
			previous: number;
			current: number;
		}
	>
>;

class LngTracker {
	values: {
		team: Values;
		player: Values;
	};

	constructor() {
		this.values = {
			team: {},
			player: {},
		};
	}

	log(
		type: "team" | "player",
		id: number,
		stat: string,
		value: number,
		remove?: boolean,
	) {
		if (!this.values[type][id]) {
			this.values[type][id] = {};
		}

		if (!this.values[type][id][stat]) {
			this.values[type][id][stat] = {
				previous: -Infinity,
				current: -Infinity,
			};
		}

		const x = this.values[type][id][stat];

		if (!remove) {
			// Add to history

			// Add when >= not just >, so that it will handle removing a value that ties the previous lng
			if (value >= x.current) {
				x.previous = x.current;
				x.current = value;
			}
		} else {
			if (value === x.current) {
				// Remove this value from history
				x.current = x.previous;
				x.previous = -Infinity;
			}
		}

		return x.current === -Infinity ? 0 : x.current;
	}
}

export default LngTracker;
