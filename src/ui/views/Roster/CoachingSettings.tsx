import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import type { TeamCoaching } from "../../../common/types.ts";
import { DEFAULT_COACHING } from "../../../common/constants.ts";
import { HelpPopover } from "../../components/HelpPopover.tsx";
import CollapseArrow from "../../components/CollapseArrow.tsx";
import { toWorker } from "../../util/toWorker.ts";

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
	{
		key: "pace",
		label: "Tempo",
		low: "Slow it down",
		high: "Push the pace",
	},
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

const PRESETS: {
	name: string;
	values: TeamCoaching;
}[] = [
	{ name: "Balanced", values: DEFAULT_COACHING },
	{
		name: "Pace & Space",
		values: {
			threePointTendency: 0.8,
			pace: 0.6,
			crashOffensiveGlass: -0.4,
			paintDefense: -0.3,
			defensiveAggression: 0,
		},
	},
	{
		name: "Seven Seconds or Less",
		values: {
			threePointTendency: 0.5,
			pace: 1,
			crashOffensiveGlass: -0.5,
			paintDefense: -0.2,
			defensiveAggression: 0.2,
		},
	},
	{
		name: "Grit & Grind",
		values: {
			threePointTendency: -0.6,
			pace: -0.6,
			crashOffensiveGlass: 0.7,
			paintDefense: 0.7,
			defensiveAggression: 0.4,
		},
	},
	{
		name: "Lockdown Defense",
		values: {
			threePointTendency: 0,
			pace: -0.2,
			crashOffensiveGlass: 0,
			paintDefense: 0.6,
			defensiveAggression: 0.7,
		},
	},
];

const CUSTOM = "Custom";

const matchingPreset = (coaching: TeamCoaching) => {
	const preset = PRESETS.find((preset) =>
		DIALS.every(({ key }) => preset.values[key] === coaching[key]),
	);
	return preset ? preset.name : CUSTOM;
};

const Slider = ({
	dial,
	value,
	onChange,
}: {
	dial: (typeof DIALS)[number];
	value: number;
	onChange: (value: number) => void;
}) => {
	const id = `coaching-${dial.key}`;

	return (
		<div className="mb-3">
			<label className="form-label mb-0" htmlFor={id}>
				{dial.label}
			</label>
			<input
				type="range"
				className="form-range"
				id={id}
				value={value}
				min="-1"
				max="1"
				step="0.1"
				onChange={(event) => {
					const parsed = Number.parseFloat(event.target.value);
					if (!Number.isNaN(parsed)) {
						onChange(parsed);
					}
				}}
			/>
			<div
				className="d-flex justify-content-between text-body-secondary small"
				style={{ marginTop: -5 }}
			>
				<span>{dial.low}</span>
				<span>{dial.high}</span>
			</div>
		</div>
	);
};

const CoachingSettings = ({
	t,
}: {
	t: {
		tid: number;
		coaching?: TeamCoaching;
	};
}) => {
	const [expanded, setExpanded] = useState(!window.mobile);
	const [coaching, setCoaching] = useState<TeamCoaching>({
		...DEFAULT_COACHING,
		...t.coaching,
	});

	const update = async (
		newCoaching: TeamCoaching,
		changedKeys: (keyof TeamCoaching)[],
	) => {
		setCoaching(newCoaching);
		for (const key of changedKeys) {
			await toWorker("main", "updateCoaching", {
				tid: t.tid,
				key,
				value: newCoaching[key],
			});
		}
	};

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
						These dials let you tell your coaching staff how you want to play.
						They only apply to your team — AI teams play their natural style.
					</p>
					<p>
						Each setting is a tradeoff. For example, packing the paint makes
						interior shots harder but concedes more open threes, and crashing
						the offensive glass wins more offensive rebounds but leaves you more
						exposed.
					</p>
					<p>
						Pick a preset to set everything at once, then fine-tune any
						individual slider.
					</p>
				</HelpPopover>
			</div>
			<AnimatePresence initial={false}>
				{expanded ? (
					<m.form
						className="mt-2"
						initial="collapsed"
						animate="open"
						exit="collapsed"
						variants={{
							open: { opacity: 1, height: "auto" },
							collapsed: { opacity: 0, height: 0 },
						}}
						transition={{
							duration: 0.3,
							type: "tween",
						}}
					>
						<div className="mb-3">
							<label className="form-label mb-0" htmlFor="coaching-preset">
								Preset
							</label>
							<select
								id="coaching-preset"
								className="form-select"
								value={matchingPreset(coaching)}
								onChange={(event) => {
									const preset = PRESETS.find(
										(preset) => preset.name === event.target.value,
									);
									if (preset) {
										update(
											{ ...preset.values },
											DIALS.map((dial) => dial.key),
										);
									}
								}}
							>
								{matchingPreset(coaching) === CUSTOM ? (
									<option value={CUSTOM}>{CUSTOM}</option>
								) : null}
								{PRESETS.map((preset) => (
									<option key={preset.name} value={preset.name}>
										{preset.name}
									</option>
								))}
							</select>
						</div>
						{DIALS.map((dial) => (
							<Slider
								key={dial.key}
								dial={dial}
								value={coaching[dial.key]}
								onChange={(value) => {
									update({ ...coaching, [dial.key]: value }, [dial.key]);
								}}
							/>
						))}
					</m.form>
				) : null}
			</AnimatePresence>
		</div>
	);
};

export default CoachingSettings;
