import React, {
	useState,
	ChangeEvent,
	FormEvent,
	MouseEvent,
	useEffect,
} from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker, logEvent, realtimeUpdate } from "../util";
import type { View } from "../../common/types";
import { PHASE } from "../../common";
import TeamForm from "./ManageTeams/TeamForm";

type Team = Omit<View<"manageTeams">["teams"][number], "tid"> & {
	takeControl: boolean;
};

const ExpansionDraft = ({
	confs,
	divs,
	minRosterSize,
	multiTeamMode,
	phase,
}: View<"expansionDraft">) => {
	const defaultTeam: Team = {
		abbrev: "AAA",
		region: "Aaa",
		name: "Aaa",
		imgURL: "",
		colors: ["#000000", "#cccccc", "#ffffff"],
		pop: 1,
		stadiumCapacity: 25000,
		did: divs[divs.length - 1].did,
		takeControl: false,
	};

	const [saving, setSaving] = useState(false);
	const [teams, setTeams] = useState<Team[]>([helpers.deepCopy(defaultTeam)]);
	const [numProtectedPlayers, setNumProtectedPlayers] = useState(
		String(minRosterSize - 1),
	);

	useTitleBar({ title: "Expansion Draft" });

	useEffect(() => {
		setNumProtectedPlayers(String(minRosterSize - teams.length));
	}, [minRosterSize, teams]);

	if (phase !== PHASE.DRAFT_LOTTERY) {
		return (
			<p>
				You can only do an expansion draft after the playoffs end but before the
				draft starts.
			</p>
		);
	}

	const handleInputChange = (i: number) => (
		field: string,
		event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const value = event.target.value;

		const t = {
			...teams[i],
			[field]: value,
		};
		const newTeams = [...teams];
		newTeams[i] = t;
		setTeams(newTeams);
	};

	const deleteTeam = (i: number) => (event: MouseEvent) => {
		event.preventDefault();

		setTeams(teams.filter((t, j) => j !== i));
	};

	const addTeam = (event: MouseEvent) => {
		event.preventDefault();

		setTeams([...teams, helpers.deepCopy(defaultTeam)]);
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
			numProtectedPlayers,
			teams,
		);

		if (errors) {
			logEvent({
				type: "error",
				text: `- ${errors.join("<br>- ")}`,
				saveToDb: false,
			});
			setSaving(false);
		} else {
			realtimeUpdate([], helpers.leagueUrl(["protect_players"]));
		}
	};

	const handleTakeControl = (i: number) => (
		event: ChangeEvent<HTMLInputElement>,
	) => {
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

		setTeams(newTeams);
	};

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
						return (
							<div key={i} className="col-xl-4 col-lg-6 mb-3">
								<div className="card">
									<div className="card-body row">
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
											]}
											confs={confs}
											divs={divs}
											handleInputChange={handleInputChange(i)}
											t={t}
										/>
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
										<div className="col-6 text-right">
											<button
												type="button"
												className="btn btn-danger"
												onClick={deleteTeam(i)}
											>
												Remove Team
											</button>
										</div>
									</div>
								</div>
							</div>
						);
					})}
					<div className="col-xl-4 col-lg-6 mb-3">
						<div className="card">
							<div className="card-body">
								<button
									type="button"
									className="btn btn-secondary"
									onClick={addTeam}
								>
									Add Team
								</button>
							</div>
						</div>
					</div>
				</div>

				<h2>Settings</h2>
				<div className="form-group">
					<label htmlFor="expansion-num-protected">
						Number of players each existing team can protect
					</label>
					<input
						id="expansion-num-protected"
						type="text"
						className="form-control"
						onChange={event => {
							setNumProtectedPlayers(event.target.value);
						}}
						value={numProtectedPlayers}
						style={{ maxWidth: 100 }}
					/>
				</div>

				<button
					type="submit"
					className="btn btn-primary"
					disabled={saving || teams.length === 0}
				>
					Advance To Player Protection
				</button>
			</form>
		</>
	);
};

export default ExpansionDraft;
