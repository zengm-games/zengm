import classNames from "classnames";
import { useState, ReactNode, FormEvent } from "react";
import { isSport, WEBSITE_ROOT } from "../../common";
import {
	gameAttributesKeysGameState,
	gameAttributesKeysTeams,
} from "../../common/defaultGameAttributes";
import { types } from "../../common/transactionInfo";
import type {
	EventBBGM,
	GameAttribute,
	Player,
	Team,
	View,
} from "../../common/types";
import { ActionButton, MoreLinks, ProgressBarText } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import {
	downloadFileStream,
	helpers,
	makeExportStream,
	safeLocalStorage,
	toWorker,
} from "../util";
import { HAS_FILE_SYSTEM_ACCESS_API } from "../util/downloadFileStream";

export type ExportLeagueKey =
	| "players"
	| "gameHighs"
	| "teamsBasic"
	| "teams"
	| "headToHead"
	| "schedule"
	| "draftPicks"
	| "leagueSettings"
	| "gameState"
	| "newsFeedTransactions"
	| "newsFeedOther"
	| "games";

type Category = {
	key: ExportLeagueKey;
	name: string;
	desc: string;
	default: boolean;
	parent?: ExportLeagueKey;
};

const categories: Category[] = [
	{
		key: "players",
		name: "Players",
		desc: "All player info, ratings, stats, and awards.",
		default: true,
	},
	...((!isSport("football")
		? [
				{
					key: "gameHighs",
					name: "Include game highs",
					desc: "Game highs are fun, but they increase export size by 25%.",
					default: true,
					parent: "players",
				},
		  ]
		: []) as Category[]),
	{
		key: "teamsBasic",
		name: "Basic team data",
		desc: "Just the stuff you see at Tools > Manage Teams, such as abbrev/region/name, division, logo, etc. Select only this if you want to create a new league with the same teams as this league, but without anything else copied over.",
		default: true,
	},
	{
		key: "teams",
		name: "All team data",
		desc: "All team info and stats.",
		default: true,
		parent: "teamsBasic",
	},
	{
		key: "schedule",
		name: "Schedule",
		desc: "Current regular season schedule and playoff series.",
		default: true,
	},
	{
		key: "draftPicks",
		name: "Draft picks",
		desc: "Future draft picks.",
		default: true,
	},
	{
		key: "leagueSettings",
		name: "League settings",
		desc: "All league settings.",
		default: true,
	},
	{
		key: "gameState",
		name: "Game state",
		desc: "Interactions with the owner, current contract negotiations, current season/phase, etc. Useful for saving or backing up a game, but not for creating custom rosters to share.",
		default: true,
	},
	{
		key: "newsFeedTransactions",
		name: "News feed - transactions",
		desc: "Trades, draft picks, and signings.",
		default: true,
	},
	{
		key: "newsFeedOther",
		name: "News feed - all other entries",
		desc: "All entries besides trades, draft picks, and signings - usually not that important, and increases export size by 10%.",
		default: true,
	},
	{
		key: "headToHead",
		name: "Head-to-head data",
		desc: "History of head-to-head results between teams.",
		default: true,
	},
	{
		key: "games",
		name: "Box scores",
		desc: "Box scores take up tons of space, but by default only three seasons are saved.",
		default: false,
	},
];

type Checked = Record<ExportLeagueKey, boolean>;
type BulkType = "default" | "none" | "all" | "teamsOnly" | "leagueSettingsOnly";

