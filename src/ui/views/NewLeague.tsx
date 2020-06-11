import orderBy from "lodash/orderBy";
import PropTypes from "prop-types";
import React, {
	useCallback,
	useState,
	useRef,
	useReducer,
	useEffect,
} from "react";
import { DIFFICULTY, applyRealTeamInfo } from "../../common";
import { LeagueFileUpload, PopText } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { confirm, helpers, logEvent, realtimeUpdate, toWorker } from "../util";
import type { View, RealTeamInfo, GetLeagueOptions } from "../../common/types";
import classNames from "classnames";

type NewLeagueTeam = {
	tid: number;
	region: string;
	name: string;
	pop?: number;
	popRank: number;
	srID?: string;
	disabled?: boolean;
};

type LeagueInfo = {
	startingSeason: number;
	stores: string[];
	teams: NewLeagueTeam[];
};

const applyRealTeamInfos = (
	teams: NewLeagueTeam[],
	realTeamInfo: RealTeamInfo | undefined,
	season: number = new Date().getFullYear(),
) => {
	if (!realTeamInfo) {
		return teams;
	}

	return teams.map(t => {
		if (t.srID && realTeamInfo[t.srID]) {
			const t2 = helpers.deepCopy(t);
			applyRealTeamInfo(t2, realTeamInfo, season);
			return t2;
		}

		return t;
	});
};

const teamsDefault: NewLeagueTeam[] = helpers.addPopRank(
	helpers.getTeamsDefault(),
);

const leaguePartDescriptions: { [key: string]: string } = {
	gameAttributes: "League settings",
	startingSeason: "Starting season",
	players: "Players, including ratings and stats",
	teams: "Teams",
	teamSeason: "Team seasons history",
	teamStats: "Team stats history",
	allStars: "All-Star Game history",
	awards: "Awards history",
	games: "Box scores",
	releasedPlayers: "Contracts owed to released players",
	draftLotteryResults: "Draft lottery history",
	events: "Event log",
	negotiations: "In-progress contract negotiations",
	trade: "In-progress trade negotiations",
	meta: "League metadata, like league name",
	messages: "Messages from the owner",
	playerFeats: "Statistical feats",
	playoffSeries: "Upcoming and historical playoff series",
	schedule: "Upcoming schedule",
	draftPicks: "Traded future draft picks",
	scheduledEvents: "Scheduled events, like expansion and league rule changes",
};

const initKeptKeys = ({
	leagueFile,
	newAllKeys,
	oldKeptKeys,
	oldAllKeys,
}:
	| {
			leagueFile: any;
			newAllKeys?: undefined;
			oldKeptKeys?: string[];
			oldAllKeys?: string[];
	  }
	| {
			leagueFile?: undefined;
			newAllKeys: string[];
			oldKeptKeys?: string[];
			oldAllKeys?: string[];
	  }) => {
	let allKeys;
	if (newAllKeys) {
		allKeys = newAllKeys;
	} else {
		allKeys = leagueFile
			? Object.keys(leagueFile).filter(key => key !== "version")
			: [];
	}

	let keptKeys;
	if (!oldKeptKeys || !oldAllKeys) {
		keptKeys = allKeys;
	} else {
		// If any were unchecked before, keep them unchecked now
		keptKeys = allKeys.filter(key => {
			if (!oldAllKeys.includes(key)) {
				return true;
			}

			return oldKeptKeys.includes(key);
		});
	}

	return {
		allKeys,
		keptKeys,
	};
};

const LeaguePartPicker = ({
	allKeys,
	keptKeys,
	setKeptKeys,
}: {
	allKeys: string[];
	keptKeys: string[];
	setKeptKeys: (keys: string[]) => void;
}) => {
	if (allKeys.length === 0) {
		return null;
	}

	const keysSorted = Object.keys(leaguePartDescriptions).filter(key =>
		allKeys.includes(key),
	);
	keysSorted.push(...allKeys.filter(key => !keysSorted.includes(key)));

	return (
		<div className="form-group">
			<label>Use from selected league:</label>

			{keysSorted.map(key => (
				<div key={key} className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={event => {
								if (!event.target.checked) {
									setKeptKeys(keptKeys.filter(key2 => key2 !== key));
								} else {
									setKeptKeys([...keptKeys, key]);
								}
							}}
							type="checkbox"
							checked={keptKeys.includes(key)}
						/>
						{leaguePartDescriptions[key] ? leaguePartDescriptions[key] : key}
					</label>
				</div>
			))}

			<div className="mt-1">
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						setKeptKeys([...allKeys]);
					}}
				>
					All
				</button>{" "}
				|{" "}
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						setKeptKeys([]);
					}}
				>
					None
				</button>
			</div>

			<p className="alert alert-warning my-3">
				Warning: selecting a weird combination of things may result in a
				partially or completely broken league.
			</p>
		</div>
	);
};

