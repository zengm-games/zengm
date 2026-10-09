import { useState } from "react";
import { PHASE } from "../../../common/constants.ts";
import {
	getConfsDivsBeforeScheduledEvent,
	getScheduledEventPhases,
	getTeamsBeforeScheduledEvent,
	isFutureScheduledEvent,
	type ScheduledEventMaybeId,
} from "../../../common/scheduledEvents.ts";
import type { Phase, ScheduledEvent, View } from "../../../common/types.ts";
import { Modal } from "../../components/Modal.tsx";
import { toWorker } from "../../util/toWorker.ts";
import {
	type AugmentedScheduledEvent,
	formatPhase,
	formatType,
} from "./common.tsx";
import EditContraction from "./EditContraction.tsx";
import EditExpansionDraft from "./EditExpansionDraft.tsx";
import EditGameAttributes from "./EditGameAttributes.tsx";
import EditPlayer from "./EditPlayer.tsx";
import EditTeamInfo from "./EditTeamInfo.tsx";

export type Editing = {
	type: ScheduledEvent["type"];

	// Undefined when creating a new event
	event: AugmentedScheduledEvent | undefined;
};

const getEvent = <Type extends ScheduledEvent["type"]>(
	editing: Editing,
	type: Type,
) => {
	if (editing.event && editing.event.type !== type) {
		throw new Error("Should never happen");
	}

	return editing.event as
		| Extract<AugmentedScheduledEvent, { type: Type }>
		| undefined;
};

