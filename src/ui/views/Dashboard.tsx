import clsx from "clsx";
import { useCallback, useState, useEffect, type CSSProperties } from "react";
import { Dropdown } from "react-bootstrap";

import ago from "s-ago";
import {
	bySport,
	DIFFICULTY,
	REAL_PLAYERS_INFO,
	WEBSITE_PLAY,
} from "../../common/index.ts";
import type { CloudLeague } from "../../common/cloudTypes.ts";
import { DataTable, TeamLogoInline } from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { confirm, getCols, logEvent, toWorker } from "../util/index.ts";
import {
	getCloudLeagues,
	getJoinedLeagues,
	streamDownloadLeagueData,
	startRealtimeSync,
} from "../util/cloudSync.ts";
import { getCurrentUserId, isSignedIn } from "../util/firebase.ts";
import type { View } from "../../common/types.ts";
import { choice } from "../../common/random.ts";

// Re-rendering caused this to run multiple times after "Play" click, even with useRef or useMemo
const randomOtherSport = bySport({
	baseball: choice(["basketball", "football", "hockey"]),
	basketball: choice(["baseball", "football", "hockey"]),
	football: choice(["baseball", "basketball", "hockey"]),
	hockey: choice(["baseball", "basketball", "football"]),
});

const difficultyText = (difficulty: number | undefined) => {
	let prevText: string | undefined;

	if (difficulty === undefined) {
		return "???";
	}

	for (const [text, numeric] of Object.entries(DIFFICULTY)) {
		if (typeof numeric !== "number") {
			throw new Error("Should never happen");
		}

		if (difficulty === numeric) {
			return text;
		}

		// Iteration is in order, so if we're below the value, there will be no direct hit
		if (difficulty < numeric) {
			if (prevText !== undefined) {
				return `${prevText}+`;
			}

			return `${text}-`;
		}

		prevText = text;
	}

	if (prevText !== undefined) {
		return `${prevText}+`;
	}

	return "???";
};

const DifficultyText = ({
	children: difficulty,
}: {
	children: number | undefined;
}) => {
	if (difficulty === undefined) {
		return null;
	}

	return (
		<span
			className={clsx({
				"fw-bold": difficulty > DIFFICULTY.Insane,
				"text-danger": difficulty >= DIFFICULTY.Insane,
			})}
		>
			{difficultyText(difficulty)}
		</span>
	);
};

const PlayButton = ({
	lid,
	disabled,
	throbbing,
	onClick,
}: {
	lid: number;
	disabled: boolean;
	throbbing: boolean;
	onClick: () => void;
}) => {
	if (!disabled && !throbbing) {
		return (
			<a
				className="btn btn-lg btn-success"
				href={`/l/${lid}`}
				onClick={onClick}
			>
				Play
			</a>
		);
	}

	if (throbbing) {
		return (
			<button className="btn btn-lg btn-success dashboard-play-loading">
				Play
			</button>
		);
	}

	return (
		<button className="btn btn-lg btn-success" disabled>
			Play
		</button>
	);
};

// Download button for cloud leagues that aren't downloaded yet
const DownloadCloudButton = ({
	disabled,
	downloading,
	onClick,
}: {
	disabled: boolean;
	downloading: boolean;
	onClick: () => void;
}) => {
	if (downloading) {
		return (
			<button className="btn btn-lg btn-primary dashboard-play-loading">
				Downloading...
			</button>
		);
	}

	return (
		<button
			className="btn btn-lg btn-primary"
			disabled={disabled}
			onClick={onClick}
		>
			Download
		</button>
	);
};

const glyphiconStyle = {
	cursor: "pointer",
	fontSize: "larger",
};

const Star = ({ lid, starred }: { lid: number; starred?: boolean }) => {
	const [actuallyStarred, setActuallyStarred] = useState<boolean>(!!starred);
	const toggle = useCallback(async () => {
		setActuallyStarred(!actuallyStarred);
		await toWorker("main", "updateLeague", {
			lid,
			obj: {
				starred: !actuallyStarred,
			},
		});
	}, [actuallyStarred, lid]);

	if (actuallyStarred) {
		return (
			<span
				className="glyphicon glyphicon-star p-1 text-primary"
				data-no-row-highlight="true"
				onClick={toggle}
				style={glyphiconStyle}
			/>
		);
	}

	return (
		<span
			className="glyphicon glyphicon-star-empty p-1 text-body-secondary"
			data-no-row-highlight="true"
			onClick={toggle}
			style={glyphiconStyle}
			title="Star"
		/>
	);
};

