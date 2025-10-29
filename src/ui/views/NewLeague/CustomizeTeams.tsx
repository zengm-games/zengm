import { useEffect, useId, useReducer, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { NewLeagueTeamWithoutRank } from "./types.ts";
import type { Conf, Div, Player, View } from "../../../common/types.ts";
import clsx from "clsx";
import { arrayMove } from "@dnd-kit/sortable";
import UpsertTeamModal from "./UpsertTeamModal.tsx";
import { StickyBottomButtons } from "../../components/index.tsx";
import { logEvent, toWorker } from "../../util/index.ts";
import confirmDeleteWithChildren from "./confirmDeleteWithChildren.tsx";
import { Dropdown, OverlayTrigger, Popover } from "react-bootstrap";
import { applyRealTeamInfos } from "./index.tsx";
import RandomizeTeamsModal, {
	type PopulationFactor,
} from "./RandomizeTeamsModal.tsx";
import { countBy, orderBy } from "../../../common/utils.ts";
import type { Continent } from "../../../common/geographicCoordinates.ts";
import { REAL_PLAYERS_INFO } from "../../../common/constants.ts";

export const makeTIDsSequential = <T extends { tid: number }>({
	teams,
	rewriteTids,
}: {
	teams: T[];
	rewriteTids: boolean;
}): T[] => {
	if (!rewriteTids) {
		return teams;
	}

	return teams.map((t, i) => ({
		...t,
		tid: i,
	}));
};

type ConfsDivsTeams = {
	confs: Conf[];
	divs: Div[];
	teams: NewLeagueTeamWithoutRank[];
};

const makeDIDsSequential = ({
	divs,
	teams,
	rewriteTids,
}: Pick<ConfsDivsTeams, "divs" | "teams"> & {
	rewriteTids: boolean;
}) => {
	const divsByDid: Record<number, Div> = {};
	const newDivs = orderBy(divs, "cid", "asc").map((div, newDid) => {
		const newDiv = {
			...div,
			did: newDid,
		};

		divsByDid[div.did] = newDiv;

		return newDiv;
	});

	const newTeams = makeTIDsSequential({ teams, rewriteTids }).map((t) => {
		const div = divsByDid[t.did];
		if (!div) {
			throw new Error("Invalid did");
		}

		return {
			...t,
			cid: div.cid,
			did: div.did,
		};
	});

	return {
		divs: newDivs,
		teams: newTeams,
	};
};

const makeCIDsSequential = ({
	confs,
	divs,
	teams,
	rewriteTids,
}: ConfsDivsTeams & {
	rewriteTids: boolean;
}) => {
	const newCids: Record<number, number> = {};
	const newConfs = confs.map((conf, newCid) => {
		if (newCid !== conf.cid) {
			newCids[conf.cid] = newCid;
		}

		return {
			...conf,
			cid: newCid,
		};
	});

	const newDivs = divs.map((row) => {
		const newCid = newCids[row.cid];
		if (newCid !== undefined) {
			return {
				...row,
				cid: newCid,
			};
		}

		return row;
	});

	return {
		confs: newConfs,
		...makeDIDsSequential({
			divs: newDivs,
			teams,
			rewriteTids,
		}),
	};
};

type State = ConfsDivsTeams;

type Action =
	| ({
			type: "setState";
	  } & ConfsDivsTeams)
	| {
			type: "addConf";
	  }
	| {
			type: "addDiv";
			cid: number;
	  }
	| {
			type: "addTeam";
			t: NewLeagueTeamWithoutRank;
	  }
	| {
			type: "renameConf";
			cid: number;
			name: string;
	  }
	| {
			type: "renameDiv";
			did: number;
			name: string;
	  }
	| {
			type: "editTeam";
			t: NewLeagueTeamWithoutRank;
	  }
	| {
			type: "moveConf";
			cid: number;
			direction: 1 | -1;
	  }
	| {
			type: "moveDiv";
			did: number;
			direction: 1 | -1;
	  }
	| {
			type: "deleteConf";
			cid: number;
			moveToCID?: number;
	  }
	| {
			type: "deleteDiv";
			did: number;
			moveToDID?: number;
	  }
	| {
			type: "deleteTeam";
			tid: number;
	  };

export const makeReducer = (
	rewriteTids: boolean,
	setDirty?: Dispatch<SetStateAction<boolean>>,
) => {
	return (state: State, action: Action): State => {
		if (setDirty) {
			setDirty(true);
		}

		switch (action.type) {
			case "setState":
				return {
					...state,
					...makeCIDsSequential({
						confs: action.confs,
						divs: action.divs,
						teams: action.teams,
						rewriteTids,
					}),
				};

			case "addConf": {
				const maxCID =
					state.confs.length > 0
						? Math.max(...state.confs.map((conf) => conf.cid))
						: -1;
				return {
					...state,
					confs: [
						...state.confs,
						{
							cid: maxCID + 1,
							name: "New Conference",
						},
					],
				};
			}

			case "addDiv": {
				const maxDID =
					state.divs.length > 0
						? Math.max(...state.divs.map((div) => div.did))
						: -1;
				return {
					...state,
					...makeDIDsSequential({
						divs: [
							...state.divs,
							{
								did: maxDID + 1,
								cid: action.cid,
								name: "New Division",
							},
						],
						teams: state.teams,
						rewriteTids,
					}),
				};
			}

			case "addTeam": {
				return {
					...state,
					teams: makeTIDsSequential({
						teams: [...state.teams, action.t],
						rewriteTids,
					}),
				};
			}

			case "renameConf":
				return {
					...state,
					confs: state.confs.map((conf) => {
						if (action.cid !== conf.cid) {
							return conf;
						}

						return {
							...conf,
							name: action.name,
						};
					}),
				};

			case "renameDiv":
				return {
					...state,
					divs: state.divs.map((div) => {
						if (action.did !== div.did) {
							return div;
						}

						return {
							...div,
							name: action.name,
						};
					}),
				};

			case "editTeam": {
				const newTeams = state.teams.map((t) => {
					if (t.tid !== action.t.tid) {
						return t;
					}

					return action.t;
				});
				return {
					...state,
					teams: makeTIDsSequential({ teams: newTeams, rewriteTids }),
				};
			}

			case "moveConf": {
				const oldIndex = state.confs.findIndex(
					(conf) => conf.cid === action.cid,
				);
				const newIndex = oldIndex + action.direction;

				if (newIndex < 0 || newIndex > state.confs.length - 1) {
					return state;
				}

				const newConfs = arrayMove(state.confs, oldIndex, newIndex);

				return makeCIDsSequential({
					confs: newConfs,
					divs: state.divs,
					teams: state.teams,
					rewriteTids,
				});
			}

			case "moveDiv": {
				// Make sure we're sorted by cid, to make moving between conferences easy
				const newDivs = orderBy(state.divs, "cid", "asc");

				const div = newDivs.find((div) => div.did === action.did);
				if (!div) {
					return state;
				}

				// See if we're moving at the boundary of the conference, in which case we need to switch to a new conference
				const divsLocal = newDivs.filter((div2) => div2.cid === div.cid);
				const indexLocal = divsLocal.findIndex((div) => div.did === action.did);
				let newCID = -1;
				if (
					(indexLocal === 0 && action.direction === -1) ||
					(indexLocal === divsLocal.length - 1 && action.direction === 1)
				) {
					const confIndex = state.confs.findIndex(
						(conf) => conf.cid === div.cid,
					);
					if (confIndex > 0 && action.direction === -1) {
						newCID = state.confs[confIndex - 1]!.cid;
					} else if (
						confIndex < state.confs.length - 1 &&
						action.direction === 1
					) {
						newCID = state.confs[confIndex + 1]!.cid;
					}
				}

				let newDivs2;
				if (newCID >= 0) {
					// Move to new conf
					newDivs2 = newDivs.map((div) => {
						if (action.did !== div.did) {
							return div;
						}

						return {
							...div,
							cid: newCID,
						};
					});
				} else {
					// Move within conf
					const oldIndex = newDivs.findIndex((div) => div.did === action.did);
					const newIndex = oldIndex + action.direction;

					if (newIndex < 0 || newIndex > newDivs.length - 1) {
						return state;
					}

					newDivs2 = arrayMove(newDivs, oldIndex, newIndex);
				}

				return {
					...state,
					...makeDIDsSequential({
						divs: newDivs2,
						teams: state.teams,
						rewriteTids,
					}),
				};
			}

			case "deleteConf": {
				const { moveToCID } = action;

				let newDivs;
				let newTeams;
				if (moveToCID === undefined) {
					// Delete children
					newDivs = state.divs.filter((div) => div.cid !== action.cid);
					newTeams = state.teams.filter((t) => t.cid !== action.cid);
				} else {
					// Move children
					newDivs = state.divs.map((div) => {
						if (div.cid !== action.cid) {
							return div;
						}

						return {
							...div,
							cid: moveToCID,
						};
					});
					newTeams = state.teams.map((t) => {
						if (t.cid !== action.cid) {
							return t;
						}

						return {
							...t,
							cid: moveToCID,
						};
					});
				}

				const newConfs = state.confs.filter((conf) => conf.cid !== action.cid);

				return makeCIDsSequential({
					confs: newConfs,
					divs: newDivs,
					teams: newTeams,
					rewriteTids,
				});
			}

			case "deleteDiv": {
				let newTeams;
				if (action.moveToDID === undefined) {
					// Delete children
					newTeams = state.teams.filter((t) => t.did !== action.did);
				} else {
					// Move children
					const div = state.divs.find((div) => div.did === action.moveToDID);
					if (!div) {
						throw new Error("div not found");
					}
					newTeams = state.teams.map((t) => {
						if (t.did !== action.did) {
							return t;
						}

						return {
							...t,
							did: div.did,
							cid: div.cid,
						};
					});
				}

				return {
					...state,
					...makeDIDsSequential({
						divs: state.divs.filter((div) => div.did !== action.did),
						teams: newTeams,
						rewriteTids,
					}),
				};
			}

			case "deleteTeam":
				return {
					...state,
					teams: makeTIDsSequential({
						teams: state.teams.filter((t) => t.tid !== action.tid),
						rewriteTids,
					}),
				};

			default:
				throw new Error();
		}
	};
};

const reducer = makeReducer(true);

const PlayersButton = ({
	players,
	usePlayers,
}: {
	players: Player[];
	usePlayers?: boolean;
}) => {
	const popoverId = useId();

	if (!usePlayers) {
		return null;
	}

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={
				<Popover id={popoverId}>
					<Popover.Header>Top Players</Popover.Header>
					<Popover.Body>
						<ul className="list-unstyled mb-0">
							{orderBy(players, (p) => p.ratings.at(-1).ovr, "desc")
								.slice(0, 10)
								.map((p) => {
									const ratings = p.ratings.at(-1)!;
									return (
										<li key={p.pid}>
											{p.firstName} {p.lastName} - {ratings.ovr} ovr,{" "}
											{ratings.pot} pot
										</li>
									);
								})}
						</ul>
					</Popover.Body>
				</Popover>
			}
			rootClose
		>
			<button
				className="ms-2 btn btn-link p-0 border-0 text-reset"
				title="Players"
				type="button"
			>
				<span className="glyphicon glyphicon-user" />
			</button>
		</OverlayTrigger>
	);
};