const ScheduledEventEditor = ({
	confs,
	current,
	defaultStadiumCapacity,
	divs,
	editing,
	initialSettings,
	onClose,
	scheduledEvents,
	teams,
}: View<"scheduledEvents"> & {
	editing: Editing;
	onClose: () => void;
}) => {
	const { event, type } = editing;

	const phases = getScheduledEventPhases(type);

	// Default for a new event is the next preseason, which is always in the future
	const [season, setSeason] = useState(
		String(event ? event.season : current.season + 1),
	);
	const [phase, setPhase] = useState<Phase>(
		event ? event.phase : PHASE.PRESEASON,
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | undefined>();

	// When saving this event would change or delete other events, the user needs to confirm
	const [needsConfirmation, setNeedsConfirmation] = useState<
		| {
				changes: string[];
				event: ScheduledEventMaybeId;
		  }
		| undefined
	>();

	const seasonInt = Number.parseInt(season);
	const target = {
		id: event?.id,
		type,
		season: seasonInt,
		phase,
	};

	let seasonPhaseError: string | undefined;
	if (Number.isNaN(seasonInt)) {
		seasonPhaseError = "Invalid season.";
	} else if (!isFutureScheduledEvent(target, current)) {
		seasonPhaseError = "Scheduled events must be in the future.";
	}

	const teamsBefore = getTeamsBeforeScheduledEvent({
		current,
		events: scheduledEvents,
		target,
		teams,
	});
	const confsDivsBefore = getConfsDivsBeforeScheduledEvent({
		confs,
		current,
		divs,
		events: scheduledEvents,
		target,
	});

	const save = async (
		eventToSave: ScheduledEventMaybeId,
		confirmed: boolean,
	) => {
		setError(undefined);
		setSaving(true);

		try {
			if (!confirmed) {
				const result = await toWorker("main", "upsertScheduledEvent", {
					dryRun: true,
					event: eventToSave,
				});

				if ("error" in result) {
					setError(result.error);
					return;
				}

				if (result.changes.length > 0) {
					setNeedsConfirmation({
						changes: result.changes,
						event: eventToSave,
					});
					return;
				}
			}

			const result = await toWorker("main", "upsertScheduledEvent", {
				dryRun: false,
				event: eventToSave,
			});

			if ("error" in result) {
				setNeedsConfirmation(undefined);
				setError(result.error);
				return;
			}

			onClose();
		} finally {
			setSaving(false);
		}
	};

	const onSave = async (info: ScheduledEvent["info"]) => {
		if (seasonPhaseError !== undefined) {
			setError(seasonPhaseError);
			return;
		}

		const eventToSave = {
			type,
			season: seasonInt,
			phase,
			info,
		} as ScheduledEventMaybeId;
		if (event) {
			eventToSave.id = event.id;
		}

		await save(eventToSave, false);
	};

	const commonProps = {
		confs: confsDivsBefore.confs,
		divs: confsDivsBefore.divs,
		onCancel: onClose,
		onSave,
		saving,
		setError,
		teams: teamsBefore,
	};

	const large = type === "expansionDraft" || type === "gameAttributes";

	return (
		<Modal
			show
			onHide={onClose}
			size={large ? "xl" : "lg"}
			// Needed for ColorPicker, see the comment there
			enforceFocus={false}
		>
			<Modal.Header closeButton>
				<Modal.Title>
					{event ? "Edit" : "Add"} scheduled event:{" "}
					{formatType(type).toLowerCase()}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{needsConfirmation ? (
					<>
						<p>
							Saving this will also change other scheduled events that would no
							longer be possible:
						</p>
						<ul>
							{needsConfirmation.changes.map((change, i) => (
								<li key={i}>{change}</li>
							))}
						</ul>
						<div className="d-flex gap-2">
							<button
								className="btn btn-secondary ms-auto"
								type="button"
								disabled={saving}
								onClick={() => {
									setNeedsConfirmation(undefined);
								}}
							>
								Back
							</button>
							<button
								className="btn btn-danger"
								type="button"
								disabled={saving}
								onClick={async () => {
									await save(needsConfirmation.event, true);
								}}
							>
								Save anyway
							</button>
						</div>
					</>
				) : null}

				{/* Keep the form mounted while confirming, so no state is lost when going back */}
				<div className={needsConfirmation ? "d-none" : undefined}>
					<div className="row">
						<div className="col-6 col-sm-3 mb-3">
							<label className="form-label" htmlFor="scheduled-event-season">
								Season
							</label>
							<input
								id="scheduled-event-season"
								type="text"
								inputMode="numeric"
								className="form-control"
								value={season}
								onChange={(event) => {
									setSeason(event.target.value);
								}}
							/>
						</div>
						<div className="col-6 col-sm-3 mb-3">
							<label className="form-label" htmlFor="scheduled-event-phase">
								Phase
							</label>
							<select
								id="scheduled-event-phase"
								className="form-select"
								value={phase}
								onChange={(event) => {
									setPhase(Number.parseInt(event.target.value) as Phase);
								}}
							>
								{phases.map((phase) => (
									<option key={phase} value={phase}>
										{formatPhase(phase)}
									</option>
								))}
							</select>
						</div>
					</div>
					{seasonPhaseError !== undefined ? (
						<div className="text-danger mb-3">{seasonPhaseError}</div>
					) : null}
					{error !== undefined ? (
						<div className="alert alert-danger">{error}</div>
					) : null}

					{type === "contraction" ? (
						<EditContraction
							{...commonProps}
							event={getEvent(editing, "contraction")}
						/>
					) : null}
					{type === "expansionDraft" ? (
						<EditExpansionDraft
							{...commonProps}
							defaultStadiumCapacity={defaultStadiumCapacity}
							event={getEvent(editing, "expansionDraft")}
						/>
					) : null}
					{type === "gameAttributes" ? (
						<EditGameAttributes
							{...commonProps}
							event={getEvent(editing, "gameAttributes")}
							initialSettings={initialSettings}
						/>
					) : null}
					{type === "teamInfo" ? (
						<EditTeamInfo
							{...commonProps}
							defaultStadiumCapacity={defaultStadiumCapacity}
							event={getEvent(editing, "teamInfo")}
						/>
					) : null}
					{type === "retirePlayer" || type === "unretirePlayer" ? (
						<EditPlayer
							{...commonProps}
							event={getEvent(editing, type)}
							type={type}
						/>
					) : null}
				</div>
			</Modal.Body>
		</Modal>
	);
};

export default ScheduledEventEditor;
