import isEqual from "fast-deep-equal";
import { useReducer, useState } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers, logEvent, toWorker, useLocalPartial } from "../util/index.ts";
import type { Conf, Div, NonEmptyArray, View } from "../../common/types.ts";
import {
	DEFAULT_JERSEY,
	DEFAULT_TEAM_COLORS,
	PHASE,
} from "../../common/index.ts";
import {
	Conferences,
	getAbbrevsUsedMultipleTimes,
	makeReducer,
} from "./NewLeague/CustomizeTeams.tsx";
import StickyBottomButtons from "../components/StickyBottomButtons.tsx";
import type { NewLeagueTeamWithoutRank } from "./NewLeague/types.ts";
import { Modal } from "react-bootstrap";
import TeamForm from "./ManageTeams/TeamForm.tsx";
import {
	nextSeasonWarning,
	PHASES_WHERE_TEAMS_CAN_BE_DISABLED,
} from "./ManageTeams/index.tsx";

const EditTeamModal = ({
	t,
	confs,
	divs,
	onCancel,
	onSave,
}: {
	t: NewLeagueTeamWithoutRank | undefined;
	confs: NonEmptyArray<Conf>;
	divs: NonEmptyArray<Div>;
	onCancel: () => void;
	onSave: (t: NewLeagueTeamWithoutRank) => void;
}) => {
	const { godMode, phase } = useLocalPartial(["godMode", "phase"]);

	const [controlledTeam, setControlledTeam] = useState<
		| {
				tid: number;
				region: string;
				name: string;
				abbrev: string;
				pop: string;
				stadiumCapacity: string;
				colors: [string, string, string];
				jersey: string;
				did: string;
				imgURL: string;
				imgURLSmall: string;
		  }
		| undefined
	>();

	if (t && (!controlledTeam || controlledTeam.tid !== t.tid)) {
		setControlledTeam({
			...t,
			pop: String(t.pop),
			stadiumCapacity: String(t.stadiumCapacity),
			colors: t.colors ?? DEFAULT_TEAM_COLORS,
			jersey: t.jersey ?? DEFAULT_JERSEY,
			did: String(t.did),
			imgURL: t.imgURL ?? "",
			imgURLSmall: t.imgURLSmall ?? "",
		});
	}

	// See comments in ColorPicker explaining why this is needed
	const enforceFocus = false;

	if (!controlledTeam || !t) {
		return null;
	}

	const disableStatus =
		!godMode || !PHASES_WHERE_TEAMS_CAN_BE_DISABLED.includes(phase);

	const save = () => {
		const did = Number.parseInt(controlledTeam.did);
		const div = divs.find((div) => div.did === did);
		if (!div) {
			throw new Error("Invalid div");
		}

		onSave({
			tid: controlledTeam.tid,
			region: controlledTeam.region,
			name: controlledTeam.name,
			abbrev: controlledTeam.abbrev,
			pop: helpers.localeParseFloat(controlledTeam.pop),
			stadiumCapacity: Number.parseInt(controlledTeam.stadiumCapacity),
			colors: controlledTeam.colors,
			jersey: controlledTeam.jersey,
			did,
			cid: div.cid,
			imgURL: controlledTeam.imgURL,
			imgURLSmall:
				controlledTeam.imgURLSmall === ""
					? undefined
					: controlledTeam.imgURLSmall,
		});
	};

	return (
		<Modal size="lg" show={!!t} onHide={onCancel} enforceFocus={enforceFocus}>
			<Modal.Header closeButton>
				<Modal.Title>Edit team</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						save();
					}}
				>
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
								"d-none",
							]}
							confs={confs}
							divs={divs}
							handleInputChange={(field, event) => {
								if (field.startsWith("colors")) {
									const ind = Number.parseInt(field.replace("colors", ""));
									if (ind >= 0 && ind <= 2) {
										const colors = [...controlledTeam.colors] as [
											string,
											string,
											string,
										];
										colors[ind] = event.target.value;
										setControlledTeam({
											...controlledTeam,
											colors,
										});
									}
								} else {
									setControlledTeam({
										...controlledTeam,
										[field]: event.target.value,
									});
								}
							}}
							disablePop={!godMode}
							disableStatus={disableStatus}
							disableStadiumCapacity={!godMode}
							t={controlledTeam}
						/>
					</div>
					<button className="d-none" type="submit" />
				</form>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={onCancel}>
					Cancel
				</button>
				<button
					className="btn btn-primary"
					onClick={save}
					disabled={!controlledTeam}
				>
					Save team
				</button>
			</Modal.Footer>
		</Modal>
	);
};

