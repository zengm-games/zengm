import { idb } from "../db/index.ts";
import DOMPurify from "dompurify";

const updateInbox = async () => {
	const messages = await idb.getCopies.messages();
	messages.reverse();
	let anyUnread = false;

	for (const message of messages) {
		message.text = DOMPurify.sanitize(message.text);

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
