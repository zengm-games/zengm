import orderBy from "lodash-es/orderBy";
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
	Phase,
	ScheduledEvent,
	ScheduledEventWithoutKey,
} from "../../../common/types";
import { helpers, logEvent, useLocalShallow } from "../../util";
import EditInfoContraction from "./EditInfoContraction";

type StateInfo =
	| {
			type: "contraction";
			tid: number;
	  }
	| {
			type: "expansionDraft";
	  }
	| {
			type: "gameAttributes";
	  }
	| {
			type: "teamInfo";
	  };

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

	const {
		phase: currentPhase,
		season: currentSeason,
		teamInfoCache,
	} = useLocalShallow(state => ({
		phase: state.phase,
		season: state.season,
		teamInfoCache: state.teamInfoCache,
	}));

	const [phase, setPhase] = useState<Phase>(
		prevScheduledEvent ? prevScheduledEvent.phase : currentPhase,
	);
	const [season, setSeason] = useState(
		prevScheduledEvent
			? String(prevScheduledEvent.season)
			: String(currentSeason),
	);
	const seasonInt = parseInt(season);

	const { pastEvents, futureEvents } = getPastFutureScheduledEvents(
		{
			phase,
			season: seasonInt,
			type: type ?? "contraction",
		},
		scheduledEvents,
		"future",
	);

	let teams = teamInfoCache.map((t, tid) => ({
		...t,
		tid,
		disabled: !!t.disabled,
		future: false,
	}));
	for (const pastEvent of pastEvents) {
		if (pastEvent.type === "contraction" || pastEvent.type === "teamInfo") {
			const t = teams.find(t => t.tid === pastEvent.info.tid);
			if (!t) {
				continue;
			}

			if (pastEvent.type === "contraction") {
				t.disabled = true;
			} else if (pastEvent.type === "teamInfo") {
				for (const [key, value] of Object.entries(pastEvent.info)) {
					(t as any)[key] = value;
				}
			}
		} else if (pastEvent.type === "expansionDraft") {
			for (const newTeam of pastEvent.info.teams) {
				const t = teams.find(t => t.tid === newTeam.tid);
				if (t) {
					for (const [key, value] of Object.entries(newTeam)) {
						(t as any)[key] = value;
					}
					t.disabled = false;
				} else {
					teams.push({
						...newTeam,
						disabled: false,
						future: true,
					});
				}
			}
		}
	}
	teams = orderBy(teams, ["region", "name", "tid"]);

	const [info, setInfo] = useState<StateInfo>(() => {
		if (type === "contraction") {
			return {
				type: "contraction",
				tid: prevScheduledEvent
					? (prevScheduledEvent as any).info.tid
					: teams[0].tid,
			};
		}

		return {
			type: "gameAttributes",
		};
	});

	const save = () => {
		const base: {
			season: number;
			phase: Phase;
			id?: number;
		} = {
			season: seasonInt,
			phase,
		};

		if (prevScheduledEvent) {
			base.id = prevScheduledEvent.id;
		}

		if (info.type === "contraction") {
			onSave({
				...base,
				type: "contraction",
				info: {
					tid: info.tid,
				},
			});
		}
	};

	let error: string | undefined;

	if (
		seasonInt < currentSeason ||
		(seasonInt === currentSeason && phase < currentPhase)
	) {
		error = "You cannot schedule events in the past.";
	} else if (
		info.type === "contraction" &&
		scheduledEvents.some(
			scheduledEvent =>
				scheduledEvent.season === seasonInt &&
				scheduledEvent.phase === phase &&
				scheduledEvent.type === info.type &&
				scheduledEvent !== prevScheduledEvent &&
				scheduledEvent.info.tid === info.tid,
		)
	) {
		// Only allow one contraction per season+phase+tid
		error =
			"There is already a scheduled contraction for this team in the same season and phase.";
	}

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
						<div className="form-group col-6">
							<label htmlFor="scheduled-event-season">Season</label>
							<input
								id="scheduled-event-season"
								type="text"
								className="form-control"
								onChange={event => {
									setSeason(event.target.value);
								}}
								value={season}
							/>
						</div>
						<div className="form-group col-6">
							<label htmlFor="scheduled-event-phase">Phase</label>
							<select
								id="scheduled-event-phase"
								className="form-control"
								onChange={event => {
									setPhase(parseInt(event.target.value) as Phase);
								}}
								value={phase}
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
					{info.type === "contraction" ? (
						<EditInfoContraction
							tid={info.tid}
							teams={teams}
							onChange={tid => {
								setInfo(prevInfo => ({
									...prevInfo,
									tid,
								}));
							}}
						/>
					) : null}
					{error ? (
						<div className="alert alert-danger mb-0">
							<b>Error!</b> {error}
						</div>
					) : null}
					<button className="d-none" disabled={!!error} type="submit"></button>
				</form>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={onCancel}>
					Cancel
				</button>
				<button className="btn btn-primary" disabled={!!error} onClick={save}>
					Save
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default ScheduledEventEditor;
