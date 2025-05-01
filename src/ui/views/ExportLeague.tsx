import clsx from "clsx";
import { useState, type ReactNode, useRef } from "react";
import { GAME_NAME, isSport, WEBSITE_ROOT } from "../../common/index.ts";
import {
	gameAttributesKeysGameState,
	gameAttributesKeysTeams,
} from "../../common/defaultGameAttributes.ts";
import { types } from "../../common/transactionInfo.ts";
import type {
	EventBBGM,
	GameAttribute,
	Player,
	Team,
	View,
} from "../../common/types.ts";
import type { LeagueDBStoreNames } from "../../worker/db/connectLeague.ts";
import {
	ActionButton,
	MoreLinks,
	ProgressBarText,
} from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import {
	helpers,
	safeLocalStorage,
	toWorker,
	useLocal,
} from "../util/index.ts";

const HAS_FILE_SYSTEM_ACCESS_API = !!window.showSaveFilePicker;

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
	name: ExportLeagueKey;
	title: string;
	desc: string;
	default: boolean;
	children?: Category[];
};

type Checked = Record<ExportLeagueKey, boolean>;

type BulkType = "default" | "none" | "all" | "teamsOnly" | "leagueSettingsOnly";

const categories: Category[] = [
	{
		name: "players",
		title: "Players",
		desc: "All player info, ratings, stats, and awards.",
		default: true,
		children: !isSport("football")
			? [
					{
						name: "gameHighs",
						title: "Include game highs",
						desc: "Game highs are fun, but they increase export size by 25%.",
						default: true,
					},
				]
			: undefined,
	},
	{
		name: "teamsBasic",
		title: "Basic team data",
		desc: "Just the stuff you see at Tools > Manage Teams, such as abbrev/region/name, division, logo, etc. Select only this if you want to create a new league with the same teams as this league, but without anything else copied over.",
		default: true,
		children: [
			{
				name: "teams",
				title: "All team data",
				desc: "All team info and stats.",
				default: true,
			},
		],
	},
	{
		name: "schedule",
		title: "Schedule",
		desc: "Current regular season schedule, and current and past playoff series data.",
		default: true,
	},
	{
		name: "draftPicks",
		title: "Draft picks",
		desc: "Future draft picks.",
		default: true,
	},
	{
		name: "leagueSettings",
		title: "League settings",
		desc: "All league settings.",
		default: true,
	},
	{
		name: "gameState",
		title: "Game state",
		desc: "Interactions with the owner, current contract negotiations, current season/phase, etc. Useful for saving or backing up a game, but not for creating custom rosters to share.",
		default: true,
	},
	{
		name: "newsFeedTransactions",
		title: "News feed - transactions",
		desc: "Trades, draft picks, and signings.",
		default: true,
	},
	{
		name: "newsFeedOther",
		title: "News feed - all other entries",
		desc: "All entries besides trades, draft picks, and signings - usually not that important, and increases export size by 10%.",
		default: true,
	},
	{
		name: "headToHead",
		title: "Head-to-head data",
		desc: "History of head-to-head results between teams.",
		default: true,
	},
	{
		name: "games",
		title: "Box scores",
		desc: "Box scores take up tons of space, but by default only three seasons are saved.",
		default: false,
	},
];

const getCurrentSelected = (checked: Checked): BulkType | undefined => {
	let validDefault = true;
	let validNone = true;
	let validAll = true;
	let validTeamsOnly = true;
	let validLeagueSettingsOnly = true;

	for (const category of categories) {
		if (category.default !== checked[category.name]) {
			validDefault = false;
		}

		if (checked[category.name]) {
			validNone = false;
		}

		if (!checked[category.name]) {
			validAll = false;
		}

		if (category.name === "teamsBasic") {
			if (!checked[category.name]) {
				validTeamsOnly = false;
			}
		} else {
			if (checked[category.name]) {
				validTeamsOnly = false;
			}
		}

		if (category.name === "leagueSettings") {
			if (!checked[category.name]) {
				validLeagueSettingsOnly = false;
			}
		} else {
			if (checked[category.name]) {
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
		init[category.name] = category.default;
		if (category.children) {
			for (const child of category.children) {
				init[child.name] = child.default;
			}
		}
	}

	return init;
};

const saveDefaults = (checked: Checked, compressed: boolean, gzip: boolean) => {
	safeLocalStorage.setItem("exportLeagueData", JSON.stringify(checked));
	safeLocalStorage.setItem(
		"exportLeagueFormat",
		JSON.stringify({ compressed, gzip }),
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
		} catch {}
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
		} catch {}
	}

	return true;
};

