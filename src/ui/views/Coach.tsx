import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
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

const fmtDelta = (delta: number) => {
	const rounded = delta.toFixed(1);
	return delta >= 0 ? `+${rounded}` : rounded;
};

const Coach = ({
	career,
	coach,
	godMode,
	seasons,
	team,
	teamCoaching,
}: View<"coach">) => {
	useTitleBar({
		title: `${coach.firstName} ${coach.lastName}`,
	});

	const coyCount = coach.awards.filter(
		(a) => a.type === "Coach of the Year",
	).length;

	return (
		<>
			<div className="row">
				<div className="col-md-6">
					<h2>Overview</h2>
					<p>
						<b>Team:</b>{" "}
						{team ? (
							<a
								href={helpers.leagueUrl([
									"roster",
									`${team.abbrev}_${team.tid}`,
								])}
							>
								{team.region} {team.name}
							</a>
						) : (
							"Free agent"
						)}
						<br />
						<b>Age:</b> {coach.age}
						<br />
						<b>Overall:</b> {coach.ratings.ovr}
						<br />
						<b>Salary:</b>{" "}
						{helpers.formatCurrency(coach.contract.amount / 1000, "M")} through{" "}
						{coach.contract.exp}
						{coach.fromPid !== undefined ? (
							<>
								<br />
								<b>Former player:</b>{" "}
								<a href={helpers.leagueUrl(["player", coach.fromPid])}>
									view playing career
								</a>
							</>
						) : null}
						{coyCount > 0 ? (
							<>
								<br />
								<b>Coach of the Year:</b> {coyCount}×
							</>
						) : null}
					</p>

					{godMode ? (
						<a
							className="btn btn-god-mode mb-3"
							href={helpers.leagueUrl(["customize_coach", String(coach.cid)])}
						>
							Edit coach
						</a>
					) : null}

					<h2>Ratings</h2>
					<table className="table table-sm">
						<tbody>
							{RATING_FIELDS.map(({ key, label }) => (
								<tr key={key}>
									<td>{label}</td>
									<td className="text-end">{coach.ratings[key]}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="col-md-6">
					<h2>Philosophy</h2>
					<p className="text-body-secondary">
						Their preferred style. The team's actual style blends this with the
						roster (adaptability) and adjusts per opponent (tactics).
					</p>
					<table className="table table-sm">
						<tbody>
							{DIAL_FIELDS.map(({ key, label }) => (
								<tr key={key}>
									<td>{label}</td>
									<td className="text-end">
										{coach.philosophy[key] > 0 ? "+" : ""}
										{coach.philosophy[key].toFixed(1)}
									</td>
									{teamCoaching ? (
										<td className="text-end text-body-secondary">
											(now {teamCoaching[key] > 0 ? "+" : ""}
											{teamCoaching[key].toFixed(1)})
										</td>
									) : null}
								</tr>
							))}
						</tbody>
					</table>
					{teamCoaching ? (
						<p className="small text-body-secondary">
							"now" = this season's effective dials for {team?.abbrev}.
						</p>
					) : null}
				</div>
			</div>

			<h2>Coaching record</h2>
			{seasons.length > 0 ? (
				<div className="table-responsive">
					<table className="table table-striped table-borderless table-sm">
						<thead>
							<tr>
								<th>Season</th>
								<th>Team</th>
								<th>W</th>
								<th>L</th>
								<th title="Expected wins (talent-based, injury & trade aware)">
									Exp W
								</th>
								<th title="Wins above expectation">Δ</th>
							</tr>
						</thead>
						<tbody>
							{seasons.map((s) => (
								<tr key={s.season}>
									<td>
										<a href={helpers.leagueUrl(["history", s.season])}>
											{s.season}
										</a>
									</td>
									<td>
										<a
											href={helpers.leagueUrl([
												"roster",
												`${s.abbrev}_${s.tid}`,
												s.season,
											])}
										>
											{s.abbrev}
										</a>
									</td>
									<td>{s.won}</td>
									<td>{s.lost}</td>
									<td>{s.expectedWins.toFixed(1)}</td>
									<td
										className={
											s.delta > 0
												? "text-success"
												: s.delta < 0
													? "text-danger"
													: undefined
										}
									>
										{fmtDelta(s.delta)}
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr className="fw-bold">
								<td>Career</td>
								<td />
								<td>{career.won}</td>
								<td>{career.lost}</td>
								<td>{career.expectedWins.toFixed(1)}</td>
								<td>{fmtDelta(career.won - career.expectedWins)}</td>
							</tr>
						</tfoot>
					</table>
				</div>
			) : (
				<p>No completed seasons yet.</p>
			)}

			<h2>Awards</h2>
			{coach.awards.length > 0 ? (
				<ul>
					{coach.awards.map((a, i) => (
						<li key={i}>
							{a.season}: {a.type}
						</li>
					))}
				</ul>
			) : (
				<p>None</p>
			)}
		</>
	);
};

export default Coach;
