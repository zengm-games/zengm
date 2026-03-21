import { isSport, PHASE } from "../../../common/index.ts";
import setContract from "./setContract.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import type { Phase, Player, PlayerContract } from "../../../common/types.ts";
import genJerseyNumber from "./genJerseyNumber.ts";
import setJerseyNumber from "./setJerseyNumber.ts";
import { emitFeedEvent } from "../../util/feedEvents.ts";
import { getSocialContext } from "../../util/getSocialContext.ts";

let lastPlayerSigningMs = 0;

const sign = async (
	p: Player,
	tid: number,
	contract: PlayerContract,
	phase: Phase,
) => {
	const isRookie =
		p.stats.length === 0 &&
		p.draft.year === g.get("season") &&
		p.draft.tid === tid;

	p.tid = tid;
	p.numDaysFreeAgent = 0;
	p.gamesUntilTradable = isRookie ? 0 : Math.round(0.17 * g.get("numGames")); // 14 for basketball, 3 for football

	// Handle stats if the season is in progress. Otherwise, not needed until next season.
	if (phase <= PHASE.PLAYOFFS) {
		setJerseyNumber(p, await genJerseyNumber(p));
	}

	let score = p.valueFuzz - 45;
	if (isSport("football")) {
		score -= 7;
	}
	score = Math.round(helpers.bound(score, 0, Infinity));

	setContract(p, contract, true);
	const resigning =
		phase === PHASE.RESIGN_PLAYERS && p.draft.year !== g.get("season");
	const eventType = resigning ? "reSigned" : "freeAgent";
	const eid = await logEvent({
		type: eventType,
		showNotification: false,
		pids: [p.pid],
		tids: [p.tid],
		score,
		contract: p.contract,
	});

	const freeAgent = !resigning && !isRookie;
	if (freeAgent) {
		if (!p.transactions) {
			p.transactions = [];
		}
		p.transactions.push({
			season: g.get("season"),
			phase: g.get("phase"),
			tid: p.tid,
			type: "freeAgent",
			eid,
		});

		// --- PLAYER_SIGNING feed event hook (fire-and-forget) ---
		if (Math.random() > 0.15) {
			return;
		} // skip most signings
		const now = Date.now();
		if (now - lastPlayerSigningMs < 2000) {
			return;
		} // cooldown
		lastPlayerSigningMs = now;
		const playerName = `${p.firstName} ${p.lastName}`;
		const signingTid = p.tid;
		void getSocialContext("PLAYER_SIGNING")
			.then((context) =>
				emitFeedEvent("PLAYER_SIGNING", context, {
					playerName,
					teamName: context.teams.find((t) => t.tid === signingTid)?.name ?? "",
				}),
			)
			.catch((error) =>
				console.error("[feedEvent] PLAYER_SIGNING failed", error),
			);
		// --- end PLAYER_SIGNING hook ---
	}
};

export default sign;