const ManageConfs = ({
	actualPhase,
	autoRelocate,
	initialConfs,
	initialDivs,
	initialTeams,
}: View<"manageConfs">) => {
	const [{ confs, divs, teams }, dispatch] = useReducer(makeReducer(false), {
		confs: [...initialConfs],
		divs: [...initialDivs],
		teams: [...initialTeams],
	});
	const [saving, setSaving] = useState(false);

	const [editTeam, setEditTeam] = useState<
		NewLeagueTeamWithoutRank | undefined
	>();

	useTitleBar({ title: "Manage Conferences" });

	if (autoRelocate) {
		return (
			<p>
				You cannot edit conferences/divisions while a{" "}
				<a href={helpers.leagueUrl(["auto_relocate"])}>team relocation vote</a>{" "}
				is pending.
			</p>
		);
	}

	const abbrevsUsedMultipleTimes = getAbbrevsUsedMultipleTimes(teams);

	return (
		<>
			{actualPhase >= PHASE.PLAYOFFS ? (
				<p className="alert alert-warning d-inline-block">
					{nextSeasonWarning}
				</p>
			) : null}

			<Conferences
				confs={confs}
				divs={divs}
				teams={teams}
				dispatch={dispatch}
				allowDeleteTeams={false}
				addTeam={undefined}
				editTeam={(tid) => {
					setEditTeam(teams.find((t) => t.tid === tid));
				}}
				abbrevsUsedMultipleTimes={abbrevsUsedMultipleTimes}
			/>

			<StickyBottomButtons>
				<form
					className="btn-group ms-auto"
					onSubmit={async (event) => {
						event.preventDefault();

						if (abbrevsUsedMultipleTimes.length > 0) {
							logEvent({
								type: "error",
								text: `You cannot use the same abbrev for multiple teams: ${abbrevsUsedMultipleTimes.join(
									", ",
								)}`,
								saveToDb: false,
							});
							return;
						}

						// Check to make sure that somehow we didn't accidentally reassign a tid
						const initialRegions = initialTeams.map((t) => t.region);
						const regions = teams.map((t) => t.region);
						if (!isEqual(initialRegions, regions)) {
							throw new Error("tids may not be constant");
						}

						setSaving(true);

						await toWorker("main", "updateConfsDivs", {
							confs,
							divs,
							teams,
						});

						let text = "Saved conferences and divisions.";

						if (actualPhase >= PHASE.PLAYOFFS) {
							text += `<br /><br />${nextSeasonWarning}`;
						}

						logEvent({
							type: "success",
							text,
							saveToDb: false,
						});

						setSaving(false);
					}}
				>
					<button
						className="btn btn-primary me-2"
						type="submit"
						disabled={saving || confs.length === 0 || divs.length === 0}
					>
						Save conferences
					</button>
				</form>
			</StickyBottomButtons>

			<EditTeamModal
				key={editTeam?.tid}
				t={editTeam}
				// Can never actually get down to 0 confs/divs through ManageConfs, but the reducer function is shared with CustomizeTeams where you can!
				confs={confs as NonEmptyArray<Conf>}
				divs={divs as NonEmptyArray<Div>}
				onSave={(t) => {
					dispatch({ type: "editTeam", t });
					setEditTeam(undefined);
				}}
				onCancel={() => {
					setEditTeam(undefined);
				}}
			/>
		</>
	);
};

export default ManageConfs;
