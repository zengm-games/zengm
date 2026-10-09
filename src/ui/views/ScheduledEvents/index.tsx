import useTitleBar from "../../hooks/useTitleBar.tsx";
import type {
	View,
	LocalStateUI,
	ScheduledEvent,
} from "../../../common/types.ts";
import { helpers } from "../../util/helpers.ts";
import { toWorker } from "../../util/toWorker.ts";
import { getCols } from "../../../common/getCols.ts";
import { DataTable } from "../../components/DataTable/index.tsx";
import { Dropdown } from "react-bootstrap";
import { useState } from "react";
import { isFutureScheduledEvent } from "../../../common/scheduledEvents.ts";
import { Modal } from "../../components/Modal.tsx";
import {
	type AugmentedScheduledEvent,
	formatPhase,
	formatType,
	gameAttributeName,
} from "./common.tsx";
import ScheduledEventEditor, { type Editing } from "./ScheduledEventEditor.tsx";
import { PlayerNameLabels } from "../../components/PlayerNameLabels.tsx";
import { useLocal } from "../../util/local.ts";

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

	if (key === "imgURLSmall") {
		return "Small Logo URL";
	}

	if (key === "jersey") {
		return "Jersey";
	}

	if (key === "stadiumCapacity") {
		return "Stadium Capacity";
	}

	if (key === "colors") {
		return "Colors";
	}

	return key;
};

const formatSeason = (scheduledEvent: AugmentedScheduledEvent) => {
	return (
		<>
			{scheduledEvent.season}
			<br />
			{formatPhase(scheduledEvent.phase)}
		</>
	);
};

const TeamNameBlock = ({
	all,
	current,
	teamInfoCache,
}: {
	all: AugmentedScheduledEvent[];
	current: AugmentedScheduledEvent;
	teamInfoCache: LocalStateUI["teamInfoCache"];
}) => {
	if (current.type !== "contraction" && current.type !== "teamInfo") {
		throw new Error("Invalid type");
	}

	const tid = current.info.tid;
	if (teamInfoCache[tid]) {
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
	all: AugmentedScheduledEvent[];
	current: AugmentedScheduledEvent;
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
			<table className="table table-nonfluid table-striped table-borderless table-sm">
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
										: key === "awards"
											? (value as any[]).map((row) => row.shortName).join(", ")
											: Array.isArray(value)
												? JSON.stringify(value)
												: String(value)}
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
				<table className="table table-nonfluid table-striped table-borderless table-sm mt-3">
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

	if (current.type === "retirePlayer" || current.type === "unretirePlayer") {
		return (
			<PlayerNameLabels
				pid={current.info.pid}
				skills={current.info.skills}
				legacyName={current.info.name}
			/>
		);
	}

	throw new Error("Invalid type");
};

const bulkDelete = (type: string) => async () => {
	await toWorker("main", "deleteScheduledEvents", type);
};

const EVENT_TYPES = [
	"contraction",
	"expansionDraft",
	"gameAttributes",
	"teamInfo",
	"retirePlayer",
	"unretirePlayer",
] satisfies ScheduledEvent["type"][];