const EditButton = ({ onClick }: { onClick: () => void }) => {
	return (
		<button
			className="ms-2 btn btn-link p-0 border-0 text-reset"
			onClick={onClick}
			title="Edit"
			type="button"
		>
			<span className="glyphicon glyphicon-edit" />
		</button>
	);
};

const DeleteButton = ({
	disabled,
	onClick,
}: {
	disabled?: boolean;
	onClick: () => void;
}) => {
	return (
		<button
			className={clsx(
				"ms-2 btn btn-link p-0 border-0",
				disabled ? undefined : "text-danger",
			)}
			disabled={disabled}
			onClick={onClick}
			title="Delete"
			type="button"
		>
			<span className="glyphicon glyphicon-remove" />
		</button>
	);
};

const CardHeader = ({
	alignButtonsRight,
	name,
	onDelete,
	onMoveDown,
	onMoveUp,
	onRename,
	disableDelete,
	disableMoveUp,
	disableMoveDown,
}: {
	alignButtonsRight?: boolean;
	name: string;
	onDelete: () => void;
	onMoveDown: () => void;
	onMoveUp: () => void;
	onRename: (name: string) => void;
	disableDelete: boolean;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
}) => {
	const [renaming, setRenaming] = useState(false);
	const [controlledName, setControlledName] = useState(name);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (renaming && inputRef.current) {
			inputRef.current.select();
		}
	}, [renaming]);

	return (
		<div className={clsx("card-header", renaming ? "p-1" : "px-2")}>
			{renaming ? (
				<form
					className="d-flex"
					onSubmit={(event) => {
						event.preventDefault();
						onRename(controlledName);
						setRenaming(false);
					}}
					style={{ maxWidth: 300 }}
				>
					<input
						ref={inputRef}
						type="text"
						className="form-control me-2"
						value={controlledName}
						onChange={(event) => {
							setControlledName(event.target.value);
						}}
					/>
					<button type="submit" className="btn btn-primary">
						Save
					</button>
				</form>
			) : (
				<div className="d-flex">
					<div
						className={clsx(
							"btn btn-link p-0 border-0 text-reset text-decoration-none",
							alignButtonsRight ? "me-auto" : "me-2",
						)}
						onClick={() => {
							setRenaming(true);
						}}
					>
						{name}
					</div>
					<button
						className="ms-2 btn btn-link p-0 border-0 text-reset"
						title="Move Up"
						type="button"
						onClick={onMoveUp}
						disabled={disableMoveUp}
					>
						<span className="glyphicon glyphicon-menu-left" />
					</button>
					<button
						className="ms-2 btn btn-link p-0 border-0 text-reset"
						title="Move Down"
						type="button"
						onClick={onMoveDown}
						disabled={disableMoveDown}
					>
						<span className="glyphicon glyphicon-menu-right" />
					</button>
					<EditButton
						onClick={() => {
							setRenaming(true);
						}}
					/>
					<DeleteButton disabled={disableDelete} onClick={onDelete} />
				</div>
			)}
		</div>
	);
};

