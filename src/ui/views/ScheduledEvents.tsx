import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View, ScheduledEvent, LocalStateUI } from "../../common/types";
import { helpers, getCols, useLocal, toWorker } from "../util";
import { DataTable } from "../components";
import { PHASE_TEXT } from "../../common";
import { options } from "./GodMode";
import { Dropdown } from "react-bootstrap";

const godModeOptions: Partial<Record<
	typeof options[number]["key"],
	typeof options[number]
>> = {};
for (const option of options) {
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

const formatType = (type: ScheduledEvent["type"]) => {
	if (type === "contraction") {
		return "Contraction";
	}

	if (type === "expansionDraft") {
		return "Expansion";
	}

	if (type === "gameAttributes") {
		return "League settings";
	}

	if (type === "teamInfo") {
		return "Team info";
	}
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

const bulkDelete = (type: string) => async () => {
	await toWorker("main", "deleteScheduledEvents", type);
};

const ScheduledEvents = ({ scheduledEvents }: View<"scheduledEvents">) => {
	useTitleBar({
		title: "Scheduled Events",
	});

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

	const cols = getCols("Season", "Type", "");
	cols[2].width = "100%";

	const rows = scheduledEvents.map(scheduledEvent => {
		return {
			key: scheduledEvent.id,
			data: [
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
			],
		};
	});

	return (
		<>
			<p>
				Eventually this will support creating, updating, and deleting individual
				scheduled events. But for now, all you can do is view scheduled events
				and apply some bulk operations, like removing all scheduled team
				contractions.
			</p>
			<Dropdown>
				<Dropdown.Toggle variant="danger" id="scheduled-events-bulk-delete">
					Bulk delete
				</Dropdown.Toggle>
				<Dropdown.Menu>
					<Dropdown.Item onClick={bulkDelete("all")}>
						All scheduled events
					</Dropdown.Item>
					<Dropdown.Item onClick={bulkDelete("expansionDraft")}>
						Expansion teams
					</Dropdown.Item>
					<Dropdown.Item onClick={bulkDelete("contraction")}>
						Team contractions
					</Dropdown.Item>
					<Dropdown.Item onClick={bulkDelete("teamInfo")}>
						Team info changes
					</Dropdown.Item>
					<Dropdown.Item onClick={bulkDelete("confs")}>
						Conference/division changes
					</Dropdown.Item>
					<Dropdown.Item onClick={bulkDelete("finance")}>
						League finance changes
					</Dropdown.Item>
					<Dropdown.Item onClick={bulkDelete("rules")}>
						League rule changes
					</Dropdown.Item>
					<Dropdown.Item onClick={bulkDelete("styleOfPlay")}>
						Style of play changes
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="ScheduledEvents"
				rows={rows}
			/>
		</>
	);
};

export default ScheduledEvents;
