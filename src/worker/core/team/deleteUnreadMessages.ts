import { idb } from "../../db";

// Call this e.g. when switching team and any existing unread message is obsolete
const deleteUnreadMessages = async () => {
	const messages = await idb.getCopies.messages({ limit: 10 });
	for (const message of messages) {
		if (!message.read) {
			await idb.cache.messages.delete(message.mid);
		}
	}
};

export default deleteUnreadMessages;