const AddTeam = ({
	addTeam,
	did,
}: {
	addTeam: (did: number) => void;
	did: number;
}) => {
	return (
		<div className="d-flex p-0 m-2 justify-content-end">
			<button
				className="btn btn-light-bordered"
				onClick={() => {
					addTeam(did);
				}}
			>
				Add team
			</button>
		</div>
	);
};

const Division = ({
	allowDeleteTeams,
	div,
	divs,
	confs,
	teams,
	dispatch,
	disableMoveUp,
	disableMoveDown,
	addTeam,
	editTeam,
	abbrevsUsedMultipleTimes,
}: {
	allowDeleteTeams: boolean;
	div: Div;
	divs: Div[];
	confs: Conf[];
	teams: NewLeagueTeamWithoutRank[];
	dispatch: Dispatch<Action>;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
	addTeam: ((did: number) => void) | undefined;
	editTeam: (tid: number, did: number) => void;
	abbrevsUsedMultipleTimes: string[];
}) => {
	return (
		<div className="card mt-3">
			<CardHeader
				alignButtonsRight
				name={div.name}
				onDelete={async () => {
					if (teams.length === 0) {
						dispatch({ type: "deleteDiv", did: div.did });
					} else {
						const siblings = divs
							.filter((div2) => div2.did !== div.did)
							.map((div2) => {
								const conf = confs.find((conf) => conf.cid === div2.cid);
								return {
									key: div2.did,
									text: `Move teams to "${div2.name}" division (${
										conf ? conf.name : "unknown conference"
									})`,
								};
							});
						const { proceed, key } = await confirmDeleteWithChildren({
							text: `When the "${div.name}" division is deleted, what should happen to its teams?`,
							deleteButtonText: "Delete division",
							deleteChildrenText: allowDeleteTeams
								? `Delete all teams in the "${div.name}" division`
								: undefined,
							siblings,
						});

						if (proceed) {
							dispatch({ type: "deleteDiv", did: div.did, moveToDID: key });
						}
					}
				}}
				onMoveDown={() => {
					dispatch({ type: "moveDiv", did: div.did, direction: 1 });
				}}
				onMoveUp={() => {
					dispatch({ type: "moveDiv", did: div.did, direction: -1 });
				}}
				onRename={(name: string) => {
					dispatch({ type: "renameDiv", did: div.did, name });
				}}
				disableDelete={!allowDeleteTeams && divs.length === 1}
				disableMoveUp={disableMoveUp}
				disableMoveDown={disableMoveDown}
			/>

			<ul className="list-group list-group-flush">
				{teams.map((t) => (
					<li key={t.tid} className="list-group-item d-flex px-2">
						<div className="me-auto">
							{t.season !== undefined ? (
								<span className="text-body-secondary">{t.season} </span>
							) : null}
							{t.region} {t.name}{" "}
							<span
								className={
									abbrevsUsedMultipleTimes.includes(t.abbrev)
										? "text-danger"
										: undefined
								}
							>
								({t.abbrev})
							</span>
						</div>
						{t.players ? (
							<PlayersButton players={t.players} usePlayers={t.usePlayers} />
						) : null}
						<EditButton
							onClick={() => {
								editTeam(t.tid, t.did);
							}}
						/>
						{allowDeleteTeams ? (
							<DeleteButton
								onClick={() => {
									dispatch({ type: "deleteTeam", tid: t.tid });
								}}
							/>
						) : null}
					</li>
				))}
			</ul>

			{addTeam ? <AddTeam addTeam={addTeam} did={div.did} /> : null}
		</div>
	);
};

