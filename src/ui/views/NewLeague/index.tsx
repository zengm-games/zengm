import { m, AnimatePresence } from "framer-motion";
import orderBy from "lodash-es/orderBy";
import { useState, useReducer, useRef, useCallback, useEffect } from "react";
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
	LEAGUE_DATABASE_VERSION,
} from "../../../common";
import {
	ActionButton,
	LeagueFileUpload,
	NextPrevButtons,
	PopText,
	ProgressBarText,
} from "../../components";
import type { LeagueFileUploadOutput } from "../../components/LeagueFileUpload";
import useTitleBar from "../../hooks/useTitleBar";
import {
	confirm,
	helpers,
	logEvent,
	realtimeUpdate,
	toWorker,
	safeLocalStorage,
	useLocalPartial,
	analyticsEvent,
} from "../../util";
import type {
	View,
	RealTeamInfo,
	GetLeagueOptions,
	Div,
	Conf,
	GameAttributesLeague,
} from "../../../common/types";
import classNames from "classnames";
import { descriptions } from "../Settings/settings";
import LeagueMenu from "./LeagueMenu";
import LeaguePartPicker from "./LeaguePartPicker";
import type { LeagueInfo, NewLeagueTeam } from "./types";
import CustomizeSettings from "./CustomizeSettings";
import CustomizeTeams, { makeTIDsSequential } from "./CustomizeTeams";
import type { Settings } from "../../../worker/views/settings";
import type { BasicInfo } from "../../../worker/api/leagueFileUpload";

const animationVariants = {
	visible: {
		x: 0,
		transition: { duration: 0.25, ease: "easeInOut" },
	},
	left: {
		x: "-100vw",
		transition: { duration: 0.25, ease: "easeInOut" },
	},
	right: {
		x: "100vw",
		transition: { duration: 0.25, ease: "easeInOut" },
	},
};

export const applyRealTeamInfos = <
	T extends Parameters<typeof applyRealTeamInfo>[0] & {
		season?: number;
	},
>(
	teams: T[],
	realTeamInfo: RealTeamInfo | undefined,
	season: number | "inTeamObject" = new Date().getFullYear(),
): T[] => {
	if (!realTeamInfo) {
		return teams;
	}

	return teams.map(t => {
		if (t.srID && realTeamInfo[t.srID]) {
			const t2 = helpers.deepCopy(t);

			let teamSeason;
			if (season === "inTeamObject") {
				teamSeason = t2.season;
				if (teamSeason === undefined) {
					throw new Error("Missing season");
				}
			} else {
				teamSeason = season;
			}

			applyRealTeamInfo(t2, realTeamInfo, teamSeason);

			return t2;
		}

		return t;
	});
};

const teamsDefault: NewLeagueTeam[] = helpers.addPopRank(
	helpers.getTeamsDefault(),
);

