import { useState } from "react";
import type { ScheduledEventTeamInfo } from "../../../common/types.ts";
import { last, orderBy } from "../../../common/utils.ts";
import { helpers } from "../../util/helpers.ts";
import TeamForm from "../ManageTeams/TeamForm.tsx";
import { type EditProps, FormButtons, formatTeamOption } from "./common.tsx";
import {
	getTeamFormValues,
	setTeamFormValue,
	type TeamFormValues,
} from "./teamFormValues.ts";

type Key = keyof TeamFormValues;

const FIELDS: {
	key: Key;
	label: string;
}[] = [
	{ key: "region", label: "Region" },
	{ key: "name", label: "Name" },
	{ key: "abbrev", label: "Abbrev" },
	{ key: "did", label: "Division" },
	{ key: "pop", label: "Population" },
	{ key: "stadiumCapacity", label: "Stadium Capacity" },
	{ key: "imgURL", label: "Logo URL" },
	{ key: "imgURLSmall", label: "Small Logo" },
	{ key: "colors", label: "Colors" },
	{ key: "jersey", label: "Jersey" },
];

const isSameValue = (a: TeamFormValues[Key], b: TeamFormValues[Key]) => {
	// Colors
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.every((color, i) => color === b[i]);
	}

	return a === b;
};

const EditTeamInfo = ({
	confs,
	defaultStadiumCapacity,
	divs,
	event,
	onCancel,
	onSave,
	saving,
	setError,
	teams,
}: EditProps<"teamInfo"> & {
	defaultStadiumCapacity: number;
}) => {
	const [tid, setTid] = useState(event?.info.tid);

	// Only the fields changed by the event are here. The rest come from the team.
	const [changes, setChanges] = useState<Partial<TeamFormValues>>(() => {
		const changes: Partial<TeamFormValues> = {};
		if (event) {
			const eventValues = getTeamFormValues(event.info, {
				did: "",
				stadiumCapacity: defaultStadiumCapacity,
			});
			for (const { key } of FIELDS) {
				if (event.info[key] !== undefined) {
					(changes as any)[key] = eventValues[key];
				}
			}
		}
		return changes;
	});

	const teamsSorted = orderBy(teams, ["region", "name", "tid"]);

	// Selected team may not exist anymore, if the season/phase changed
	const selectedTeam = teamsSorted.find((t) => t.tid === tid);

	// The team right before this event happens
	const before = selectedTeam
		? getTeamFormValues(selectedTeam, {
				did: String(last(divs).did),
				stadiumCapacity: defaultStadiumCapacity,
			})
		: undefined;

	// The team right after this event happens
	const after = before
		? {
				...before,
				...changes,
			}
		: undefined;

	const changedFields =
		before && after
			? FIELDS.filter(({ key }) => !isSameValue(before[key], after[key]))
			: [];

	const save = () => {
		if (!selectedTeam || !after) {
			return;
		}

		if (changedFields.length === 0) {
			setError("Change at least one thing about this team.");
			return;
		}

		const info: ScheduledEventTeamInfo["info"] = {
			tid: selectedTeam.tid,
		};

		if (event?.info.srID !== undefined && event.info.tid === selectedTeam.tid) {
			info.srID = event.info.srID;
		}

		for (const { key } of changedFields) {
			if (key === "region" || key === "name" || key === "abbrev") {
				if (after[key].trim() === "") {
					setError(`${helpers.upperCaseFirstLetter(key)} cannot be blank.`);
					return;
				}
				info[key] = after[key];
			} else if (key === "did") {
				info.did = Number.parseInt(after.did);
				if (Number.isNaN(info.did)) {
					setError("Invalid division.");
					return;
				}
			} else if (key === "pop") {
				info.pop = helpers.localeParseFloat(after.pop);
				if (Number.isNaN(info.pop) || info.pop < 0) {
					setError("Invalid population.");
					return;
				}
			} else if (key === "stadiumCapacity") {
				info.stadiumCapacity = Number.parseInt(after.stadiumCapacity);
				if (Number.isNaN(info.stadiumCapacity) || info.stadiumCapacity < 0) {
					setError("Invalid stadium capacity.");
					return;
				}
			} else if (key === "colors") {
				info.colors = after.colors;
			} else {
				info[key] = after[key];
			}
		}

		onSave(info);
	};

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				save();
			}}
		>
			<label className="form-label" htmlFor="scheduled-event-tid">
				Team
			</label>
			<select
				id="scheduled-event-tid"
				className="form-select"
				style={{ maxWidth: 400 }}
				value={selectedTeam?.tid ?? ""}
				onChange={(event) => {
					setTid(Number.parseInt(event.target.value));

					// Changes are for a specific team
					setChanges({});
				}}
			>
				<option value="" disabled>
					Select a team
				</option>
				{teamsSorted.map((t) => (
					<option key={t.tid} value={t.tid}>
						{formatTeamOption(t)}
					</option>
				))}
			</select>

			{after ? (
				<>
					<div className="form-text mb-3">
						Edit the team to how it should be after this event. Only the things
						you change are saved in the event.
					</div>
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
								// In case the error was about nothing being changed
								setError(undefined);

								setChanges((prev) => {
									if (!before) {
										return prev;
									}

									// Apply to the full team, since changing one color requires the other two
									const newValues = setTeamFormValue(
										{
											...before,
											...prev,
										},
										field,
										event.target.value,
									);

									const key = field.startsWith("colors") ? "colors" : field;
									return {
										...prev,
										[key]: newValues[key as Key],
									};
								});
							}}
							hideStatus
							moveButton
							t={after}
						/>
					</div>
					<div>
						{changedFields.length > 0 ? (
							<>
								This event changes:{" "}
								{changedFields.map((field) => field.label).join(", ")}
							</>
						) : (
							<span className="text-body-secondary">
								Nothing is changed yet.
							</span>
						)}
					</div>
				</>
			) : null}
			<FormButtons
				disabled={!selectedTeam}
				onCancel={onCancel}
				saving={saving}
			/>
		</form>
	);
};

export default EditTeamInfo;
