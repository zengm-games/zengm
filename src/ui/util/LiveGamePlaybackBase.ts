import type { ReactNode } from "react";
import { getPeriodName } from "../../common/getPeriodName.ts";
import type { TeamNum } from "../../common/types.ts";
import type {
	PlayByPlayEvent,
	PlayByPlayEventStat,
	SportEvent,
} from "../../worker/core/GameSim/PlayByPlayLoggerBase.ts";
import { helpers } from "./helpers.ts";

// One line of play-by-play
export type LiveGameEntry = {
	t: TeamNum | undefined;
	text: ReactNode;
	textOnly: boolean;
};

type LiveGamePlayer = {
	pid: number;
	name: string;
};

type LiveGameTeam = {
	players: LiveGamePlayer[];
	ptsQtrs: number[];
	sAtt?: number;
	sPts?: number;
};

// The parts of a box score that are updated the same way in every sport
export type LiveGameBoxScore<Team extends LiveGameTeam = LiveGameTeam> = {
	numPeriods: number;
	overtime?: string;
	possession: TeamNum | undefined;
	quarter: string;
	quarterShort: string;
	shootout?: boolean;
	teams: [Team, Team];
	time: string;
};

type PlayerOf<BoxScore extends LiveGameBoxScore> =
	BoxScore["teams"][number]["players"][number];

// Only some events belong to a team
export const getEventTeam = (e: { type: string }): TeamNum | undefined => {
	const t = (e as { t?: unknown }).t;
	return t === 0 || t === 1 ? t : undefined;
};

// Stats are stored under dynamic keys on player and team objects
const asStats = (object: object) => object as Record<string, number>;

export const hasStat = (object: object, stat: string) => {
	return asStats(object)[stat] !== undefined;
};

export const addStat = (object: object, stat: string, amt: number) => {
	asStats(object)[stat]! += amt;
};

export const setStat = (object: object, stat: string, value: number) => {
	asStats(object)[stat] = value;
};

/**
 * Plays back the events of one game. Each call to `next` advances to the next play-by-play entry, updating `boxScore` (in place!) along the way.
 *
 * Create a new instance for each game, since all state about the playback of the game lives here.
 */
export abstract class LiveGamePlaybackBase<
	Event extends SportEvent,
	BoxScore extends LiveGameBoxScore,
> {
	abstract readonly sport: string;

	readonly boxScore: BoxScore;

	// State that some sports track for their live game UI, beyond what's in the box score
	readonly sportState: unknown;

	protected readonly playersByPid: Record<number, PlayerOf<BoxScore>> = {};

	private readonly events: readonly PlayByPlayEvent<Event>[];

	// Index of the next event to process
	private cursor = 0;

	constructor(boxScore: BoxScore, events: readonly PlayByPlayEvent<Event>[]) {
		this.boxScore = boxScore;
		this.events = events;

		for (const t of boxScore.teams) {
			for (const p of t.players) {
				this.playersByPid[p.pid] = p;
			}
		}
	}

	get done() {
		return this.cursor >= this.events.length;
	}

	// Process events up to and including the next one that is shown in the play-by-play. Returns undefined if the events run out before finding one.
	next(): LiveGameEntry | undefined {
		while (!this.done) {
			const e = this.events[this.cursor]!;
			this.cursor += 1;

			const entry = this.processEvent(e);
			if (entry) {
				return entry;
			}
		}
	}

	// Return an entry if this event is shown in the play-by-play
	protected abstract processEvent(
		e: PlayByPlayEvent<Event>,
	): LiveGameEntry | undefined;

	// Events after the one currently being processed
	protected *upcomingEvents() {
		for (let i = this.cursor; i < this.events.length; i++) {
			yield this.events[i]!;
		}
	}

	protected get numPeriodsStarted() {
		return this.boxScore.teams[0].ptsQtrs.length;
	}

	// For sports with a clock. There is no event for the start of the 1st period, so call this on the first event of the game, and then whenever an event signals the start of a new period.
	protected startPeriod() {
		const { boxScore } = this;

		boxScore.teams[0].ptsQtrs.push(0);
		boxScore.teams[1].ptsQtrs.push(0);

		const period = this.numPeriodsStarted;
		const overtimes = period - boxScore.numPeriods;
		if (overtimes > 0) {
			boxScore.overtime = overtimes === 1 ? "(OT)" : `(${overtimes}OT)`;
			boxScore.quarter = `${helpers.ordinal(overtimes)} overtime`;
			boxScore.quarterShort = overtimes === 1 ? "OT" : `${overtimes}OT`;
		} else {
			boxScore.quarter = `${helpers.ordinal(period)} ${getPeriodName(
				boxScore.numPeriods,
			)}`;
			boxScore.quarterShort = `${getPeriodName(
				boxScore.numPeriods,
				true,
			)}${period}`;
		}
	}

	protected startShootout() {
		const { boxScore } = this;

		boxScore.shootout = true;
		boxScore.teams[0].sPts = 0;
		boxScore.teams[0].sAtt = 0;
		boxScore.teams[1].sPts = 0;
		boxScore.teams[1].sAtt = 0;
	}

	// Period-by-period score
	protected addPeriodPts(e: PlayByPlayEventStat) {
		if (e.s === "pts") {
			const { ptsQtrs } = this.boxScore.teams[e.t];
			// eslint-disable-next-line unicorn/prefer-at
			ptsQtrs[ptsQtrs.length - 1]! += e.amt;
		}
	}

	// Add to whichever of the player and team track this stat. Override this in sports with more complicated rules.
	protected processStat(e: PlayByPlayEventStat) {
		this.addPeriodPts(e);

		if (e.pid != undefined) {
			const p = this.playersByPid[e.pid];
			if (p && hasStat(p, e.s)) {
				addStat(p, e.s, e.amt);
			}
		}

		const t = this.boxScore.teams[e.t];
		if (hasStat(t, e.s)) {
			addStat(t, e.s, e.amt);
		}
	}

	// possessionTypes has the event types that determine possession. true means the event's team has the ball, false means the other team does.
	protected updatePossession(
		e: { type: string },
		possessionTypes: Record<string, boolean>,
	) {
		if (Object.hasOwn(possessionTypes, e.type)) {
			const t = getEventTeam(e);
			this.boxScore.possession = possessionTypes[e.type] ? t : t === 0 ? 1 : 0;
		}
	}
}
