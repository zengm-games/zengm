import processLiveGameEventsBasketball from "./processLiveGameEvents.basketball";
import processLiveGameEventsFootball from "./processLiveGameEvents.football";

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
	if (process.env.SPORT === "football") {
		return processLiveGameEventsFootball({
			events,
			boxScore,
			overtimes,
			quarters,
		});
	}

	return processLiveGameEventsBasketball({
		events,
		boxScore,
		overtimes,
		quarters,
	});
};

export default processLiveGameEvents;
