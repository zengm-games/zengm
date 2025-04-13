import { bySport } from "../../common/index.ts";
import processLiveGameEventsBaseball from "./processLiveGameEvents.baseball.tsx";
import processLiveGameEventsBasketball from "./processLiveGameEvents.basketball.tsx";
import processLiveGameEventsFootball from "./processLiveGameEvents.football.tsx";
import processLiveGameEventsHockey from "./processLiveGameEvents.hockey.tsx";

// Mutates boxScore!!!
const processLiveGameEvents = ({
	events,
	boxScore,
	overtimes,
	quarters,
	sportState,
}: {
	events: any[];
	boxScore: any;
	overtimes: number;
	quarters: any[]; // Basketball/football use strings, baseball/hockey use numbers
	sportState: any;
}) => {
	return bySport({
		baseball: processLiveGameEventsBaseball({
			events,
			boxScore,
			overtimes,
			quarters,
			sportState,
		}),
		basketball: processLiveGameEventsBasketball({
			events,
			boxScore,
			overtimes,
			quarters,
		}),
		football: processLiveGameEventsFootball({
			events,
			boxScore,
			overtimes,
			quarters,
			sportState,
		}),
		hockey: processLiveGameEventsHockey({
			events,
			boxScore,
			overtimes,
			quarters,
		}) as any,
	});
};

export default processLiveGameEvents;