const initKeptKeys = ({
	newAllKeys,
	oldKeptKeys,
	oldAllKeys,
}: {
	newAllKeys: string[];
	oldKeptKeys?: string[];
	oldAllKeys?: string[];
}) => {
	const allKeys = newAllKeys.filter(key => key !== "version" && key !== "meta");

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

export const MIN_SEASON = 1947;
export const MAX_SEASON = 2024;
const MAX_PHASE = PHASE.PRESEASON;

const seasons: { key: string; value: string }[] = [];
for (let i = MAX_SEASON; i >= MIN_SEASON; i--) {
	seasons.push({
		key: String(i),
		value: String(i),
	});
}

const legends = [
	{
		key: "all" as const,
		value: "All Time",
	},
	{
		key: "2010s" as const,
		value: "2010s",
	},
	{
		key: "2000s" as const,
		value: "2000s",
	},
	{
		key: "1990s" as const,
		value: "1990s",
	},
	{
		key: "1980s" as const,
		value: "1980s",
	},
	{
		key: "1970s" as const,
		value: "1970s",
	},
	{
		key: "1960s" as const,
		value: "1960s",
	},
	{
		key: "1950s" as const,
		value: "1950s",
	},
];
type LegendKey = (typeof legends)[number]["key"];

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
	customize:
		| "default"
		| "custom-rosters"
		| "custom-url"
		| "legends"
		| "real"
		| "crossEra";
	season: number;
	phase: number;
	name: string;

	// Why keep difficulty here, rather than just using settings.difficulty? Because then it won't get reset every time settings change (new league file, etc).
	difficulty: number;

	// No "keys" in BasicInfo because we don't use it for anything, so why fake it for situations it doesn't exist, like real players leagues
	basicInfo: Omit<BasicInfo, "keys"> | undefined;
	file: File | undefined;
	url: string | undefined;
	legend: string;
	loadingLeagueFile: boolean;
	teams: NewLeagueTeam[];
	confs: Conf[];
	divs: Div[];
	tid: number;
	pendingInitialLeagueInfo: boolean;
	allKeys: string[];
	keptKeys: string[];
	settings: Omit<Settings, "numActiveTeams">;
	rebuildAbbrevPending?: string;
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
			type: "setName";
			name: string;
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
			type: "setTeamsCrossEra";
			teams: NewLeagueTeam[];
			confs: Conf[];
			divs: Div[];
			defaultSettings: State["settings"];
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
			importing: boolean;
			basicInfo: BasicInfo;
			file: File | undefined;
			url: string | undefined;
			teams: NewLeagueTeam[];
			defaultSettings: State["settings"];
	  }
	| {
			type: "newLeagueInfo";
			allKeys: string[];
			teams: NewLeagueTeam[];
			gameAttributes: Record<string, unknown>;
			defaultSettings: State["settings"];
			startingSeason: number;
	  };

const getTeamRegionName = (teams: NewLeagueTeam[], tid: number) => {
	const t = teams.find(t => t.tid === tid);
	if (!t) {
		return "";
	}
	return `${t.region} ${t.name}`;
};

const getNewTid = (prevTeamRegionName: string, newTeams: NewLeagueTeam[]) => {
	const newTeamsSorted = orderBy(
		newTeams.filter(t => !t.disabled),
		["region", "name"],
	);

	// First look for exact match
	let closestNewTeam = newTeamsSorted.find(
		t => prevTeamRegionName === `${t.region} ${t.name}`,
	);

	// Second look for exact region match
	if (!closestNewTeam) {
		closestNewTeam = newTeamsSorted.find(t =>
			prevTeamRegionName.startsWith(t.region),
		);
	}

	// Fallback, just get me something close
	if (!closestNewTeam) {
		closestNewTeam = newTeamsSorted.find(
			t => prevTeamRegionName <= `${t.region} ${t.name}`,
		);
	}

	return closestNewTeam ? closestNewTeam.tid : newTeams.length - 1;
};

