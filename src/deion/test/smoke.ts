import { league } from "../worker/core";
import { connectMeta, idb } from "../worker/db";
import { g, local } from "../worker/util";

import "smoke-test-overrides"; // eslint-disable-line
import { deleteDB } from "idb";

describe("Smoke Tests", () => {
	let intervalID: number;

	it("Create a new league and simuluate a season without error", async function () {
		// Don't want to include Mocha and Jest types cause they conflict
		// @ts-ignore
		this.timeout(5 * 60 * 1000); // 5 minutes

		idb.meta = await connectMeta();
		await league.create("Test", 0, undefined, 2016, false, 0, undefined, {});
		local.autoPlaySeasons = 1;
		league.autoPlay();
		return new Promise(resolve => {
			intervalID = window.setInterval(() => {
				if (local.autoPlaySeasons === 0) {
					clearInterval(intervalID); // Wait to let it finish whatever DB activity might still be ongoing (like flushing cache)

					setTimeout(resolve, 5000);
				}
			}, 500);
		});
	});

	// Don't want to include Mocha and Jest types cause they conflict
	// @ts-ignore
	after(async () => {
		clearInterval(intervalID);
		await league.remove(g.get("lid"));

		if (g.get("lid") !== undefined) {
			throw new Error("g.lid should be undefined");
		}

		if (idb.meta !== undefined) {
			idb.meta.close();
		}

		await deleteDB("meta");
		// @ts-ignore
		idb.meta = undefined;
	});
});
