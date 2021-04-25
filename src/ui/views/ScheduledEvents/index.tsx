import useTitleBar from "../../hooks/useTitleBar";
import type { View, ScheduledEvent, LocalStateUI } from "../../../common/types";
import { helpers, getCols, useLocal, toWorker } from "../../util";
import { DataTable } from "../../components";
import { PHASE_TEXT } from "../../../common";
import { settings } from "../Settings/settings";
import { Dropdown } from "react-bootstrap";
import { useState } from "react";
import ScheduledEventEditor from "./ScheduledEventEditor";

const godModeOptions: Partial<
	Record<typeof settings[number]["key"], typeof settings[number]>
> = {};
for (const option of settings) {
	godModeOptions[option.key] = option;
}

const gameAttributeName = (key: string) => {
	if ((godModeOptions as any)[key]) {
		return (godModeOptions as any)[key].name;
	}

	if (key === "confs") {
		return "Conferences";
	}

	if (key === "divs") {
		return "Divisions";
	}

	return key;
};

const teamInfoKey = (key: string) => {
	if (key === "region") {
		return "Region";
	}

	if (key === "name") {
		return "Name";
	}

	if (key === "pop") {
		return "Population";
	}

	if (key === "cid") {
		return "Conference";
	}

	if (key === "did") {
		return "Division";
	}

	if (key === "abbrev") {
		return "Abbrev";
	}

	if (key === "imgURL") {
		return "Logo URL";
	}

	if (key === "colors") {
		return "Colors";
	}

	return key;
};

const formatSeason = (scheduledEvent: ScheduledEvent) => {
	const phaseText = PHASE_TEXT[scheduledEvent.phase]
		? helpers.upperCaseFirstLetter(PHASE_TEXT[scheduledEvent.phase])
		: "???";
	return (
		<>
			{scheduledEvent.season}
			<br />
			{phaseText}
		</>
	);
};

export const formatType = (type?: ScheduledEvent["type"]) => {
	if (type === "contraction") {
		return "Contraction";
	}

	if (type === "expansionDraft") {
		return "Expansion draft";
	}

	if (type === "gameAttributes") {
		return "League settings";
	}

	if (type === "teamInfo") {
		return "Team info";
	}

	return "???";
};

const TeamNameBlock = ({
	all,
	current,
	teamInfoCache,
}: {
	all: ScheduledEvent[];
	current: ScheduledEvent;
	teamInfoCache: LocalStateUI["teamInfoCache"];
}) => {
	if (current.type !== "contraction" && current.type !== "teamInfo") {
		throw new Error("Invalid type");
	}

	const tid = current.info.tid;
	if (tid < teamInfoCache.length) {
		const t = teamInfoCache[tid];
		return (
			<div>
				{t.region} {t.name}
				<br />
				Team ID: {tid}
			</div>
		);
	}

	// Must be a team that doesn't exist yet, look in all
	let t;
	for (const scheduledEvent of all) {
		if (scheduledEvent.type === "expansionDraft") {
			for (const t2 of scheduledEvent.info.teams) {
				if (t2.tid === tid) {
					t = t2;
					break;
				}
			}
		}
		if (t) {
			break;
		}
	}

	if (t) {
		return (
			<div>
				{t.region} {t.name} (future expansion team)
				<br />
				Team ID: {t.tid}
			</div>
		);
	}

	return (
		<div className="text-danger">
			Invalid team
			<br />
			Team ID: {tid}
		</div>
	);
};

