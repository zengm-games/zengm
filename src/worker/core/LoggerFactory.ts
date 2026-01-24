import type { Sport } from "../../../tools/lib/getSport";
import type {
	BaseLogger,
	BasePlayByPlayEvent,
} from "./GameSim/abstractPlayByPlayLogger";
import BaseballPlayByPlayLogger from "./GameSim.baseball/PlayByPlayLogger";
import BasketballPlayByPlayLogger from "./GameSim.basketball/PlayByPlayLogger";
import FootballPlayByPlayLogger from "./GameSim.football/PlayByPlayLogger";
import HockeyPlayByPlayLogger from "./GameSim.hockey/PlayByPlayLogger";

export class LoggerFactory {
	static createPlayByPlayLogger(
		sport: "basketball",
		active: boolean,
	): BasketballPlayByPlayLogger;
	static createPlayByPlayLogger(
		sport: "baseball",
		active: boolean,
	): BaseballPlayByPlayLogger;
	static createPlayByPlayLogger(
		sport: "football",
		active: boolean,
	): FootballPlayByPlayLogger;
	static createPlayByPlayLogger(
		sport: "hockey",
		active: boolean,
	): HockeyPlayByPlayLogger;
	static createPlayByPlayLogger(
		sport: Sport,
		active: boolean,
	): BaseLogger<BasePlayByPlayEvent> {
		switch (sport) {
			case "basketball":
				return new BasketballPlayByPlayLogger(active);
			case "baseball":
				return new BaseballPlayByPlayLogger(active);
			case "football":
				return new FootballPlayByPlayLogger(active);
			case "hockey":
				return new HockeyPlayByPlayLogger(active);
		}
	}
}
