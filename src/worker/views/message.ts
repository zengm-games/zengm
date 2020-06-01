import { idb } from "../db";
import { g, helpers, updatePlayMenu, updateStatus } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updateMessage = async (
	inputs: ViewInput<"message">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// Complexity of updating is to handle auto-read message, so inputs.mid is blank
	if (
		updateEvents.includes("firstRun") ||
		!state.message ||
		state.message.mid !== inputs.mid
	) {
		let message;
		let readThisPageview = false;

		if (inputs.mid === undefined) {
			const messages = (
				await idb.getCopies.messages({
					limit: 10,
				})
			).reverse(); // First look for an unread message

			for (const m of messages) {
				if (!m.read) {
					// https://stackoverflow.com/a/59923262/786644
					const returnValue = {
						redirectUrl: helpers.leagueUrl(["message", m.mid]),
					};
					return returnValue;
				}
			}

			// Then look for any message
			if (messages.length > 0) {
				// https://stackoverflow.com/a/59923262/786644
				const returnValue = {
					redirectUrl: helpers.leagueUrl(["message", messages[0].mid]),
				};
				return returnValue;
			}
		} else {
			message = await idb.getCopy.messages({
				mid: inputs.mid,
			});
		}

		if (message && !message.read) {
			message.read = true;
			readThisPageview = true;
			await idb.cache.messages.put(message);
		}

		if (readThisPageview) {
			if (g.get("gameOver")) {
				await updateStatus("You're fired!");
			}

			await updatePlayMenu();
		}

		return {
			message,
		};
	}
};

export default updateMessage;
