import orderBy from "lodash/orderBy";

const processGameAttributes = (events: any[], season: number) => {
	let gameAttributeEvents = [];

	for (const event of events) {
		if (event.type === "gameAttributes") {
			gameAttributeEvents.push(event);
		}
	}

	let initialGameAttributes;

	// Remove gameAttributes individual property dupes, and find what the gameAttributes state was at the beginning of the given season
	const prevState: any = {};
	for (const event of gameAttributeEvents) {
		if (
			(event.season === season + 1 ||
				(event.season === season && event.phase > 0)) &&
			initialGameAttributes === undefined
		) {
			initialGameAttributes = JSON.parse(JSON.stringify(prevState));
		}
		for (const [key, value] of Object.entries(event.info)) {
			if (value === prevState[key]) {
				delete event.info[key];
			} else {
				prevState[key] = value;
			}
		}
	}

	// Handle initialGameAttributes for the last season, where the season + 1 condition above can never be met
	if (initialGameAttributes === undefined) {
		initialGameAttributes = JSON.parse(JSON.stringify(prevState));
	}

	gameAttributeEvents = gameAttributeEvents.filter(
		event =>
			event.season > season || (event.season === season && event.phase > 0),
	);

	return { gameAttributeEvents, initialGameAttributes };
};

const processTeams = (events: any[], season: number) => {
	let teamEvents = [];

	for (const event of events) {
		if (event.type === "expansionDraft" || event.type === "teamInfo") {
			teamEvents.push(event);
		}
	}

	let initialTeams: {
		region: string;
		name: string;
		pop: number;
		colors: [string, string, string];
		abbrev: string;
		imgURL: string;
		srID: string;
		tid: number;
		cid: number;
		did: number;
	}[];

	// Keep track of initial teams
	const prevState: any[] = [];
	for (const event of teamEvents) {
		if (
			(event.season > season || (event.season === season && event.phase > 0)) &&
			// @ts-ignore
			initialTeams === undefined
		) {
			initialTeams = JSON.parse(JSON.stringify(prevState));
		}

		if (event.type === "expansionDraft") {
			prevState.push(...event.info.teams);
		} else if (event.type === "teamInfo") {
			const t = event.info;
			const ind = prevState.findIndex(t0 => t0.tid === t.tid);
			const t0 = prevState[ind];
			if (!t0) {
				console.log(event);
				throw new Error(`teamInfo before expansionDraft for tid ${t.tid}`);
			}
			prevState[ind] = {
				...t0,
				...t,
			};
		}
	}

	// Handle initialTeams for the last season, where the season + 1 condition above can never be met
	// @ts-ignore
	if (initialTeams === undefined) {
		initialTeams = JSON.parse(JSON.stringify(prevState));
	}

	teamEvents = teamEvents.filter(
		event =>
			event.season > season || (event.season === season && event.phase > 0),
	);

	// Remove tids, in case user already did another expansion draft
	teamEvents = teamEvents.map(event => {
		if (event.type !== "expansionDraft") {
			return event;
		}

		return {
			...event,
			info: {
				...event.info,
				teams: event.info.teams.map((t: any) => {
					const t2 = { ...t };
					delete t2.tid;
					return t2;
				}),
			},
		};
	});

	return { teamEvents, initialTeams };
};

const formatScheduledEvents = (events: any[], season: number) => {
	for (const event of events) {
		if (
			event.type !== "gameAttributes" &&
			event.type !== "expansionDraft" &&
			event.type !== "teamInfo"
		) {
			throw new Error(`Unknown event type: ${event.type}`);
		}
	}

	const eventsSorted = orderBy(events, ["season", "phase", "type"]);

	const { gameAttributeEvents, initialGameAttributes } = processGameAttributes(
		eventsSorted,
		season,
	);

	const { teamEvents, initialTeams } = processTeams(eventsSorted, season);

	return {
		scheduledEvents: [...gameAttributeEvents, ...teamEvents],
		initialGameAttributes,
		initialTeams,
	};
};

export default formatScheduledEvents;