const getCurrentSelected = (checked: Checked): BulkType | undefined => {
	let validDefault = true;
	let validNone = true;
	let validAll = true;
	let validTeamsOnly = true;
	let validLeagueSettingsOnly = true;

	for (const category of categories) {
		if (category.default !== checked[category.key]) {
			validDefault = false;
		}

		if (checked[category.key]) {
			validNone = false;
		}

		if (!checked[category.key]) {
			validAll = false;
		}

		if (category.key === "teamsBasic") {
			if (!checked[category.key]) {
				validTeamsOnly = false;
			}
		} else {
			if (checked[category.key]) {
				validTeamsOnly = false;
			}
		}

		if (category.key === "leagueSettings") {
			if (!checked[category.key]) {
				validLeagueSettingsOnly = false;
			}
		} else {
			if (checked[category.key]) {
				validLeagueSettingsOnly = false;
			}
		}
	}

	if (validDefault) {
		return "default";
	}

	if (validNone) {
		return "none";
	}

	if (validAll) {
		return "all";
	}

	if (validTeamsOnly) {
		return "teamsOnly";
	}

	if (validLeagueSettingsOnly) {
		return "leagueSettingsOnly";
	}

	return undefined;
};

const getDefaultChecked = () => {
	const init = {
		players: false,
		gameHighs: false,
		teamsBasic: false,
		teams: false,
		headToHead: false,
		schedule: false,
		draftPicks: false,
		leagueSettings: false,
		gameState: false,
		newsFeedTransactions: false,
		newsFeedOther: false,
		games: false,
	};

	for (const category of categories) {
		init[category.key] = category.default;
	}

	return init;
};

const saveDefaults = (checked: Checked, compressed: boolean) => {
	safeLocalStorage.setItem("exportLeagueData", JSON.stringify(checked));
	safeLocalStorage.setItem(
		"exportLeagueFormat",
		JSON.stringify({ compressed }),
	);
};

const loadChecked = () => {
	const checked = getDefaultChecked();

	const json = safeLocalStorage.getItem("exportLeagueData");
	if (json) {
		try {
			const settings = JSON.parse(json);
			for (const key of helpers.keys(checked)) {
				if (typeof settings[key] === "boolean") {
					checked[key] = settings[key];
				}
			}

			return checked;
		} catch (error) {}
	}

	return checked;
};

const loadCompressed = (): boolean => {
	const json = safeLocalStorage.getItem("exportLeagueFormat");
	if (json) {
		try {
			const settings = JSON.parse(json);
			if (typeof settings.compressed === "boolean") {
				return settings.compressed;
			}
		} catch (error) {}
	}

	return true;
};

