import { idb } from "../db";

const updateInbox = async () => {
	const messages = await idb.getCopies.messages();
	messages.reverse();
	let anyUnread = false;

	for (const message of messages) {
		message.text = message.text.replace(/<p>/g, "").replace(/<\/p>/g, " "); // Needs to be regex otherwise it's cumbersome to do global replace

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
