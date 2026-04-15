// Input rather than Output for baseball because that's the only sport where input and output objects are the same, so output doesn't exist
import type { PlayByPlayEventInput as BaseballEvent } from "../GameSim.baseball/PlayByPlayLogger.ts";
import type { PlayByPlayEventOutput as FootballEvent } from "../GameSim.football/PlayByPlayLogger.ts";
import type { PlayByPlayEventOutput as BasketballEvent } from "../GameSim.basketball/PlayByPlayLogger.ts";
import type { PlayByPlayEventOutput as HockeyEvent } from "../GameSim.hockey/PlayByPlayLogger.ts";
import type { TeamNum } from "../../../common/types.ts";

type PlayByPlayEventStat = {
	type: "stat";
	t: TeamNum;
	pid: number | undefined | null;
	s: string;
	amt: number;
};

type PlayByPlayEventInit = {
	type: "init";
	boxScore: any;
};

type SportEvent = FootballEvent | BaseballEvent | BasketballEvent | HockeyEvent;

export type PlayByPlayEvent<T extends SportEvent> =
	| T
	| PlayByPlayEventStat
	| PlayByPlayEventInit;

export abstract class PlayByPlayLoggerBase<T extends SportEvent> {
	active: boolean = false;
	playByPlay: PlayByPlayEvent<T>[] = [];
	constructor(active: boolean) {
		this.active = active;
	}
	abstract logEvent(event: unknown): void;

	logStat(t: TeamNum, pid: number | undefined | null, s: string, amt: number) {
		if (!this.active) {
			return;
		}

		this.playByPlay.push({
			type: "stat",
			t,
			pid,
			s,
			amt,
		});
	}

	getPlayByPlay(boxScore: any): PlayByPlayEvent<T>[] | undefined {
		if (!this.active) {
			return;
		}

		return [
			{
				type: "init",
				boxScore,
			},
			...this.playByPlay,
		];
	}
}
