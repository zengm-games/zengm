import { useReducer, useState } from "react";
import type { Dispatch } from "react";
import type { NewLeagueTeamWithoutRank } from "./types";
import type { Conf, Div, Player, View } from "../../../common/types";
import classNames from "classnames";
import { arrayMoveImmutable } from "array-move";
import orderBy from "lodash-es/orderBy";
import UpsertTeamModal from "./UpsertTeamModal";
import countBy from "lodash-es/countBy";
import { StickyBottomButtons } from "../../components";
import { logEvent, toWorker } from "../../util";
import confirmDeleteWithChlidren from "./confirmDeleteWithChlidren";
import { Dropdown, OverlayTrigger, Popover } from "react-bootstrap";
import { ProcessingSpinner } from "../../components/ActionButton";
import { applyRealTeamInfos, MAX_SEASON } from ".";
import RandomizeTeamsModal from "./RandomizeTeamsModal";

export const makeTIDsSequential = <T extends { tid: number }>(
	teams: T[],
): T[] => {
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

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "setState":
			return {
				...state,
				confs: action.confs,
				divs: action.divs,
				teams: makeTIDsSequential(action.teams),
			};

		case "addConf": {
			const maxCID =
				state.confs.length > 0
					? Math.max(...state.confs.map(conf => conf.cid))
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
					? Math.max(...state.divs.map(div => div.did))
					: -1;
			return {
				...state,
				divs: [
					...state.divs,
					{
						did: maxDID + 1,
						cid: action.cid,
						name: "New Division",
					},
				],
			};
		}

		case "addTeam": {
			return {
				...state,
				teams: makeTIDsSequential([...state.teams, action.t]),
			};
		}

		case "renameConf":
			return {
				...state,
				confs: state.confs.map(conf => {
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
				divs: state.divs.map(div => {
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
			const newTeams = state.teams.map(t => {
				if (t.tid !== action.t.tid) {
					return t;
				}

				return action.t;
			});
			return {
				...state,
				teams: makeTIDsSequential(newTeams),
			};
		}

		case "moveConf": {
			const oldIndex = state.confs.findIndex(conf => conf.cid === action.cid);
			const newIndex = oldIndex + action.direction;

			if (newIndex < 0 || newIndex > state.confs.length - 1) {
				return state;
			}

			const newConfs = arrayMoveImmutable(state.confs, oldIndex, newIndex);

			return {
				...state,
				confs: newConfs,
			};
		}

		case "moveDiv": {
			// Make sure we're sorted by cid, to make moving between conferences easy
			const newDivs = orderBy(state.divs, "cid", "asc");

			const div = newDivs.find(div => div.did === action.did);
			if (!div) {
				return state;
			}

			// See if we're moving at the boundary of the conference, in which case we need to switch to a new conference
			const divsLocal = newDivs.filter(div2 => div2.cid === div.cid);
			const indexLocal = divsLocal.findIndex(div => div.did === action.did);
			let newCID = -1;
			if (
				(indexLocal === 0 && action.direction === -1) ||
				(indexLocal === divsLocal.length - 1 && action.direction === 1)
			) {
				const confIndex = state.confs.findIndex(conf => conf.cid === div.cid);
				if (confIndex > 0 && action.direction === -1) {
					newCID = state.confs[confIndex - 1].cid;
				} else if (
					confIndex < state.confs.length - 1 &&
					action.direction === 1
				) {
					newCID = state.confs[confIndex + 1].cid;
				}
			}

			if (newCID >= 0) {
				return {
					...state,
					divs: newDivs.map(div => {
						if (action.did !== div.did) {
							return div;
						}

						return {
							...div,
							cid: newCID,
						};
					}),
				};
			}

			// Normal move
			const oldIndex = newDivs.findIndex(div => div.did === action.did);
			const newIndex = oldIndex + action.direction;

			if (newIndex < 0 || newIndex > newDivs.length - 1) {
				return state;
			}

			const newDivs2 = arrayMoveImmutable(newDivs, oldIndex, newIndex);

			return {
				...state,
				divs: newDivs2,
			};
		}

		case "deleteConf": {
			const { moveToCID } = action;

			let newDivs;
			let newTeams;
			if (moveToCID === undefined) {
				// Delete children
				newDivs = state.divs.filter(div => div.cid !== action.cid);
				newTeams = state.teams.filter(t => t.cid !== action.cid);
			} else {
				// Move children
				newDivs = state.divs.map(div => {
					if (div.cid !== action.cid) {
						return div;
					}

					return {
						...div,
						cid: moveToCID,
					};
				});
				newTeams = state.teams.map(t => {
					if (t.cid !== action.cid) {
						return t;
					}

					return {
						...t,
						cid: moveToCID,
					};
				});
			}

			return {
				confs: state.confs.filter(conf => conf.cid !== action.cid),
				divs: newDivs,
				teams: makeTIDsSequential(newTeams),
			};
		}

		case "deleteDiv": {
			let newTeams;
			if (action.moveToDID === undefined) {
				// Delete children
				newTeams = state.teams.filter(t => t.did !== action.did);
			} else {
				// Move children
				const div = state.divs.find(div => div.did === action.moveToDID);
				if (!div) {
					throw new Error("div not found");
				}
				newTeams = state.teams.map(t => {
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
				divs: state.divs.filter(div => div.did !== action.did),
				teams: makeTIDsSequential(newTeams),
			};
		}

		case "deleteTeam":
			return {
				...state,
				teams: makeTIDsSequential(
					state.teams.filter(t => t.tid !== action.tid),
				),
			};

		default:
			throw new Error();
	}
};

const PlayersButton = ({
	players,
	usePlayers,
}: {
	players: Player[];
	usePlayers?: boolean;
}) => {
	if (!usePlayers) {
		return null;
	}

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={
				<Popover id={String(Math.random())}>
					<Popover.Header>Top Players</Popover.Header>
					<Popover.Body>
						<ul className="list-unstyled mb-0">
							{orderBy(players, p => p.ratings.at(-1).ovr, "desc")
								.slice(0, 10)
								.map(p => {
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

const DeleteButton = ({ onClick }: { onClick: () => void }) => {
	return (
		<button
			className="ms-2 btn btn-link text-danger p-0 border-0"
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
	disableMoveUp,
	disableMoveDown,
}: {
	alignButtonsRight?: boolean;
	name: string;
	onDelete: () => void;
	onMoveDown: () => void;
	onMoveUp: () => void;
	onRename: (name: string) => void;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
}) => {
	const [renaming, setRenaming] = useState(false);
	const [controlledName, setControlledName] = useState(name);

	return (
		<div className={classNames("card-header", renaming ? "p-1" : "px-2")}>
			{renaming ? (
				<form
					className="d-flex"
					onSubmit={event => {
						event.preventDefault();
						onRename(controlledName);
						setRenaming(false);
					}}
					style={{ maxWidth: 300 }}
				>
					<input
						type="text"
						className="form-control me-2"
						value={controlledName}
						onChange={event => {
							setControlledName(event.target.value);
						}}
					/>
					<button type="submit" className="btn btn-primary">
						Save
					</button>
				</form>
			) : (
				<div className="d-flex">
					<div className={alignButtonsRight ? "me-auto" : "me-2"}>{name}</div>
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
					<DeleteButton onClick={onDelete} />
				</div>
			)}
		</div>
	);
};

const AddTeam = ({
	showAddEditTeamModal,
	did,
}: {
	showAddEditTeamModal: (did: number) => void;
	did: number;
}) => {
	return (
		<div className="d-flex p-0 m-2 justify-content-end">
			<button
				className="btn btn-light-bordered"
				onClick={() => {
					showAddEditTeamModal(did);
				}}
			>
				Add Team
			</button>
		</div>
	);
};

const Division = ({
	div,
	divs,
	confs,
	teams,
	dispatch,
	showAddEditTeamModal,
	editTeam,
	disableMoveUp,
	disableMoveDown,
	abbrevsUsedMultipleTimes,
}: {
	div: Div;
	divs: Div[];
	confs: Conf[];
	teams: NewLeagueTeamWithoutRank[];
	dispatch: Dispatch<Action>;
	showAddEditTeamModal: (did: number) => void;
	editTeam: (tid: number, did: number) => void;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
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
							.filter(div2 => div2.did !== div.did)
							.map(div2 => {
								const conf = confs.find(conf => conf.cid === div2.cid);
								return {
									key: div2.did,
									text: `Move teams to "${div2.name}" division (${
										conf ? conf.name : "unknown conference"
									})`,
								};
							});
						const { proceed, key } = await confirmDeleteWithChlidren({
							text: `When the "${div.name}" division is deleted, what should happen to its teams?`,
							deleteButtonText: "Delete Division",
							deleteChildrenText: `Delete all teams in the "${div.name}" division`,
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
				disableMoveUp={disableMoveUp}
				disableMoveDown={disableMoveDown}
			/>

			<ul className="list-group list-group-flush">
				{teams.map(t => (
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
						<DeleteButton
							onClick={() => {
								dispatch({ type: "deleteTeam", tid: t.tid });
							}}
						/>
					</li>
				))}
			</ul>

			<AddTeam showAddEditTeamModal={showAddEditTeamModal} did={div.did} />
		</div>
	);
};

const Conference = ({
	conf,
	confs,
	divs,
	teams,
	dispatch,
	showAddEditTeamModal,
	editTeam,
	disableMoveUp,
	disableMoveDown,
	abbrevsUsedMultipleTimes,
}: {
	conf: Conf;
	confs: Conf[];
	divs: Div[];
	teams: NewLeagueTeamWithoutRank[];
	dispatch: Dispatch<Action>;
	showAddEditTeamModal: (did: number) => void;
	editTeam: (tid: number, did: number) => void;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
	abbrevsUsedMultipleTimes: string[];
}) => {
	const children = divs.filter(div => div.cid === conf.cid);

	return (
		<div className="card mb-2">
			<CardHeader
				name={conf.name}
				onDelete={async () => {
					if (children.length === 0) {
						dispatch({ type: "deleteConf", cid: conf.cid });
					} else {
						const siblings = confs
							.filter(conf2 => conf2.cid !== conf.cid)
							.map(conf2 => ({
								key: conf2.cid,
								text: `Move divisions to "${conf2.name}" conference`,
							}));
						const { proceed, key } = await confirmDeleteWithChlidren({
							text: `When the "${conf.name}" conference is deleted, what should happen to its divisions?`,
							deleteButtonText: "Delete Conference",
							deleteChildrenText: `Delete all divisions in the "${conf.name}" conference`,
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
							div={div}
							divs={divs}
							confs={confs}
							dispatch={dispatch}
							showAddEditTeamModal={showAddEditTeamModal}
							editTeam={editTeam}
							teams={teams.filter(t => t.did === div.did)}
							disableMoveUp={i === 0 && disableMoveUp}
							disableMoveDown={i === divs.length - 1 && disableMoveDown}
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
					Add Division
				</button>
			</div>
		</div>
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
		seasonReal: MAX_SEASON,
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

	const showAddEditTeamModal = (did: number) => {
		setAddEditTeamInfo({ ...addEditTeamInfo, type: "add", did });
	};

	const abbrevCounts = countBy(teams, "abbrev");
	const abbrevsUsedMultipleTimes: string[] = [];
	for (const [abbrev, count] of Object.entries(abbrevCounts)) {
		if (count > 1) {
			abbrevsUsedMultipleTimes.push(abbrev);
		}
	}

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
		weightByPopulation,
		northAmericaOnly,
	}: {
		real: boolean;
		weightByPopulation: boolean;
		northAmericaOnly: boolean;
	}) => {
		setRandomizingState("randomizing");

		try {
			// If there are no teams, auto reset to default first
			let myDivs = divs;
			let myTeams = teams;
			let myConfs = confs;
			if (myTeams.length === 0) {
				const info = getDefaultConfsDivsTeams();
				myDivs = info.divs;
				myTeams = info.teams;
				myConfs = info.confs;
			}

			const numTeamsPerDiv = myDivs.map(
				div => myTeams.filter(t => t.did === div.did).length,
			);

			const response = await toWorker("main", "getRandomTeams", {
				divs: myDivs,
				numTeamsPerDiv,
				real,
				weightByPopulation,
				northAmericaOnly,
			});

			if (typeof response === "string") {
				logEvent({
					type: "error",
					text: response,
					saveToDb: false,
				});
			} else {
				const newTeams = real
					? applyRealTeamInfos(response, realTeamInfo, "inTeamObject")
					: response;

				dispatch({
					type: "setState",
					teams: newTeams,
					divs: myDivs,
					confs: myConfs,
				});
			}
			setRandomizingState(undefined);
		} catch (error) {
			setRandomizingState(undefined);
			throw error;
		}
	};

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
					showAddEditTeamModal={showAddEditTeamModal}
					editTeam={editTeam}
					disableMoveUp={i === 0}
					disableMoveDown={i === confs.length - 1}
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
					Add Conference
				</button>
			</div>

			<StickyBottomButtons>
				<Dropdown>
					<Dropdown.Toggle
						variant="danger"
						id="customize-teams-reset"
						disabled={randomizingState === "randomizing"}
					>
						{randomizingState === "randomizing" ? (
							<ProcessingSpinner />
						) : (
							"Reset"
						)}
					</Dropdown.Toggle>
					<Dropdown.Menu>
						<Dropdown.Item onClick={resetClear}>Clear</Dropdown.Item>
						<Dropdown.Item onClick={resetDefault}>Default</Dropdown.Item>
						<Dropdown.Item
							onClick={() => {
								setRandomizingState("modal");
							}}
						>
							Randomize...
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
				<form
					className="btn-group ms-auto"
					onSubmit={event => {
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
						disabled={randomizingState === "randomizing"}
					>
						Cancel
					</button>
					<button
						className="btn btn-primary me-2"
						type="submit"
						disabled={randomizingState === "randomizing"}
					>
						Save Teams
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
				confs={confs}
				divs={divs}
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
