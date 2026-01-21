/**
 * Cloud Sync View
 *
 * Allows users to manage cloud-synced leagues:
 * - Sign in with Firebase (Google or email)
 * - Upload existing league to cloud
 * - Join a cloud league from another device
 * - View sync status
 */

import { useCallback, useEffect, useState } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { toWorker, realtimeUpdate } from "../util/index.ts";
import { useLocalPartial } from "../util/local.ts";
import {
	isFirebaseConfigured,
	isSignedIn,
	signInWithGoogle,
	signInWithEmail,
	createAccount,
	signOut,
	getUserDisplayName,
	getUserEmail,
	waitForAuth,
	onAuthChange,
	getCurrentUserId,
} from "../util/firebase.ts";
import {
	createCloudLeague,
	uploadLeagueData,
	getCloudLeagues,
	getJoinedLeagues,
	deleteCloudLeague,
	downloadLeagueData,
	startRealtimeSync,
	getSyncStatus,
	onSyncStatusChange,
	joinCloudLeague,
	getCloudLeagueTeams,
	type CloudTeam,
} from "../util/cloudSync.ts";
import type { CloudLeague } from "../../common/cloudTypes.ts";

// Sync status indicator component
const SyncStatusBadge = ({ status }: { status?: string }) => {
	const defaultConfig = { color: "secondary", text: "Disconnected" };
	const statusConfig: Record<string, { color: string; text: string }> = {
		disconnected: defaultConfig,
		connecting: { color: "warning", text: "Connecting..." },
		syncing: { color: "info", text: "Syncing..." },
		synced: { color: "success", text: "Synced" },
		error: { color: "danger", text: "Error" },
	};

	const key = status || "disconnected";
	const config = key in statusConfig ? statusConfig[key]! : defaultConfig;

	return (
		<span className={`badge bg-${config.color}`}>
			{config.text}
		</span>
	);
};

