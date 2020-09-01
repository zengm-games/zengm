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
		await league.create({
			name: "Test",
			tid: 0,
			leagueFile: {
				startingSeason: 2016,
			},
		});
		local.autoPlayUntil = {
			season: 2017,
			phase: 0,
		};
		league.autoPlay();
		return new Promise(resolve => {
			intervalID = window.setInterval(() => {
				if (g.get("season") === 2017) {
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
