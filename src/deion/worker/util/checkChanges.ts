import { idb } from "../db";
import logEvent from "./logEvent";
import overrides from "./overrides";
import { Conditions } from "../../common/types";

const checkChanges = async (conditions: Conditions) => {
	const changesRead = ((await idb.meta.get(
		"attributes",
		"changesRead",
	)) as unknown) as number;

	// Don't show anything on first visit
	if (changesRead === undefined || changesRead < 0) {
		await idb.meta.put(
			"attributes",
			overrides.util.changes.length,
			"changesRead",
		);
		return;
	}

	if (changesRead < overrides.util.changes.length) {
		const unread = overrides.util.changes.slice(changesRead);
		let text = "";
		let linked = false;

		for (let i = 0; i < unread.length; i++) {
			if (i > 0) {
				text += "<br>";
			}

			text += `<strong>${unread[i].date}</strong>: ${unread[i].msg}`;

			if (i >= 2 && unread.length - i - 1 > 0) {
				linked = true;
				text += `<br><a href="/changes">...and ${unread.length -
					i -
					1} more changes.</a>`;
				break;
			}
		}

		if (!linked) {
			text += '<br><a href="/changes">View all changes</a>';
		}

		logEvent(
			{
				extraClass: "",
				persistent: true,
				type: "changes",
				text,
				saveToDb: false,
			},
			conditions,
		);
		await idb.meta.put(
			"attributes",
			overrides.util.changes.length,
			"changesRead",
		);
	}
};

export default checkChanges;
