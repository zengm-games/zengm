import { g } from "../util";
import { UpdateEvents } from "../../common/types";

const updateExportStats = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("newPhase")) {
		const options = [
			{
				key: "all",
				val: "All Seasons",
			},
		];

		for (let season = g.startingSeason; season <= g.season; season++) {
			options.push({
				key: String(season),
				val: `${season} season`,
			});
		}

		return {
			seasons: options,
		};
	}
};

export default updateExportStats;
