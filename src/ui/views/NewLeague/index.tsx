import { motion, AnimatePresence } from "framer-motion";
import orderBy from "lodash-es/orderBy";
import PropTypes from "prop-types";
import { useCallback, useState, useReducer } from "react";
import type { ReactNode } from "react";
import {
	DIFFICULTY,
	applyRealTeamInfo,
	PHASE,
	PHASE_TEXT,
	DEFAULT_CONFS,
	DEFAULT_DIVS,
	SPORT_HAS_LEGENDS,
	SPORT_HAS_REAL_PLAYERS,
	gameAttributesArrayToObject,
	WEBSITE_ROOT,
	unwrapGameAttribute,
} from "../../../common";
import { LeagueFileUpload, NextPrevButtons, PopText } from "../../components";
import useTitleBar from "../../hooks/useTitleBar";
import {
	confirm,
	helpers,
	logEvent,
	realtimeUpdate,
	toWorker,
	safeLocalStorage,
} from "../../util";
import type {
	View,
	RealTeamInfo,
	GetLeagueOptions,
	Div,
	Conf,
} from "../../../common/types";
import classNames from "classnames";
import { descriptions } from "../Settings/settings";
import LeagueMenu from "./LeagueMenu";
import LeaguePartPicker from "./LeaguePartPicker";
import type { LeagueInfo, NewLeagueTeam } from "./types";
import CustomizeSettings from "./CustomizeSettings";
import CustomizeTeams from "./CustomizeTeams";
import type { Settings } from "../../../worker/views/settings";