const ScheduledEvents = (props: View<"scheduledEvents">) => {
	const { current, scheduledEvents } = props;

	useTitleBar({
		title: "Scheduled Events",
	});

	const { godMode, teamInfoCache } = useLocal(["godMode", "teamInfoCache"]);

	const [editing, setEditing] = useState<Editing | undefined>();

	// When deleting an event would change or delete other events, the user needs to confirm
	const [deleting, setDeleting] = useState<
		| {
				id: number;
				changes: string[];
		  }
		| undefined
	>();
	const [deletingProcessing, setDeletingProcessing] = useState(false);

	const deleteEvent = async (id: number) => {
		const result = await toWorker("main", "deleteScheduledEvent", {
			dryRun: true,
			id,
		});

		if (result.changes.length > 0) {
			setDeleting({
				id,
				changes: result.changes,
			});
			return;
		}

		await toWorker("main", "deleteScheduledEvent", {
			dryRun: false,
			id,
		});
	};

	const cols = getCols(["Season", "Type", "", "Actions"], {
		"": {
			width: "100%",
		},
		Actions: {
			sortSequence: [],
		},
	});

	const rows = scheduledEvents.map((scheduledEvent) => {
		// Events not in the future will never be processed, so there's no point in editing them
		const canEdit = godMode && isFutureScheduledEvent(scheduledEvent, current);

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
				<div className="d-flex gap-2">
					<button
						className="btn btn-secondary"
						disabled={!canEdit}
						onClick={() => {
							setEditing({
								type: scheduledEvent.type,
								event: scheduledEvent,
							});
						}}
						type="button"
					>
						Edit
					</button>
					<button
						className="btn btn-danger"
						onClick={async () => {
							await deleteEvent(scheduledEvent.id);
						}}
						type="button"
					>
						Delete
					</button>
				</div>,
			],
		};
	});

	return (
		<>
			<p>
				Scheduled events happen automatically when the league reaches a future
				season and phase. In historical "real players" leagues, they are created
				by default to match what happened in real life.
			</p>
			<p>
				Some scheduled events depend on others. For example, you can't contract
				a team before the expansion draft that creates it. If a change you make
				here would make other events impossible, you'll be asked to confirm
				before they are deleted.
			</p>
			<div className="d-flex gap-2 mb-3">
				<Dropdown>
					<Dropdown.Toggle
						variant="primary"
						id="scheduled-events-add"
						disabled={!godMode}
					>
						Add event
					</Dropdown.Toggle>
					<Dropdown.Menu>
						{EVENT_TYPES.map((type) => (
							<Dropdown.Item
								key={type}
								onClick={() => {
									setEditing({
										type,
										event: undefined,
									});
								}}
							>
								{formatType(type)}
							</Dropdown.Item>
						))}
					</Dropdown.Menu>
				</Dropdown>
				{scheduledEvents.length > 0 ? (
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
							<Dropdown.Item onClick={bulkDelete("awards")}>
								Award settings changes
							</Dropdown.Item>
							<Dropdown.Item onClick={bulkDelete("retirePlayer")}>
								Retire players
							</Dropdown.Item>
							<Dropdown.Item onClick={bulkDelete("unretirePlayer")}>
								Unretire players
							</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
				) : null}
			</div>
			{!godMode ? (
				<p className="text-warning">
					You can delete scheduled events, but adding or editing them requires{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			) : null}

			{scheduledEvents.length === 0 ? (
				<p>No scheduled events found!</p>
			) : (
				<DataTable
					cols={cols}
					defaultSort={[0, "asc"]}
					name="ScheduledEvents"
					rows={rows}
				/>
			)}

			{editing ? (
				<ScheduledEventEditor
					{...props}
					editing={editing}
					onClose={() => {
						setEditing(undefined);
					}}
				/>
			) : null}

			<Modal
				show={!!deleting}
				onHide={() => {
					setDeleting(undefined);
				}}
			>
				<Modal.Body>
					<p>
						Deleting this will also change other scheduled events that would no
						longer be possible:
					</p>
					<ul className="mb-0">
						{deleting?.changes.map((change, i) => (
							<li key={i}>{change}</li>
						))}
					</ul>
				</Modal.Body>
				<Modal.Footer>
					<button
						className="btn btn-secondary"
						type="button"
						disabled={deletingProcessing}
						onClick={() => {
							setDeleting(undefined);
						}}
					>
						Cancel
					</button>
					<button
						className="btn btn-danger"
						type="button"
						disabled={deletingProcessing}
						onClick={async () => {
							if (deleting) {
								setDeletingProcessing(true);
								await toWorker("main", "deleteScheduledEvent", {
									dryRun: false,
									id: deleting.id,
								});
								setDeletingProcessing(false);
								setDeleting(undefined);
							}
						}}
					>
						Delete
					</button>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default ScheduledEvents;