const getExportInfo = (
	stats: View<"exportLeague">["stats"],
	checked: Record<ExportLeagueKey, boolean>,
) => {
	const storesSet = new Set<string>();

	const storesByKey = {
		players: ["players", "releasedPlayers", "awards"],
		teamsBasic: ["teams", "gameAttributes"],
		teams: ["teamSeasons", "teamStats"],
		headToHead: ["headToHeads"],
		schedule: ["schedule", "playoffSeries"],
		draftPicks: ["draftPicks"],
		leagueSettings: ["gameAttributes"],
		gameState: [
			"gameAttributes",
			"trade",
			"negotiations",
			"draftLotteryResults",
			"messages",
			"playerFeats",
			"allStars",
			"scheduledEvents",
		],
		newsFeedTransactions: ["events"],
		newsFeedOther: ["events"],
		games: ["games"],
	};

	for (const key of helpers.keys(storesByKey)) {
		if (checked[key]) {
			for (const store of storesByKey[key]) {
				storesSet.add(store);
			}
		}
	}

	const stores = Array.from(storesSet);

	const filter: any = {};
	if (checked.newsFeedTransactions && !checked.newsFeedOther) {
		filter.events = (event: EventBBGM) => {
			const category = types[event.type]?.category;
			return category === "transaction" || category === "draft";
		};
	} else if (!checked.newsFeedTransactions && checked.newsFeedOther) {
		filter.events = (event: EventBBGM) => {
			const category = types[event.type]?.category;
			return category !== "transaction" && category !== "draft";
		};
	} else if (
		checked.leagueSettings ||
		checked.gameState ||
		checked.teamsBasic
	) {
		filter.gameAttributes = (row: GameAttribute) => {
			if (!checked.leagueSettings) {
				if (
					!gameAttributesKeysGameState.includes(row.key) &&
					!gameAttributesKeysTeams.includes(row.key)
				) {
					return false;
				}
			}

			if (!checked.gameState) {
				if (gameAttributesKeysGameState.includes(row.key)) {
					return false;
				}
			}

			if (!checked.teamsBasic) {
				if (gameAttributesKeysTeams.includes(row.key)) {
					return false;
				}
			}

			return true;
		};
	}

	const forEach: any = {};
	if (checked.players && !checked.gameHighs) {
		forEach.players = (p: Player) => {
			for (const row of p.stats) {
				for (const stat of stats.max) {
					delete row[stat];
				}
			}
		};
	}

	const map: any = {};
	const teamsBasicOnly = checked.teamsBasic && !checked.teams;
	if (teamsBasicOnly) {
		map.teams = (t: Team) => {
			return {
				tid: t.tid,
				abbrev: t.abbrev,
				region: t.region,
				name: t.name,
				imgURL: t.imgURL,
				imgURLSmall: t.imgURLSmall,
				colors: t.colors,
				jersey: t.jersey,
				cid: t.cid,
				did: t.did,
				pop: t.pop,
				stadiumCapacity: t.stadiumCapacity,
				disabled: t.disabled,
				srID: t.srID,
			};
		};
	}

	// Include startingSeason when necessary (historical data but no game state)
	const hasHistoricalData =
		checked.players ||
		checked.teams ||
		checked.headToHead ||
		checked.schedule ||
		checked.draftPicks;

	return {
		stores,
		filter,
		forEach,
		map,
		hasHistoricalData,
	};
};

