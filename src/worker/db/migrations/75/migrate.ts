import { gameAttributesArrayToObject } from "../../../../common/gameAttributesArrayToObject.ts";
import { unwrapGameAttribute } from "../../../../common/unwrapGameAttribute.ts";
import type { Phase } from "../../../../common/types.ts";
import type { VersionChangeTransaction } from "../../connectLeague.ts";
import {
	convertLegacyContracts,
	type LegacyReleasedPlayer,
	type LegacyReleaseEvent,
	type LegacySigningEvent,
} from "../../../core/contract/convertLegacyContracts.ts";
import { updateOwedByTids } from "../../../core/contract/index.ts";

const pushToMap = <T>(map: Map<number, T[]>, key: number, value: T) => {
	let values = map.get(key);
	if (!values) {
		values = [];
		map.set(key, values);
	}
	values.push(value);
};

// Fraction of regular season games played so far in the current season, averaged over all teams
const getFractionCurrentSeasonPaid = (
	teamSeasons: {
		won: number;
		lost: number;
		tied?: number;
		otl?: number;
	}[],
	numGames: number,
) => {
	if (teamSeasons.length === 0 || numGames <= 0) {
		return 0;
	}

	let gp = 0;
	for (const ts of teamSeasons) {
		gp += ts.won + ts.lost + (ts.tied ?? 0) + (ts.otl ?? 0);
	}

	return Math.min(1, gp / (teamSeasons.length * numGames));
};

// See convertLegacyContracts
export const migrate75 = async (transaction: VersionChangeTransaction) => {
	const gameAttributes = gameAttributesArrayToObject(
		await transaction.objectStore("gameAttributes").getAll(),
	);
	const season: number = gameAttributes.season;
	const phase: Phase = gameAttributes.phase;
	const numGames = unwrapGameAttribute(gameAttributes, "numGames");

	const teamSeasons = await transaction
		.objectStore("teamSeasons")
		.index("season, tid")
		.getAll(IDBKeyRange.bound([season], [season, ""]));
	const leagueState = {
		fractionCurrentSeasonPaid: getFractionCurrentSeasonPaid(
			teamSeasons,
			numGames,
		),
		phase,
		season,
	};

	const releasedPlayers: LegacyReleasedPlayer[] = await (
		transaction.objectStore("releasedPlayers" as any) as any
	).getAll();
	const releasedPlayersByPid = new Map<number, LegacyReleasedPlayer[]>();
	for (const rp of releasedPlayers) {
		pushToMap(releasedPlayersByPid, rp.pid, rp);
	}

	const signingEventsByPid = new Map<number, LegacySigningEvent[]>();
	const releaseEventsByPid = new Map<number, LegacyReleaseEvent[]>();
	for await (const cursor of transaction.objectStore("events")) {
		const event = cursor.value;
		const pid = event.pids?.[0];
		const tid = event.tids?.[0];
		if (pid === undefined || tid === undefined) {
			continue;
		}

		if (
			(event.type === "freeAgent" || event.type === "reSigned") &&
			event.contract
		) {
			pushToMap(signingEventsByPid, pid, {
				type: event.type,
				season: event.season,
				phase: event.phase,
				tid,
				amount: event.contract.amount,
				exp: event.contract.exp,
			});
		} else if (event.type === "release") {
			pushToMap(releaseEventsByPid, pid, {
				season: event.season,
				phase: (event as any).phase,
				tid,
			});
		}
	}

	for await (const cursor of transaction.objectStore("players")) {
		const p = cursor.value as any;

		const { contracts, contractDemand } = convertLegacyContracts({
			p,
			leagueState,
			releasedPlayers: releasedPlayersByPid.get(p.pid) ?? [],
			releaseEvents: releaseEventsByPid.get(p.pid) ?? [],
			signingEvents: signingEventsByPid.get(p.pid) ?? [],
		});

		delete p.contract;
		delete p.salaries;
		p.contracts = contracts;
		if (contractDemand) {
			p.contractDemand = contractDemand;
		}
		updateOwedByTids(p);

		await cursor.update(p);
	}
};
