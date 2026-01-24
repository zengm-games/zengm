import type { Sport } from "../../../tools/lib/getSport";
//@ts-expect-error
import {
	PlayByPlayLogger as FootballLogger,
	type PlayByPlayEvent,
} from "./GameSim.football/PlayByPlayLogger";

export class LoggerFactory {
	static createPlayByPlayLogger(sport: Sport, props: any): IPlayByPlayLogger {
		switch (sport) {
			case "basketball":
				throw new Error("Not implemented yet");
			case "football":
				return new FootballLogger();
			case "baseball":
				throw new Error("Not implemented yet");
			case "hockey":
				throw new Error("Not implemented yet");
		}
	}
}

// Need to make an abstract

export abstract class BaseLogger implements IPlayByPlayLogger {
	active: boolean = false;
	playByPlay: PlayByPlayEvent[] = [];

	constructor(active: boolean) {
		active = active;
	}
	abstract logEvent(): void;

	abstract logStat(): void;

	abstract logClock(): void;

	getPlayByPlay(boxScore: any): PlayByPlayEvent[] | undefined {
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

	abstract removeLastScore(): void;
}

interface IPlayByPlayLogger {
	logEvent(event: any): void;
	logStat(): void;
	logClock(): void;
	getPlayByPlay(boxScore: any): PlayByPlayEvent[] | undefined;
	removeLastScore(): void;
}
