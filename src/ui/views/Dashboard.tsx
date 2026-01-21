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
import { getCloudLeagues, downloadLeagueData } from "../util/cloudSync.ts";
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
}: {
	lid: number;
	children: string;
	starred?: boolean;
	disabled: boolean;
	onClick: () => void;
}) => {
	return (
		<div className="d-flex align-items-center">
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
	const [loadingCloudLeagues, setLoadingCloudLeagues] = useState(true);
	const [joiningCloudId, setJoiningCloudId] = useState<string | undefined>();
	useTitleBar();

	// Fetch cloud leagues on mount
	useEffect(() => {
		const fetchCloudLeagues = async () => {
			const userId = localStorage.getItem("cloudUserId");
			if (!userId) {
				setLoadingCloudLeagues(false);
				return;
			}

			try {
				const leagues = await getCloudLeagues();
				setCloudLeagues(leagues);
			} catch (error) {
				console.error("Failed to fetch cloud leagues:", error);
			} finally {
				setLoadingCloudLeagues(false);
			}
		};

		fetchCloudLeagues();
	}, []);

	const handleJoinCloudLeague = async (cloudLeague: CloudLeague) => {
		const userId = localStorage.getItem("cloudUserId");
		if (!userId) {
			logEvent({
				type: "error",
				text: "Please sign in first. Go to Tools > Cloud Sync to sign in.",
				saveToDb: false,
				showNotification: true,
			});
			return;
		}

		try {
			setJoiningCloudId(cloudLeague.cloudId);
			logEvent({
				type: "info",
				text: `Downloading cloud league "${cloudLeague.name}". This may take a while for large leagues...`,
				saveToDb: false,
				showNotification: true,
			});

			const lid = await downloadLeagueData(cloudLeague.cloudId);

			logEvent({
				type: "info",
				text: `Cloud league "${cloudLeague.name}" downloaded successfully!`,
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
			setJoiningCloudId(undefined);
		}
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

	// Filter out cloud leagues - they're shown in the Cloud Leagues section
	const localOnlyLeagues = leagues.filter((league: any) => !league.cloudId);

	const rows = localOnlyLeagues.map((league) => {
		const disabled =
			deletingLID !== undefined ||
			loadingLID !== undefined ||
			cloningLID !== undefined;
		const throbbing = loadingLID === league.lid;
		return {
			key: league.lid,
			data: [
				<PlayButton
					lid={league.lid}
					disabled={disabled}
					throbbing={throbbing}
					onClick={() => setLoadingLID(league.lid)}
				/>,
				<LeagueName
					lid={league.lid}
					starred={league.starred}
					disabled={disabled}
					onClick={() => setLoadingLID(league.lid)}
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

			{/* Cloud Leagues Section */}
			{!loadingCloudLeagues && cloudLeagues.length > 0 && (
				<div className="mb-4">
					<h4 className="mb-3">
						<span className="glyphicon glyphicon-cloud me-2" />
						Cloud Leagues
					</h4>
					<div className="table-responsive">
						<table className="table table-striped table-hover">
							<thead>
								<tr>
									<th style={{ width: "1%" }}></th>
									<th>League</th>
									<th>Sport</th>
									<th>Season</th>
									<th>Last Updated</th>
								</tr>
							</thead>
							<tbody>
								{cloudLeagues.map((cloudLeague) => {
									const isJoining = joiningCloudId === cloudLeague.cloudId;
									const localLeague = leagues.find(
										(l: any) => l.cloudId === cloudLeague.cloudId
									);
									const isLocallyAvailable = !!localLeague;

									// Check if cloud has newer changes than local
									const cloudUpdatedAt = cloudLeague.updatedAt || 0;
									const localLastPlayed = localLeague?.lastPlayed?.getTime?.() || 0;
									const needsSync = isLocallyAvailable && cloudUpdatedAt > localLastPlayed;

									const disabled =
										deletingLID !== undefined ||
										loadingLID !== undefined ||
										cloningLID !== undefined ||
										joiningCloudId !== undefined;
									return (
										<tr key={cloudLeague.cloudId}>
											<td>
												{isLocallyAvailable ? (
													needsSync ? (
														<a
															className={`btn btn-sm btn-warning ${loadingLID === localLeague.lid ? "dashboard-play-loading" : ""}`}
															href={`/l/${localLeague.lid}`}
															onClick={() => setLoadingLID(localLeague.lid)}
															title="Cloud has newer changes - click to sync and play"
														>
															Sync
														</a>
													) : (
														<a
															className={`btn btn-sm btn-success ${loadingLID === localLeague.lid ? "dashboard-play-loading" : ""}`}
															href={`/l/${localLeague.lid}`}
															onClick={() => setLoadingLID(localLeague.lid)}
														>
															Play
														</a>
													)
												) : isJoining ? (
													<button
														className="btn btn-sm btn-primary"
														disabled
													>
														Downloading...
													</button>
												) : (
													<button
														className="btn btn-sm btn-primary"
														onClick={() => handleJoinCloudLeague(cloudLeague)}
														disabled={disabled}
													>
														Download
													</button>
												)}
											</td>
											<td>
												<span className="glyphicon glyphicon-cloud text-primary me-2" />
												{cloudLeague.name}
												{needsSync && (
													<span className="badge bg-warning text-dark ms-2" title="Updates available from cloud">
														New
													</span>
												)}
											</td>
											<td style={{ textTransform: "capitalize" }}>
												{cloudLeague.sport}
											</td>
											<td>{cloudLeague.season || "—"}</td>
											<td>
												{cloudLeague.updatedAt
													? ago(new Date(cloudLeague.updatedAt))
													: "—"}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Local Leagues Section */}
			{rows.length > 0 && cloudLeagues.length > 0 && (
				<h4 className="mb-3">Local Leagues</h4>
			)}

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
