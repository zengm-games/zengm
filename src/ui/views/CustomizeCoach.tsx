import { useState } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import { toWorker } from "../util/toWorker.ts";
import { realtimeUpdate } from "../util/realtimeUpdate.ts";
import type { View } from "../../common/types.ts";

const RATING_FIELDS = [
	{ key: "development", label: "Development" },
	{ key: "tactics", label: "Tactics" },
	{ key: "adaptability", label: "Adaptability" },
	{ key: "motivation", label: "Motivation" },
] as const;

const DIAL_FIELDS = [
	{ key: "threePointTendency", label: "Three-point volume" },
	{ key: "pace", label: "Tempo" },
	{ key: "crashOffensiveGlass", label: "Offensive rebounding" },
	{ key: "paintDefense", label: "Defensive focus" },
	{ key: "defensiveAggression", label: "Defensive aggression" },
] as const;

// Same weighting as worker/core/coach/ovr.ts, for a live preview.
const computeOvr = (r: {
	development: number;
	tactics: number;
	adaptability: number;
	motivation: number;
}) =>
	Math.round(
		0.3 * r.development +
			0.3 * r.tactics +
			0.2 * r.adaptability +
			0.2 * r.motivation,
	);

const CustomizeCoach = ({ coach, season }: View<"customizeCoach">) => {
	useTitleBar({
		title: "Edit Coach",
	});

	const [form, setForm] = useState(() => ({
		firstName: coach.firstName,
		lastName: coach.lastName,
		age: coach.age,
		ratings: {
			development: coach.ratings.development,
			tactics: coach.ratings.tactics,
			adaptability: coach.ratings.adaptability,
			motivation: coach.ratings.motivation,
		},
		philosophy: { ...coach.philosophy },
		// Contract amount edited in millions.
		contractAmountM: coach.contract.amount / 1000,
		contractExp: coach.contract.exp,
	}));
	const [saving, setSaving] = useState(false);

	const liveOvr = computeOvr(form.ratings);

	const save = async () => {
		setSaving(true);
		await toWorker("main", "updateCoach", {
			cid: coach.cid,
			firstName: form.firstName,
			lastName: form.lastName,
			age: form.age,
			ratings: form.ratings,
			philosophy: form.philosophy,
			contract: {
				amount: Math.round(form.contractAmountM * 1000),
				exp: form.contractExp,
			},
		});
		setSaving(false);
		realtimeUpdate([], helpers.leagueUrl(["coach", String(coach.cid)]));
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<div className="row">
				<div className="col-md-6">
					<h2>Attributes</h2>
					<div className="row g-2">
						<div className="col-6">
							<label className="form-label">First name</label>
							<input
								className="form-control"
								value={form.firstName}
								onChange={(e) =>
									setForm((f) => ({ ...f, firstName: e.target.value }))
								}
							/>
						</div>
						<div className="col-6">
							<label className="form-label">Last name</label>
							<input
								className="form-control"
								value={form.lastName}
								onChange={(e) =>
									setForm((f) => ({ ...f, lastName: e.target.value }))
								}
							/>
						</div>
						<div className="col-6">
							<label className="form-label">Age</label>
							<input
								type="number"
								className="form-control"
								value={form.age}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										age: Number.parseInt(e.target.value),
									}))
								}
							/>
						</div>
					</div>

					<h2 className="mt-3">Contract</h2>
					<div className="row g-2">
						<div className="col-6">
							<label className="form-label">Amount ($M / year)</label>
							<input
								type="number"
								step="0.1"
								className="form-control"
								value={form.contractAmountM}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										contractAmountM: helpers.localeParseFloat(e.target.value),
									}))
								}
							/>
						</div>
						<div className="col-6">
							<label className="form-label">Expires</label>
							<input
								type="number"
								className="form-control"
								value={form.contractExp}
								min={season}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										contractExp: Number.parseInt(e.target.value),
									}))
								}
							/>
						</div>
					</div>
				</div>

				<div className="col-md-6">
					<h2>
						Ratings <span className="text-body-secondary">(Ovr {liveOvr})</span>
					</h2>
					<div className="row g-2">
						{RATING_FIELDS.map(({ key, label }) => (
							<div className="col-6" key={key}>
								<label className="form-label">{label}</label>
								<input
									type="number"
									min="0"
									max="100"
									className="form-control"
									value={form.ratings[key]}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											ratings: {
												...f.ratings,
												[key]: helpers.bound(
													Number.parseInt(e.target.value),
													0,
													100,
												),
											},
										}))
									}
								/>
							</div>
						))}
					</div>

					<h2 className="mt-3">Philosophy</h2>
					<p className="text-body-secondary">Preferred style dials, −1 to 1.</p>
					<div className="row g-2">
						{DIAL_FIELDS.map(({ key, label }) => (
							<div className="col-6" key={key}>
								<label className="form-label">{label}</label>
								<input
									type="number"
									min="-1"
									max="1"
									step="0.1"
									className="form-control"
									value={form.philosophy[key]}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											philosophy: {
												...f.philosophy,
												[key]: helpers.bound(
													helpers.localeParseFloat(e.target.value),
													-1,
													1,
												),
											},
										}))
									}
								/>
							</div>
						))}
					</div>
				</div>
			</div>

			<button type="submit" className="btn btn-primary mt-3" disabled={saving}>
				Save coach
			</button>
		</form>
	);
};

export default CustomizeCoach;
