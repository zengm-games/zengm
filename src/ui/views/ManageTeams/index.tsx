import { Fragment, useReducer, type FormEvent } from "react";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers, logEvent, toWorker } from "../../util";
import AddRemove from "./AddRemove";
import type { View } from "../../../common/types";
import { PHASE } from "../../../common";
import TeamForm from "./TeamForm";
import { groupBy } from "../../../common/groupBy";

const nextSeasonWarning =
	"Because the regular season is already over, changes will not be fully applied until next season.";

type State = {
	saving: boolean;
	teams: View<"manageTeams">["teams"];
};

export type Action =
	| {
			type: "startSaving";
	  }
	| {
			type: "doneSaving";
	  }
	| {
			type: "updateTeam";
			tid: number;
			field: string;
			value: string;
	  }
	| {
			type: "addTeam";
			team: State["teams"][number];
	  };

const reducer = (state: State, action: Action) => {
	switch (action.type) {
		case "startSaving":
			return {
				...state,
				saving: true,
			};
		case "doneSaving":
			return {
				...state,
				saving: false,
			};
		case "updateTeam": {
			const newTeams = state.teams.slice();
			const t = newTeams.find(t => t.tid === action.tid);
			if (!t) {
				throw new Error(`No team found with tid ${action.tid}`);
			}

			if (action.field.startsWith("colors")) {
				// @ts-expect-error
				t.colors[action.field.replace("colors", "")] = action.value;
			} else if (action.field === "did") {
				t[action.field] = parseInt(action.value);
			} else if (action.field === "disabled") {
				t[action.field] = action.value === "1";
			} else {
				// @ts-expect-error
				t[action.field] = action.value;
			}
			return {
				...state,
				teams: newTeams,
			};
		}
		case "addTeam":
			return {
				...state,
				teams: [...state.teams, action.team],
			};
	}
};

const getUniqueAbbrevsErrorMessage = (teams: { abbrev: string }[]) => {
	const grouped = groupBy(teams, "abbrev");

	const duplicateInfos = [];

	for (const [abbrev, teams] of Object.entries(grouped)) {
		const count = teams.length;
		if (count > 1) {
			duplicateInfos.push({
				abbrev,
				count,
			});
		}
	}

	if (duplicateInfos.length === 0) {
		return;
	}

	if (duplicateInfos.length === 1) {
		const { abbrev, count } = duplicateInfos[0];
		return (
			<>
				{count} teams have the same abbrev <b>{abbrev}</b> which can cause
				problems in the UI.
			</>
		);
	}

	return (
		<>
			Some teams have the same abbrev (
			{duplicateInfos.map(({ abbrev, count }, i) => (
				<Fragment key={abbrev}>
					{i > 0 ? ", " : null}
					<b>{abbrev}:</b> {count}
				</Fragment>
			))}
			) which can cause problems in the UI.
		</>
	);
};

const ManageTeams = (props: View<"manageTeams">) => {
	const [state, dispatch] = useReducer(reducer, {
		saving: false,
		teams: props.teams,
	});

	const handleInputChange =
		(tid: number) => (field: string, event: { target: { value: string } }) => {
			const value = event.target.value;

			dispatch({ type: "updateTeam", tid, field, value });
		};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		dispatch({ type: "startSaving" });

		try {
			await toWorker("main", "updateTeamInfo", state.teams);

			let text = "Saved team info.";

			if (props.phase >= PHASE.PLAYOFFS) {
				text += `<br /><br />${nextSeasonWarning}`;
			}

			logEvent({
				type: "success",
				text,
				saveToDb: false,
			});
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
		}

		dispatch({ type: "doneSaving" });
	};

	useTitleBar({ title: "Manage Teams" });

	if (props.autoRelocate) {
		return (
			<p>
				You cannot edit teams while a{" "}
				<a href={helpers.leagueUrl(["relocate"])}>team relocation vote</a> is
				pending.
			</p>
		);
	}

	const disableStatus =
		!props.godMode ||
		![
			PHASE.PRESEASON,
			PHASE.DRAFT_LOTTERY,
			PHASE.AFTER_DRAFT,
			PHASE.RESIGN_PLAYERS,
			PHASE.FREE_AGENCY,
		].includes(props.phase);

	const { saving, teams } = state;

	const uniqueAbbrevsErrorMessage = getUniqueAbbrevsErrorMessage(teams);

	return (
		<>
			{!props.godMode ? (
				<div>
					<span className="alert alert-warning d-inline-block">
						Enable <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a> to
						access additional features, such as creating new teams and
						activating/inactivating existing teams.
					</span>
				</div>
			) : null}

			{props.godMode ? (
				<>
					<AddRemove dispatch={dispatch} phase={props.phase} saving={saving} />
					<h2 className="mt-sm-3">Edit Teams</h2>
				</>
			) : null}

			{props.phase >= PHASE.PLAYOFFS ? (
				<div>
					<span className="alert alert-warning d-inline-block">
						{nextSeasonWarning}
					</span>
				</div>
			) : null}

			<div className="row gx-2 d-none d-lg-flex fw-bold mb-2">
				<div className="col-lg-2">
					<br />
					Region
				</div>
				<div className="col-lg-1">
					<br />
					Name
				</div>
				<div className="col-lg-1">
					<br />
					Abbrev
				</div>
				<div className="col-lg-1">
					<br />
					Division
				</div>
				<div className="col-lg-1">
					Population
					<br />
					(millions)
				</div>
				<div className="col-lg-1">
					Stadium
					<br />
					Capacity
				</div>
				<div className="col-lg-1">
					<br />
					Logo URL
				</div>
				<div className="col-lg-1">
					<br />
					Small Logo
				</div>
				<div className="col-lg-2">
					<br />
					Jersey
				</div>
				<div className="col-lg-1">
					<br />
					Status
				</div>
			</div>

			<form onSubmit={handleSubmit}>
				<div className="row gx-2">
					{teams.map(t => (
						<Fragment key={t.tid}>
							<TeamForm
								classNamesCol={[
									"col-6 col-lg-2",
									"col-6 col-lg-1",
									"col-6 col-lg-1",
									"col-6 col-lg-1",
									"col-6 col-lg-1",
									"col-6 col-lg-1",
									"col-6 col-lg-1",
									"col-6 col-lg-1",
									"col-6 col-lg-2",
									"col-6 col-lg-1",
									"d-none",
								]}
								classNameLabel="d-lg-none"
								confs={props.confs}
								divs={props.divs}
								handleInputChange={handleInputChange(t.tid)}
								disablePop={!props.godMode}
								disableStatus={disableStatus}
								disableStadiumCapacity={!props.godMode}
								moveButton
								t={t}
							/>
							<div className="col-12 d-lg-none" style={{ marginTop: -12 }}>
								<hr />
							</div>
						</Fragment>
					))}
				</div>
				<div className="text-center">
					{uniqueAbbrevsErrorMessage ? (
						<div className="alert alert-danger d-inline-block">
							<b>Warning:</b> {uniqueAbbrevsErrorMessage}
						</div>
					) : null}
					<div>
						<button type="submit" className="btn btn-primary" disabled={saving}>
							Update Team Info
						</button>
					</div>
				</div>
			</form>
		</>
	);
};

export default ManageTeams;
