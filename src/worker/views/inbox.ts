import { idb } from "../db/index.ts";

const updateInbox = async () => {
	const messages = await idb.getCopies.messages();
	messages.reverse();
	let anyUnread = false;

	for (const message of messages) {
		message.text = message.text.replaceAll("<p>", "").replaceAll("</p>", " "); // Needs to be regex otherwise it's cumbersome to do global replace

		if (!message.read) {
			anyUnread = true;
		}
	}

	return {
		anyUnread,
		messages,
	};
};

export default updateInbox;