const ViewEvent = ({
	all,
	current,
	teamInfoCache,
}: {
	all: ScheduledEvent[];
	current: ScheduledEvent;
	teamInfoCache: LocalStateUI["teamInfoCache"];
}) => {
	if (current.type === "contraction") {
		return (
			<TeamNameBlock
				all={all}
				current={current}
				teamInfoCache={teamInfoCache}
			/>
		);
	}

	if (current.type === "expansionDraft") {
		return (
			<ul className="list-unstyled mb-0">
				{current.info.teams.map((t, i) => (
					<li className={i > 0 ? "mt-3" : undefined} key={i}>
						{t.region} {t.name}
						{t.tid !== undefined ? (
							<>
								<br />
								Team ID: {t.tid}
							</>
						) : null}
					</li>
				))}
			</ul>
		);
	}

	if (current.type === "gameAttributes") {
		return (
			<table className="table table-nonfluid">
				<tbody>
					{Object.entries(current.info).map(([key, value]) => {
						return (
							<tr key={key}>
								<td>{gameAttributeName(key)}</td>
								<td>
									{key === "confs" || key === "divs"
										? (value as any[]).map((x, i) => (
												<div key={i}>{x.name}</div>
										  ))
										: Array.isArray(value)
										? JSON.stringify(value)
										: value}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		);
	}

	if (current.type === "teamInfo") {
		return (
			<>
				<TeamNameBlock
					all={all}
					current={current}
					teamInfoCache={teamInfoCache}
				/>
				<table className="table table-nonfluid mt-3">
					<tbody>
						{Object.entries(current.info)
							.filter(([key]) => key !== "tid" && key !== "srID")
							.map(([key, value]) => {
								return (
									<tr key={key}>
										<td>{teamInfoKey(key)}</td>
										<td>
											{Array.isArray(value) ? JSON.stringify(value) : value}
										</td>
									</tr>
								);
							})}
					</tbody>
				</table>
			</>
		);
	}

	throw new Error("Invalid type");
};

const ScheduledEvents = ({ scheduledEvents }: View<"scheduledEvents">) => {
	useTitleBar({
		title: "Scheduled Events",
	});

	const [checked, setChecked] = useState<Set<number>>(new Set());

	const [editingInfo, setEditingInfo] = useState<{
		type?: ScheduledEvent["type"];
		scheduledEvent?: ScheduledEvent;
	}>({});

	const teamInfoCache = useLocal(state => state.teamInfoCache);

	if (scheduledEvents.length === 0) {
		return (
			<>
				<p>No scheduled events found!</p>
				<p>
					Eventually you will be able to add scheduled events here, but
					currently they are only available in historical "real players" leagues
					where they are created by default when making a new league.
				</p>
			</>
		);
	}

	const bulkSelect = (type: "all" | "none" | ScheduledEvent["type"]) => {
		const newChecked = new Set<number>();
		for (const scheduledEvent of scheduledEvents) {
			if (type === "all" || type === scheduledEvent.type) {
				newChecked.add(scheduledEvent.id);
			}
		}
		setChecked(newChecked);
	};

	const newScheduledEvent = (type: ScheduledEvent["type"]) => {
		setEditingInfo({
			type,
		});
	};

	const cols = getCols("", "Season", "Type", "Details", "Actions");
	cols[3].width = "100%";

	const rows = scheduledEvents.map(scheduledEvent => {
		return {
			key: scheduledEvent.id,
			data: [
				<input
					type="checkbox"
					checked={checked.has(scheduledEvent.id)}
					onChange={() => {
						const newChecked = new Set([...checked]);
						if (checked.has(scheduledEvent.id)) {
							newChecked.delete(scheduledEvent.id);
						} else {
							newChecked.add(scheduledEvent.id);
						}
						setChecked(newChecked);
					}}
				/>,
				{
					value: formatSeason(scheduledEvent),
					sortValue: `${scheduledEvent.season} ${scheduledEvent.phase} ${scheduledEvent.id}`,
				},
				formatType(scheduledEvent.type),
				<ViewEvent
					all={scheduledEvents}
					current={scheduledEvent}
					teamInfoCache={teamInfoCache}
				/>,
				<>
					<button
						className="mr-2 btn btn-link p-0 border-0 text-reset"
						onClick={() => {
							setEditingInfo({
								type: scheduledEvent.type,
								scheduledEvent,
							});
						}}
						title="Edit"
						type="button"
					>
						<span
							className="glyphicon glyphicon-edit"
							data-no-row-highlight="true"
						/>
					</button>
					<button
						className="btn btn-link text-danger p-0 border-0"
						onClick={async () => {
							await toWorker("main", "deleteScheduledEvents", [
								scheduledEvent.id,
							]);
						}}
						title="Delete"
						type="button"
					>
						<span
							className="glyphicon glyphicon-remove"
							data-no-row-highlight="true"
						/>
					</button>
				</>,
			],
		};
	});

	return (
		<>
			<div className="d-flex">
				<Dropdown>
					<Dropdown.Toggle
						variant="secondary"
						id="scheduled-events-bulk-select"
					>
						Bulk select
					</Dropdown.Toggle>
					<Dropdown.Menu>
						<Dropdown.Item
							onClick={() => {
								bulkSelect("all");
							}}
						>
							All
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								bulkSelect("none");
							}}
						>
							None
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								bulkSelect("contraction");
							}}
						>
							Contraction
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								bulkSelect("expansionDraft");
							}}
						>
							Expansion draft
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								bulkSelect("teamInfo");
							}}
						>
							Team info
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								bulkSelect("gameAttributes");
							}}
						>
							League settings
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
				<button
					className="btn btn-danger mx-2"
					disabled={checked.size === 0}
					onClick={async () => {
						await toWorker(
							"main",
							"deleteScheduledEvents",
							Array.from(checked),
						);
					}}
				>
					Delete selected
				</button>
				<Dropdown>
					<Dropdown.Toggle variant="success" id="scheduled-events-bulk-select">
						New event
					</Dropdown.Toggle>
					<Dropdown.Menu>
						<Dropdown.Item
							onClick={() => {
								newScheduledEvent("contraction");
							}}
						>
							Contraction
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								newScheduledEvent("expansionDraft");
							}}
						>
							Expansion draft
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								newScheduledEvent("teamInfo");
							}}
						>
							Team info
						</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								newScheduledEvent("gameAttributes");
							}}
						>
							League settings
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
			</div>

			<DataTable
				cols={cols}
				defaultSort={[1, "asc"]}
				name="ScheduledEvents"
				rows={rows}
			/>

			<ScheduledEventEditor
				key={
					editingInfo.scheduledEvent
						? editingInfo.scheduledEvent.id
						: editingInfo.type ?? "none"
				}
				type={editingInfo.type}
				prevScheduledEvent={editingInfo.scheduledEvent}
				scheduledEvents={scheduledEvents}
				onSave={scheduledEvent => {
					console.log("onSave", scheduledEvent);
					setEditingInfo({});
				}}
				onCancel={() => {
					setEditingInfo({});
				}}
			/>
		</>
	);
};

export default ScheduledEvents;