// Firebase auth section
const AuthSection = ({
	onSignInSuccess,
}: {
	onSignInSuccess: () => void;
}) => {
	const [mode, setMode] = useState<"signin" | "register">("signin");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleGoogleSignIn = async () => {
		setError(null);
		setLoading(true);
		try {
			await signInWithGoogle();
			onSignInSuccess();
		} catch (err: any) {
			setError(err.message || "Failed to sign in with Google");
		} finally {
			setLoading(false);
		}
	};

	const handleEmailAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			if (mode === "signin") {
				await signInWithEmail(email, password);
			} else {
				await createAccount(email, password);
			}
			onSignInSuccess();
		} catch (err: any) {
			setError(err.message || `Failed to ${mode === "signin" ? "sign in" : "create account"}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="card">
			<div className="card-body">
				<h5 className="card-title">Sign In to Enable Cloud Sync</h5>

				{error && (
					<div className="alert alert-danger" role="alert">
						{error}
					</div>
				)}

				<button
					className="btn btn-outline-dark w-100 mb-3"
					onClick={handleGoogleSignIn}
					disabled={loading}
				>
					<svg className="me-2" width="18" height="18" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					Sign in with Google
				</button>

				<hr className="my-3" />

				<ul className="nav nav-tabs mb-3">
					<li className="nav-item">
						<button
							className={`nav-link ${mode === "signin" ? "active" : ""}`}
							onClick={() => setMode("signin")}
						>
							Sign In
						</button>
					</li>
					<li className="nav-item">
						<button
							className={`nav-link ${mode === "register" ? "active" : ""}`}
							onClick={() => setMode("register")}
						>
							Register
						</button>
					</li>
				</ul>

				<form onSubmit={handleEmailAuth}>
					<div className="mb-3">
						<label htmlFor="email" className="form-label">Email</label>
						<input
							type="email"
							className="form-control"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="mb-3">
						<label htmlFor="password" className="form-label">Password</label>
						<input
							type="password"
							className="form-control"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
						/>
					</div>
					<button
						type="submit"
						className="btn btn-primary"
						disabled={loading}
					>
						{loading ? "Please wait..." : (mode === "signin" ? "Sign In" : "Create Account")}
					</button>
				</form>
			</div>
		</div>
	);
};

// User info section when signed in
const UserInfoSection = ({
	onSignOut,
}: {
	onSignOut: () => void;
}) => {
	const displayName = getUserDisplayName();
	const email = getUserEmail();

	const handleSignOut = async () => {
		await signOut();
		onSignOut();
	};

	return (
		<div className="alert alert-info d-flex justify-content-between align-items-center">
			<div>
				<strong>Signed in as:</strong> {displayName || email || "Unknown"}
				{displayName && email && <span className="text-muted ms-2">({email})</span>}
			</div>
			<button className="btn btn-outline-secondary btn-sm" onClick={handleSignOut}>
				Sign Out
			</button>
		</div>
	);
};

// Cloud leagues list
const CloudLeaguesList = ({
	leagues,
	onOpen,
	onDelete,
	loading,
	isOwner = true,
}: {
	leagues: CloudLeague[];
	onOpen: (league: CloudLeague) => void;
	onDelete: (league: CloudLeague) => void;
	loading: boolean;
	isOwner?: boolean;
}) => {
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const copyLeagueId = async (cloudId: string) => {
		await navigator.clipboard.writeText(cloudId);
		setCopiedId(cloudId);
		setTimeout(() => setCopiedId(null), 2000);
	};

	if (loading) {
		return <div className="text-muted">Loading...</div>;
	}

	if (leagues.length === 0) {
		return (
			<div className="alert alert-secondary">
				{isOwner
					? "No cloud leagues found. Upload a league to get started!"
					: "You haven't joined any leagues yet."}
			</div>
		);
	}

	return (
		<div className="list-group">
			{leagues.map((league) => (
				<div
					key={league.cloudId}
					className="list-group-item"
				>
					<div className="d-flex justify-content-between align-items-start">
						<div>
							<h6 className="mb-1">{league.name}</h6>
							<small className="text-muted d-block">
								Season {league.season} |{" "}
								{league.members?.length || 1} member(s) |{" "}
								Updated {new Date(league.updatedAt).toLocaleDateString()}
							</small>
							{isOwner && (
								<small className="text-muted d-block mt-1">
									<strong>League ID:</strong>{" "}
									<code className="user-select-all">{league.cloudId}</code>
									<button
										className="btn btn-link btn-sm p-0 ms-2"
										onClick={() => copyLeagueId(league.cloudId)}
										title="Copy League ID"
									>
										{copiedId === league.cloudId ? "Copied!" : "Copy"}
									</button>
								</small>
							)}
						</div>
						<div>
							<button
								className="btn btn-sm btn-primary me-2"
								onClick={() => onOpen(league)}
							>
								Open
							</button>
							{isOwner && (
								<button
									className="btn btn-sm btn-outline-danger"
									onClick={() => onDelete(league)}
								>
									Delete
								</button>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

// Join league section
const JoinLeagueSection = ({
	onJoinSuccess,
}: {
	onJoinSuccess: () => void;
}) => {
	const [leagueId, setLeagueId] = useState("");
	const [teamId, setTeamId] = useState<number | null>(null);
	const [teams, setTeams] = useState<CloudTeam[]>([]);
	const [loadingTeams, setLoadingTeams] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleLoadTeams = async () => {
		if (!leagueId.trim()) {
			setError("Please enter a League ID first");
			return;
		}

		setError(null);
		setLoadingTeams(true);
		setTeams([]);
		setTeamId(null);

		try {
			const fetchedTeams = await getCloudLeagueTeams(leagueId.trim());
			setTeams(fetchedTeams);
			// Auto-select first available team
			const firstAvailable = fetchedTeams.find(t => !t.claimedBy);
			if (firstAvailable) {
				setTeamId(firstAvailable.tid);
			}
		} catch (err: any) {
			setError(err.message || "Failed to load teams. Check the League ID.");
		} finally {
			setLoadingTeams(false);
		}
	};

	const handleJoin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (teamId === null) {
			setError("Please select a team");
			return;
		}

		setError(null);
		setSuccess(null);
		setLoading(true);

		try {
			const league = await joinCloudLeague(leagueId.trim(), teamId);
			setSuccess(`Successfully joined "${league.name}"!`);
			setLeagueId("");
			setTeamId(null);
			setTeams([]);
			onJoinSuccess();
		} catch (err: any) {
			setError(err.message || "Failed to join league");
		} finally {
			setLoading(false);
		}
	};

	const availableTeams = teams.filter(t => !t.claimedBy);
	const takenTeams = teams.filter(t => t.claimedBy);

	return (
		<div className="card mb-4">
			<div className="card-body">
				<h5 className="card-title">Join a Cloud League</h5>
				<p className="text-muted">
					Enter the League ID shared by the commissioner, then select your team.
				</p>

				{error && (
					<div className="alert alert-danger" role="alert">
						{error}
					</div>
				)}

				{success && (
					<div className="alert alert-success" role="alert">
						{success}
					</div>
				)}

				<form onSubmit={handleJoin}>
					{/* Step 1: Enter League ID */}
					<div className="row g-3 mb-3">
						<div className="col-md-8">
							<label htmlFor="leagueId" className="form-label">Step 1: League ID</label>
							<input
								type="text"
								className="form-control"
								id="leagueId"
								placeholder="Paste the League ID from the commissioner"
								value={leagueId}
								onChange={(e) => {
									setLeagueId(e.target.value);
									setTeams([]);
									setTeamId(null);
								}}
								required
							/>
						</div>
						<div className="col-md-4 d-flex align-items-end">
							<button
								type="button"
								className="btn btn-outline-secondary w-100"
								onClick={handleLoadTeams}
								disabled={loadingTeams || !leagueId.trim()}
							>
								{loadingTeams ? "Loading..." : "Load Teams"}
							</button>
						</div>
					</div>

					{/* Step 2: Select Team (shown after teams are loaded) */}
					{teams.length > 0 && (
						<>
							<div className="mb-3">
								<label htmlFor="teamSelect" className="form-label">
									Step 2: Select Your Team ({availableTeams.length} available)
								</label>
								<select
									className="form-select"
									id="teamSelect"
									value={teamId ?? ""}
									onChange={(e) => setTeamId(parseInt(e.target.value, 10))}
									required
								>
									<option value="" disabled>Choose a team...</option>
									{availableTeams.length > 0 && (
										<optgroup label="Available Teams">
											{availableTeams.map((team) => (
												<option key={team.tid} value={team.tid}>
													{team.region} {team.name} ({team.abbrev})
												</option>
											))}
										</optgroup>
									)}
									{takenTeams.length > 0 && (
										<optgroup label="Already Taken">
											{takenTeams.map((team) => (
												<option key={team.tid} value={team.tid} disabled>
													{team.region} {team.name} - {team.claimedBy}
												</option>
											))}
										</optgroup>
									)}
								</select>
							</div>

							<button
								type="submit"
								className="btn btn-primary"
								disabled={loading || teamId === null}
							>
								{loading ? "Joining..." : "Join League"}
							</button>
						</>
					)}
				</form>
			</div>
		</div>
	);
};

// Main CloudSync view
const CloudSync = () => {
	useTitleBar({
		title: "Cloud Sync",
		hideNewWindow: true,
	});

	const { lid, userTid } = useLocalPartial(["lid", "userTid"]);

	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);
	const [cloudLeagues, setCloudLeagues] = useState<CloudLeague[]>([]);
	const [joinedLeagues, setJoinedLeagues] = useState<CloudLeague[]>([]);
	const [loadingLeagues, setLoadingLeagues] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState<{ message: string; percent: number } | null>(null);
	const [syncStatus, setSyncStatus] = useState(getSyncStatus());

	// Check Firebase configuration
	const firebaseConfigured = isFirebaseConfigured();

	// Load cloud leagues (both owned and joined)
	const loadCloudLeagues = useCallback(async () => {
		if (!isAuthenticated) return;
		setLoadingLeagues(true);
		try {
			const [owned, joined] = await Promise.all([
				getCloudLeagues(),
				getJoinedLeagues(),
			]);
			setCloudLeagues(owned);
			setJoinedLeagues(joined);
		} catch (err: any) {
			console.error("Failed to load cloud leagues:", err);
		} finally {
			setLoadingLeagues(false);
		}
	}, [isAuthenticated]);

	// Initialize auth state
	useEffect(() => {
		if (!firebaseConfigured) {
			setLoading(false);
			return;
		}

		const initAuth = async () => {
			try {
				await waitForAuth();
				setIsAuthenticated(isSignedIn());
			} catch (err) {
				console.error("Auth init error:", err);
			} finally {
				setLoading(false);
			}
		};

		initAuth();

		// Listen for auth changes
		const unsubscribe = onAuthChange((user) => {
			setIsAuthenticated(!!user);
		});

		// Listen for sync status changes
		onSyncStatusChange(setSyncStatus);

		return unsubscribe;
	}, [firebaseConfigured]);

	// Load leagues when authenticated
	useEffect(() => {
		if (isAuthenticated) {
			loadCloudLeagues();
		}
	}, [isAuthenticated, loadCloudLeagues]);

	const handleSignInSuccess = () => {
		setIsAuthenticated(true);
	};

	const handleSignOut = () => {
		setIsAuthenticated(false);
		setCloudLeagues([]);
		setJoinedLeagues([]);
	};

	const handleUploadToCloud = async () => {
		if (!lid) {
			setError("No league is currently loaded. Please load a league first.");
			return;
		}

		setError(null);
		setUploadProgress({ message: "Starting upload...", percent: 0 });

		try {
			// Get league name and user's team ID
			console.log("[CloudSync] Getting league name...");
			const leagueName = await toWorker("main", "getLeagueName", undefined) as string;
			console.log("[CloudSync] Got league name:", leagueName);

			console.log("[CloudSync] Got userTid from local state:", userTid);

			// Create cloud league
			setUploadProgress({ message: "Creating cloud league...", percent: 5 });
			console.log("[CloudSync] Creating cloud league...");
			const cloudId = await createCloudLeague(leagueName, "basketball", userTid);
			console.log("[CloudSync] Cloud league created:", cloudId);

			// Upload data
			console.log("[CloudSync] Starting data upload...");
			await uploadLeagueData(cloudId, (message, percent) => {
				console.log("[CloudSync] Upload progress:", message, percent);
				setUploadProgress({ message, percent: 5 + percent * 0.95 });
			});
			console.log("[CloudSync] Data upload complete");

			setUploadProgress(null);
			await loadCloudLeagues();

			// Start real-time sync
			console.log("[CloudSync] Starting real-time sync...");
			await startRealtimeSync(cloudId);
			console.log("[CloudSync] All done!");

		} catch (err: any) {
			console.error("[CloudSync] Upload failed:", err);
			setError(err.message || "Upload failed");
			setUploadProgress(null);
		}
	};

	const handleOpenLeague = async (league: CloudLeague) => {
		setError(null);
		setUploadProgress({ message: "Downloading league...", percent: 0 });

		try {
			// Get the current user's membership to find their assigned team
			const userId = getCurrentUserId();
			const member = userId ? league.members.find(m => m.userId === userId) : undefined;
			const memberTeamId = member?.teamId;

			// Download data
			const data = await downloadLeagueData(league.cloudId, (message, percent) => {
				setUploadProgress({ message, percent: percent * 0.8 });
			});

			// Create local league from cloud data
			setUploadProgress({ message: "Creating local league...", percent: 85 });
			const newLid = await toWorker("main", "createLeagueFromCloud", {
				cloudId: league.cloudId,
				name: league.name,
				data,
				memberTeamId, // Set userTid to the member's assigned team
			});

			setUploadProgress(null);

			// Start real-time sync
			await startRealtimeSync(league.cloudId);

			// Navigate to the new league
			await realtimeUpdate(["firstRun"], `/l/${newLid}`);

		} catch (err: any) {
			console.error("Open failed:", err);
			setError(err.message || "Failed to open league");
			setUploadProgress(null);
		}
	};

	const handleDeleteLeague = async (league: CloudLeague) => {
		if (!confirm(`Are you sure you want to delete "${league.name}" from the cloud?`)) {
			return;
		}

		setError(null);
		try {
			await deleteCloudLeague(league.cloudId);
			await loadCloudLeagues();
		} catch (err: any) {
			setError(err.message || "Failed to delete league");
		}
	};

	if (!firebaseConfigured) {
		return (
			<div className="alert alert-warning">
				<h4>Firebase Not Configured</h4>
				<p>
					Cloud sync requires Firebase to be configured. Please add your Firebase
					credentials to <code>src/ui/util/firebase.ts</code>.
				</p>
			</div>
		);
	}

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="row">
			<div className="col-lg-8 col-md-10">
				<p className="text-muted">
					Cloud sync allows you to access your leagues from any device and see
					changes in real-time across multiple devices.
				</p>

				{error && (
					<div className="alert alert-danger" role="alert">
						{error}
						<button
							type="button"
							className="btn-close float-end"
							onClick={() => setError(null)}
						/>
					</div>
				)}

				{uploadProgress && (
					<div className="alert alert-info">
						<div className="d-flex justify-content-between mb-2">
							<span>{uploadProgress.message}</span>
							<span>{uploadProgress.percent}%</span>
						</div>
						<div className="progress">
							<div
								className="progress-bar"
								role="progressbar"
								style={{ width: `${uploadProgress.percent}%` }}
							/>
						</div>
					</div>
				)}

				{!isAuthenticated ? (
					<AuthSection onSignInSuccess={handleSignInSuccess} />
				) : (
					<>
						<UserInfoSection onSignOut={handleSignOut} />

						{/* Current League Upload */}
						{lid && (
							<div className="card mb-4">
								<div className="card-body">
									<h5 className="card-title">
										Current League <SyncStatusBadge status={syncStatus} />
									</h5>
									<p>Upload your current league to the cloud to access it from any device.</p>
									<button
										className="btn btn-primary"
										onClick={handleUploadToCloud}
										disabled={!!uploadProgress}
									>
										Upload to Cloud
									</button>
								</div>
							</div>
						)}

						{/* Join a League */}
						<JoinLeagueSection onJoinSuccess={loadCloudLeagues} />

						{/* Your Cloud Leagues (owned) */}
						<div className="card mb-4">
							<div className="card-body">
								<h5 className="card-title">Your Cloud Leagues (Commissioner)</h5>
								<p className="text-muted">
									Leagues you created. Share the League ID with friends so they can join.
								</p>

								<CloudLeaguesList
									leagues={cloudLeagues}
									onOpen={handleOpenLeague}
									onDelete={handleDeleteLeague}
									loading={loadingLeagues}
									isOwner={true}
								/>

								<button
									className="btn btn-outline-primary mt-3"
									onClick={loadCloudLeagues}
									disabled={loadingLeagues}
								>
									Refresh List
								</button>
							</div>
						</div>

						{/* Joined Leagues */}
						<div className="card">
							<div className="card-body">
								<h5 className="card-title">Joined Leagues</h5>
								<p className="text-muted">
									Leagues you've joined as a team owner.
								</p>

								<CloudLeaguesList
									leagues={joinedLeagues}
									onOpen={handleOpenLeague}
									onDelete={() => {}} // Can't delete leagues you don't own
									loading={loadingLeagues}
									isOwner={false}
								/>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default CloudSync;