const animationVariants = {
	visible: {
		x: 0,
		transition: { duration: 0.25, ease: "easeInOut" },
	},
	left: {
		x: "-75vw",
		transition: { duration: 0.25, ease: "easeInOut" },
	},
	right: {
		x: "75vw",
		transition: { duration: 0.25, ease: "easeInOut" },
	},
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

const MIN_SEASON = 1947;
const MAX_SEASON = 2021;

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

const phases = [
	{
		key: PHASE.PRESEASON,
		value: helpers.upperCaseFirstLetter(PHASE_TEXT[PHASE.PRESEASON]),
	},
	{
		key: PHASE.PLAYOFFS,
		value: helpers.upperCaseFirstLetter(PHASE_TEXT[PHASE.PLAYOFFS]),
	},
	{
		key: PHASE.DRAFT_LOTTERY,
		value: helpers.upperCaseFirstLetter(PHASE_TEXT[PHASE.DRAFT_LOTTERY]),
	},
	{
		key: PHASE.DRAFT,
		value: helpers.upperCaseFirstLetter(PHASE_TEXT[PHASE.DRAFT]),
	},
	{
		key: PHASE.AFTER_DRAFT,
		value: helpers.upperCaseFirstLetter(PHASE_TEXT[PHASE.AFTER_DRAFT]),
	},
];

type State = {
	creating: boolean;
	customize: "default" | "custom-rosters" | "custom-url" | "legends" | "real";
	season: number;
	phase: number;
	difficulty: number;
	leagueFile: any;
	legend: string;
	loadingLeagueFile: boolean;
	randomization: "none" | "debuts" | "debutsForever" | "shuffle";
	teams: NewLeagueTeam[];
	confs: Conf[];
	divs: Div[];
	tid: number;
	pendingInitialLeagueInfo: boolean;
	allKeys: string[];
	keptKeys: string[];
	expandOptions: boolean;
	equalizeRegions: boolean;
	noStartingInjuries: boolean;
	realDraftRatings: "rookie" | "draft";
	settings: Omit<Settings, "numActiveTeams">;
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
			type: "setPhase";
			phase: number;
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
			type: "setTeams";
			teams: NewLeagueTeam[];
			confs: Conf[];
			divs: Div[];
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
			defaultSettings: State["settings"];
	  }
	| {
			type: "newLeagueInfo";
			allKeys: string[];
			teams: NewLeagueTeam[];
			gameAttributes: Record<string, unknown>;
			defaultSettings: State["settings"];
	  }
	| {
			type: "toggleExpandOptions";
	  }
	| {
			type: "toggleEqualizeRegions";
	  }
	| { type: "toggleNoStartingInjuries" }
	| {
			type: "setRealDraftRatings";
			realDraftRatings: "rookie" | "draft";
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

		case "setPhase":
			return {
				...state,
				phase: action.phase,
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

		case "setTeams":
			return {
				...state,
				confs: action.confs,
				divs: action.divs,
				teams: action.teams,
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

			let confs = DEFAULT_CONFS;
			let divs = DEFAULT_DIVS;

			const newSettings = helpers.deepCopy(action.defaultSettings);

			// gameAttributes was already converted to an object before dispatching this action
			if (action.leagueFile && action.leagueFile.gameAttributes) {
				for (const key of helpers.keys(newSettings)) {
					const value = unwrapGameAttribute(
						action.leagueFile.gameAttributes,
						key,
					);
					if (value !== undefined) {
						if (key === "repeatSeason") {
							newSettings[key] = !!value;
						} else {
							(newSettings[key] as any) = value;
						}
					}
				}

				if (action.leagueFile.gameAttributes.confs) {
					confs = unwrapGameAttribute(
						action.leagueFile.gameAttributes,
						"confs",
					);
				}
				if (action.leagueFile.gameAttributes.divs) {
					divs = unwrapGameAttribute(action.leagueFile.gameAttributes, "divs");
				}
			}

			return {
				...state,
				loadingLeagueFile: false,
				leagueFile: action.leagueFile,
				allKeys,
				keptKeys,
				confs,
				divs,
				teams: action.teams.filter(t => !t.disabled),
				tid: getNewTid(prevTeamRegionName, action.teams),
				settings: newSettings,
			};
		}

		case "newLeagueInfo": {
			let prevTeamRegionName = getTeamRegionName(state.teams, state.tid);
			if (state.pendingInitialLeagueInfo) {
				const fromLocalStorage = safeLocalStorage.getItem("prevTeamRegionName");
				if (fromLocalStorage !== null) {
					prevTeamRegionName = fromLocalStorage;
				}
			}

			const { allKeys, keptKeys } = initKeptKeys({
				newAllKeys: action.allKeys,
				oldKeptKeys: state.keptKeys,
				oldAllKeys: state.allKeys,
			});

			const newSettings = helpers.deepCopy(action.defaultSettings);

			for (const key of helpers.keys(newSettings)) {
				const value = unwrapGameAttribute(action.gameAttributes, key);
				if (value !== undefined) {
					if (key === "repeatSeason") {
						newSettings[key] = !!value;
					} else {
						(newSettings[key] as any) = value;
					}
				}
			}

			const confs = unwrapGameAttribute(action.gameAttributes, "confs");
			const divs = unwrapGameAttribute(action.gameAttributes, "divs");

			return {
				...state,
				loadingLeagueFile: false,
				leagueFile: null,
				allKeys,
				keptKeys,
				confs,
				divs,
				teams: action.teams,
				tid: getNewTid(prevTeamRegionName, action.teams),
				pendingInitialLeagueInfo: false,
				settings: newSettings,
			};
		}

		case "toggleExpandOptions":
			return {
				...state,
				expandOptions: !state.expandOptions,
			};

		case "toggleEqualizeRegions":
			return {
				...state,
				equalizeRegions: !state.equalizeRegions,
			};

		case "toggleNoStartingInjuries":
			return {
				...state,
				noStartingInjuries: !state.noStartingInjuries,
			};

		case "setRealDraftRatings":
			return {
				...state,
				realDraftRatings: action.realDraftRatings,
			};

		default:
			throw new Error();
	}
};

const NewLeague = (props: View<"newLeague">) => {
	const [name, setName] = useState(props.name);
	const [startingSeason, setStartingSeason] = useState(
		String(new Date().getFullYear()),
	);
	const [currentScreen, setCurrentScreen] = useState<
		"default" | "teams" | "settings"
	>("default");

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

			let prevTeamRegionName = safeLocalStorage.getItem("prevTeamRegionName");
			if (prevTeamRegionName === null) {
				prevTeamRegionName = "";
			}

			let season = parseInt(safeLocalStorage.getItem("prevSeason") as any);
			if (Number.isNaN(season)) {
				season = 2021;
			}
			let phase = parseInt(safeLocalStorage.getItem("prevPhase") as any);
			if (Number.isNaN(phase)) {
				phase = PHASE.PRESEASON;
			}

			const { allKeys, keptKeys } = initKeptKeys({
				leagueFile,
			});

			return {
				creating: false,
				customize,
				season,
				legend: "all",
				difficulty: props.difficulty ?? DIFFICULTY.Normal,
				phase,
				leagueFile,
				loadingLeagueFile: false,
				randomization: "none",
				teams: teamsDefault,
				confs: DEFAULT_CONFS,
				divs: DEFAULT_DIVS,
				tid: getNewTid(prevTeamRegionName, teams),
				pendingInitialLeagueInfo: true,
				allKeys,
				keptKeys,
				expandOptions: false,
				noStartingInjuries: false,
				equalizeRegions: false,
				realDraftRatings: "rookie",
				settings: props.defaultSettings,
			};
		},
	);

	let title: string;
	if (props.lid !== undefined) {
		title = "Import League";
	} else if (props.type === "custom") {
		title = SPORT_HAS_REAL_PLAYERS ? "New Custom League" : "New League";
	} else if (props.type === "random") {
		title = "New Random Players League";
	} else if (props.type === "legends") {
		title = "New Legends League";
	} else {
		title = "New Real Players League";
	}

	const createLeague = async (settingsOverride?: State["settings"]) => {
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

		const actualStartingSeason =
			state.customize === "default" ? startingSeason : undefined;

		const actualRandomDebutsForever =
			state.customize === "real" && state.randomization === "debutsForever";

		try {
			let getLeagueOptions: GetLeagueOptions | undefined;
			if (state.customize === "real") {
				getLeagueOptions = {
					type: "real",
					season: state.season,
					phase: state.phase,
					randomDebuts:
						state.randomization === "debuts" ||
						state.randomization === "debutsForever",
					realDraftRatings: state.realDraftRatings,
				};
			} else if (state.customize === "legends") {
				getLeagueOptions = {
					type: "legends",
					decade: state.legend as any,
				};
			}

			const teamRegionName = getTeamRegionName(state.teams, state.tid);
			safeLocalStorage.setItem("prevTeamRegionName", teamRegionName);
			if (state.customize === "real") {
				safeLocalStorage.setItem("prevSeason", String(state.season));
				safeLocalStorage.setItem("prevPhase", String(state.phase));
			}

			const lid = await toWorker("main", "createLeague", {
				name,
				tid: state.tid,
				leagueFileInput: state.leagueFile,
				keptKeys: state.keptKeys,
				shuffleRosters: actualShuffleRosters,
				importLid: props.lid,
				getLeagueOptions,
				actualStartingSeason,
				noStartingInjuries: state.noStartingInjuries,
				equalizeRegions: state.equalizeRegions,
				randomDebutsForever: actualRandomDebutsForever,
				confs: state.confs,
				divs: state.divs,
				teams: state.teams,
				settings: settingsOverride ?? state.settings,
			});

			let type: string = state.customize;
			if (type === "real") {
				type = String(state.season);
			}
			if (type === "legends") {
				type = String(state.legend);
			}
			if (window.enableLogging && window.gtag) {
				window.gtag("event", "new_league", {
					event_category: type,
					event_label: teamRegionName,
					value: lid,
				});
			}

			realtimeUpdate([], `/l/${lid}`);
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
	};

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

			if (newLeagueFile.gameAttributes) {
				if (Array.isArray(newLeagueFile.gameAttributes)) {
					newLeagueFile.gameAttributes = gameAttributesArrayToObject(
						newLeagueFile.gameAttributes,
					);
				}
			}

			dispatch({
				type: "newLeagueFile",
				leagueFile: newLeagueFile,
				teams: applyRealTeamInfos(
					newTeams,
					props.realTeamInfo,
					newLeagueFile.startingSeason,
				),
				defaultSettings: props.defaultSettings,
			});

			// Need to update team and difficulty dropdowns?
			if (newLeagueFile.gameAttributes) {
				if (newLeagueFile.gameAttributes.userTid !== undefined) {
					let tid = newLeagueFile.gameAttributes.userTid;
					if (Array.isArray(tid) && tid.length > 0) {
						tid = tid[tid.length - 1].value;
					}
					if (typeof tid === "number" && !Number.isNaN(tid)) {
						dispatch({ type: "setTid", tid });
					}
				}

				const difficulty = newLeagueFile.gameAttributes.difficulty;
				if (typeof difficulty === "number" && !Number.isNaN(difficulty)) {
					dispatch({ type: "setDifficulty", difficulty: String(difficulty) });
				}
			}
		},
		[props.defaultSettings, props.realTeamInfo],
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
			gameAttributes: leagueInfo.gameAttributes,
			defaultSettings: props.defaultSettings,
		});
	};

	let pageTitle = title;
	if (currentScreen === "teams") {
		pageTitle = "Customize Teams";
	} else if (currentScreen === "settings") {
		pageTitle = "Customize Settings";
	}

	useTitleBar({
		title: pageTitle,
		hideNewWindow: true,
	});

	let subPage = null;
	if (currentScreen === "teams") {
		subPage = (
			<motion.div
				key="screen-teams"
				variants={animationVariants}
				initial="right"
				animate="visible"
				exit="right"
			>
				<CustomizeTeams
					onCancel={() => {
						setCurrentScreen("default");
					}}
					onSave={({ confs, divs, teams }) => {
						dispatch({
							type: "setTeams",
							confs,
							divs,
							teams: helpers.addPopRank(teams),
						});
						setCurrentScreen("default");
					}}
					initialConfs={state.confs}
					initialDivs={state.divs}
					initialTeams={state.teams}
					getDefaultConfsDivsTeams={() => {
						return {
							confs: DEFAULT_CONFS,
							divs: DEFAULT_DIVS,
							teams: teamsDefault,
						};
					}}
					godModeLimits={props.godModeLimits}
				/>
			</motion.div>
		);
	}

	const keptKeysIsAvailable = state.customize.startsWith("custom");
	const displayedTeams =
		!keptKeysIsAvailable || state.keptKeys.includes("teams")
			? state.teams
			: teamsDefault;

	const createLeagueText =
		props.lid !== undefined ? "Import League" : "Create League";

	if (currentScreen === "settings") {
		subPage = (
			<motion.div
				key="screen-settings"
				variants={animationVariants}
				initial="right"
				animate="visible"
				exit="right"
				onAnimationComplete={definition => {
					// HACK HACK HACK
					// CustomizeSettings has a sticky div inside it, and mobile Chrome (and maybe others) get confused by the `transform: translateX(0vw) translateZ(0px);` CSS that framer-motion leaves hanging around
					if (definition === "visible") {
						const parent = document.getElementById("actual-actual-content");
						if (parent) {
							const animatedDiv = parent.children[0] as
								| HTMLDivElement
								| undefined;
							if (animatedDiv) {
								animatedDiv.style.transform = "";
							}
						}
					}
				}}
			>
				<CustomizeSettings
					onCancel={() => {
						setCurrentScreen("default");
					}}
					onSave={async settings => {
						await createLeague(settings);
					}}
					initial={{
						...state.settings,
						numActiveTeams: displayedTeams.length,
						difficulty: state.difficulty,
					}}
					saveText={createLeagueText}
				/>
			</motion.div>
		);
	}

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

	const moreOptions: ReactNode[] = [
		<div key="other" className="mb-3">
			<label>Other</label>
			<div className="form-check mb-2">
				<input
					className="form-check-input"
					type="checkbox"
					id="new-league-equalizeRegions"
					checked={state.equalizeRegions}
					onChange={() => {
						dispatch({ type: "toggleEqualizeRegions" });
					}}
				/>
				<label
					className="form-check-label"
					htmlFor="new-league-equalizeRegions"
				>
					Equalize region populations
				</label>
			</div>
			{state.keptKeys.includes("players") ? (
				<div className="form-check mb-2">
					<input
						className="form-check-input"
						type="checkbox"
						id="new-league-noStartingInjuries"
						checked={state.noStartingInjuries}
						onChange={() => {
							dispatch({ type: "toggleNoStartingInjuries" });
						}}
					/>
					<label
						className="form-check-label"
						htmlFor="new-league-noStartingInjuries"
					>
						No starting injuries
					</label>
				</div>
			) : null}
		</div>,
	];

	if (
		(state.customize === "real" || state.customize === "legends") &&
		state.keptKeys.includes("players")
	) {
		moreOptions.unshift(
			<div key="realDraftRatings" className="form-group">
				<label htmlFor="new-league-realDraftRatings">
					Real draft prospect ratings
				</label>
				<select
					id="new-league-realDraftRatings"
					className="form-control"
					onChange={event => {
						dispatch({
							type: "setRealDraftRatings",
							realDraftRatings: event.target.value as any,
						});
					}}
					value={state.realDraftRatings}
				>
					<option value="rookie">Based on rookie season stats</option>
					<option value="draft">Based on draft position</option>
				</select>
				{state.realDraftRatings === "rookie" ? (
					<div className="text-muted mt-1">
						Player ratings for draft prospects are based on their rookie season
						stats. Players who overperformed or underperformed their real draft
						positions as rookies will be ranked differently than they were in
						reality.
					</div>
				) : null}
				{state.realDraftRatings === "draft" ? (
					<div className="text-muted mt-1">
						Player ratings for draft prospects are based on the position they
						were drafted. Every #1 pick will have a high rating, even if in
						reality he was a bust. Every late pick will have a low rating, even
						if in reality he became a star.
					</div>
				) : null}
			</div>,
		);
	}

	if (state.keptKeys.includes("players") || state.customize === "real") {
		moreOptions.unshift(
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
					{state.customize === "real" ? (
						<option value="debutsForever">Random debuts forever</option>
					) : null}
					<option value="shuffle">Shuffle rosters</option>
				</select>
				{state.randomization === "debuts" ? (
					<div className="text-muted mt-1">
						Every player's draft year is randomized. Starting teams and future
						draft classes are all random combinations of past, current, and
						future real players.
					</div>
				) : null}
				{state.randomization === "debutsForever" ? (
					<div className="text-muted mt-1">
						Like random debuts, except when it runs out of draft prospects, it
						will randomize all real players again and add them to future draft
						classes.
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

	const bannedExpansionSeasons = [
		// Because of other mergers
		1947,
		1948,
		1949,

		// Because of ABA merger
		1976,
	];
	let invalidSeasonPhaseMessage: string | undefined;
	if (
		state.phase > PHASE.PLAYOFFS &&
		bannedExpansionSeasons.includes(state.season)
	) {
		invalidSeasonPhaseMessage =
			"Starting after the playoffs is not yet supported for seasons where league mergers occurred.";
	}
	if (state.season === 2021 && state.phase > PHASE.PRESEASON) {
		invalidSeasonPhaseMessage =
			"Sorry, I'm not allowed to share the results of the 2021 season yet.";
	}

	const sortedDisplayedTeams = orderBy(displayedTeams, ["region", "name"]);

	// exitBeforeEnter sucks (makes transition slower) but otherwise it jumps at the end because it stacks the divs vertically, and I couldn't figure out how to work around that
	return (
		<AnimatePresence exitBeforeEnter initial={false}>
			{subPage ? (
				subPage
			) : (
				<motion.form
					key="screen-main"
					variants={animationVariants}
					initial="left"
					animate="visible"
					exit="left"
					onSubmit={async event => {
						event.preventDefault();
						await createLeague();
					}}
					style={{ maxWidth: 800 }}
				>
					{props.lid !== undefined ? (
						<>
							<p>
								Here you can create a new league that overwrites one of your
								existing leagues. This is no different than deleting the
								existing league and creating a new one, it's just a little more
								convenient for people who do that a lot.
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
								<>
									<div className="form-group">
										<LeagueMenu
											value={String(state.season)}
											values={seasons}
											getLeagueInfo={(value, value2) =>
												toWorker("main", "getLeagueInfo", {
													type: "real",
													season: parseInt(value),
													phase: value2,
													randomDebuts:
														state.randomization === "debuts" ||
														state.randomization === "debutsForever",
													realDraftRatings: state.realDraftRatings,
												})
											}
											onLoading={value => {
												const season = parseInt(value);
												dispatch({ type: "setSeason", season });

												if (season === 2021) {
													dispatch({
														type: "setPhase",
														phase: PHASE.PRESEASON,
													});
												}
											}}
											onDone={handleNewLeagueInfo}
											quickValues={[
												"1956",
												"1968",
												"1984",
												"1996",
												"2003",
												"2021",
											]}
											value2={state.phase}
											values2={phases}
											onNewValue2={phase => {
												dispatch({
													type: "setPhase",
													phase,
												});
											}}
										/>
										{invalidSeasonPhaseMessage ? (
											<div className="text-danger mt-1">
												{invalidSeasonPhaseMessage}
											</div>
										) : (
											<div className="text-muted mt-1">
												{state.season} in BBGM is the {state.season - 1}-
												{String(state.season).slice(2)} season.
											</div>
										)}
									</div>
								</>
							) : null}

							{state.customize === "legends" ? (
								<div className="form-group">
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
								</div>
							) : null}

							<div className="form-group">
								<label htmlFor="new-league-team" className="mr-2">
									Pick your team
								</label>
								<NextPrevButtons
									currentItem={sortedDisplayedTeams.find(
										t => t.tid === state.tid,
									)}
									items={sortedDisplayedTeams}
									onChange={newTeam => {
										dispatch({
											type: "setTid",
											tid: newTeam.tid,
										});
									}}
									disabled={disableWhileLoadingLeagueFile}
								/>
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
										{sortedDisplayedTeams.map(t => {
											return (
												<option key={t.tid} value={t.tid}>
													{showLoadingIndicator
														? "Loading..."
														: `${t.region} ${t.name}`}
												</option>
											);
										})}
									</select>
									{state.customize === "default" ? (
										<div className="input-group-append new-league-customize-teams-wrapper">
											<button
												className="btn btn-secondary"
												disabled={disableWhileLoadingLeagueFile}
												type="button"
												onClick={() => {
													setCurrentScreen("teams");
												}}
											>
												Customize
											</button>
										</div>
									) : null}
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
								{!state.equalizeRegions ? (
									<PopText
										className="text-muted"
										tid={state.tid}
										teams={displayedTeams}
										numActiveTeams={displayedTeams.length}
									/>
								) : (
									<span className="text-muted">
										Region population: equal
										<br />
										Size: normal
									</span>
								)}
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
								<span className="text-muted">{descriptions.difficulty}</span>
							</div>

							{moreOptions.length > 0 ? (
								<>
									<button
										className="btn btn-link p-0 mb-3"
										type="button"
										onClick={() => dispatch({ type: "toggleExpandOptions" })}
									>
										<AnimatePresence initial={false}>
											<motion.span
												animate={state.expandOptions ? "open" : "collapsed"}
												variants={{
													open: { rotate: 90 },
													collapsed: { rotate: 0 },
												}}
												transition={{
													duration: 0.3,
													type: "tween",
												}}
												className="glyphicon glyphicon-triangle-right"
											/>
										</AnimatePresence>{" "}
										More options
									</button>
									<AnimatePresence initial={false}>
										{state.expandOptions ? (
											<motion.div
												initial="collapsed"
												animate="open"
												exit="collapsed"
												variants={{
													open: { opacity: 1, height: "auto" },
													collapsed: { opacity: 0, height: 0 },
												}}
												transition={{
													duration: 0.3,
													type: "tween",
												}}
											>
												{moreOptions}
											</motion.div>
										) : null}
									</AnimatePresence>
								</>
							) : null}

							<div className="text-center mt-3">
								<button
									type="submit"
									className="btn btn-lg btn-primary mr-2"
									disabled={
										state.creating ||
										disableWhileLoadingLeagueFile ||
										!!invalidSeasonPhaseMessage
									}
								>
									{createLeagueText}
								</button>

								<button
									className="btn btn-lg btn-secondary"
									type="button"
									onClick={() => {
										setCurrentScreen("settings");
									}}
								>
									Customize Settings
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
														from real data. Draft classes are included up to
														today.
													</p>
												</li>
												<li className="list-group-item bg-light">
													<h3>Watch your league evolve over time</h3>
													<p className="mb-0">
														There were only 11 teams in {MIN_SEASON}, playing a
														very different brand of basketball than today. Live
														through expansion drafts, league rule changes, team
														relocations, economic growth, and changes in style
														of play.
													</p>
												</li>
												<li className="list-group-item bg-light">
													<h3>Every league is different</h3>
													<p className="mb-0">
														Draft prospects always start the same, but they have
														different career arcs in every league. See busts
														meet their potentials, see injury-shortened careers
														play out in full, and see new combinations of
														players lead to dynasties.
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
														franchise's history. Create a league with players
														from only one decade, or the greatest players of all
														time.
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
										<div
											className="card-body"
											style={{ marginBottom: "-1rem" }}
										>
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
														{SPORT_HAS_REAL_PLAYERS
															? "Random players and teams"
															: "Default"}
													</option>
													{SPORT_HAS_REAL_PLAYERS ? (
														<option value="real">Real players and teams</option>
													) : null}
													{SPORT_HAS_LEGENDS ? (
														<option value="legends">Legends</option>
													) : null}
													<option value="custom-rosters">
														Upload league file
													</option>
													<option value="custom-url">
														Enter league file URL
													</option>
												</select>
												{state.customize === "custom-rosters" ||
												state.customize === "custom-url" ? (
													<p className="mt-3">
														League files can contain teams, players, settings,
														and other data. You can create a league file by
														going to Tools &gt; Export within a league, or by{" "}
														<a
															href={`https://${WEBSITE_ROOT}/manual/customization/`}
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
				</motion.form>
			)}
		</AnimatePresence>
	);
};

NewLeague.propTypes = {
	difficulty: PropTypes.number,
	lid: PropTypes.number,
	name: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
};

export default NewLeague;
