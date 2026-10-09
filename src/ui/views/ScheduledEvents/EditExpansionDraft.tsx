import { useRef, useState } from "react";
import {
	DEFAULT_JERSEY,
	DEFAULT_TEAM_COLORS,
} from "../../../common/constants.ts";
import getTeamInfos from "../../../common/getTeamInfos.ts";
import getUnusedAbbrevs from "../../../common/getUnusedAbbrevs.ts";
import type { ScheduledEventsTeam } from "../../../common/scheduledEvents.ts";
import type { ScheduledEvent } from "../../../common/types.ts";
import { last, orderBy } from "../../../common/utils.ts";
import { TeamsSplitNorthAmericaWorld } from "../../components/TeamsSplitNorthAmericaWorld.tsx";
import { helpers } from "../../util/helpers.ts";
import TeamForm from "../ManageTeams/TeamForm.tsx";
import { type EditProps, FormButtons } from "./common.tsx";

type ExpansionTeam = Extract<
	ScheduledEvent,
	{ type: "expansionDraft" }
>["info"]["teams"][number];

// Same format that TeamForm uses
type TeamFormValues = {
	abbrev: string;
	colors: [string, string, string];
	did: string;
	imgURL: string;
	imgURLSmall: string;
	jersey: string;
	name: string;
	pop: string;
	region: string;
	stadiumCapacity: string;
};

type FormTeam = {
	// Only used by React
	key: number;

	// Undefined for a new team that is not saved yet. Otherwise this is used to identify the team, either in `teams` (an inactive team that is coming back) or in other scheduled events (a new team from an existing event).
	tid: number | undefined;

	// When editing an existing event, this has any properties that are not in the form
	original: ExpansionTeam | undefined;

	values: TeamFormValues;
};

const BLANK_TEAM = "blank";
const INACTIVE_TEAM_PREFIX = "inactive-";
const BUILT_IN_TEAM_PREFIX = "builtIn-";

