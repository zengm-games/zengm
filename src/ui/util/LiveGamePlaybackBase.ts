import type { ReactNode } from "react";
import { getPeriodName } from "../../common/getPeriodName.ts";
import type { TeamNum } from "../../common/types.ts";
import type {
	PlayByPlayEvent,
	PlayByPlayEventStat,
	SportEvent,
} from "../../worker/core/GameSim/PlayByPlayLoggerBase.ts";
import type { FastForward } from "../components/PlayPauseNext.tsx";
import { helpers } from "./helpers.ts";

// One line of play-by-play
export type LiveGameEntry = {
	t: TeamNum | undefined;
	text: ReactNode;
	textOnly: boolean;

	// Only if the score changed since the previous entry
	score?: {
		diff: number;

		// Score of each team after this entry. During a shootout, this is the shootout score.
		pts: [number, number];

		// Team to credit for the score, which is usually the same as the entry's team
		t: TeamNum | undefined;

		// For sports with different types of scores
		type?: string;
	};

	// Only if this entry added outs
	outs?: number;
};

// A sport-specific way to skip ahead in the game
export type LiveGameFastForward = {
	label: string;
	keyboardShortcut: FastForward["keyboardShortcut"];

	// Call this when starting to fast forward. Then call the function it returns after each `next`, until it returns true.
	start: () => () => boolean;
};

type LiveGamePlayer = {
	pid: number;
	name: string;
};

type LiveGameTeam = {
	players: LiveGamePlayer[];
	pts: number;
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
		// Decide this up front, so an entry that starts a shootout is still compared using the normal score
		const { shootout } = this.boxScore;
		const getPts = (): [number, number] => {
			const [t0, t1] = this.boxScore.teams;
			return shootout ? [t0.sPts ?? 0, t1.sPts ?? 0] : [t0.pts, t1.pts];
		};

		const prevPts = getPts();

		while (!this.done) {
			const e = this.events[this.cursor]!;
			this.cursor += 1;

			const entry = this.processEvent(e);
			if (entry) {
				const pts = getPts();
				const diff = pts[0] + pts[1] - prevPts[0] - prevPts[1];
				if (diff !== 0) {
					entry.score = {
						diff,
						pts,
						t: entry.t,
					};
				}

				return entry;
			}
		}
	}

	// Override this in sports that have their own ways to skip ahead
	getFastForwards(): LiveGameFastForward[] {
		return [];
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
