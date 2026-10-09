import { useState } from "react";
import type { ScheduledEventTeamInfo } from "../../../common/types.ts";
import { last, orderBy } from "../../../common/utils.ts";
import { helpers } from "../../util/helpers.ts";
import TeamForm, {
	type TeamFormToggleField,
} from "../ManageTeams/TeamForm.tsx";
import { type EditProps, FormButtons, formatTeamOption } from "./common.tsx";
import {
	getTeamFormValues,
	setTeamFormValue,
	type TeamFormValues,
} from "./teamFormValues.ts";

const KEYS = [
	"region",
	"name",
	"abbrev",
	"did",
	"pop",
	"stadiumCapacity",
	"imgURL",
	"imgURLSmall",
	"colors",
	"jersey",
] satisfies TeamFormToggleField[];

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

	// Only the fields that are checked are here, and those are the fields changed by the event. The rest come from the team.
	const [changes, setChanges] = useState<Partial<TeamFormValues>>(() => {
		const changes: Partial<TeamFormValues> = {};
		if (event) {
			const eventValues = getTeamFormValues(event.info, {
				did: "",
				stadiumCapacity: defaultStadiumCapacity,
			});
			for (const key of KEYS) {
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

	const enabledKeys = KEYS.filter((key) => changes[key] !== undefined);

	const save = () => {
		if (!selectedTeam || !after) {
			return;
		}

		if (enabledKeys.length === 0) {
			setError("Select at least one thing to change.");
			return;
		}

		const info: ScheduledEventTeamInfo["info"] = {
			tid: selectedTeam.tid,
		};

		if (event?.info.srID !== undefined && event.info.tid === selectedTeam.tid) {
			info.srID = event.info.srID;
		}

		for (const key of enabledKeys) {
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
					<div className="row mt-3">
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
							fieldToggles={{
								enabled: new Set(enabledKeys),
								onToggle: (key) => {
									// In case the error was about nothing being selected
									setError(undefined);

									setChanges((prev) => {
										if (prev[key] !== undefined) {
											const { [key]: _removed, ...rest } = prev;
											return rest;
										}

										// Start with the value the team has before this event
										return {
											...prev,
											[key]: before?.[key],
										};
									});
								},
							}}
							handleInputChange={(field, event) => {
								// In case the error was about nothing being selected
								setError(undefined);

								setChanges((prev) => {
									if (!before) {
										return prev;
									}

									// Apply to the full team, since changing one color requires the other two. This also selects the field if it was not selected already, which happens when moving a team.
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
										[key]: newValues[key as keyof TeamFormValues],
									};
								});
							}}
							hideStatus
							moveButton
							t={after}
						/>
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
