import { assert, test } from "vitest";
import rosterFitFactor from "./rosterFit.basketball.ts";

// Minimal player shape rosterFitFactor reads: value + last ratings entry.
const mk = (
	pos: string,
	{
		tp = 40,
		three = 40,
		usage = 50,
		value = 0.6,
	}: { tp?: number; three?: number; usage?: number; value?: number } = {},
) => ({
	value,
	ratings: [{ pos, tp, tendencyThree: three, tendencyUsage: usage }],
});

const spacer = (extra = {}) => mk("SF", { tp: 70, three: 70, ...extra });
const nonShooter = (extra = {}) => mk("SF", { tp: 30, three: 30, ...extra });

test("a non-shooting roster ranks a shooter above an equal non-shooter", () => {
	const roster = [
		nonShooter(),
		nonShooter(),
		nonShooter(),
		nonShooter(),
		nonShooter(),
	];

	const fitSpacer = rosterFitFactor(roster, spacer());
	const fitNonShooter = rosterFitFactor(roster, nonShooter());

	assert(
		fitSpacer > fitNonShooter,
		`expected spacer fit ${fitSpacer} > non-shooter fit ${fitNonShooter}`,
	);
});

test("a guard-heavy roster ranks a needed big up", () => {
	const roster = [mk("PG"), mk("SG"), mk("SG"), mk("PG"), mk("SG")];

	const fitBig = rosterFitFactor(roster, mk("C"));
	const fitGuard = rosterFitFactor(roster, mk("SG"));

	assert(
		fitBig > fitGuard,
		`expected big fit ${fitBig} > guard fit ${fitGuard}`,
	);
});

test("a ball-dominant roster down-weights another high-usage player", () => {
	const roster = [
		mk("PG", { usage: 80 }),
		mk("SG", { usage: 80 }),
		mk("SF", { usage: 80 }),
		mk("PF"),
		mk("C"),
	];

	const fitHighUsage = rosterFitFactor(roster, mk("SG", { usage: 80 }));
	const fitLowUsage = rosterFitFactor(roster, mk("SG", { usage: 45 }));

	assert(
		fitHighUsage < fitLowUsage,
		`expected high-usage fit ${fitHighUsage} < low-usage fit ${fitLowUsage}`,
	);
});

test("fit stays within the modest clamp band", () => {
	const roster = [
		nonShooter(),
		nonShooter(),
		nonShooter(),
		nonShooter(),
		nonShooter(),
	];
	const fit = rosterFitFactor(roster, spacer());
	assert(fit >= 0.88 && fit <= 1.12, `fit ${fit} out of band`);
});
