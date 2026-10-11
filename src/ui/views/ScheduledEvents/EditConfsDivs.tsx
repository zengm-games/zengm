import { useReducer, useState } from "react";
import type { ScheduledEventsTeam } from "../../../common/scheduledEvents.ts";
import type { Conf, Div } from "../../../common/types.ts";
import { Modal } from "../../components/Modal.tsx";
import { Conferences, makeReducer } from "../NewLeague/CustomizeTeams.tsx";
import type { NewLeagueTeamWithoutRank } from "../NewLeague/types.ts";
import {
	type EditProps,
	FormButtons,
	ReloadSettingsBefore,
} from "./common.tsx";

// Team tids never change here
const reducer = makeReducer(false);

// Convert to the format used by Conferences. If the team's division does not exist, it goes in the last one.
const getTeamInDivision = (
	t: ScheduledEventsTeam,
	did: number,
	divs: Div[],
): NewLeagueTeamWithoutRank | undefined => {
	const div = divs.find((div) => div.did === did) ?? divs.at(-1);
	if (!div) {
		return;
	}

	return {
		tid: t.tid,
		region: t.region ?? "",
		name: t.name ?? "",
		abbrev: t.abbrev ?? "",
		cid: div.cid,
		did: div.did,

		// Required by NewLeagueTeamWithoutRank, but not used here
		pop: 0,
	};
};

const getTidsKey = (teams: ScheduledEventsTeam[]) => {
	return teams.map((t) => t.tid).join(",");
};

const MoveTeamModal = ({
	confs,
	divs,
	onHide,
	onMove,
	t,
}: {
	confs: Conf[];
	divs: Div[];
	onHide: () => void;
	onMove: (did: number) => void;
	t: NewLeagueTeamWithoutRank | undefined;
}) => {
	return (
		<Modal show={!!t} onHide={onHide}>
			<Modal.Header closeButton>
				<Modal.Title>
					Move {t?.region} {t?.name}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<label className="form-label" htmlFor="scheduled-event-move-team">
					Division
				</label>
				<select
					id="scheduled-event-move-team"
					className="form-select"
					value={t?.did}
					onChange={(event) => {
						onMove(Number.parseInt(event.target.value));
					}}
				>
					{divs.map((div) => {
						const conf = confs.find((conf) => conf.cid === div.cid);
						return (
							<option key={div.did} value={div.did}>
								{conf ? `${div.name} (${conf.name})` : div.name}
							</option>
						);
					})}
				</select>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" type="button" onClick={onHide}>
					Close
				</button>
			</Modal.Footer>
		</Modal>
	);
};

const EditConfsDivs = ({
	confs: confsBefore,
	divs: divsBefore,
	event,
	onCancel,
	onSave,
	saving,
	seasonPhaseInvalid,
	setError,
	teams: teamsBefore,
}: EditProps<"confsDivs">) => {
	// Only active teams are assigned to divisions here. An inactive team gets a division when an expansion draft brings it back.
	const activeTeams = teamsBefore.filter((t) => t.active);

	// State right before this event
	const getStateBefore = () => {
		return {
			confs: [...confsBefore],
			divs: [...divsBefore],
			teams: activeTeams
				.map((t) => getTeamInDivision(t, Number(t.did), divsBefore))
				.filter((t) => t !== undefined),
		};
	};

	const [{ confs, divs, teams }, dispatchRaw] = useReducer(
		reducer,
		undefined,
		() => {
			if (!event) {
				return getStateBefore();
			}

			const { confs, divs } = event.info;

			return {
				confs: [...confs],
				divs: [...divs],
				teams: activeTeams
					.map((t) => {
						const row = event.info.teams.find((row) => row.tid === t.tid);
						return getTeamInDivision(t, row?.did ?? Number(t.did), divs);
					})
					.filter((t) => t !== undefined),
			};
		},
	);

	// Has the user changed anything since the form was loaded?
	const [dirty, setDirty] = useState(false);
	const dispatch: typeof dispatchRaw = (action) => {
		setDirty(true);
		dispatchRaw(action);
	};

	const startOver = () => {
		dispatchRaw({
			type: "setState",
			...getStateBefore(),
		});
		setDirty(false);
	};

	// The state before this event depends on its season/phase, which can be changed while this is open. See ReloadSettingsBefore.
	const beforeKey = JSON.stringify([
		confsBefore,
		divsBefore,
		activeTeams.map((t) => [t.tid, t.did]),
	]);
	const [loadedBeforeKey, setLoadedBeforeKey] = useState(beforeKey);
	const beforeChanged = beforeKey !== loadedBeforeKey;

	const tidsKey = getTidsKey(activeTeams);
	const [prevTidsKey, setPrevTidsKey] = useState(tidsKey);

	if (beforeChanged && !event && !dirty) {
		setLoadedBeforeKey(beforeKey);
		setPrevTidsKey(tidsKey);
		startOver();
	} else if (tidsKey !== prevTidsKey) {
		// Even when not starting over, the teams here need to be the ones that will exist
		setPrevTidsKey(tidsKey);
		dispatchRaw({
			type: "setState",
			confs,
			divs,
			teams: activeTeams
				.map((t) => {
					// Keep teams where they are, and put new teams in the division they will be in before this event
					return (
						teams.find((t2) => t2.tid === t.tid) ??
						getTeamInDivision(t, Number(t.did), divs)
					);
				})
				.filter((t) => t !== undefined),
		});
	}

	const [movingTid, setMovingTid] = useState<number | undefined>();
	const movingTeam = teams.find((t) => t.tid === movingTid);

	const save = () => {
		const [firstConf, ...otherConfs] = confs;
		const [firstDiv, ...otherDivs] = divs;
		if (!firstConf || !firstDiv) {
			setError("There must be at least one conference and one division.");
			return;
		}

		onSave({
			confs: [firstConf, ...otherConfs],
			divs: [firstDiv, ...otherDivs],
			teams: teams.map((t) => ({
				tid: t.tid,
				did: t.did,
			})),
		});
	};

	return (
		<>
			{beforeChanged ? (
				<ReloadSettingsBefore
					onReload={() => {
						setLoadedBeforeKey(beforeKey);
						setPrevTidsKey(tidsKey);
						startOver();
					}}
					saving={saving}
					text="The conferences, divisions, or teams before this event are different now than when you started editing."
				/>
			) : null}

			{/* Not inside the form, because this has its own forms and buttons */}
			<Conferences
				confs={confs}
				divs={divs}
				teams={teams}
				dispatch={dispatch}
				allowDeleteTeams={false}
				addTeam={undefined}
				editTeam={setMovingTid}
				abbrevsUsedMultipleTimes={[]}
			/>

			<form
				onSubmit={(event) => {
					event.preventDefault();
					save();
				}}
			>
				<FormButtons
					disabled={
						confs.length === 0 || divs.length === 0 || seasonPhaseInvalid
					}
					onCancel={onCancel}
					saving={saving}
				/>
			</form>

			<MoveTeamModal
				confs={confs}
				divs={divs}
				onHide={() => {
					setMovingTid(undefined);
				}}
				onMove={(did) => {
					const div = divs.find((div) => div.did === did);
					if (movingTeam && div) {
						dispatch({
							type: "editTeam",
							t: {
								...movingTeam,
								cid: div.cid,
								did: div.did,
							},
						});
					}
					setMovingTid(undefined);
				}}
				t={movingTeam}
			/>
		</>
	);
};

export default EditConfsDivs;
