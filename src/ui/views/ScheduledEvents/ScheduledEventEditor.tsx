import { useState } from "react";
import { Modal } from "react-bootstrap";
import { formatType } from ".";
import {
	getPastFutureScheduledEvents,
	PHASE,
	PHASE_TEXT,
} from "../../../common";
import type {
	DiscriminateUnion,
	ScheduledEvent,
	ScheduledEventWithoutKey,
} from "../../../common/types";
import { helpers, logEvent, useLocalShallow } from "../../util";

const ScheduledEventEditor = <Type extends ScheduledEvent["type"]>({
	prevScheduledEvent,
	scheduledEvents,
	type,
	onCancel,
	onSave,
}: {
	prevScheduledEvent?: DiscriminateUnion<ScheduledEvent, "type", Type>;
	scheduledEvents: ScheduledEvent[];
	type?: Type;
	onCancel: () => void;
	onSave: (scheduledEvent: ScheduledEventWithoutKey | ScheduledEvent) => void;
}) => {
	type MyScheduledEvent = NonNullable<typeof prevScheduledEvent>;

	const { phase, season, teamInfoCache } = useLocalShallow(state => ({
		phase: state.phase,
		season: state.season,
		teamInfoCache: state.teamInfoCache,
	}));

	const [state, setState] = useState(() => {
		const common = {
			phase: prevScheduledEvent ? prevScheduledEvent.phase : phase,
			season: prevScheduledEvent
				? String(prevScheduledEvent.season)
				: String(season),
		};

		return {
			...common,
		};
	});

	const seasonInt = parseInt(state.season);

	const { pastEvents, futureEvents } = getPastFutureScheduledEvents(
		{
			phase: state.phase,
			season: seasonInt,
		},
		scheduledEvents,
	);

	const save = () => {
		if (t === undefined || controlledTeam === undefined) {
			return;
		}
		const did = parseInt(controlledTeam.did);
		const div = divs.find(div => div.did === did);
		if (!div) {
			return;
		}

		const edited = {
			...t,
			region: controlledTeam.region,
			name: controlledTeam.name,
			abbrev: controlledTeam.abbrev,
			pop: parseFloat(controlledTeam.pop),
			stadiumCapacity: parseInt(controlledTeam.stadiumCapacity),
			colors: controlledTeam.colors,
			jersey: controlledTeam.jersey,
			did,
			cid: div.cid,
			imgURL: controlledTeam.imgURL,
		};

		const errors = [];
		let errorMessage: string | undefined;
		if (Number.isNaN(edited.pop)) {
			errors.push("Population");
		}
		if (Number.isNaN(edited.stadiumCapacity)) {
			errors.push("Stadium Capacity");
		}
		if (errors.length === 1) {
			errorMessage = `${errors[0]} must be a number.`;
		} else if (errors.length > 1) {
			errorMessage = `${errors[0]} and ${errors[1]} must be numbers.`;
		}
		if (errorMessage) {
			logEvent({
				type: "error",
				text: errorMessage,
				saveToDb: false,
			});
			return;
		}

		onSave(edited);
	};

	return (
		<Modal size="lg" show={type !== undefined} onHide={onCancel}>
			<Modal.Header closeButton>
				{prevScheduledEvent !== undefined ? "Edit" : "Add"} scheduled event -{" "}
				{formatType(type).toLowerCase()}
			</Modal.Header>
			<Modal.Body>
				<form
					onSubmit={event => {
						event.preventDefault();
						save();
					}}
				>
					<div className="row">
						<div className="form-group col">
							<label htmlFor="scheduled-event-season">Season</label>
							<input
								id="scheduled-event-season"
								type="text"
								className="form-control"
								onChange={event => {
									setState(prevState => ({
										...prevState,
										season: event.target.value,
									}));
								}}
								value={state.season}
							/>
						</div>
						<div className="form-group col">
							<label htmlFor="scheduled-event-phase">Phase</label>
							<select
								id="scheduled-event-phase"
								className="form-control"
								onChange={event => {
									setState(prevState => ({
										...prevState,
										phase: parseInt(event.target.value),
									}));
								}}
								value={state.phase}
							>
								<option value={PHASE.PRESEASON}>
									{helpers.upperCaseFirstLetter(PHASE_TEXT[PHASE.PRESEASON])}
								</option>
								<option value={PHASE.DRAFT_LOTTERY}>
									{helpers.upperCaseFirstLetter(
										PHASE_TEXT[PHASE.DRAFT_LOTTERY],
									)}
								</option>
							</select>
						</div>
					</div>
					<button className="d-none" type="submit"></button>
				</form>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={onCancel}>
					Cancel
				</button>
				<button className="btn btn-primary" onClick={save}>
					Save
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default ScheduledEventEditor;
