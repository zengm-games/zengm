import { idb } from "../db/index.ts";
import { defineView } from "../util/defineView.ts";

export default defineView("inbox", async () => {
	const messages = await idb.getCopies.messages();
	messages.reverse();
	let anyUnread = false;

	for (const message of messages) {
		message.text = message.text.replaceAll("<p>", "").replaceAll("</p>", " ");

		if (!message.read) {
			anyUnread = true;
		}
	}

	return {
		anyUnread,
		messages,
	};
});