const Conference = ({
	allowDeleteTeams,
	conf,
	confs,
	divs,
	teams,
	dispatch,
	disableMoveUp,
	disableMoveDown,
	addTeam,
	editTeam,
	abbrevsUsedMultipleTimes,
}: {
	allowDeleteTeams: boolean;
	conf: Conf;
	confs: Conf[];
	divs: Div[];
	teams: NewLeagueTeamWithoutRank[];
	dispatch: Dispatch<Action>;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
	addTeam: ((did: number) => void) | undefined;
	editTeam: (tid: number, did: number) => void;
	abbrevsUsedMultipleTimes: string[];
}) => {
	const children = divs.filter((div) => div.cid === conf.cid);

	return (
		<div className="card mb-2">
			<CardHeader
				name={conf.name}
				onDelete={async () => {
					if (children.length === 0) {
						dispatch({ type: "deleteConf", cid: conf.cid });
					} else {
						const siblings = confs
							.filter((conf2) => conf2.cid !== conf.cid)
							.map((conf2) => ({
								key: conf2.cid,
								text: `Move divisions to "${conf2.name}" conference`,
							}));
						const { proceed, key } = await confirmDeleteWithChildren({
							text: `When the "${conf.name}" conference is deleted, what should happen to its divisions?`,
							deleteButtonText: "Delete Conference",
							deleteChildrenText: allowDeleteTeams
								? `Delete all divisions in the "${conf.name}" conference`
								: undefined,
							siblings,
						});

						if (proceed) {
							dispatch({ type: "deleteConf", cid: conf.cid, moveToCID: key });
						}
					}
				}}
				onMoveDown={() => {
					dispatch({ type: "moveConf", cid: conf.cid, direction: 1 });
				}}
				onMoveUp={() => {
					dispatch({ type: "moveConf", cid: conf.cid, direction: -1 });
				}}
				disableDelete={!allowDeleteTeams && confs.length === 1}
				disableMoveUp={disableMoveUp}
				disableMoveDown={disableMoveDown}
				onRename={(name: string) => {
					dispatch({ type: "renameConf", cid: conf.cid, name });
				}}
			/>

			<div className="row mx-0">
				{children.map((div, i) => (
					<div className="col-sm-6 col-md-4" key={div.did}>
						<Division
							allowDeleteTeams={allowDeleteTeams}
							div={div}
							divs={divs}
							confs={confs}
							dispatch={dispatch}
							teams={teams.filter((t) => t.did === div.did)}
							disableMoveUp={i === 0 && disableMoveUp}
							disableMoveDown={i === divs.length - 1 && disableMoveDown}
							addTeam={addTeam}
							editTeam={editTeam}
							abbrevsUsedMultipleTimes={abbrevsUsedMultipleTimes}
						/>
					</div>
				))}
			</div>

			<div className="card-body p-0 m-2 d-flex">
				<button
					className="btn btn-light-bordered ms-auto"
					onClick={() => {
						dispatch({ type: "addDiv", cid: conf.cid });
					}}
					style={{
						marginRight: 9,
					}}
				>
					Add division
				</button>
			</div>
		</div>
	);
};

