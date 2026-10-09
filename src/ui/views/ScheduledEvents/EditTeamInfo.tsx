import { useState } from "react";
import {
	DEFAULT_JERSEY,
	DEFAULT_TEAM_COLORS,
	JERSEYS,
} from "../../../common/constants.ts";
import type { ScheduledEventsTeam } from "../../../common/scheduledEvents.ts";
import type { ScheduledEventTeamInfo } from "../../../common/types.ts";
import { orderBy } from "../../../common/utils.ts";
import { ColorPicker } from "../../components/ColorPicker/index.tsx";
import { helpers } from "../../util/helpers.ts";
import { type EditProps, FormButtons, formatTeamOption } from "./common.tsx";

// Only fields that are in `values` are changed by the event
type Values = {
	abbrev?: string;
	colors?: [string, string, string];
	did?: string;
	imgURL?: string;
	imgURLSmall?: string;
	jersey?: string;
	name?: string;
	pop?: string;
	region?: string;
	stadiumCapacity?: string;
};

type Key = keyof Values;

const FIELDS: {
	key: Key;
	label: string;
}[] = [
	{ key: "region", label: "Region" },
	{ key: "name", label: "Name" },
	{ key: "abbrev", label: "Abbrev" },
	{ key: "did", label: "Division" },
	{ key: "pop", label: "Population (millions)" },
	{ key: "stadiumCapacity", label: "Stadium Capacity" },
	{ key: "imgURL", label: "Logo URL" },
	{ key: "imgURLSmall", label: "Small Logo URL" },
	{ key: "colors", label: "Colors" },
	{ key: "jersey", label: "Jersey" },
];

// Same height as the other inputs
const COLORS_HEIGHT = 33;

// Convert from the format in the event or team object to the format used in the form
const getValue = <K extends Key>(
	key: K,
	object: Pick<ScheduledEventsTeam, K>,
): Values[Key] => {
	const value = object[key];

	if (key === "colors") {
		return (value as Values["colors"]) ?? DEFAULT_TEAM_COLORS;
	}

	if (key === "jersey") {
		return (value as string | undefined) ?? DEFAULT_JERSEY;
	}

	return value === undefined ? "" : String(value);
};

const getInitialValues = (info: ScheduledEventTeamInfo["info"] | undefined) => {
	const values: Values = {};
	if (info) {
		for (const { key } of FIELDS) {
			if (info[key] !== undefined) {
				(values as any)[key] = getValue(key, info);
			}
		}
	}
	return values;
};

const EditTeamInfo = ({
	confs,
	divs,
	event,
	onCancel,
	onSave,
	saving,
	setError,
	teams,
}: EditProps<"teamInfo">) => {
	const [tid, setTid] = useState(event?.info.tid);
	const [values, setValues] = useState(() => getInitialValues(event?.info));

	const teamsSorted = orderBy(teams, ["region", "name", "tid"]);

	// Selected team may not exist anymore, if the season/phase changed
	const selectedTeam = teamsSorted.find((t) => t.tid === tid);

	const setValue = <K extends Key>(key: K, value: Values[K]) => {
		setValues((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const toggleField = (key: Key) => {
		setValues((prev) => {
			if (prev[key] !== undefined) {
				const { [key]: _removed, ...rest } = prev;
				return rest;
			}

			// Start with the current value for this team
			return {
				...prev,
				[key]: getValue(key, selectedTeam ?? {}),
			};
		});
	};

	const save = () => {
		if (!selectedTeam) {
			return;
		}

		const info: ScheduledEventTeamInfo["info"] = {
			tid: selectedTeam.tid,
		};

		if (event?.info.srID !== undefined && event.info.tid === selectedTeam.tid) {
			info.srID = event.info.srID;
		}

		for (const key of ["region", "name", "abbrev"] as const) {
			const value = values[key];
			if (value !== undefined) {
				if (value.trim() === "") {
					setError(`${helpers.upperCaseFirstLetter(key)} cannot be blank.`);
					return;
				}
				info[key] = value;
			}
		}

		if (values.did !== undefined) {
			info.did = Number.parseInt(values.did);
			if (Number.isNaN(info.did)) {
				setError("Invalid division.");
				return;
			}
		}

		if (values.pop !== undefined) {
			info.pop = helpers.localeParseFloat(values.pop);
			if (Number.isNaN(info.pop) || info.pop < 0) {
				setError("Invalid population.");
				return;
			}
		}

		if (values.stadiumCapacity !== undefined) {
			info.stadiumCapacity = Number.parseInt(values.stadiumCapacity);
			if (Number.isNaN(info.stadiumCapacity) || info.stadiumCapacity < 0) {
				setError("Invalid stadium capacity.");
				return;
			}
		}

		for (const key of ["imgURL", "imgURLSmall", "jersey"] as const) {
			if (values[key] !== undefined) {
				info[key] = values[key];
			}
		}

		if (values.colors !== undefined) {
			info.colors = values.colors;
		}

		if (Object.keys(values).length === 0) {
			setError("Select at least one thing to change.");
			return;
		}

		onSave(info);
	};

	const renderInput = (key: Key) => {
		const enabled = values[key] !== undefined;
		const id = `scheduled-event-team-info-${key}`;

		// When not enabled, show the value the team will have at this time
		const value = values[key] ?? getValue(key, selectedTeam ?? {});

		if (key === "colors") {
			const colors = value as [string, string, string];

			return (
				<div className="input-group">
					{([0, 1, 2] as const).map((i) => (
						<ColorPicker
							key={i}
							disabled={!enabled}
							onChange={(color) => {
								const newColors: [string, string, string] = [...colors];
								newColors[i] = color;
								setValue("colors", newColors);
							}}
							value={colors[i]}
							style={{ minWidth: "33%", height: COLORS_HEIGHT }}
						/>
					))}
				</div>
			);
		}

		if (key === "did" || key === "jersey") {
			const options =
				key === "did"
					? divs.map((div) => {
							const conf = confs.find((conf) => conf.cid === div.cid);
							return {
								key: String(div.did),
								text: conf ? `${div.name} (${conf.name})` : div.name,
							};
						})
					: helpers.entries(JERSEYS).map(([jersey, text]) => ({
							key: jersey,
							text,
						}));

			return (
				<select
					id={id}
					className="form-select"
					disabled={!enabled}
					value={value as string}
					onChange={(event) => {
						setValue(key, event.target.value);
					}}
				>
					{options.map((option) => (
						<option key={option.key} value={option.key}>
							{option.text}
						</option>
					))}
				</select>
			);
		}

		return (
			<input
				id={id}
				type="text"
				className="form-control"
				disabled={!enabled}
				value={value as string}
				onChange={(event) => {
					setValue(key, event.target.value);
				}}
			/>
		);
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

			<div className="row mt-3">
				{FIELDS.map(({ key, label }) => {
					const checkboxId = `scheduled-event-team-info-check-${key}`;
					return (
						<div key={key} className="col-sm-6 mb-3">
							<div className="form-check mb-1">
								<input
									id={checkboxId}
									className="form-check-input"
									type="checkbox"
									checked={values[key] !== undefined}
									disabled={!selectedTeam}
									onChange={() => {
										toggleField(key);
									}}
								/>
								<label className="form-check-label" htmlFor={checkboxId}>
									{label}
								</label>
							</div>
							{renderInput(key)}
						</div>
					);
				})}
			</div>
			<FormButtons
				disabled={!selectedTeam}
				onCancel={onCancel}
				saving={saving}
			/>
		</form>
	);
};

export default EditTeamInfo;