const EditExpansionDraft = ({
	confs,
	defaultStadiumCapacity,
	divs,
	event,
	onCancel,
	onSave,
	saving,
	setError,
	teams,
}: EditProps<"expansionDraft"> & {
	defaultStadiumCapacity: number;
}) => {
	const nextKey = useRef(0);
	const getKey = () => {
		const key = nextKey.current;
		nextKey.current += 1;
		return key;
	};

	const defaultDid = String(last(divs).did);

	const toValues = (
		t: Partial<Record<keyof TeamFormValues, unknown>>,
	): TeamFormValues => {
		return {
			abbrev: String(t.abbrev ?? ""),
			colors: (t.colors as TeamFormValues["colors"]) ?? DEFAULT_TEAM_COLORS,
			did: String(t.did ?? defaultDid),
			imgURL: String(t.imgURL ?? ""),
			imgURLSmall: String(t.imgURLSmall ?? ""),
			jersey: String(t.jersey ?? DEFAULT_JERSEY),
			name: String(t.name ?? ""),
			pop: String(t.pop ?? 1),
			region: String(t.region ?? ""),
			stadiumCapacity: String(t.stadiumCapacity ?? defaultStadiumCapacity),
		};
	};

	const [formTeams, setFormTeams] = useState<FormTeam[]>(() => {
		if (!event) {
			return [];
		}

		return event.info.teams.map((t) => {
			return {
				key: getKey(),
				tid: t.tid,
				original: t,
				values: toValues(t),
			};
		});
	});
	const [teamToAdd, setTeamToAdd] = useState(BLANK_TEAM);

	const formTids = new Set(formTeams.map((t) => t.tid));
	const formAbbrevs = new Set(formTeams.map((t) => t.values.abbrev));

	const inactiveTeams = orderBy(
		teams.filter((t) => !t.active && !formTids.has(t.tid)),
		["region", "name", "tid"],
	);

	const builtInTeams = orderBy(
		getTeamInfos(
			getUnusedAbbrevs(
				teams.map((t) => ({
					abbrev: t.abbrev ?? "",
					region: t.region ?? "",
					name: t.name ?? "",
				})),
			).map((abbrev) => ({
				tid: -1,
				cid: -1,
				did: -1,
				abbrev,
			})),
		).filter((t) => !formAbbrevs.has(t.abbrev)),
		["region", "name"],
	);

	const addTeam = () => {
		let newTeam: FormTeam | undefined;

		if (teamToAdd.startsWith(INACTIVE_TEAM_PREFIX)) {
			const tid = Number.parseInt(teamToAdd.replace(INACTIVE_TEAM_PREFIX, ""));
			const t = inactiveTeams.find((t) => t.tid === tid);
			if (t) {
				newTeam = {
					key: getKey(),
					tid,
					original: undefined,
					values: toValues(t),
				};
			}
		} else if (teamToAdd.startsWith(BUILT_IN_TEAM_PREFIX)) {
			const abbrev = teamToAdd.replace(BUILT_IN_TEAM_PREFIX, "");
			const t = builtInTeams.find((t) => t.abbrev === abbrev);
			if (t) {
				newTeam = {
					key: getKey(),
					tid: undefined,
					original: undefined,
					values: toValues({
						...t,

						// did in builtInTeams is a placeholder
						did: undefined,
					}),
				};
			}
		} else {
			newTeam = {
				key: getKey(),
				tid: undefined,
				original: undefined,
				values: toValues({}),
			};
		}

		if (newTeam) {
			setFormTeams((prev) => [...prev, newTeam]);
		}
		setTeamToAdd(BLANK_TEAM);
	};

	const handleInputChange =
		(key: number) => (field: string, event: { target: { value: string } }) => {
			const value = event.target.value;

			setFormTeams((prev) =>
				prev.map((t) => {
					if (t.key !== key) {
						return t;
					}

					const values = { ...t.values };
					if (field.startsWith("colors")) {
						const i = Number.parseInt(field.replace("colors", ""));
						const colors: TeamFormValues["colors"] = [...values.colors];
						colors[i] = value;
						values.colors = colors;
					} else {
						(values as any)[field] = value;
					}

					return {
						...t,
						values,
					};
				}),
			);
		};

	const save = () => {
		if (formTeams.length === 0) {
			setError("Add at least one team.");
			return;
		}

		const outputTeams = [];
		for (const { tid, original, values } of formTeams) {
			for (const key of ["region", "name", "abbrev"] as const) {
				if (values[key].trim() === "") {
					setError(`${helpers.upperCaseFirstLetter(key)} cannot be blank.`);
					return;
				}
			}

			const pop = helpers.localeParseFloat(values.pop);
			if (Number.isNaN(pop) || pop < 0) {
				setError(`Invalid population for ${values.abbrev}.`);
				return;
			}

			const stadiumCapacity = Number.parseInt(values.stadiumCapacity);
			if (Number.isNaN(stadiumCapacity) || stadiumCapacity < 0) {
				setError(`Invalid stadium capacity for ${values.abbrev}.`);
				return;
			}

			const t = {
				takeControl: false,
				...original,
				...values,
				imgURL: values.imgURL === "" ? undefined : values.imgURL,

				// For a new team, the tid is assigned when the event is saved, since it depends on the other scheduled events
				tid: tid as number,
			};
			if (values.imgURLSmall === "") {
				delete (t as { imgURLSmall?: string }).imgURLSmall;
			}

			outputTeams.push(t);
		}

		const info: Parameters<typeof onSave>[0] = {
			teams: outputTeams,
		};

		// Not editable here, but keep it if it's already set on an existing event
		if (event?.info.numProtectedPlayers !== undefined) {
			info.numProtectedPlayers = event.info.numProtectedPlayers;
		}

		onSave(info);
	};

	const getTeamLabel = (t: FormTeam) => {
		// If this team exists before this event, then it's an inactive team coming back. Otherwise, it's a new team.
		const existingTeam: ScheduledEventsTeam | undefined = teams.find(
			(t2) => t2.tid === t.tid,
		);
		if (!existingTeam) {
			return "New team";
		}

		if (existingTeam.active) {
			return (
				<span className="text-danger">
					This team will already be active at this time
				</span>
			);
		}

		return "Inactive team coming back";
	};

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				save();
			}}
		>
			<div className="row">
				{formTeams.map((t) => (
					<div key={t.key} className="col-lg-6 mb-3">
						<div className="card">
							<div className="card-body">
								<div className="d-flex align-items-center mb-3">
									<b>{getTeamLabel(t)}</b>
									<button
										type="button"
										className="btn btn-danger btn-sm ms-auto"
										onClick={() => {
											setFormTeams((prev) =>
												prev.filter((t2) => t2.key !== t.key),
											);
										}}
									>
										Remove Team
									</button>
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
										handleInputChange={handleInputChange(t.key)}
										hideStatus
										t={t.values}
									/>
								</div>
							</div>
						</div>
					</div>
				))}
				<div className="col-lg-6 mb-3">
					<div className="card">
						<div className="card-body">
							<select
								className="form-select"
								value={teamToAdd}
								onChange={(event) => {
									setTeamToAdd(event.target.value);
								}}
							>
								<option value={BLANK_TEAM}>Blank Team</option>
								{inactiveTeams.length > 0 ? (
									<optgroup label="Inactive teams">
										{inactiveTeams.map((t) => (
											<option
												key={t.tid}
												value={`${INACTIVE_TEAM_PREFIX}${t.tid}`}
											>
												{t.region} {t.name}
											</option>
										))}
									</optgroup>
								) : null}
								<TeamsSplitNorthAmericaWorld
									teams={builtInTeams}
									option={(t) => (
										<option
											key={t.abbrev}
											value={`${BUILT_IN_TEAM_PREFIX}${t.abbrev}`}
										>
											{t.region} {t.name}
										</option>
									)}
								/>
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

			<FormButtons onCancel={onCancel} saving={saving} />
		</form>
	);
};

export default EditExpansionDraft;