const quickValuesStyle = { height: 19 };

const MIN_SEASON = 1947;
const MAX_SEASON = 2020;

const seasons: { key: string; value: string }[] = [];
for (let i = MAX_SEASON; i >= MIN_SEASON; i--) {
	seasons.push({
		key: String(i),
		value: String(i),
	});
}

const legends = [
	{
		key: "all",
		value: "All Time",
	},
	{
		key: "2010s",
		value: "2010s",
	},
	{
		key: "2000s",
		value: "2000s",
	},
	{
		key: "1990s",
		value: "1990s",
	},
	{
		key: "1980s",
		value: "1980s",
	},
	{
		key: "1970s",
		value: "1970s",
	},
	{
		key: "1960s",
		value: "1960s",
	},
	{
		key: "1950s",
		value: "1950s",
	},
];

const LeagueMenu = <T extends string>({
	getLeagueInfo,
	onDone,
	onLoading,
	quickValues,
	value,
	values,
}: {
	getLeagueInfo: (value: T) => Promise<LeagueInfo>;
	onDone: (leagueInfo: any) => void;
	onLoading: (value: T) => void;
	quickValues?: T[];
	value: T;
	values: { key: T; value: string }[];
}) => {
	const waitingForInfo = useRef<string | undefined>(value);

	const handleNewValue = async (newValue: T) => {
		waitingForInfo.current = newValue;
		onLoading(newValue);

		try {
			const leagueInfo = await getLeagueInfo(newValue);
			if (waitingForInfo.current === newValue) {
				onDone(leagueInfo);
			}
		} catch (error) {
			console.error(error);
			if (window.bugsnagClient) {
				window.bugsnagClient.notify(error);
			}
			logEvent({
				type: "error",
				text: `Error loading real team data: ${error.message}`,
				saveToDb: false,
				persistent: true,
			});
		}
		if (waitingForInfo.current === newValue) {
			waitingForInfo.current = undefined;
		}
	};

	// Handle initial value
	useEffect(() => {
		handleNewValue(value);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="form-group">
			<div className="d-flex">
				<label htmlFor="new-league-season" className="flex-grow-1">
					Season
				</label>
				{quickValues
					? quickValues.map(key => (
							<button
								key={key}
								type="button"
								className="btn btn-link border-0 p-0 mb-1 ml-2"
								style={quickValuesStyle}
								onClick={() => {
									handleNewValue(key);
								}}
							>
								{values.find(v => v.key === key)!.value}
							</button>
					  ))
					: null}
			</div>
			<div className="input-group mb-1">
				<select
					id="new-league-season"
					className="form-control"
					value={value}
					onChange={async event => {
						await handleNewValue((event.target.value as unknown) as T);
					}}
				>
					{values.map(({ key, value }) => {
						return (
							<option key={key} value={key}>
								{value}
							</option>
						);
					})}
				</select>
				<div className="input-group-append">
					<button
						className="btn btn-secondary"
						type="button"
						onClick={() => {
							const keys = values.map(v => v.key);
							const random = keys[Math.floor(Math.random() * keys.length)];
							handleNewValue(random);
						}}
					>
						Random
					</button>
				</div>
			</div>
		</div>
	);
};

type State = {
	creating: boolean;
	customize: "default" | "custom-rosters" | "custom-url" | "legends" | "real";
	season: number;
	difficulty: number;
	leagueFile: any;
	legend: string;
	loadingLeagueFile: boolean;
	randomization: "none" | "debuts" | "shuffle";
	teams: NewLeagueTeam[];
	tid: number;
	pendingInitialLeagueInfo: boolean;
	allKeys: string[];
	keptKeys: string[];
};

type Action =
	| {
			type: "submit";
	  }
	| {
			type: "error";
	  }
	| {
			type: "clearLeagueFile";
	  }
	| {
			type: "setCustomize";
			customize: State["customize"];
	  }
	| {
			type: "setDifficulty";
			difficulty: string;
	  }
	| {
			type: "setKeptKeys";
			keptKeys: string[];
	  }
	| {
			type: "setLegend";
			legend: string;
	  }
	| {
			type: "setRandomization";
			randomization: State["randomization"];
	  }
	| {
			type: "setSeason";
			season: number;
	  }
	| {
			type: "setTid";
			tid: number;
	  }
	| {
			type: "loadingLeagueFile";
	  }
	| {
			type: "newLeagueFile";
			leagueFile: any;
			teams: NewLeagueTeam[];
	  }
	| {
			type: "newLeagueInfo";
			allKeys: string[];
			teams: NewLeagueTeam[];
	  };

const getTeamRegionName = (teams: NewLeagueTeam[], tid: number) => {
	const t = teams.find(t => t.tid === tid);
	if (!t) {
		return "";
	}
	return `${t.region} ${t.name}`;
};

const getNewTid = (prevTeamRegionName: string, newTeams: NewLeagueTeam[]) => {
	const newTeamsSorted = orderBy(newTeams, ["region", "name"]);
	const closestNewTeam = newTeamsSorted.find(
		t => prevTeamRegionName <= `${t.region} ${t.name}`,
	);
	return closestNewTeam ? closestNewTeam.tid : newTeams.length - 1;
};

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "submit":
			return {
				...state,
				creating: true,
			};

		case "error":
			return {
				...state,
				creating: false,
			};

		case "clearLeagueFile":
			return {
				...state,
				leagueFile: null,
				loadingLeagueFile: false,
				keptKeys: [],
				teams: teamsDefault,
				tid: getNewTid(getTeamRegionName(state.teams, state.tid), teamsDefault),
			};

		case "setCustomize": {
			const allKeys = action.customize === "default" ? [] : state.allKeys;
			return {
				...state,
				customize: action.customize,
				allKeys,
			};
		}

		case "setDifficulty":
			return {
				...state,
				difficulty: parseFloat(action.difficulty),
			};

		case "setKeptKeys":
			return {
				...state,
				keptKeys: action.keptKeys,
			};

		case "setLegend":
			return {
				...state,
				legend: action.legend,
			};

		case "setRandomization":
			return {
				...state,
				randomization: action.randomization,
			};

		case "setSeason":
			return {
				...state,
				season: action.season,
			};

		case "setTid": {
			const t = state.teams.find(t => t.tid === action.tid);
			const tid = t ? t.tid : state.teams.length > 0 ? state.teams[0].tid : 0;

			return {
				...state,
				tid,
			};
		}

		case "loadingLeagueFile":
			return {
				...state,
				loadingLeagueFile: true,
			};

		case "newLeagueFile": {
			const prevTeamRegionName = getTeamRegionName(state.teams, state.tid);

			const { allKeys, keptKeys } = initKeptKeys({
				leagueFile: action.leagueFile,
				oldKeptKeys: state.keptKeys,
				oldAllKeys: state.allKeys,
			});

			return {
				...state,
				loadingLeagueFile: false,
				leagueFile: action.leagueFile,
				allKeys,
				keptKeys,
				teams: action.teams.filter(t => !t.disabled),
				tid: getNewTid(prevTeamRegionName, action.teams),
			};
		}

		case "newLeagueInfo": {
			let prevTeamRegionName = getTeamRegionName(state.teams, state.tid);
			if (state.pendingInitialLeagueInfo) {
				const fromLocalStorage = localStorage.getItem("prevTeamRegionName");
				if (fromLocalStorage !== null) {
					prevTeamRegionName = fromLocalStorage;
				}
			}

			const { allKeys, keptKeys } = initKeptKeys({
				newAllKeys: action.allKeys,
				oldKeptKeys: state.keptKeys,
				oldAllKeys: state.allKeys,
			});

			return {
				...state,
				loadingLeagueFile: false,
				leagueFile: null,
				allKeys,
				keptKeys,
				teams: action.teams,
				tid: getNewTid(prevTeamRegionName, action.teams),
				pendingInitialLeagueInfo: false,
			};
		}

		default:
			throw new Error();
	}
};