const getSettingsFromGameAttributes = (
	gameAttributes: Record<string, unknown> | undefined,
	defaultSettings: State["settings"],
) => {
	const newSettings = helpers.deepCopy(defaultSettings);

	if (gameAttributes) {
		for (const key of helpers.keys(newSettings)) {
			if (
				key === "noStartingInjuries" ||
				key === "randomization" ||
				key === "realStats" ||
				key === "giveMeWorstRoster"
			) {
				continue;
			}

			const value = unwrapGameAttribute(gameAttributes, key);
			if (value !== undefined) {
				if (key === "repeatSeason") {
					newSettings[key] = !!value;
				} else {
					(newSettings[key] as any) = value;
				}
			}
		}
	}

	return newSettings;
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
				basicInfo: undefined,
				file: undefined,
				url: undefined,
				loadingLeagueFile: false,
				keptKeys: [],
				teams: teamsDefault,
				tid: getNewTid(getTeamRegionName(state.teams, state.tid), teamsDefault),
			};

		case "setCustomize": {
			const allKeys =
				action.customize === "default" || action.customize === "crossEra"
					? []
					: state.allKeys;
			return {
				...state,
				customize: action.customize,
				allKeys,
			};
		}

		case "setDifficulty":
			return {
				...state,
				difficulty: helpers.localeParseFloat(action.difficulty),
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

		case "setName":
			return {
				...state,
				name: action.name,
			};

		case "setSeason":
			return {
				...state,
				season: action.season,
			};

		case "setTeams": {
			const prevTeamRegionName = getTeamRegionName(state.teams, state.tid);

			return {
				...state,
				confs: action.confs,
				divs: action.divs,
				teams: action.teams,
				tid: getNewTid(prevTeamRegionName, action.teams),
			};
		}

		case "setTeamsCrossEra": {
			const prevTeamRegionName = getTeamRegionName(state.teams, state.tid);

			const settings = {
				...action.defaultSettings,
			};

			// What we want - change the default randomization value from "none" to "debuts". This mostly does that, unless the user has specified "none" in the global default settings, in which case we can't distinguish that from nothing being selected. Probably nobody will notice the difference. Using "debuts" rather than "debutsKeepCurrent" because really they're the same in this context (meaningless not to keep current players) so only "debuts" is exposed in the settings UI.
			if (settings.randomization === "none") {
				settings.randomization = "debuts";
			}

			return {
				...state,
				confs: action.confs,
				divs: action.divs,
				teams: action.teams,
				tid: getNewTid(prevTeamRegionName, action.teams),
				loadingLeagueFile: false,
				pendingInitialLeagueInfo: false,
				settings,
			};
		}

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
				newAllKeys: Array.from(action.basicInfo.keys),
				oldKeptKeys: state.keptKeys,
				oldAllKeys: state.allKeys,
			});

			let confs = DEFAULT_CONFS;
			let divs = DEFAULT_DIVS;

			const newSettings = getSettingsFromGameAttributes(
				action.basicInfo.gameAttributes,
				action.defaultSettings,
			);

			if (action.basicInfo.gameAttributes) {
				if (action.basicInfo.gameAttributes.confs) {
					confs = unwrapGameAttribute(action.basicInfo.gameAttributes, "confs");
				}
				if (action.basicInfo.gameAttributes.divs) {
					divs = unwrapGameAttribute(action.basicInfo.gameAttributes, "divs");
				}
			}

			const updatedState: State = {
				...state,
				loadingLeagueFile: false,
				basicInfo: action.basicInfo,
				file: action.file,
				url: action.url,
				allKeys,
				keptKeys,
				confs,
				divs,
				teams: action.teams.filter(t => !t.disabled),
				tid: getNewTid(prevTeamRegionName, action.teams),
				settings: newSettings,
			};

			// Update name only if we're creating a new league (not importing) and it's a meaningful name (not default League N)
			if (
				action.basicInfo.name &&
				!action.importing &&
				!action.basicInfo.name.match(/^League \d+$/)
			) {
				updatedState.name = action.basicInfo.name;
			}

			return updatedState;
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

			const newSettings = getSettingsFromGameAttributes(
				action.gameAttributes,
				action.defaultSettings,
			);

			const confs = unwrapGameAttribute(action.gameAttributes, "confs");
			const divs = unwrapGameAttribute(action.gameAttributes, "divs");

			let tid;
			if (state.rebuildAbbrevPending) {
				const t = action.teams.find(t => t.srID === state.rebuildAbbrevPending);
				if (t) {
					tid = t.tid;
				}
			}
			if (tid === undefined) {
				tid = getNewTid(prevTeamRegionName, action.teams);
			}

			return {
				...state,
				loadingLeagueFile: false,
				basicInfo: {
					gameAttributes: action.gameAttributes,
					maxGid: -1,
					hasRookieContracts: true,
					startingSeason: action.startingSeason,
					teams: action.teams,
					version: LEAGUE_DATABASE_VERSION,
				},
				file: undefined,
				url: undefined,
				allKeys,
				keptKeys,
				confs,
				divs,
				teams: action.teams,
				tid,
				pendingInitialLeagueInfo: false,
				settings: newSettings,
				rebuildAbbrevPending: undefined,
			};
		}

		default:
			throw new Error();
	}
};

