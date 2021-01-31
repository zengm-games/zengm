import { bySport } from "../../common";
import processLiveGameEventsBasketball from "./processLiveGameEvents.basketball";
import processLiveGameEventsFootball from "./processLiveGameEvents.football";
import processLiveGameEventsHockey from "./processLiveGameEvents.hockey";

// Mutates boxScore!!!
const processLiveGameEvents = ({
	events,
	boxScore,
	overtimes,
	quarters,
}: {
	events: any[];
	boxScore: any;
	overtimes: number;
	quarters: string[];
}) => {
	return bySport({
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
		}),
	});
};

export default processLiveGameEvents;