const LeagueName = ({
	lid,
	children: name,
	starred,
	disabled,
	onClick,
	isCloud,
}: {
	lid: number;
	children: string;
	starred?: boolean;
	disabled: boolean;
	onClick: () => void;
	isCloud?: boolean;
}) => {
	return (
		<div className="d-flex align-items-center">
			{isCloud && (
				<span
					className="glyphicon glyphicon-cloud text-primary me-2"
					title="Cloud League - syncs with other players"
				/>
			)}
			<div className="me-1">
				{!disabled ? (
					<a href={`/l/${lid}`} onClick={onClick}>
						{name}
					</a>
				) : (
					name
				)}
			</div>
			<Star lid={lid} starred={starred} />
		</div>
	);
};

const Ago = ({ date }: { date?: Date }) => {
	if (date) {
		return <span title={date.toLocaleString()}>{ago(date)}</span>;
	}

	return null;
};

// https://stackoverflow.com/a/47417545/786644 hack because of overflow-x in table-responsive, otherwise menu gets chopped off if table has few rows
const dropdownStyle: CSSProperties = {
	position: "static",
};

const Dashboard = ({ leagues }: View<"dashboard">) => {
	const [loadingLID, setLoadingLID] = useState<number | undefined>();
	const [deletingLID, setDeletingLID] = useState<number | undefined>();
	const [cloningLID, setCloningLID] = useState<number | undefined>();
	const [cloudLeagues, setCloudLeagues] = useState<CloudLeague[]>([]);
	const [downloadingCloudId, setDownloadingCloudId] = useState<string | undefined>();
	useTitleBar();

	// Fetch cloud leagues on mount (both owned and joined)
	useEffect(() => {
		const fetchCloudLeagues = async () => {
			if (!isSignedIn()) {
				return;
			}

			try {
				// Get both owned leagues and joined leagues
				const [owned, joined] = await Promise.all([
					getCloudLeagues(),
					getJoinedLeagues(),
				]);
				// Combine and dedupe
				const allCloud = [...owned];
				for (const league of joined) {
					if (!allCloud.find(l => l.cloudId === league.cloudId)) {
						allCloud.push(league);
					}
				}
				setCloudLeagues(allCloud);
			} catch (error) {
				console.error("Failed to fetch cloud leagues:", error);
			}
		};

		fetchCloudLeagues();
	}, []);

	// Handle downloading a cloud league
	const handleDownloadCloudLeague = async (cloudLeague: CloudLeague) => {
		const userId = getCurrentUserId();
		if (!userId) {
			logEvent({
				type: "error",
				text: "Please sign in first. Go to Tools > Cloud Sync to sign in.",
				saveToDb: false,
				showNotification: true,
			});
			return;
		}

		// Find user's membership to get their assigned team
		const member = cloudLeague.members.find(m => m.userId === userId);
		const memberTeamId = member?.teamId;

		try {
			setDownloadingCloudId(cloudLeague.cloudId);
			logEvent({
				type: "info",
				text: `Downloading "${cloudLeague.name}"...`,
				saveToDb: false,
				showNotification: true,
			});

			// Use streaming download to avoid memory exhaustion on mobile
			const lid = await streamDownloadLeagueData(
				cloudLeague.cloudId,
				cloudLeague.name,
				memberTeamId,
			);

			// Start real-time sync listener
			await startRealtimeSync(cloudLeague.cloudId);

			logEvent({
				type: "info",
				text: `"${cloudLeague.name}" ready to play!`,
				saveToDb: false,
				showNotification: true,
			});

			// Navigate to the league
			window.location.href = `/l/${lid}`;
		} catch (error: any) {
			logEvent({
				type: "error",
				text: error.message || "Failed to download cloud league",
				saveToDb: false,
				showNotification: true,
			});
		} finally {
			setDownloadingCloudId(undefined);
		}
	};

	// Handle playing a cloud league (starts sync listener)
	const handlePlayCloudLeague = async (lid: number, cloudId: string) => {
		setLoadingLID(lid);
		try {
			// Start real-time sync for cloud leagues
			await startRealtimeSync(cloudId);
		} catch (error) {
			console.error("Failed to start cloud sync:", error);
		}
		// Navigation happens via the href
	};

	const cols = getCols(
		[
			"",
			"League",
			"Team",
			"Phase",
			"# Seasons",
			"Difficulty",
			"Created",
			"Last Played",
			"",
		],
		{
			"": {
				width: "1%",
			},
		},
	);

	const disabled =
		deletingLID !== undefined ||
		loadingLID !== undefined ||
		cloningLID !== undefined ||
		downloadingCloudId !== undefined;

	// Build unified rows from local leagues
	const localRows = leagues.map((league: any) => {
		const isCloud = !!league.cloudId;
		const throbbing = loadingLID === league.lid;

		return {
			key: league.lid,
			data: [
				<PlayButton
					lid={league.lid}
					disabled={disabled}
					throbbing={throbbing}
					onClick={() => {
						if (isCloud) {
							handlePlayCloudLeague(league.lid, league.cloudId);
						} else {
							setLoadingLID(league.lid);
						}
					}}
				/>,
				<LeagueName
					lid={league.lid}
					starred={league.starred}
					disabled={disabled}
					onClick={() => {
						if (isCloud) {
							handlePlayCloudLeague(league.lid, league.cloudId);
						} else {
							setLoadingLID(league.lid);
						}
					}}
					isCloud={isCloud}
				>
					{league.name}
				</LeagueName>,
				{
					value: (
						<div className="d-flex align-items-center">
							<TeamLogoInline
								imgURL={league.imgURL}
								size={48}
								className="me-2"
							/>
							<div>
								{league.teamRegion} {league.teamName}
							</div>
						</div>
					),
					sortValue: `${league.teamRegion} ${league.teamName}`,
					classNames: "py-0",
				},
				league.phaseText,
				league.startingSeason !== undefined && league.season !== undefined
					? 1 + league.season - league.startingSeason
					: undefined,
				{
					searchValue: difficultyText(league.difficulty),
					sortValue: league.difficulty,
					value: <DifficultyText>{league.difficulty}</DifficultyText>,
				},
				{
					searchValue: league.created ? ago(league.created) : "",
					sortValue:
						league.created && league.created.getTime
							? league.created.getTime()
							: 0,
					value: <Ago date={league.created} />,
				},
				{
					searchValue: league.lastPlayed ? ago(league.lastPlayed) : "",
					sortValue:
						league.lastPlayed && league.lastPlayed.getTime
							? league.lastPlayed.getTime()
							: 0,
					value: <Ago date={league.lastPlayed} />,
				},
				<Dropdown
					style={dropdownStyle}
					className={window.mobile ? "dropdown-mobile" : undefined}
				>
					<Dropdown.Toggle
						as="span"
						bsPrefix="no-caret"
						id={`dashboard-actions-${league.lid}`}
						style={glyphiconStyle}
						title="Actions"
					>
						<span
							className="glyphicon glyphicon-option-vertical text-body-secondary p-2"
							data-no-row-highlight="true"
						/>
					</Dropdown.Toggle>
					{!disabled ? (
						<Dropdown.Menu>
							<Dropdown.Item href={`/new_league/${league.lid}`}>
								Import
							</Dropdown.Item>
							<Dropdown.Item
								href={`/l/${league.lid}/export_league`}
								onClick={() => setLoadingLID(league.lid)}
							>
								Export
							</Dropdown.Item>
							<Dropdown.Item
								onClick={async () => {
									const newName = await confirm("League name:", {
										defaultValue: league.name,
										okText: "Rename league",
									});

									if (typeof newName === "string") {
										await toWorker("main", "updateLeague", {
											lid: league.lid,
											obj: {
												name: newName,
											},
										});
									}
								}}
							>
								Rename
							</Dropdown.Item>
							<Dropdown.Item
								onClick={async () => {
									try {
										logEvent({
											type: "info",
											text: `Cloning league "${league.name}". This may take a little while if it's a large league.`,
											saveToDb: false,
											showNotification: true,
										});

										setCloningLID(league.lid);
										const name = await toWorker(
											"main",
											"cloneLeague",
											league.lid,
										);
										setCloningLID(undefined);

										logEvent({
											type: "info",
											text: `Clone complete! Your new league is named "${name}".`,
											saveToDb: false,
											showNotification: true,
										});
									} catch (error) {
										logEvent({
											type: "error",
											text: error.message,
											saveToDb: false,
										});
									}
								}}
							>
								Clone
							</Dropdown.Item>
							<Dropdown.Item
								onClick={async () => {
									const proceed = await confirm(
										`Are you absolutely sure you want to delete "${league.name}"? You will permanently lose any record of all seasons, players, and games from this league.`,
										{
											okText: "Delete League",
										},
									);

									if (proceed) {
										setDeletingLID(league.lid);
										await toWorker("main", "removeLeague", league.lid);
										setDeletingLID(undefined);
									}
								}}
							>
								Delete
							</Dropdown.Item>
						</Dropdown.Menu>
					) : null}
				</Dropdown>,
			],
		};
	});

	// Add rows for cloud leagues that aren't downloaded yet
	const downloadedCloudIds = new Set(
		leagues.filter((l: any) => l.cloudId).map((l: any) => l.cloudId)
	);

	const cloudOnlyRows = cloudLeagues
		.filter(cl => !downloadedCloudIds.has(cl.cloudId))
		.map((cloudLeague) => {
			const isDownloading = downloadingCloudId === cloudLeague.cloudId;

			return {
				key: `cloud-${cloudLeague.cloudId}`,
				data: [
					<DownloadCloudButton
						disabled={disabled}
						downloading={isDownloading}
						onClick={() => handleDownloadCloudLeague(cloudLeague)}
					/>,
					<div className="d-flex align-items-center">
						<span
							className="glyphicon glyphicon-cloud text-primary me-2"
							title="Cloud League - needs download"
						/>
						<span>{cloudLeague.name}</span>
						<span className="badge bg-secondary ms-2">Not Downloaded</span>
					</div>,
					// Team - unknown until downloaded
					{
						value: <span className="text-body-secondary">—</span>,
						sortValue: "",
					},
					// Phase
					cloudLeague.phase !== undefined ? `Phase ${cloudLeague.phase}` : "—",
					// Seasons
					"—",
					// Difficulty
					{
						value: <span className="text-body-secondary">—</span>,
						sortValue: 0,
					},
					// Created
					{
						searchValue: "",
						sortValue: cloudLeague.createdAt || 0,
						value: cloudLeague.createdAt ? <Ago date={new Date(cloudLeague.createdAt)} /> : null,
					},
					// Last Updated (instead of Last Played)
					{
						searchValue: cloudLeague.updatedAt ? ago(new Date(cloudLeague.updatedAt)) : "",
						sortValue: cloudLeague.updatedAt || 0,
						value: cloudLeague.updatedAt ? <Ago date={new Date(cloudLeague.updatedAt)} /> : null,
					},
					// Actions - none for undownloaded
					null,
				],
			};
		});

	// Combine all rows
	const rows = [...localRows, ...cloudOnlyRows];

	const pagination = rows.length > 100;

	return (
		<>
			{location.host.indexOf("beta") === 0 ? (
				<p
					className="alert alert-warning d-inline-block"
					style={{ maxWidth: 840 }}
				>
					You are on the beta site. Sometimes new features are tested on the
					beta site, but most of the time it gets updated less frequently than{" "}
					<a href={`https://${WEBSITE_PLAY}/`}>the main site</a>. So unless
					you're testing some specific thing, you probably should be playing on{" "}
					<a href={`https://${WEBSITE_PLAY}/`}>the main site</a>.
				</p>
			) : null}
			<div className="dashboard-top-wrapper">
				{REAL_PLAYERS_INFO ? (
					<>
						<a
							href="/new_league/real"
							className="btn btn-primary dashboard-top-link dashboard-top-link-new me-3 mb-3"
						>
							New league
							<br />
							<span className="dashboard-top-link-small">» Real players</span>
						</a>
						<a
							href="/new_league/random"
							className="btn btn-primary dashboard-top-link dashboard-top-link-new me-sm-3 mb-3"
						>
							New league
							<br />
							<span className="dashboard-top-link-small">» Random players</span>
						</a>
						<div className="d-sm-none" />
						{REAL_PLAYERS_INFO.legends ? (
							<>
								<a
									href="/new_league/cross_era"
									className="btn btn-primary dashboard-top-link dashboard-top-link-new me-3 mb-3"
								>
									New league
									<br />
									<span className="dashboard-top-link-small">» Cross-era</span>
								</a>
								<a
									href="/new_league/legends"
									className="btn btn-primary dashboard-top-link dashboard-top-link-new me-sm-3 mb-3"
								>
									New league
									<br />
									<span className="dashboard-top-link-small">» Legends</span>
								</a>
								<div className="d-sm-none" />
							</>
						) : null}
						<a
							href="/new_league"
							className="btn btn-primary dashboard-top-link dashboard-top-link-new me-3 mb-3"
						>
							New league
							<br />
							<span className="dashboard-top-link-small">» Custom</span>
						</a>
						<a
							href="/exhibition"
							className="btn btn-secondary dashboard-top-link dashboard-top-link-new me-sm-3 mb-3"
						>
							Exhibition game
						</a>
						<div className="d-sm-none" />
					</>
				) : (
					<>
						<a
							href="/new_league"
							className="btn btn-primary dashboard-top-link dashboard-top-link-new me-3 mb-3"
						>
							Create new
							<br />
							league
						</a>
						<a
							href="/exhibition"
							className="btn btn-secondary dashboard-top-link dashboard-top-link-new me-sm-3 mb-3"
						>
							Exhibition game
						</a>
						<div className="d-sm-none" />
					</>
				)}
				<a
					href="https://zengm.com/"
					className={`btn btn-light-bordered dashboard-top-link dashboard-top-link-other mb-3 dashboard-top-link-other-${randomOtherSport} dashboard-top-link-flatten`}
				>
					Try our other sports sim
					<br /> games!
				</a>
			</div>

			{rows.length > 0 ? (
				<DataTable
					cols={cols}
					disableSettingsCache
					defaultSort={[7, "desc"]}
					defaultStickyCols={1}
					name="Dashboard"
					pagination={pagination}
					small={false}
					rows={rows}
				/>
			) : null}
		</>
	);
};

export default Dashboard;
