// This file is needed because the zod types are imported in both the node and web projects

import * as z from "zod";

const awardPlayerSchema = z.object({
	pid: z.number(),
	tid: z.number(),
	statOverrides: z
		.object({
			score: z.number(),
		})
		.catchall(z.union([z.number(), z.string()]))
		.optional(),
});

export type AwardPlayer = z.infer<typeof awardPlayerSchema>;

const awardInfoCommonSchema = z.object({
	shortName: z.string(),
	name: z.string(),
	formula: z.string(),
	formulaByPos: z.record(z.string(), z.string()).optional(),

	// undefined means regularSeason, number is index of finals where -1 is finals, -2 is semifinals, etc
	statRange: z
		.union([z.literal("playoffs"), z.literal("combined"), z.number()])
		.optional(),

	// undefined means league
	group: z
		.discriminatedUnion("type", [
			z.object({
				type: z.literal("conf"),
				cid: z.number(),
			}),
			z.object({
				type: z.literal("div"),
				did: z.number(),
			}),
			z.object({
				type: z.literal("playoffSeries"),
				tids: z.tuple([z.number(), z.number()]).readonly(),
			}),
		])
		.optional(),

	// What stats to show on Award Races and Season Summary?
	// Would be tricky to explicitly specify stats because (1) those 2 pages show different stuff; (2) it'd be very verbose; and (3) it'd be tricky to support playoff series awards where different stats are available
	showStats: z.enum([
		// baseball - defense would be nice, but don't want to deal with the arrays, and not actually needed in default awards
		"overall",
		"sp",
		"rp",
		"offense",
		"defense",
		// basketball
		"offense",
		"defense",
		// football
		"overall",
		"defense",
		"blocking",
		// hockey
		"overall",
		"defense",
		"goalkeeping",
	]),

	// Filters
	bench: z.literal(true).optional(),
	mip: z.literal(true).optional(),
	rookie: z.literal(true).optional(),
});

const awardInfoIndividualCommonSchema = z.object({
	numTeams: z.undefined().optional(),

	// Treat as "MVP" or "ROY" in UI and for FBGM OPOY
	actAs: z.enum(["mvp", "roy"]).optional(),
});

const awardInfoTeamCommonSchema = z.object({
	numTeams: z.number().gte(1),
});

const awardInfoIndividualSchema = awardInfoCommonSchema
	.extend(awardInfoIndividualCommonSchema.shape)
	.extend({
		// Individual award - top 5 are saved, although we may have fewer slots than that in an upgraded league
		winner: z.array(
			z.union([
				awardPlayerSchema.extend({
					opoyOverride: z.literal(true).optional(),
				}),
				awardPlayerSchema.extend({
					pid: z.undefined().optional(),
					tid: z.undefined().optional(),
				}),
			]),
		),

		// Special QB stuff for OPOY award - not in Common because we don't need to persist this in Player objects, we only need it here for state (GameAttributesLeague) and history (Awards)
		opoyFormula: z.string().optional(),
	});

const awardInfoTeamSchema = awardInfoCommonSchema
	.extend(awardInfoTeamCommonSchema.shape)
	.extend({
		// Team award
		winner: z.array(
			z.array(
				z.union([
					awardPlayerSchema.extend({
						// pos is defined if TEAM_AWARD_INFO.byPos
						pos: z.string().optional(),
					}),

					// This would be if it can't find enough players at one position - either an empty object, or one containg only pos if TEAM_AWARD_INFO.byPos
					awardPlayerSchema.extend({
						pid: z.undefined().optional(),
						tid: z.undefined().optional(),
						pos: z.string().optional(),
					}),
				]),
			),
		),
	});

const awardSettingIndividualSchema = awardInfoIndividualSchema
	.omit({
		group: true,
		winner: true,
	})
	.extend({
		group: z.enum(["conf", "div"]).optional(),
	});

const awardSettingTeamSchema = awardInfoTeamSchema
	.omit({
		group: true,
		winner: true,
	})
	.extend({
		group: z.enum(["conf", "div"]).optional(),
	});

export const awardSettingsSchema = z
	.array(z.union([awardSettingIndividualSchema, awardSettingTeamSchema]))
	.superRefine((awards, ctx) => {
		const seen = new Set<string>();

		for (const [i, award] of awards.entries()) {
			const { shortName } = award;

			const addIssue = (message: string) => {
				ctx.addIssue({
					code: "custom",
					path: [i],
					message,
				});
			};

			if (seen.has(shortName)) {
				addIssue("Duplicate abbrev - award abbrevs must be unique");
			}
			if (award.numTeams !== undefined && typeof award.statRange === "number") {
				addIssue("Playoff series awards cannot be individual awards");
			}
			if (award.mip && typeof award.statRange === "number") {
				addIssue("Playoff series awards cannot be Most Improved Player awards");
			}
			if (award.numTeams === undefined && award.opoyFormula !== undefined) {
				const banWith = ["actAs", "rookie", "bench", "mip"] as const;
				for (const key of banWith) {
					if (award[key]) {
						addIssue(`opoyFormula and ${key} cannot both be defined`);
					}
				}
			}

			seen.add(shortName);
		}
	});

export type AwardInfoCommon = z.infer<typeof awardInfoCommonSchema>;
export type AwardInfoIndividual = z.infer<typeof awardInfoIndividualSchema>;
export type AwardInfoTeam = z.infer<typeof awardInfoTeamSchema>;
export type AwardSettingIndividual = z.infer<
	typeof awardSettingIndividualSchema
>;
export type AwardSettingTeam = z.infer<typeof awardSettingTeamSchema>;
export type AwardSettings = z.infer<typeof awardSettingsSchema>;

const playerAwardBuiltInBaseSchema = z.object({
	season: z.number(),
	type: z.undefined().optional(),
	name: z.string(),
	shortName: z.string(),
	index: z.number(), // Index in the list of awards for this season - this is just used in the UI some places for sorting
	rank: z.number(), // rank in individual award, team number in team award
	group: z
		.discriminatedUnion("type", [
			z.object({
				type: z.literal("conf"),
				cid: z.number(),
			}),
			z.object({
				type: z.literal("div"),
				did: z.number(),
			}),
		])
		.optional(),
});

const playerAwardBuiltInSchema = z.union([
	playerAwardBuiltInBaseSchema.extend(awardInfoIndividualCommonSchema.shape),
	playerAwardBuiltInBaseSchema.extend(awardInfoTeamCommonSchema.shape),
]);

const playerAwardSimpleSchema = z.object({
	season: z.number(),
	type: z.string(),
});

export const playerAwardSchema = z.union([
	playerAwardSimpleSchema,
	playerAwardBuiltInSchema,
]);

export type PlayerAwardBuiltIn = z.infer<typeof playerAwardBuiltInSchema>;
export type PlayerAwardSimple = z.infer<typeof playerAwardSimpleSchema>;
export type PlayerAward = z.infer<typeof playerAwardSchema>;

const awardSchema = z.union([awardInfoIndividualSchema, awardInfoTeamSchema]);

export const awardsSchema = z.object({
	season: z.number(),
	bestRecord: z.number(), // tid

	// Keys can't be z.number() because that messes up the JSON Schema type https://github.com/colinhacks/zod/issues/6496
	bestRecordConfs: z.record(z.string(), z.number()), // <cid, tid>
	bestRecordDivs: z.record(z.string(), z.number()), // <did, tid>

	awards: z.array(awardSchema),
});

export type Award = z.infer<typeof awardSchema>;
export type Awards = z.infer<typeof awardsSchema>;