const NewLeague = (props: View<"newLeague">) => {
	const [name, setName] = useState(props.name);
	const [startingSeason, setStartingSeason] = useState(
		String(new Date().getFullYear()),
	);
	const [expandOptions, setExpandOptions] = useState(false);

	const [state, dispatch] = useReducer(
		reducer,
		props,
		(props: View<"newLeague">): State => {
			let customize: State["customize"] = "default";
			if (props.lid !== undefined) {
				customize = "custom-rosters";
			}
			if (props.type === "real") {
				customize = "real";
			}
			if (props.type === "legends") {
				customize = "legends";
			}

			const leagueFile = null;

			const teams = teamsDefault;

			let prevTeamRegionName = localStorage.getItem("prevTeamRegionName");
			if (prevTeamRegionName === null) {
				prevTeamRegionName = "";
			}

			let season = parseInt(localStorage.getItem("prevSeason") as any);
			if (Number.isNaN(season)) {
				season = 2020;
			}

			const { allKeys, keptKeys } = initKeptKeys({
				leagueFile,
			});

			return {
				creating: false,
				customize,
				season,
				legend: "all",
				difficulty:
					props.difficulty !== undefined ? props.difficulty : DIFFICULTY.Normal,
				leagueFile,
				loadingLeagueFile: false,
				randomization: "none",
				teams,
				tid: getNewTid(prevTeamRegionName, teams),
				pendingInitialLeagueInfo: true,
				allKeys,
				keptKeys,
			};
		},
	);

	let title: string;
	if (props.lid !== undefined) {
		title = "Import League";
	} else if (props.type === "custom") {
		title =
			process.env.SPORT === "basketball" ? "New Custom League" : "New League";
	} else if (props.type === "random") {
		title = "New Random Players League";
	} else if (props.type === "legends") {
		title = "New Legends League";
	} else {
		title = "New Real Players League";
	}

	const handleSubmit = useCallback(
		async event => {
			event.preventDefault();

			if (props.lid !== undefined) {
				const result = await confirm(
					`Are you sure you want to import this league? All the data currently in "${props.name}" will be overwritten.`,
					{
						okText: title,
					},
				);
				if (!result) {
					return;
				}
			}

			dispatch({
				type: "submit",
			});

			const actualShuffleRosters = state.keptKeys.includes("players")
				? state.randomization === "shuffle"
				: false;

			const actualDifficulty = Object.values(DIFFICULTY).includes(
				state.difficulty,
			)
				? state.difficulty
				: DIFFICULTY.Normal;

			const actualStartingSeason =
				state.customize === "default" ? startingSeason : undefined;

			try {
				let getLeagueOptions: GetLeagueOptions | undefined;
				if (state.customize === "real") {
					getLeagueOptions = {
						type: "real",
						season: state.season,
						randomDebuts: state.randomization === "debuts",
					};
				} else if (state.customize === "legends") {
					getLeagueOptions = {
						type: "legends",
						decade: state.legend as any,
					};
				}

				const lid = await toWorker("main", "createLeague", {
					name,
					tid: state.tid,
					leagueFileInput: state.leagueFile,
					keptKeys: state.keptKeys,
					shuffleRosters: actualShuffleRosters,
					difficulty: actualDifficulty,
					importLid: props.lid,
					getLeagueOptions,
					actualStartingSeason,
				});

				let type: string = state.customize;
				if (type === "real") {
					type = String(state.season);
				}
				if (type === "legends") {
					type = String(state.legend);
				}
				const teamRegionName = getTeamRegionName(state.teams, state.tid);
				if (window.enableLogging && window.gtag) {
					window.gtag("event", "new_league", {
						event_category: type,
						event_label: teamRegionName,
						value: lid,
					});
				}

				realtimeUpdate([], `/l/${lid}`);

				localStorage.setItem("prevTeamRegionName", teamRegionName);

				if (state.customize === "real") {
					localStorage.setItem("prevSeason", String(state.season));
				}
			} catch (err) {
				dispatch({
					type: "error",
				});
				console.log(err);
				logEvent({
					type: "error",
					text: err.message,
					persistent: true,
					saveToDb: false,
				});
			}
		},
		[
			state.customize,
			state.difficulty,
			state.keptKeys,
			state.leagueFile,
			state.legend,
			name,
			props.lid,
			props.name,
			state.randomization,
			state.season,
			startingSeason,
			state.teams,
			state.tid,
			title,
		],
	);

	const handleNewLeagueFile = useCallback(
		(err, newLeagueFile) => {
			if (err) {
				dispatch({ type: "clearLeagueFile" });
				return;
			}

			let newTeams = helpers.deepCopy(newLeagueFile.teams);
			if (newTeams) {
				for (const t of newTeams) {
					// Is pop hidden in season, like in manageTeams import?
					if (!t.hasOwnProperty("pop") && t.hasOwnProperty("seasons")) {
						t.pop = t.seasons[t.seasons.length - 1].pop;
					}

					// God, I hate being permissive...
					if (typeof t.pop !== "number") {
						t.pop = parseFloat(t.pop);
					}
					if (Number.isNaN(t.pop)) {
						t.pop = 1;
					}

					t.pop = parseFloat(t.pop.toFixed(2));
				}

				newTeams = helpers.addPopRank(newTeams);
			} else {
				newTeams = teamsDefault;
			}

			dispatch({
				type: "newLeagueFile",
				leagueFile: newLeagueFile,
				teams: applyRealTeamInfos(
					newTeams,
					props.realTeamInfo,
					newLeagueFile.startingSeason,
				),
			});

			// Need to update team and difficulty dropdowns?
			if (newLeagueFile.hasOwnProperty("gameAttributes")) {
				for (const ga of newLeagueFile.gameAttributes) {
					if (
						ga.key === "userTid" &&
						typeof ga.value === "number" &&
						!Number.isNaN(ga.value)
					) {
						dispatch({ type: "setTid", tid: ga.value });
					} else if (
						ga.key === "difficulty" &&
						typeof ga.value === "number" &&
						!Number.isNaN(ga.value)
					) {
						dispatch({ type: "setDifficulty", difficulty: ga.value });
					}
				}
			}
		},
		[props.realTeamInfo],
	);

	const handleNewLeagueInfo = (leagueInfo: LeagueInfo) => {
		const newTeams = helpers.addPopRank(helpers.deepCopy(leagueInfo.teams));

		dispatch({
			type: "newLeagueInfo",
			allKeys: leagueInfo.stores,
			teams: applyRealTeamInfos(
				newTeams,
				props.realTeamInfo,
				leagueInfo.startingSeason,
			),
		});
	};

	useTitleBar({ title, hideNewWindow: true });

	const displayedTeams = state.keptKeys.includes("teams")
		? state.teams
		: teamsDefault;

	const disableWhileLoadingLeagueFile =
		((state.customize === "custom-rosters" ||
			state.customize === "custom-url") &&
			(state.leagueFile === null || state.loadingLeagueFile)) ||
		((state.customize === "real" || state.customize === "legends") &&
			state.pendingInitialLeagueInfo);
	const showLoadingIndicator =
		disableWhileLoadingLeagueFile &&
		(state.loadingLeagueFile ||
			((state.customize === "real" || state.customize === "legends") &&
				state.pendingInitialLeagueInfo));

	const moreOptions: React.ReactNode[] = [];

	if (state.keptKeys.includes("players") || state.customize === "real") {
		moreOptions.push(
			<div key="randomization" className="form-group">
				<label htmlFor="new-league-randomization">Randomization</label>
				<select
					id="new-league-randomization"
					className="form-control"
					onChange={event => {
						dispatch({
							type: "setRandomization",
							randomization: event.target.value as any,
						});
					}}
					value={state.randomization}
				>
					<option value="none">None</option>
					{state.customize === "real" ? (
						<option value="debuts">Random debuts</option>
					) : null}
					<option value="shuffle">Shuffle rosters</option>
				</select>
				{state.randomization === "debuts" ? (
					<div className="text-muted mt-1">
						Every player's draft year is randomized. Starting teams are random
						combinations of current and future players, and future draft classes
						contain a random selection of real players.
					</div>
				) : null}
				{state.randomization === "shuffle" ? (
					<div className="text-muted mt-1">
						All active players are placed on random teams.
					</div>
				) : null}
			</div>,
		);
	}

	return (
		<form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
			{props.lid !== undefined ? (
				<>
					<p>
						Here you can create a new league that overwrites one of your
						existing leagues. This is no different than deleting the existing
						league and creating a new one, it's just a little more convenient
						for people who do that a lot.
					</p>
					<p>
						If you just want to create a new league,{" "}
						<a href="/new_league">click here</a>.
					</p>
				</>
			) : null}
			<div className="row">
				<div className="col-sm-6">
					<div className="form-group">
						<label htmlFor="new-league-name">League name</label>
						<input
							id="new-league-name"
							className="form-control"
							type="text"
							value={name}
							onChange={event => {
								setName(event.target.value);
							}}
						/>
					</div>

					{state.customize === "default" ? (
						<div className="form-group">
							<label htmlFor="new-league-starting-season">Season</label>
							<input
								id="new-league-starting-season"
								className="form-control"
								type="text"
								value={startingSeason}
								onChange={event => {
									setStartingSeason(event.target.value);
								}}
							/>
						</div>
					) : null}

					{state.customize === "real" ? (
						<LeagueMenu
							value={String(state.season)}
							values={seasons}
							getLeagueInfo={value =>
								toWorker("main", "getLeagueInfo", {
									type: "real",
									season: parseInt(value),
								})
							}
							onLoading={value => {
								const season = parseInt(value);
								dispatch({ type: "setSeason", season });
							}}
							onDone={handleNewLeagueInfo}
							quickValues={["1956", "1968", "1984", "1996", "2003", "2020"]}
						/>
					) : null}

					{state.customize === "legends" ? (
						<LeagueMenu
							value={state.legend}
							values={legends}
							getLeagueInfo={value =>
								toWorker("main", "getLeagueInfo", {
									type: "legends",
									decade: value,
								})
							}
							onLoading={legend => {
								dispatch({ type: "setLegend", legend });
							}}
							onDone={handleNewLeagueInfo}
						/>
					) : null}

					<div className="form-group">
						<label htmlFor="new-league-team">Pick your team</label>
						<div className="input-group mb-1">
							<select
								id="new-league-team"
								className="form-control"
								disabled={disableWhileLoadingLeagueFile}
								value={state.tid}
								onChange={event => {
									dispatch({
										type: "setTid",
										tid: parseInt(event.target.value),
									});
								}}
							>
								{orderBy(displayedTeams, ["region", "name"]).map(t => {
									return (
										<option key={t.tid} value={t.tid}>
											{showLoadingIndicator
												? "Loading..."
												: `${t.region} ${t.name}`}
										</option>
									);
								})}
							</select>
							<div className="input-group-append">
								<button
									className="btn btn-secondary"
									disabled={disableWhileLoadingLeagueFile}
									type="button"
									onClick={() => {
										const t =
											displayedTeams[
												Math.floor(Math.random() * displayedTeams.length)
											];
										dispatch({ type: "setTid", tid: t.tid });
									}}
								>
									Random
								</button>
							</div>
						</div>
						<PopText
							tid={state.tid}
							teams={displayedTeams}
							numActiveTeams={displayedTeams.length}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="new-league-difficulty">Difficulty</label>
						<select
							id="new-league-difficulty"
							className="form-control mb-1"
							onChange={event => {
								dispatch({
									type: "setDifficulty",
									difficulty: event.target.value,
								});
							}}
							value={state.difficulty}
						>
							{Object.entries(DIFFICULTY).map(([text, numeric]) => (
								<option key={numeric} value={numeric}>
									{text}
								</option>
							))}
							{!Object.values(DIFFICULTY).includes(state.difficulty) ? (
								<option value={state.difficulty}>
									Custom (from league file)
								</option>
							) : null}
						</select>
						<span className="text-muted">
							Increasing difficulty makes AI teams more reluctant to trade with
							you, makes players less likely to sign with you, and makes it
							harder to turn a profit.
						</span>
					</div>

					{moreOptions.length > 0 ? (
						<>
							<button
								className="btn btn-link p-0 mb-3"
								type="button"
								onClick={() => setExpandOptions(expand => !expand)}
							>
								More Options{" "}
								<span
									className={`glyphicon ${
										expandOptions
											? "glyphicon-menu-down"
											: "glyphicon-menu-right"
									}`}
								/>
							</button>
							{expandOptions ? moreOptions : null}
						</>
					) : null}

					<div className="text-center">
						<button
							type="submit"
							className="btn btn-lg btn-primary mt-3"
							disabled={state.creating || disableWhileLoadingLeagueFile}
						>
							{props.lid !== undefined ? "Import League" : "Create League"}
						</button>
					</div>
				</div>

				{props.type === "custom" ||
				props.type === "real" ||
				props.type === "legends" ? (
					<div
						className={classNames(
							"col-sm-6 order-first order-sm-last mb-3 mb-sm-0",
							{
								"d-none d-sm-block": props.type === "real",
							},
						)}
					>
						<div className="card bg-light mt-1">
							{props.type === "real" ? (
								<>
									<ul className="list-group list-group-flush">
										<li className="list-group-item bg-light">
											<h3>Start in any season back to {MIN_SEASON}</h3>
											<p className="mb-0">
												Players, teams, rosters, and contracts are generated
												from real data. Draft classes are included up to today.
											</p>
										</li>
										<li className="list-group-item bg-light">
											<h3>Watch your league evolve over time</h3>
											<p className="mb-0">
												There were only 11 teams in {MIN_SEASON}, playing a very
												different brand of basketball than today. Live through
												expansion drafts, league rule changes, team relocations,
												economic growth, and changes in style of play.
											</p>
										</li>
										<li className="list-group-item bg-light">
											<h3>Every league is different</h3>
											<p className="mb-0">
												Draft prospects always start the same, but they have
												different career arcs in every league. See busts meet
												their potentials, see injury-shortened careers play out
												in full, and see new combinations of players lead to
												dynasties.
											</p>
										</li>
									</ul>
								</>
							) : null}
							{props.type === "legends" ? (
								<>
									<ul className="list-group list-group-flush">
										<li className="list-group-item bg-light">
											<h3>Legends mode</h3>
											<p>
												Each team is filled with the best players from that
												franchise's history. Create a league with players from
												only one decade, or the greatest players of all time.
											</p>
											<p className="mb-0">
												<a href="https://basketball-gm.com/blog/2020/05/legends-leagues/">
													More details
												</a>
											</p>
										</li>
									</ul>
								</>
							) : null}
							{props.type === "custom" ? (
								<div className="card-body" style={{ marginBottom: "-1rem" }}>
									<h2 className="card-title">Customize</h2>
									<div className="form-group">
										<select
											className="form-control"
											onChange={event => {
												const newCustomize = event.target.value as any;
												dispatch({
													type: "setCustomize",
													customize: newCustomize,
												});
												if (
													newCustomize !== "real" &&
													newCustomize !== "legends"
												) {
													dispatch({ type: "clearLeagueFile" });
												}
											}}
											value={state.customize}
										>
											<option value="default">
												{process.env.SPORT === "basketball"
													? "Random players and teams"
													: "Default"}
											</option>
											{process.env.SPORT === "basketball" ? (
												<option value="real">Real players and teams</option>
											) : null}
											{process.env.SPORT === "basketball" ? (
												<option value="legends">Legends</option>
											) : null}
											<option value="custom-rosters">Upload league file</option>
											<option value="custom-url">Enter league file URL</option>
										</select>
										{state.customize === "custom-rosters" ||
										state.customize === "custom-url" ? (
											<p className="mt-3">
												League files can contain teams, players, settings, and
												other data. You can create a league file by going to
												Tools &gt; Export within a league, or by{" "}
												<a
													href={`https://${process.env.SPORT}-gm.com/manual/customization/`}
												>
													creating a custom league file
												</a>
												.
											</p>
										) : null}
									</div>
									{state.customize === "custom-rosters" ||
									state.customize === "custom-url" ? (
										<div className="my-3">
											<LeagueFileUpload
												onLoading={() => {
													dispatch({ type: "loadingLeagueFile" });
												}}
												onDone={handleNewLeagueFile}
												enterURL={state.customize === "custom-url"}
												hideLoadedMessage
											/>
										</div>
									) : null}

									<LeaguePartPicker
										allKeys={state.allKeys}
										keptKeys={state.keptKeys}
										setKeptKeys={keptKeys => {
											dispatch({ type: "setKeptKeys", keptKeys });
										}}
									/>
								</div>
							) : null}
						</div>
					</div>
				) : null}
			</div>
		</form>
	);
};

NewLeague.propTypes = {
	difficulty: PropTypes.number,
	lid: PropTypes.number,
	name: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
};

export default NewLeague;
