import { type PlayByPlayEvent as BaseballEvent } from "../GameSim.baseball/PlayByPlayLogger";
import type { PlayByPlayEvent as FootballEvent } from "../GameSim.football/PlayByPlayLogger";
import type { PlayByPlayEvent as BasketballEvent } from "../GameSim.basketball/PlayByPlayLogger";
import type { PlayByPlayEvent as HockeyEvent } from "../GameSim.hockey/PlayByPlayLogger";
import type { TeamNum } from "../../../common/types";

type PlayByPlayEventStat = {
	type: "stat";
	t: TeamNum;
	pid: number | undefined | null;
	s: string;
	amt: number;
};

type PlayByPlayInitEvent = {
	type: "init";
	boxScore: any;
};

export type BasePlayByPlayEvent =
	| FootballEvent
	| BaseballEvent
	| BasketballEvent
	| HockeyEvent
	| PlayByPlayEventStat
	| PlayByPlayInitEvent;
export abstract class BaseLogger<
	T extends BasePlayByPlayEvent,
> implements IPlayByPlayLogger<T> {
	active: boolean = false;
	playByPlay: T[] = [];
	constructor(active: boolean) {
		this.active = active;
	}
	abstract logEvent(event: any): void;

	logStat(t: TeamNum, pid: number | undefined | null, s: string, amt: number) {
		const statEvent = {
			type: "stat",
			t,
			pid,
			s,
			amt,
		} as T; // Type cast because typescript can't infer this is T
		if (!this.active) {
			return;
		}

		this.playByPlay.push(statEvent);
	}

	getPlayByPlay(boxScore: any): T[] | undefined {
		if (!this.active) {
			return;
		}

		return [
			{
				type: "init",
				boxScore,
			} as T,
			...this.playByPlay,
		];
	}
}

interface IPlayByPlayLogger<T extends BasePlayByPlayEvent> {
	logEvent(event: T): void;
	logStat(
		t: TeamNum,
		pid: number | undefined | null,
		s: string,
		amt: number,
	): void;
	getPlayByPlay(boxScore: any): T[] | undefined;
}