export const Conferences = ({
	allowDeleteTeams,
	confs,
	divs,
	teams,
	dispatch,
	addTeam,
	editTeam,
	abbrevsUsedMultipleTimes,
}: {
	allowDeleteTeams: boolean;
	confs: Conf[];
	divs: Div[];
	teams: NewLeagueTeamWithoutRank[];
	dispatch: Dispatch<Action>;
	addTeam: ((did: number) => void) | undefined;
	editTeam: (tid: number, did: number) => void;
	abbrevsUsedMultipleTimes: string[];
}) => {
	return (
		<>
			{confs.map((conf, i) => (
				<Conference
					key={conf.cid}
					conf={conf}
					confs={confs}
					divs={divs}
					teams={teams}
					dispatch={dispatch}
					disableMoveUp={i === 0}
					disableMoveDown={i === confs.length - 1}
					allowDeleteTeams={allowDeleteTeams}
					addTeam={addTeam}
					editTeam={editTeam}
					abbrevsUsedMultipleTimes={abbrevsUsedMultipleTimes}
				/>
			))}
			<div className="mb-3 d-flex">
				<button
					className="btn btn-light-bordered ms-auto"
					onClick={() => {
						dispatch({ type: "addConf" });
					}}
					style={{
						marginRight: 18,
					}}
				>
					Add conference
				</button>
			</div>
		</>
	);
};

