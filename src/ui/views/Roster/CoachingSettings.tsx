import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import type { TeamCoaching } from "../../../common/types.ts";
import { DEFAULT_COACHING } from "../../../common/constants.ts";
import { HelpPopover } from "../../components/HelpPopover.tsx";
import CollapseArrow from "../../components/CollapseArrow.tsx";
import { helpers } from "../../util/helpers.ts";

const titleText = "Coaching Style";

// Each dial is a signed level in [-1, 1], 0 = neutral.
const DIALS: {
	key: keyof TeamCoaching;
	label: string;
	low: string;
	high: string;
}[] = [
	{
		key: "threePointTendency",
		label: "Three-point volume",
		low: "Fewer 3s",
		high: "More 3s",
	},
	{ key: "pace", label: "Tempo", low: "Slow it down", high: "Push the pace" },
	{
		key: "crashOffensiveGlass",
		label: "Offensive rebounding",
		low: "Get back on D",
		high: "Crash the glass",
	},
	{
		key: "paintDefense",
		label: "Defensive focus",
		low: "Guard the perimeter",
		high: "Pack the paint",
	},
	{
		key: "defensiveAggression",
		label: "Defensive aggression",
		low: "Play it safe",
		high: "Force turnovers",
	},
];

const signedPct = (level: number, magnitude: number) => {
	const pct = Math.round(level * magnitude);
	return `${pct > 0 ? "+" : ""}${pct}%`;
};

// Plain-language summary of how the current (coach-set) dials change games.
const projectedEffects = (coaching: TeamCoaching): string[] => {
	const effects: string[] = [];

	if (coaching.threePointTendency !== 0) {
		effects.push(
			`${signedPct(coaching.threePointTendency, 40)} three-point attempt rate`,
		);
	}
	if (coaching.pace !== 0) {
		const faster = coaching.pace > 0;
		effects.push(
			`${signedPct(coaching.pace, 12)} possessions · ${signedPct(
				coaching.pace,
				15,
			)} fatigue rate · injury risk ${faster ? "up" : "down"}`,
		);
	}
	if (coaching.crashOffensiveGlass !== 0) {
		const crashing = coaching.crashOffensiveGlass > 0;
		effects.push(
			`${signedPct(
				coaching.crashOffensiveGlass,
				40,
			)} offensive-rebound rate · transition defense ${
				crashing ? "more exposed" : "more protected"
			}`,
		);
	}
	if (coaching.paintDefense !== 0) {
		const mag = Math.abs(coaching.paintDefense);
		if (coaching.paintDefense > 0) {
			effects.push(
				`Pack the paint: ${signedPct(mag, 25)} opponent 3PA, −${Math.round(
					mag * 5,
				)} pp interior FG, +${Math.round(mag * 4)} pp opponent 3PT`,
			);
		} else {
			effects.push(
				`Guard the perimeter: −${Math.round(
					mag * 25,
				)}% opponent 3PA, +${Math.round(
					mag * 5,
				)} pp interior FG, −${Math.round(mag * 4)} pp opponent 3PT`,
			);
		}
	}
	if (coaching.defensiveAggression !== 0) {
		effects.push(
			`${signedPct(
				coaching.defensiveAggression,
				40,
			)} steals / blocks / forced turnovers · ${signedPct(
				coaching.defensiveAggression,
				30,
			)} fouls`,
		);
	}

	if (effects.length === 0) {
		return ["Neutral — no adjustments to how your team plays."];
	}
	return effects;
};

const dialValue = (value: number) =>
	value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);

type CoachCard = {
	cid: number;
	firstName: string;
	lastName: string;
	age: number;
	ratings: {
		ovr: number;
		development: number;
		tactics: number;
		adaptability: number;
		motivation: number;
	};
};

// Read-only: the team's style is set by its head coach (see the Coaches page).
const CoachingSettings = ({
	t,
	coach,
}: {
	t: {
		tid: number;
		coaching?: TeamCoaching;
	};
	coach?: CoachCard;
}) => {
	const [expanded, setExpanded] = useState(!window.mobile);

	const coaching: TeamCoaching = { ...DEFAULT_COACHING, ...t.coaching };

	return (
		<div className="coaching-style">
			<div className="d-flex align-items-center">
				{window.mobile ? (
					<button
						className="btn btn-link p-0 fw-bold"
						type="button"
						onClick={() => setExpanded((prev) => !prev)}
					>
						<CollapseArrow open={expanded} /> {titleText}
					</button>
				) : (
					<b>{titleText}</b>
				)}
				<HelpPopover className="ms-1" title={titleText}>
					<p>
						This team's playing style is set by its head coach — their
						philosophy, how much they adapt it to the roster, and how they
						adjust for each opponent. Manage coaches on the{" "}
						<a href={helpers.leagueUrl(["coaches"])}>Coaches</a> page.
					</p>
				</HelpPopover>
			</div>
			<AnimatePresence initial={false}>
				{expanded ? (
					<m.div
						className="mt-2"
						initial="collapsed"
						animate="open"
						exit="collapsed"
						variants={{
							open: { opacity: 1, height: "auto" },
							collapsed: { opacity: 0, height: 0 },
						}}
						transition={{ duration: 0.3, type: "tween" }}
					>
						{coach ? (
							<div className="mb-2">
								<a href={helpers.leagueUrl(["coach", String(coach.cid)])}>
									{coach.firstName} {coach.lastName}
								</a>{" "}
								<span className="text-body-secondary">
									(age {coach.age}, {coach.ratings.ovr} ovr)
								</span>
								<div className="small text-body-secondary">
									Dev {coach.ratings.development} · Tac {coach.ratings.tactics}{" "}
									· Adp {coach.ratings.adaptability} · Mot{" "}
									{coach.ratings.motivation}
								</div>
							</div>
						) : null}
						<table className="table table-sm mb-2">
							<tbody>
								{DIALS.map((dial) => (
									<tr key={dial.key}>
										<td className="p-1">{dial.label}</td>
										<td className="p-1 text-end" style={{ width: 50 }}>
											{dialValue(coaching[dial.key])}
										</td>
										<td className="p-1 text-body-secondary">
											{coaching[dial.key] >= 0 ? dial.high : dial.low}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<div className="fw-bold mb-1">Projected impact</div>
						<ul className="list-unstyled mb-0 small text-body-secondary">
							{projectedEffects(coaching).map((effect, i) => (
								<li key={i}>{effect}</li>
							))}
						</ul>
					</m.div>
				) : null}
			</AnimatePresence>
		</div>
	);
};

export default CoachingSettings;
