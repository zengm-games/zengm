import React, { useState, ChangeEvent, FormEvent, MouseEvent } from "react";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers } from "../../util";
import type { View } from "../../../common/types";
import { PHASE } from "../../../common";
import TeamForm from "../ManageTeams/TeamForm";

type Team = Omit<View<"manageTeams">["teams"][number], "tid">;

const ExpansionDraft = ({ confs, divs, phase }: View<"expansionDraft">) => {
	const defaultTeam: Team = {
		abbrev: "AAA",
		region: "Aaa",
		name: "Aaa",
		imgURL: "",
		colors: ["#000000", "#cccccc", "#ffffff"],
		pop: 1,
		stadiumCapacity: 25000,
		did: divs[divs.length - 1].did,
	};

	const [saving, setSaving] = useState(false);
	const [teams, setTeams] = useState<Team[]>([helpers.deepCopy(defaultTeam)]);

	useTitleBar({ title: "Expansion Draft" });

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
		setSaving(true);
	};

	return (
		<>
			<p>
				In an expansion draft, new teams are added to the league. Rather than
				starting with no players, they draft players from existing teams.
				However the list of players available to be drafted is limited, each
				existing team has a chance to protect some of their players.
			</p>

			<p>First, specify the expansion teams.</p>

			<form onSubmit={handleSubmit}>
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
										<div className="col-12">
											<button
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
								<button className="btn btn-secondary" onClick={addTeam}>
									Add Team
								</button>
							</div>
						</div>
					</div>
				</div>
				<div className="text-center">
					<button
						type="submit"
						className="btn btn-primary"
						disabled={saving || teams.length === 0}
					>
						Advance To Player Protection
					</button>
				</div>
			</form>
		</>
	);
};

export default ExpansionDraft;