// Store all info in every object so we automatically use previous values when adding a second team
export type AddEditTeamInfo = {
	type: "none" | "add" | "edit";
	addType: "random" | "real" | "league";
	did: number;
	lid: number | undefined;
	seasonLeague: number | undefined;
	seasonReal: number;
	tidEdit: number;
	hideDupeAbbrevs: boolean;
};

export const getAbbrevsUsedMultipleTimes = (
	teams: NewLeagueTeamWithoutRank[],
) => {
	const abbrevCounts = countBy(teams, "abbrev");
	const abbrevsUsedMultipleTimes: string[] = [];
	for (const [abbrev, count] of Object.entries(abbrevCounts)) {
		if (count > 1) {
			abbrevsUsedMultipleTimes.push(abbrev);
		}
	}

	return abbrevsUsedMultipleTimes;
};

const CustomizeTeams = ({
	onCancel,
	onSave,
	initialConfs,
	initialDivs,
	initialTeams,
	getDefaultConfsDivsTeams,
	godModeLimits,
	realTeamInfo,
}: {
	onCancel: () => void;
	onSave: (obj: ConfsDivsTeams) => void;
	initialConfs: Conf[];
	initialDivs: Div[];
	initialTeams: NewLeagueTeamWithoutRank[];
	getDefaultConfsDivsTeams: () => ConfsDivsTeams;
} & Pick<View<"newLeague">, "godModeLimits" | "realTeamInfo">) => {
	const [{ confs, divs, teams }, dispatch] = useReducer(reducer, {
		confs: [...initialConfs],
		divs: [...initialDivs],
		teams: [...initialTeams],
	});

	const [addEditTeamInfo, setAddEditTeamInfo] = useState<AddEditTeamInfo>({
		type: "none",
		addType: "random",
		did: 0,
		lid: undefined,
		seasonLeague: undefined,
		seasonReal: REAL_PLAYERS_INFO?.MAX_SEASON ?? 0,
		tidEdit: 0,
		hideDupeAbbrevs: false,
	});

	const [randomizingState, setRandomizingState] = useState<
		undefined | "modal" | "randomizing"
	>();

	const editTeam = (tidEdit: number, did: number) => {
		setAddEditTeamInfo({
			...addEditTeamInfo,
			type: "edit",
			tidEdit,
			did,
		});
	};

	const addTeam = (did: number) => {
		setAddEditTeamInfo({ ...addEditTeamInfo, type: "add", did });
	};

	const abbrevsUsedMultipleTimes = getAbbrevsUsedMultipleTimes(teams);

	const resetClear = () => {
		dispatch({
			type: "setState",
			confs: [
				{
					cid: 0,
					name: "New Conference",
				},
			],
			divs: [
				{
					did: 0,
					cid: 0,
					name: "New Division",
				},
			],
			teams: [],
		});
	};

	const resetDefault = () => {
		const info = getDefaultConfsDivsTeams();
		dispatch({
			type: "setState",
			...info,
		});
	};

	const randomize = async ({
		real,
		populationFactor,
		continents,
		newConfDivNums,
		seasonRange,
	}: {
		real: boolean;
		populationFactor: PopulationFactor;
		continents: ReadonlyArray<Continent>;
		newConfDivNums: Record<"confs" | "divs" | "teams", number> | undefined;
		seasonRange: [number, number];
	}) => {
		let myConfs;
		let myDivs;
		let numTeamsPerDiv;
		if (newConfDivNums) {
			myConfs = [];
			myDivs = [];
			let did = 0;
			for (let cid = 0; cid < newConfDivNums.confs; cid++) {
				myConfs.push({
					cid,
					name: `Conf ${cid + 1}`,
				});
				for (let i = 0; i < newConfDivNums.divs; i++) {
					myDivs.push({
						did,
						cid,
						name: `Div ${did + 1}`,
					});
					did += 1;
				}
			}

			numTeamsPerDiv = myDivs.map(() => newConfDivNums.teams);
		} else {
			myConfs = confs;
			myDivs = divs;
			let myTeams = teams;

			// If there are no teams, auto reset to default
			if (myTeams.length === 0) {
				const info = getDefaultConfsDivsTeams();
				myConfs = info.confs;
				myDivs = info.divs;
				myTeams = info.teams;
			}

			numTeamsPerDiv = myDivs.map(
				(div) => myTeams.filter((t) => t.did === div.did).length,
			);
		}

		const response = await toWorker("main", "getRandomTeams", {
			divInfo: {
				type: "explicit",
				confs: myConfs,
				divs: myDivs,
				numTeamsPerDiv,
			},
			real,
			populationFactor,
			continents,
			seasonRange,
		});

		if (typeof response === "string") {
			throw new Error(response);
		} else {
			const newTeams = real
				? applyRealTeamInfos(response.teams, realTeamInfo, "inTeamObject")
				: response.teams;

			dispatch({
				type: "setState",
				teams: newTeams,
				divs: myDivs,
				confs: myConfs,
			});
		}
		setRandomizingState(undefined);
	};

	return (
		<>
			<Conferences
				allowDeleteTeams
				confs={confs}
				divs={divs}
				teams={teams}
				dispatch={dispatch}
				addTeam={addTeam}
				editTeam={editTeam}
				abbrevsUsedMultipleTimes={abbrevsUsedMultipleTimes}
			/>

			<StickyBottomButtons>
				<Dropdown>
					<Dropdown.Toggle
						variant="danger"
						id="customize-teams-reset"
						disabled={randomizingState === "modal"}
					>
						Reset
					</Dropdown.Toggle>
					<Dropdown.Menu>
						<Dropdown.Item onClick={resetClear}>Clear</Dropdown.Item>
						<Dropdown.Item onClick={resetDefault}>Default</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
				<button
					className="btn btn-secondary ms-2"
					onClick={() => {
						setRandomizingState("modal");
					}}
				>
					Randomize...
				</button>
				<form
					className="btn-group ms-auto"
					onSubmit={(event) => {
						event.preventDefault();

						if (abbrevsUsedMultipleTimes.length > 0) {
							logEvent({
								type: "error",
								text: `You cannot use the same abbrev for multiple teams: ${abbrevsUsedMultipleTimes.join(
									", ",
								)}`,
								saveToDb: false,
							});
							return;
						}

						if (teams.length < 2) {
							logEvent({
								type: "error",
								text: "Your league must have at least 2 teams in it.",
								saveToDb: false,
							});
							return;
						}

						onSave({ confs, divs, teams });
					}}
				>
					<button
						className="btn btn-secondary"
						type="button"
						onClick={onCancel}
						disabled={randomizingState === "modal"}
					>
						Cancel
					</button>
					<button
						className="btn btn-primary me-2"
						type="submit"
						disabled={randomizingState === "modal"}
					>
						Save<span className="d-none d-sm-inline"> teams</span>
					</button>
				</form>
			</StickyBottomButtons>

			<RandomizeTeamsModal
				onCancel={() => {
					setRandomizingState(undefined);
				}}
				onRandomize={randomize}
				show={randomizingState === "modal"}
			/>

			<UpsertTeamModal
				key={
					addEditTeamInfo.type === "edit"
						? addEditTeamInfo.tidEdit
						: addEditTeamInfo.type
				}
				addEditTeamInfo={addEditTeamInfo}
				setAddEditTeamInfo={setAddEditTeamInfo}
				// These are like Conf[] here rather than NonEmptyArray<Conf> because they can all be deleted, but the button to show UpsertTeamModal is only displayed if there is at least one div+conf so this is fine.
				confs={confs as any}
				divs={divs as any}
				teams={teams}
				onSave={(t: NewLeagueTeamWithoutRank) => {
					if (t.tid === -1) {
						dispatch({ type: "addTeam", t });
					} else {
						dispatch({ type: "editTeam", t });
					}
					setAddEditTeamInfo({ ...addEditTeamInfo, type: "none" });
				}}
				onCancel={() => {
					setAddEditTeamInfo({ ...addEditTeamInfo, type: "none" });
				}}
				godModeLimits={godModeLimits}
				realTeamInfo={realTeamInfo}
			/>
		</>
	);
};

export default CustomizeTeams;