const ExportLeague = ({ stats }: View<"exportLeague">) => {
	const [status, setStatus] = useState<ReactNode | undefined>();
	const [compressed, setCompressed] = useState(loadCompressed);
	const [checked, setChecked] = useState<Checked>(loadChecked);
	const [processingStore, setProcessingStore] = useState<string | undefined>();
	const [percentDone, setPercentDone] = useState(-1);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		setStatus("Exporting...");
		setPercentDone(0);
		saveDefaults(checked, compressed);

		let timeoutID: number | undefined;

		try {
			const filename = await toWorker("main", "getExportFilename", "league");

			const { stores, filter, forEach, map, hasHistoricalData } = getExportInfo(
				stats,
				checked,
			);

			const readableStream = await makeExportStream(stores, {
				compressed,
				filter,
				forEach,
				map,
				hasHistoricalData,
				onPercentDone: percent => {
					setPercentDone(percent);
				},
				onProcessingStore: store => {
					setProcessingStore(store);
				},
			});

			// I HAVE NO IDEA WHY THIS LINE IS NEEDED, but without this, Firefox seems to cut the stream off early
			(self as any).stream0 = readableStream;

			await downloadFileStream(filename, readableStream);
		} catch (error) {
			setStatus(<span className="text-danger">Error: "{error.message}"</span>);
			setPercentDone(-1);
			setProcessingStore(undefined);
			delete (self as any).stream0;
			throw error;
		}

		clearTimeout(timeoutID);

		setStatus(undefined);
		setPercentDone(-1);
		setProcessingStore(undefined);
		delete (self as any).stream0;
	};

	useTitleBar({ title: "Export League" });

	const currentSelected = getCurrentSelected(checked);

	const bulkSetChecked = (type: BulkType) => {
		if (type === "default") {
			setChecked(getDefaultChecked());
		} else {
			setChecked(prevChecked => {
				const newChecked = { ...prevChecked };
				for (const key of helpers.keys(newChecked)) {
					if (type === "none") {
						newChecked[key] = false;
					} else if (type === "all") {
						newChecked[key] = true;
					} else if (type === "teamsOnly") {
						newChecked[key] = key === "teamsBasic";
					} else if (type === "leagueSettingsOnly") {
						newChecked[key] = key === "leagueSettings";
					}
				}

				return newChecked;
			});
		}
	};

	const bulkInfo: {
		key: BulkType;
		title: string;
	}[] = [
		{
			key: "default",
			title: "Default",
		},
		{
			key: "none",
			title: "None",
		},
		{
			key: "all",
			title: "All",
		},
		{
			key: "teamsOnly",
			title: "Teams Only",
		},
		{
			key: "leagueSettingsOnly",
			title: "Settings Only",
		},
	];

	const bulkSelectButtons = bulkInfo.map(info => (
		<button
			key={info.key}
			className={`btn btn-${
				currentSelected === info.key ? "primary" : "light-bordered"
			}`}
			onClick={() => {
				bulkSetChecked(info.key);
			}}
			type="button"
		>
			{info.title}
		</button>
	));

	const showFirefoxWarning =
		!HAS_FILE_SYSTEM_ACCESS_API && navigator.userAgent.includes("Firefox");

	return (
		<>
			<MoreLinks type="importExport" page="export_league" />
			<p>
				Here you can export your entire league data to a single League File. A
				League File can serve many purposes. You can use it as a <b>backup</b>,
				to <b>copy a league from one computer to another</b>, or to use as the
				base for a <b>custom roster file</b> to share with others. Select as
				much or as little information as you want to export, since any missing
				information will be filled in with default values when it is used.{" "}
				<a href={`https://${WEBSITE_ROOT}/manual/customization/`}>
					Read the manual for more info.
				</a>
			</p>

			<form onSubmit={handleSubmit}>
				<div className="row">
					<div className="col-md-6 col-lg-5 col-xl-4">
						<h2>Data</h2>

						<div className="btn-group mb-3">{bulkSelectButtons}</div>

						{categories.map(cat => (
							<div
								key={cat.name}
								className={classNames("form-check", {
									"ml-4": cat.parent,
								})}
							>
								<label className="form-check-label">
									<input
										className="form-check-input"
										type="checkbox"
										checked={
											checked[cat.key] && (!cat.parent || checked[cat.parent])
										}
										disabled={cat.parent && !checked[cat.parent]}
										onChange={() => {
											setChecked(checked2 => ({
												...checked2,
												[cat.key]: !checked2[cat.key],
											}));
										}}
									/>
									{cat.name}
									<p className="text-muted">{cat.desc}</p>
								</label>
							</div>
						))}
					</div>
					<div className="col-md-6 col-lg-5 col-xl-4">
						<h2>Format</h2>
						<div className="form-check mb-3">
							<label className="form-check-label">
								<input
									className="form-check-input"
									type="checkbox"
									checked={compressed}
									onChange={() => {
										setCompressed(compressed => !compressed);
									}}
								/>
								Compressed (no extra whitespace)
							</label>
						</div>
					</div>
				</div>
				<div className="row">
					<div className="col-md-6 col-lg-5 col-xl-4">
						{showFirefoxWarning ? (
							<div className="alert alert-warning d-inline-block">
								<b>Firefox sometimes fails at writing exported data to disk.</b>{" "}
								If the progress bar gets stuck and it never prompts you to save
								a file, please reload and try again.
							</div>
						) : null}

						<div className="text-center">
							<ActionButton
								type="submit"
								processing={status === "Exporting..."}
							>
								Export League
							</ActionButton>
						</div>

						{percentDone >= 0 ? (
							<ProgressBarText
								className="mt-3"
								text={`Processing${
									processingStore ? ` ${processingStore}` : ""
								}...`}
								percent={percentDone ?? 0}
							/>
						) : null}

						{status && status !== "Exporting..." ? (
							<div className="mt-3 text-center">{status}</div>
						) : null}
					</div>
				</div>
			</form>
		</>
	);
};

export default ExportLeague;
