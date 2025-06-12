import { idb } from "../db/index.ts";
import logEvent from "./logEvent.ts";
import type { Conditions } from "../../common/types.ts";
import { fetchWrapper, SUBREDDIT_NAME } from "../../common/index.ts";

const LAST_VERSION_BEFORE_THIS_EXISTED = "2021.05.25.0919";
const CURRENT_VERSION = "VERSION_NUMBER";
const MAX_NUM_TO_SHOW = 3;
const FETCH_LIMIT = 10;

const checkChanges = async (conditions: Conditions) => {
	// Fall back to LAST_VERSION_BEFORE_THIS_EXISTED if data doesn't exist - must be a user from before then
	const lastChangesVersion =
		(await idb.meta.get("attributes", "lastChangesVersion")) ??
		(LAST_VERSION_BEFORE_THIS_EXISTED as unknown as string);

	if (CURRENT_VERSION > lastChangesVersion) {
		const changes = (await fetchWrapper({
			url: "https://zengm.com/changelog.php",
			method: "GET",
			data: {
				since: lastChangesVersion,
				current: CURRENT_VERSION,
				sport: process.env.SPORT,
				limit: FETCH_LIMIT,
			},
		})) as unknown as {
			version: string;
			text: string;

			// Currently returns null, but making this field just not present would be better
			links: string[] | null;
		}[];

		if (changes && changes.length > 0) {
			let text = "";

			for (const [i, change] of changes.entries()) {
				text += `<p class="mt-1 mb-0"><strong>v${change.version}</strong>: ${change.text}`;

				const links = change.links;
				if (links) {
					const link =
						links.find((link) => link.startsWith("/blog/")) ??
						links.find((link) => link.includes(SUBREDDIT_NAME)) ??
						links[0];
					if (link) {
						let url;
						if (link.startsWith("/basketball/")) {
							url = link.replace("/basketball/", "https://basketball-gm.com/");
						} else if (link.startsWith("/football/")) {
							url = link.replace("/football/", "https://football-gm.com/");
						} else if (link.startsWith("/")) {
							url = link.replace("/", "https://zengm.com/");
						} else {
							url = link;
						}

						text += ` <a href="${url}" target="_blank">More details</a>`;
					}
				}
				text += "</p>";

				if (i >= MAX_NUM_TO_SHOW - 1) {
					break;
				}
			}

			let moreText;
			const numMore = changes.length - MAX_NUM_TO_SHOW;
			if (numMore === 1) {
				moreText = "...and 1 more change";
			} else if (numMore === FETCH_LIMIT - MAX_NUM_TO_SHOW) {
				moreText = "...and many more changes";
			} else if (numMore > 1) {
				moreText = `...and more ${numMore} changes`;
			} else {
				moreText = "View all changes";
			}
			text += `<p class="mt-1 mb-0"><a href="https://zengm.com/changelog/" target="_blank">${moreText}</a></p>`;

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
		}

		await idb.meta.put("attributes", CURRENT_VERSION, "lastChangesVersion");
	}
};

export default checkChanges;
