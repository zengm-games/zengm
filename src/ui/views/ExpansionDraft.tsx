import { useState, ChangeEvent, FormEvent, MouseEvent } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker, logEvent } from "../util";
import type { View, ExpansionDraftSetupTeam } from "../../common/types";
import { DEFAULT_JERSEY, PHASE } from "../../common";
import TeamForm from "./ManageTeams/TeamForm";
import { getGodModeWarnings } from "./NewLeague/UpsertTeamModal";

const ExpansionDraft = ({
	builtInTeams,
	confs,
	defaultNumProtectedPlayers,
	divs,
	godMode,
	godModeLimits,
	initialNumPerTeam,
	initialNumProtectedPlayers,
	initialTeams,
	minRosterSize,
	multiTeamMode,
	numActiveTeams,
	phase,
}: View<"expansionDraft">) => {
	const defaultTeam: ExpansionDraftSetupTeam = {
		abbrev: "AAA",
		region: "",
		name: "",
		imgURL: "",
		colors: ["#000000", "#cccccc", "#ffffff"],
		jersey: DEFAULT_JERSEY,
		pop: "1",
		stadiumCapacity: "25000",
		did: String(divs.at(-1).did),
		takeControl: false,
	};

	const [saving, setSaving] = useState(false);
	const [teams, setTeams2] = useState<ExpansionDraftSetupTeam[]>(initialTeams);
	const [numProtectedPlayers, setNumProtectedPlayers2] = useState(
		initialNumProtectedPlayers,
	);
	const [numPerTeam, setNumPerTeam2] = useState(initialNumPerTeam);
	const [addTeamAbbrev, setAddTeamAbbrev] = useState("");

	const setNumProtectedPlayers = async (newNum: string) => {
		setNumProtectedPlayers2(newNum);
		setSaving(true);
		await toWorker("main", "updateExpansionDraftSetup", {
			numProtectedPlayers: newNum,
		});
		setSaving(false);
	};

	const setNumPerTeam = async (newNum: string) => {
		setNumPerTeam2(newNum);
		setSaving(true);
		await toWorker("main", "updateExpansionDraftSetup", {
			numPerTeam: newNum,
		});
		setSaving(false);
	};

	const setTeams = async (newTeams: ExpansionDraftSetupTeam[]) => {
		const newNumProtectedPlayers = String(
			helpers.bound(defaultNumProtectedPlayers - newTeams.length, 0, Infinity),
		);
		const newNumPerTeam = String(
			helpers.getExpansionDraftMinimumPlayersPerActiveTeam(
				newTeams.length,
				minRosterSize,
				numActiveTeams,
			),
		);
		setTeams2(newTeams);
		setNumProtectedPlayers2(newNumProtectedPlayers);
		setNumPerTeam2(newNumPerTeam);
		setSaving(true);
		await toWorker("main", "updateExpansionDraftSetup", {
			numProtectedPlayers: newNumProtectedPlayers,
			numPerTeam: newNumPerTeam,
			teams: newTeams,
		});
		setSaving(false);
	};

	useTitleBar({ title: "Expansion Draft" });

	const phaseDisabled = ![PHASE.PRESEASON, PHASE.DRAFT_LOTTERY].includes(phase);

	if (phaseDisabled) {
		return (
			<p>
				You can only do an expansion draft during the preseason or draft lottery
				phases.
			</p>
		);
	}

	const handleInputChange =
		(i: number) =>
		async (
			field: string,
			event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
		) => {
			const value = event.target.value;

			const t: any = {
				...teams[i],
			};

			if (field.startsWith("colors")) {
				const ind = parseInt(field.replace("colors", ""));
				if (ind >= 0 && ind <= 2) {
					t.colors[ind] = value;
				}
			} else {
				t[field] = value;
			}

			const newTeams = [...teams];
			newTeams[i] = t;
			await setTeams(newTeams);
		};

	const deleteTeam = (i: number) => async (event: MouseEvent) => {
		event.preventDefault();

		await setTeams(teams.filter((t, j) => j !== i));
	};

	const addTeam = async (event: MouseEvent) => {
		event.preventDefault();

		const newTeam =
			builtInTeams.find(t => t.abbrev === addTeamAbbrev) || defaultTeam;

		await setTeams([...teams, helpers.deepCopy(newTeam)]);
		setAddTeamAbbrev("");
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		if (saving) {
			return;
		}

		setSaving(true);

		const errors = await toWorker(
			"main",
			"advanceToPlayerProtection",
			undefined,
		);

		if (errors) {
			logEvent({
				type: "error",
				text: `- ${errors.join("<br>- ")}`,
				saveToDb: false,
			});
			setSaving(false);
		}
	};

	const handleTakeControl =
		(i: number) => async (event: ChangeEvent<HTMLInputElement>) => {
			const newTeams = [...teams];
			if (!event.target.checked) {
				newTeams[i] = {
					...newTeams[i],
					takeControl: false,
				};
			} else {
				if (multiTeamMode) {
					newTeams[i] = {
						...newTeams[i],
						takeControl: true,
					};
				} else {
					for (let j = 0; j < newTeams.length; j++) {
						// Only allow one to be checked
						newTeams[j] = {
							...newTeams[j],
							takeControl: i === j,
						};
					}
				}
			}

			await setTeams(newTeams);
		};

	const currentAbbrevs = teams.map(t => t.abbrev);

	// If user is taking control of team, don't let them pick the number of protected players - too easy!
	const disableNumProtectedPlayersChange =
		teams.some(t => t.takeControl) && !godMode;
	const defaultNumProtectedPlayersValue = String(
		defaultNumProtectedPlayers - teams.length,
	);
	if (
		disableNumProtectedPlayersChange &&
		numProtectedPlayers !== defaultNumProtectedPlayersValue
	) {
		setNumProtectedPlayers(defaultNumProtectedPlayersValue);
	}

	let godModeWarning = false;

	return (
		<>
			<p>
				In an expansion draft, new teams are added to the league. Rather than
				starting with no players, they draft players from existing teams.
				However the list of players available to be drafted is limited, each
				existing team has a chance to protect some of their players.
			</p>

			<form onSubmit={handleSubmit}>
				<h2>Expansion Teams</h2>
				<div className="row">
					{teams.map((t, i) => {
						const godModeWarnings = godMode
							? []
							: getGodModeWarnings({ t, godModeLimits });
						if (godModeWarnings.length > 0) {
							godModeWarning = true;
						}

						return (
							<div key={i} className="col-xl-4 col-lg-6 mb-3">
								<div className="card">
									<div className="card-body">
										<div className="row">
											<TeamForm
												classNamesCol={[
													"col-6",
													"col-6",
													"col-6",
													"col-6",
													"col-6",
													"col-6",
													"col-6",
													"col-6",
													"col-6",
													"col-6",
												]}
												confs={confs}
												disableStadiumCapacity={!godMode}
												divs={divs}
												handleInputChange={handleInputChange(i)}
												hideStatus
												t={t}
											/>
										</div>
										<div className="row">
											<div className="col-6">
												<div className="form-check mt-2">
													<input
														className="form-check-input"
														type="checkbox"
														id={`expansion-control-team-${i}`}
														checked={t.takeControl}
														onChange={handleTakeControl(i)}
													/>
													<label
														className="form-check-label"
														htmlFor={`expansion-control-team-${i}`}
													>
														{multiTeamMode
															? "Add team to multi team mode"
															: "Switch to controlling this team"}
													</label>
												</div>
											</div>
											<div className="col-6 text-end">
												<button
													type="button"
													className="btn btn-danger"
													onClick={deleteTeam(i)}
												>
													Remove Team
												</button>
											</div>
										</div>
										{godModeWarnings.length > 0 ? (
											<div className="alert alert-danger mb-0 mt-3">
												You cannot set {godModeWarnings.join(" or ")} unless you
												enable{" "}
												<a href={helpers.leagueUrl(["godMode"])}>God Mode</a>.
											</div>
										) : null}
									</div>
								</div>
							</div>
						);
					})}
					<div className="col-xl-4 col-lg-6 mb-3">
						<div className="card">
							<div className="card-body">
								<select
									className="form-select me-2"
									style={{ maxWidth: 300 }}
									value={addTeamAbbrev}
									onChange={event => {
										setAddTeamAbbrev(event.target.value);
									}}
								>
									<option value="">Blank Team</option>
									{builtInTeams
										.filter(t => !currentAbbrevs.includes(t.abbrev))
										.map(t => (
											<option key={t.abbrev} value={t.abbrev}>
												{t.region} {t.name}
												{t.tid !== undefined ? " (inactive)" : ""}
											</option>
										))}
								</select>
								<button
									type="button"
									className="btn btn-primary mt-2"
									onClick={addTeam}
								>
									Add Team
								</button>
							</div>
						</div>
					</div>
				</div>

				<h2>Settings</h2>
				<div className="d-sm-flex">
					<div className="me-sm-3">
						<label className="form-label" htmlFor="expansion-num-protected">
							Number of players each existing team can protect
						</label>
						<input
							id="expansion-num-protected"
							type="text"
							className="form-control"
							disabled={disableNumProtectedPlayersChange}
							onChange={async event => {
								await setNumProtectedPlayers(event.target.value);
							}}
							value={numProtectedPlayers}
							style={{ maxWidth: 100 }}
						/>
					</div>
					<div>
						<label className="form-label" htmlFor="expansion-num-per-team">
							Max number of players that can be drafted from each existing team
						</label>
						<input
							id="expansion-num-per-team"
							type="text"
							className="form-control"
							disabled={disableNumProtectedPlayersChange}
							onChange={async event => {
								await setNumPerTeam(event.target.value);
							}}
							value={numPerTeam}
							style={{ maxWidth: 100 }}
						/>
					</div>
				</div>
				{disableNumProtectedPlayersChange ? (
					<div className="form-text text-muted mt-2 mb-0">
						If you're taking control of a team, you can't change these settings
						unless you enable{" "}
						<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
					</div>
				) : null}

				<button
					type="submit"
					className="btn btn-primary mt-3"
					disabled={saving || teams.length === 0 || godModeWarning}
				>
					Advance To Player Protection
				</button>
			</form>
		</>
	);
};

export default ExpansionDraft;
