import { expect, test } from "vitest";
import normalizeContractDemands from "./normalizeContractDemands.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { PHASE } from "../../../common/constants.ts";

// These snapshots were generated with the original Set-based bidding loop.
// Hash every resulting player record and check random consumption too.
for (const type of [
	"newLeague",
	"freeAgentsOnly",
	"includeExpiringContracts",
	"dummyExpiringContracts",
] as const) {
	for (const salaryCapType of ["soft", "hard"] as const) {
		for (const values of ["mixed", "zero", "negative"] as const) {
			test(`${type}, ${salaryCapType} cap, ${values} values`, async () => {
				resetG();
				Object.assign(g, {
					phase: PHASE.FREE_AGENCY,
					salaryCapType,
					salaryCap: 60000,
					minContract: 500,
					maxContract: 15000,
					numActiveTeams: 3,
					draftPickAutoContract: false,
				});
				await resetCache({
					teams: [0, 1, 2].map((tid) => ({ tid, disabled: false })),
					players: Array.from({ length: 48 }, (_, pid) => ({
						pid,
						tid: (pid % 4) - 1,
						firstName: "Test",
						lastName: String(pid),
						born: { year: 1980 + (pid % 17) },
						value:
							values === "zero"
								? 0
								: values === "negative"
									? -40 - (pid % 4)
									: ((pid * 17) % 93) - 20,
						contract: {
							amount: 500 + (pid % 9) * 700,
							exp: pid % 3 === 0 ? 2017 : 2016,
						},
						draft: { year: 2010, round: 0, pick: 0 },
						ratings: [{ ovr: 30 + pid, pot: 40 + pid, pos: "PG", skills: [] }],
						stats: [],
						injury: { type: "Healthy", gamesRemaining: 0 },
					})),
				});
				const originalRandom = Math.random;
				let state = 12345;
				let calls = 0;
				Math.random = () => {
					state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
					calls++;
					return state / 4294967296;
				};
				try {
					await normalizeContractDemands({
						type,
						pids:
							type === "dummyExpiringContracts" ? [0, 4, 8, 12, 16] : undefined,
					});
					const players = await idb.cache.players.getAll();
					const digest = await crypto.subtle.digest(
						"SHA-256",
						new TextEncoder().encode(JSON.stringify(players)),
					);
					expect({
						players: Array.from(new Uint8Array(digest), (byte) =>
							byte.toString(16).padStart(2, "0"),
						).join(""),
						calls,
						state,
					}).toMatchSnapshot();
				} finally {
					Math.random = originalRandom;
				}
			});
		}
	}
}