const getRebuildInfo = () => {
	if (location.hash.startsWith("#rebuild=")) {
		const rebuildSlug = location.hash.replace("#rebuild=", "");
		const parts = rebuildSlug.split("_");
		const abbrev = parts[1].toUpperCase();
		const season = parseInt(parts[2]);
		if (abbrev && !Number.isNaN(season)) {
			return {
				abbrev,
				season,
			};
		}
	}
};

const getGenderOverride = (): GameAttributesLeague["gender"] | undefined => {
	if (location.hash.startsWith("#gender=")) {
		const gender = location.hash.replace("#gender=", "");
		if (gender === "male" || gender === "female") {
			return gender;
		}
	}
};

const NewLeague = (props: View<"newLeague">) => {
	const [startingSeason, setStartingSeason] = useState(
		String(new Date().getFullYear()),
	);
	const [currentScreen, setCurrentScreen] = useState<
		"default" | "teams" | "settings"
	>("default");

	const leagueCreationID = useRef(Math.random());
	const { leagueCreation, leagueCreationPercent } = useLocalPartial([
		"leagueCreation",
		"leagueCreationPercent",
	]);

	const importing = props.lid !== undefined;

	const [state, dispatch] = useReducer(
		reducer,
		props,
		(props: View<"newLeague">): State => {
			let customize: State["customize"] = "default";
			if (importing) {
				customize = "custom-rosters";
			}
			if (
				props.type === "real" ||
				props.type === "legends" ||
				props.type === "crossEra"
			) {
				customize = props.type;
			}

			const basicInfo = undefined;

			const teams = teamsDefault;

			let prevTeamRegionName = safeLocalStorage.getItem("prevTeamRegionName");
			if (prevTeamRegionName === null) {
				prevTeamRegionName = "";
			}

			let season;
			let phase;
			const rebuildInfo = getRebuildInfo();
			if (rebuildInfo) {
				season = rebuildInfo.season;
				phase = PHASE.PRESEASON;
				// Can't set tid yet because we haven't loaded teams for this season - do it later with rebuildAbbrevPending
			} else {
				season = parseInt(safeLocalStorage.getItem("prevSeason") as any);
				if (Number.isNaN(season)) {
					season = MAX_SEASON;
				}
				phase = parseInt(safeLocalStorage.getItem("prevPhase") as any);
				if (Number.isNaN(phase)) {
					phase = PHASE.PRESEASON;
				}
			}

			let settings;
			const genderOverride = getGenderOverride();
			if (genderOverride) {
				settings = {
					...props.defaultSettings,
					gender: genderOverride,
				};
			} else {
				settings = props.defaultSettings;
			}

			const { allKeys, keptKeys } = initKeptKeys({
				newAllKeys: [],
			});

			return {
				creating: false,
				customize,
				season,
				legend: "all",
				difficulty: props.difficulty ?? DIFFICULTY.Normal,
				phase,
				name: props.name,
				basicInfo,
				file: undefined,
				url: undefined,
				loadingLeagueFile: false,
				teams: teamsDefault,
				confs: DEFAULT_CONFS,
				divs: DEFAULT_DIVS,
				tid: getNewTid(prevTeamRegionName, teams),
				pendingInitialLeagueInfo: true,
				allKeys,
				keptKeys,
				settings,
				rebuildAbbrevPending: rebuildInfo?.abbrev,
			};
		},
	);

	let title: string;
	if (importing) {
		title = "Import League";
	} else if (props.type === "custom") {
		title = SPORT_HAS_REAL_PLAYERS ? "New Custom League" : "New League";
	} else if (props.type === "random") {
		title = "New Random Players League";
	} else if (props.type === "legends") {
		title = "New Legends League";
	} else if (props.type === "crossEra") {
		title = "New Cross-Era League";
	} else {
		title = "New Real Players League";
	}

	const keptKeysIsAvailable = state.allKeys.length > 0;
	const displayedTeams =
		!keptKeysIsAvailable || state.keptKeys.includes("teams")
			? state.teams
			: teamsDefault;

	const createLeague = async (settingsOverride?: State["settings"]) => {
		if (importing) {
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

		const settings = settingsOverride ?? state.settings;

		// If no settingsOverride, then use difficulty from state, since user may have selected a new value
		if (!settingsOverride) {
			settings.difficulty = state.difficulty;
		}

		const actualShuffleRosters = state.keptKeys.includes("players")
			? settings.randomization === "shuffle"
			: false;

		const startingSeasonFromInput =
			state.customize === "default" || state.customize === "crossEra"
				? startingSeason
				: undefined;

		try {
			let getLeagueOptions: GetLeagueOptions | undefined;
			if (state.customize === "real") {
				getLeagueOptions = {
					type: "real",
					season: state.season,
					phase: state.phase,
					randomDebuts:
						settings.randomization === "debuts" ||
						settings.randomization === "debutsKeepCurrent" ||
						settings.randomization === "debutsForever" ||
						settings.randomization === "debutsForeverKeepCurrent",
					randomDebutsKeepCurrent:
						settings.randomization === "debutsKeepCurrent" ||
						settings.randomization === "debutsForeverKeepCurrent",
					realDraftRatings: settings.realDraftRatings,
					realStats: settings.realStats,
				};
			} else if (state.customize === "legends") {
				getLeagueOptions = {
					type: "legends",
					decade: state.legend as LegendKey,
				};
			}

			const teamRegionName = getTeamRegionName(state.teams, state.tid);
			safeLocalStorage.setItem("prevTeamRegionName", teamRegionName);
			if (state.customize === "real") {
				safeLocalStorage.setItem("prevSeason", String(state.season));
				safeLocalStorage.setItem("prevPhase", String(state.phase));
			}

			// If undefined, it's random players, so make this true to not trigger this logic downstream
			const hasRookieContracts = state.basicInfo?.hasRookieContracts ?? true;

			const lid = await toWorker("main", "createLeague", {
				name: state.name,
				tid: state.tid,
				file: state.file,
				url: state.url,
				keptKeys: state.keptKeys,
				shuffleRosters: actualShuffleRosters,
				importLid: props.lid,
				getLeagueOptions,
				startingSeasonFromInput,
				confs: state.confs,
				divs: state.divs,
				teamsFromInput: displayedTeams,
				settings,
				fromFile: {
					gameAttributes: state.basicInfo?.gameAttributes,
					maxGid: state.basicInfo?.maxGid,
					hasRookieContracts,
					startingSeason: state.basicInfo?.startingSeason,
					teams: state.basicInfo?.teams,
					version: state.basicInfo?.version,
				},
				leagueCreationID: leagueCreationID.current,
			});

			let type: string = state.customize;
			if (type === "real") {
				type = String(state.season);
			}
			if (type === "legends") {
				type = String(state.legend);
			}
			analyticsEvent("new_league", {
				league_type: type,
				team: teamRegionName,
				league_id: lid,
			});

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

	const handleNewLeagueFile = (
		err: Error | null,
		output?: LeagueFileUploadOutput,
	) => {
		if (err) {
			dispatch({ type: "clearLeagueFile" });
			return;
		}

		const { basicInfo, file, url } = output!;

		let newTeams = helpers.deepCopy(basicInfo.teams);
		if (newTeams) {
			for (const t of newTeams) {
				// Is pop hidden in season, like in manageTeams import?
				if (!Object.hasOwn(t, "pop") && t.seasons && t.seasons.length > 0) {
					t.pop = t.seasons.at(-1).pop;
				}

				// God, I hate being permissive...
				if (typeof t.pop !== "number") {
					t.pop = helpers.localeParseFloat(t.pop);
				}
				if (Number.isNaN(t.pop)) {
					t.pop = 1;
				}

				t.pop = helpers.localeParseFloat(t.pop.toFixed(2));
			}

			newTeams = helpers.addPopRank(newTeams);
		} else {
			newTeams = teamsDefault;
		}

		if (basicInfo.gameAttributes) {
			if (Array.isArray(basicInfo.gameAttributes)) {
				basicInfo.gameAttributes = gameAttributesArrayToObject(
					basicInfo.gameAttributes,
				);
			}
		}

		dispatch({
			type: "newLeagueFile",
			importing,
			basicInfo,
			file,
			url,
			teams: applyRealTeamInfos(
				newTeams,
				props.realTeamInfo,
				basicInfo.startingSeason,
			),
			defaultSettings: props.defaultSettings,
		});

		// Need to update team and difficulty dropdowns?
		if (basicInfo.gameAttributes) {
			if (basicInfo.gameAttributes.userTid !== undefined) {
				let tid = basicInfo.gameAttributes.userTid;
				if (Array.isArray(tid) && tid.length > 0) {
					tid = tid.at(-1).value;
				}
				if (typeof tid === "number" && !Number.isNaN(tid)) {
					dispatch({ type: "setTid", tid });
				}
			}

			const difficulty = basicInfo.gameAttributes.difficulty;
			if (typeof difficulty === "number" && !Number.isNaN(difficulty)) {
				dispatch({ type: "setDifficulty", difficulty: String(difficulty) });
			}
		}
	};

	const handleNewLeagueInfo = useCallback(
		(leagueInfo: LeagueInfo) => {
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
				startingSeason: leagueInfo.startingSeason,
			});
		},
		[props.defaultSettings, props.realTeamInfo],
	);

	const generateCrossEraTeams = useCallback(async () => {
		dispatch({ type: "loadingLeagueFile" });

		const response = await toWorker("main", "getRandomTeams", {
			divs: DEFAULT_DIVS,
			numTeamsPerDiv: Array(DEFAULT_DIVS.length).fill(5),
			real: true,
			weightByPopulation: false,
			northAmericaOnly: false,
		});

		if (typeof response === "string") {
			throw new Error(`Error randomizing teams: ${response}`);
		} else {
			const newTeams = applyRealTeamInfos(
				makeTIDsSequential(response),
				props.realTeamInfo,
				"inTeamObject",
			);

			dispatch({
				type: "setTeamsCrossEra",
				confs: DEFAULT_CONFS,
				divs: DEFAULT_DIVS,
				teams: helpers.addPopRank(newTeams),
				defaultSettings: props.defaultSettings,
			});
		}
	}, [props.defaultSettings, props.realTeamInfo]);

	useEffect(() => {
		if (state.customize === "crossEra") {
			generateCrossEraTeams();
		}
	}, [generateCrossEraTeams, state.customize]);

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
			<m.div
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
					realTeamInfo={props.realTeamInfo}
				/>
			</m.div>
		);
	}

	const createLeagueText = importing ? "Import League" : "Create League";

	if (currentScreen === "settings") {
		subPage = (
			<m.div
				key="screen-settings"
				variants={animationVariants}
				initial="right"
				animate="visible"
				exit="right"
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
					hasPlayers={state.keptKeys.includes("players")}
					// Don't want legends for this!
					realPlayers={state.customize === "real"}
				/>
			</m.div>
		);
	}

	const disableWhileLoadingLeagueFile =
		((state.customize === "custom-rosters" ||
			state.customize === "custom-url") &&
			((state.file === undefined && state.url === undefined) ||
				state.loadingLeagueFile)) ||
		((state.customize === "real" || state.customize === "legends") &&
			state.pendingInitialLeagueInfo) ||
		(state.customize === "crossEra" &&
			(state.loadingLeagueFile || state.pendingInitialLeagueInfo));
	const showLoadingIndicator =
		disableWhileLoadingLeagueFile &&
		(state.loadingLeagueFile ||
			((state.customize === "real" ||
				state.customize === "legends" ||
				state.customize === "crossEra") &&
				state.pendingInitialLeagueInfo));

	const bannedExpansionSeasons = [
		// Because of other mergers
		1947, 1948, 1949,

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
	if (state.season === MAX_SEASON && state.phase > MAX_PHASE) {
		invalidSeasonPhaseMessage = `Sorry, I'm not allowed to share the results of the ${MAX_SEASON} ${
			MAX_PHASE === PHASE.PRESEASON ? "season" : (PHASE_TEXT as any)[MAX_PHASE]
		} yet.`;
	}

	const sortedDisplayedTeams = orderBy(displayedTeams, ["region", "name"]);

	return (
		<AnimatePresence mode="popLayout" initial={false}>
			{subPage ? (
				subPage
			) : (
				<m.form
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
					{importing ? (
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
							<div className="mb-3">
								<label className="form-label" htmlFor="new-league-name">
									League name
								</label>
								<input
									id="new-league-name"
									className="form-control"
									type="text"
									value={state.name}
									onChange={event => {
										dispatch({
											type: "setName",
											name: event.target.value,
										});
									}}
								/>
							</div>

							{state.customize === "default" ||
							state.customize === "crossEra" ? (
								<div className="mb-3">
									<label
										className="form-label"
										htmlFor="new-league-starting-season"
									>
										Season
									</label>
									<input
										id="new-league-starting-season"
										className="form-control"
										type="text"
										value={startingSeason}
										onChange={event => {
											setStartingSeason(event.target.value);
										}}
										inputMode="numeric"
									/>
								</div>
							) : null}

							{state.customize === "real" ? (
								<>
									<div className="mb-3">
										<LeagueMenu
											value={String(state.season)}
											values={seasons}
											getLeagueInfo={async (value, value2) => {
												const leagueInfo = await toWorker(
													"main",
													"getLeagueInfo",
													{
														type: "real",
														season: parseInt(value),
														phase: value2,
														randomDebuts:
															state.settings.randomization === "debuts" ||
															state.settings.randomization ===
																"debutsKeepCurrent" ||
															state.settings.randomization ===
																"debutsForever" ||
															state.settings.randomization ===
																"debutsForeverKeepCurrent",
														randomDebutsKeepCurrent:
															state.settings.randomization ===
																"debutsKeepCurrent" ||
															state.settings.randomization ===
																"debutsForeverKeepCurrent",
														realDraftRatings: state.settings.realDraftRatings,

														// Adding historical seasons just screws up tid
														realStats: "none",
													},
												);

												return leagueInfo;
											}}
											onLoading={value => {
												const season = parseInt(value);
												dispatch({ type: "setSeason", season });
											}}
											onDone={handleNewLeagueInfo}
											quickValues={[
												"1956",
												"1968",
												"1984",
												"1996",
												"2003",
												`${MAX_SEASON}`,
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
											<div className="text-body-secondary mt-1">
												{state.season} in BBGM is the {state.season - 1}-
												{String(state.season).slice(2)} season.
											</div>
										)}
									</div>
								</>
							) : null}

							{state.customize === "legends" ? (
								<div className="mb-3">
									<LeagueMenu
										value={state.legend}
										values={legends}
										getLeagueInfo={async value => {
											const leagueInfo = await toWorker(
												"main",
												"getLeagueInfo",
												{
													type: "legends",
													decade: value as LegendKey,
												},
											);

											return leagueInfo;
										}}
										onLoading={legend => {
											dispatch({ type: "setLegend", legend });
										}}
										onDone={handleNewLeagueInfo}
									/>
								</div>
							) : null}

							<div className="mb-3">
								<label htmlFor="new-league-team" className="form-label me-2">
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
										className="form-select"
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
														: `${t.region} ${t.name}${
																t.season !== undefined ? ` (${t.season})` : ""
														  }`}
												</option>
											);
										})}
									</select>
									{state.customize === "default" ||
									state.customize === "crossEra" ? (
										<button
											className="btn btn-light-bordered"
											disabled={disableWhileLoadingLeagueFile}
											type="button"
											onClick={() => {
												setCurrentScreen("teams");
											}}
										>
											Customize
										</button>
									) : null}
									<button
										className="btn btn-light-bordered"
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
								{!state.settings.equalizeRegions ? (
									<PopText
										className="text-body-secondary"
										tid={state.tid}
										teams={displayedTeams}
										numActiveTeams={displayedTeams.length}
									/>
								) : (
									<span className="text-body-secondary">Population: equal</span>
								)}
								{state.customize === "crossEra" ? (
									<ActionButton
										className="mt-1"
										variant="light-bordered"
										type="button"
										disabled={disableWhileLoadingLeagueFile}
										processing={showLoadingIndicator}
										onClick={generateCrossEraTeams}
										processingText="Selecting Teams"
									>
										Regenerate Historical Teams
									</ActionButton>
								) : null}
							</div>

							<div className="mb-3">
								<label className="form-label" htmlFor="new-league-difficulty">
									Difficulty
								</label>
								<select
									id="new-league-difficulty"
									className="form-select mb-1"
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
								<span className="text-body-secondary">
									{descriptions.difficulty}
								</span>
							</div>

							<div className="text-center mt-3">
								<ActionButton
									className="me-2"
									size="lg"
									type="submit"
									disabled={
										state.creating ||
										disableWhileLoadingLeagueFile ||
										!!invalidSeasonPhaseMessage
									}
									processing={state.creating}
								>
									{createLeagueText}
								</ActionButton>

								<button
									className="btn btn-lg btn-secondary"
									type="button"
									disabled={
										state.creating ||
										disableWhileLoadingLeagueFile ||
										!!invalidSeasonPhaseMessage
									}
									onClick={() => {
										setCurrentScreen("settings");
									}}
								>
									Customize Settings
								</button>
							</div>

							{(state.file || state.url) &&
							(leagueCreationPercent?.id === leagueCreationID.current ||
								leagueCreation?.id === leagueCreationID.current) ? (
								<div className="mt-3">
									<ProgressBarText
										text={leagueCreation?.status ?? ""}
										percent={leagueCreationPercent?.percent ?? 0}
									/>
								</div>
							) : null}
						</div>

						{props.type === "custom" ||
						props.type === "real" ||
						props.type === "legends" ||
						props.type === "crossEra" ? (
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
														<a href="https://zengm.com/blog/2020/05/legends-leagues/">
															More details
														</a>
													</p>
												</li>
											</ul>
										</>
									) : null}
									{props.type === "crossEra" ? (
										<>
											<ul className="list-group list-group-flush">
												<li className="list-group-item bg-light">
													<h3>Mix historical teams in one league</h3>
													<p>
														Cross-era leagues are filled with real historical
														teams from different seasons. Each league you create
														has a new set of teams.
													</p>
													<h3>Real/random draft classes</h3>
													<p className="mb-0">
														By default, "Random Debuts" is enabled, meaning that
														any real players not on the initial teams will be
														randomly placed in future draft classes.
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
											<div className="mb-3">
												<select
													className="form-select"
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
														<option value="crossEra">Cross-era</option>
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
				</m.form>
			)}
		</AnimatePresence>
	);
};

export default NewLeague;