const loadGzip = (): boolean => {
	// Safari 16.4 (can remove this and other checks for the existence of DecompressionStream and CompressionStream)
	if (typeof DecompressionStream === "undefined") {
		return false;
	}

	const json = safeLocalStorage.getItem("exportLeagueFormat");
	if (json) {
		try {
			const settings = JSON.parse(json);
			if (typeof settings.gzip === "boolean") {
				return settings.gzip;
			}
		} catch {}
	}

	return true;
};

const getExportInfo = (
	stats: View<"exportLeague">["stats"],
	checked: Record<ExportLeagueKey, boolean>,
) => {
	const storesSet = new Set<LeagueDBStoreNames>();

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
			"seasonLeaders",
			"savedTrades",
			"savedTradingBlock",
		],
		newsFeedTransactions: ["events"],
		newsFeedOther: ["events"],
		games: ["games"],
	} satisfies Record<string, LeagueDBStoreNames[]>;

	for (const key of helpers.keys(storesByKey)) {
		if (checked[key]) {
			for (const store of storesByKey[key]) {
				storesSet.add(store);
			}
		}
	}

	const stores = Array.from(storesSet);

	const includeAtLeastSeasonAndStartingSeason =
		checked.players ||
		checked.teams ||
		checked.headToHead ||
		checked.schedule ||
		checked.draftPicks;

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
		checked.teamsBasic ||
		includeAtLeastSeasonAndStartingSeason
	) {
		filter.gameAttributes = (row: GameAttribute<any>) => {
			if (includeAtLeastSeasonAndStartingSeason) {
				if (row.key === "season" || row.key === "startingSeason") {
					return true;
				}

				// Short circuit if none of the other settings are enabled
				if (
					!checked.leagueSettings &&
					!checked.gameState &&
					!checked.teamsBasic
				) {
					return false;
				}
			}

			// If leagueSettings is not checked, that means at least one of gameState or teamsBasic is, so filter out any other settings
			if (!checked.leagueSettings) {
				if (
					!gameAttributesKeysGameState.includes(row.key) &&
					!gameAttributesKeysTeams.includes(row.key)
				) {
					return false;
				}
			}

			// If gameState or teamBasic is not checked, filter out any associated settings
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

			// Made it this far, must be something to keep
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

	return {
		stores,
		filter,
		forEach,
		map,
	};
};

const RenderOption = ({
	checked,
	children,
	desc,
	name,
	onToggle,
	parent,
	title,
}: Category & {
	checked: Checked;
	parent?: ExportLeagueKey;
	onToggle: (name: ExportLeagueKey) => void;
}) => {
	return (
		<>
			<div
				className={clsx("form-check", {
					"ms-4": parent,
				})}
			>
				<label className="form-check-label">
					<input
						className="form-check-input"
						type="checkbox"
						checked={checked[name] && (!parent || checked[parent])}
						disabled={parent && !checked[parent]}
						onChange={() => {
							onToggle(name);
						}}
					/>
					{title}
					<p className="text-body-secondary">{desc}</p>
				</label>
			</div>
			{children
				? children.map((child) => (
						<RenderOption
							key={child.name}
							{...child}
							checked={checked}
							onToggle={onToggle}
							parent={name}
						/>
					))
				: null}
		</>
	);
};

const SUPPORTS_CANCEL = typeof AbortController !== "undefined";

const ExportLeague = ({ stats }: View<"exportLeague">) => {
	const [state, setState] = useState<"idle" | "download" | "dropbox">("idle");
	const [aborting, setAborting] = useState(false);
	const [status, setStatus] = useState<ReactNode | undefined>();
	const [compressed, setCompressed] = useState(loadCompressed);
	const [gzip, setGzip] = useState(loadGzip);
	const [checked, setChecked] = useState<Checked>(loadChecked);
	const [processingStore, setProcessingStore] = useState<string | undefined>();
	const [percentDone, setPercentDone] = useState(-1);
	const [streamDownload, setStreamDownload] = useState(
		HAS_FILE_SYSTEM_ACCESS_API,
	);
	const abortController = useRef<AbortController | undefined>(undefined);

	const lid = useLocal((state) => state.lid);

	const cleanupAfterStream = (status?: ReactNode) => {
		abortController.current = undefined;
		setStatus(status);
		setState("idle");
		setAborting(false);
		setPercentDone(-1);
		setProcessingStore(undefined);
	};

	const [dropboxAccessToken, setDropboxAccessToken] = useState(() =>
		safeLocalStorage.getItem("dropboxAccessToken"),
	);

	const handleSubmit = (type: "download" | "dropbox") => async () => {
		setStatus(undefined);
		setState(type);
		setAborting(false);
		setPercentDone(0);
		saveDefaults(checked, compressed, gzip);

		try {
			let filename = await toWorker("main", "getExportFilename", "league");
			if (gzip && typeof CompressionStream !== "undefined") {
				filename += ".gz";
			}

			const { stores, filter, forEach, map } = getExportInfo(stats, checked);

			const { downloadFileStream, makeExportStream } = await import(
				"../util/exportLeague.ts"
			);

			const readableStream = await makeExportStream(stores, {
				compressed,
				filter,
				forEach,
				map,
				name: await toWorker("main", "getLeagueName", undefined),
				onPercentDone: (percent) => {
					setPercentDone(percent);
				},
				onProcessingStore: (store) => {
					setProcessingStore(store);
				},
			});

			let fileStream;
			let status: ReactNode;
			if (type === "download") {
				fileStream = await downloadFileStream(streamDownload, filename, gzip);
			} else {
				if (!dropboxAccessToken) {
					throw new Error("Missing dropboxAccessToken");
				}
				if (lid === undefined) {
					throw new Error("Missing lid");
				}
				const { dropboxStream } = await import("../util/dropbox.ts");
				fileStream = await dropboxStream({
					accessToken: dropboxAccessToken,
					filename,
					lid,
					onAbortDone: () => {
						// This (and all "aborting/setAborting" code) is needed because there is no good way to abort an upload https://github.com/dropbox/dropbox-sdk-js/issues/159 until the next chunk, which can take a few seconds. So need this intermediate state where it is aborting, but has not aborted yet.
						cleanupAfterStream();
					},
					onComplete: (url) => {
						status = (
							<>
								<p className="text-success">Upload complete!</p>
								{url ? (
									<>
										<p>
											URL: <a href={url}>{url}</a>
										</p>
										<p className="mb-0">
											You can use this URL when{" "}
											<a href="/new_league">making a new custom league</a>, just
											select "Enter league file URL" under "Customize" and paste
											in the URL.
										</p>
									</>
								) : (
									<>
										<p className="mb-0">
											The file URL could not be retrieved (maybe you still need
											to verify the email address for your Dropbox account), but
											it should be in your Dropbox account under: Apps/
											{GAME_NAME}/{filename}
										</p>
									</>
								)}
							</>
						);
					},
				});
			}

			if (SUPPORTS_CANCEL) {
				abortController.current = new AbortController();
			}

			let tempStream = readableStream.pipeThrough(new TextEncoderStream());

			if (gzip && typeof CompressionStream !== "undefined") {
				tempStream = tempStream.pipeThrough(new CompressionStream("gzip"));
			}

			await tempStream.pipeTo(fileStream, {
				signal: abortController.current?.signal,
			});

			cleanupAfterStream(status);
		} catch (error) {
			cleanupAfterStream(
				<span className="text-danger">
					<b>Error:</b> {error.message}
				</span>,
			);
			throw error;
		}
	};

	useTitleBar({ title: "Export League" });

	const currentSelected = getCurrentSelected(checked);

	const bulkSetChecked = (type: BulkType) => {
		if (type === "default") {
			setChecked(getDefaultChecked());
		} else {
			setChecked((prevChecked) => {
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

	const bulkSelectButtons = bulkInfo.map((info) => (
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
		!HAS_FILE_SYSTEM_ACCESS_API &&
		streamDownload &&
		navigator.userAgent.includes("Firefox");

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

			<div className="btn-group mb-3">{bulkSelectButtons}</div>

			<div className="row">
				{categories.map((cat) => (
					<div className="col-md-6 col-lg-5 col-xl-4" key={cat.name}>
						<RenderOption
							{...cat}
							checked={checked}
							onToggle={(name) => {
								setChecked((checked2) => ({
									...checked2,
									[name]: !checked2[name],
								}));
							}}
						/>
					</div>
				))}
			</div>
			<div className="row">
				<div className="col-md-6 col-lg-5 col-xl-4">
					<h2>Export options</h2>
					<div className="form-check mb-3">
						<label className="form-check-label">
							<input
								className="form-check-input"
								type="checkbox"
								checked={compressed}
								onChange={() => {
									setCompressed((compressed) => !compressed);
								}}
							/>
							Compress (no extra whitespace)
						</label>
					</div>
					{typeof CompressionStream !== "undefined" ? (
						<div className="form-check mb-3">
							<label className="form-check-label">
								<input
									className="form-check-input"
									type="checkbox"
									checked={gzip}
									onChange={() => {
										setGzip((gzip) => !gzip);
									}}
								/>
								Compress (gzip)
							</label>
						</div>
					) : null}
					<div className="form-check">
						<label className="form-check-label">
							<input
								className="form-check-input"
								type="checkbox"
								checked={streamDownload}
								onChange={() => {
									setStreamDownload((streamDownload) => !streamDownload);
								}}
							/>
							Streaming download
							{HAS_FILE_SYSTEM_ACCESS_API ? (
								<p className="text-body-secondary">
									Keep this enabled unless you're having trouble getting your
									browser to download an export. If that happens to you, please{" "}
									<a
										href="https://basketball-gm.com/manual/debugging/"
										target="_blank"
									>
										help me figure out why it's not working
									</a>
									, because ideally it should always work with this enabled.
								</p>
							) : (
								<p className="text-body-secondary">
									This works better for large leagues, but is not supported well
									in your browser so it might fail.
								</p>
							)}
						</label>
					</div>

					{showFirefoxWarning ? (
						<div className="alert alert-warning d-inline-block">
							<b>Firefox sometimes fails at streaming data to disk.</b> If the
							progress bar gets stuck and it never prompts you to save a file,
							please reload and try again.
						</div>
					) : null}

					<div className="d-flex flex-wrap gap-2">
						{state === "idle" || state === "download" ? (
							<ActionButton
								processing={state === "download"}
								onClick={handleSubmit("download")}
							>
								<span className="glyphicon glyphicon-download-alt" /> Download
								file
							</ActionButton>
						) : null}

						{state === "idle" || state === "dropbox" ? (
							dropboxAccessToken ? (
								<>
									<ActionButton
										className={state === "idle" ? "ms-2" : undefined}
										maintainWidth={false}
										processing={state === "dropbox"}
										onClick={handleSubmit("dropbox")}
									>
										<span className="glyphicon glyphicon-cloud-upload" /> Save
										to Dropbox
									</ActionButton>
									{state === "idle" ? (
										<button
											className="btn btn-danger"
											onClick={() => {
												safeLocalStorage.removeItem("dropboxAccessToken");
												setDropboxAccessToken(null);
											}}
										>
											Disconnect
										</button>
									) : null}
								</>
							) : (
								<button
									className="btn btn-primary"
									onClick={async () => {
										if (lid === undefined) {
											return;
										}

										const { getAuthenticationUrl } = await import(
											"../util/dropbox.ts"
										);
										const url = await getAuthenticationUrl(lid);

										// Remember what was checked, since local state will be lost during redirect
										saveDefaults(checked, compressed, gzip);

										window.location.href = url;
									}}
								>
									<span className="glyphicon glyphicon-cloud-upload" /> Connect
									to Dropbox
								</button>
							)
						) : null}

						{SUPPORTS_CANCEL && state !== "idle" ? (
							<button
								className="btn btn-secondary"
								type="button"
								disabled={aborting}
								onClick={() => {
									if (abortController.current) {
										abortController.current.abort();
										if (state === "dropbox") {
											setAborting(true);
										} else {
											cleanupAfterStream();
										}
									}
								}}
							>
								Cancel
							</button>
						) : null}
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
				</div>
			</div>

			{status && status !== "Exporting..." ? (
				<div className="mt-3">{status}</div>
			) : null}
		</>
	);
};

export default ExportLeague;
