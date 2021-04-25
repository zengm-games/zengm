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

	const [phase, setPhase] = useState(
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
		const base = {};
		if (info.type === "contraction") {
		}
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
									setPhase(parseInt(event.target.value));
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
