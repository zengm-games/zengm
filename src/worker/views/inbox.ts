import { idb } from "../db/index.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "inbox",
	load: async () => {
		let anyUnread = false;
		const messages = (await idb.merged.messages.getAll())
			.reverse()
			.map((message) => {
				if (!message.read) {
					anyUnread = true;
				}

				return {
					...message,
					text: message.text.replaceAll("<p>", "").replaceAll("</p>", " "),
				};
			});

		return {
			anyUnread,
			messages,
		};
	},
});
