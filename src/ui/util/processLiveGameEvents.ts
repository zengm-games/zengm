import { bySport } from "../../common";
import processLiveGameEventsBaseball from "./processLiveGameEvents.baseball";
import processLiveGameEventsBasketball from "./processLiveGameEvents.basketball";
import processLiveGameEventsFootball from "./processLiveGameEvents.football";
import processLiveGameEventsHockey from "./processLiveGameEvents.hockey";

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
		}) as any,
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
