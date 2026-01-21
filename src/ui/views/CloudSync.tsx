/**
 * Cloud Sync View
 *
 * Allows users to manage cloud-synced leagues:
 * - Sign in with Firebase (Google or email)
 * - Create a new cloud league
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
} from "../util/firebase.ts";
import type { CloudLeague } from "../../common/cloudTypes.ts";

// Sync status indicator component
const SyncStatusBadge = ({ status }: { status?: string }) => {
	const defaultConfig = { color: "secondary", text: "Disconnected" };
	const statusConfig: Record<string, { color: string; text: string }> = {
		disconnected: defaultConfig,
		connecting: { color: "warning", text: "Connecting..." },
		syncing: { color: "info", text: "Syncing..." },
		synced: { color: "success", text: "Synced" },
		conflict: { color: "danger", text: "Conflict" },
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
	onJoin,
	onDelete,
	currentLeagueId,
}: {
	leagues: CloudLeague[];
	onJoin: (league: CloudLeague) => void;
	onDelete: (league: CloudLeague) => void;
	currentLeagueId?: string;
}) => {
	if (leagues.length === 0) {
		return (
			<div className="alert alert-secondary">
				No cloud leagues found. Create a new one or upload an existing league.
			</div>
		);
	}

	return (
		<div className="list-group">
			{leagues.map((league) => (
				<div
					key={league.cloudId}
					className={`list-group-item d-flex justify-content-between align-items-center ${
						currentLeagueId === league.cloudId ? "active" : ""
					}`}
				>
					<div>
						<h6 className="mb-1">{league.name}</h6>
						<small className="text-muted">
							{league.sport.charAt(0).toUpperCase() + league.sport.slice(1)} |
							Season {league.season} |
							Updated {new Date(league.updatedAt).toLocaleDateString()}
						</small>
					</div>
					<div>
						{currentLeagueId !== league.cloudId && (
							<button
								className="btn btn-sm btn-primary me-2"
								onClick={() => onJoin(league)}
							>
								Open
							</button>
						)}
						<button
							className="btn btn-sm btn-outline-danger"
							onClick={() => onDelete(league)}
						>
							Delete
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

// Main CloudSync view
const CloudSync = () => {
	useTitleBar({
		title: "Cloud Sync",
		hideNewWindow: true,
	});

	const { cloudSyncStatus, cloudLeagueId, lid } = useLocalPartial([
		"cloudSyncStatus",
		"cloudLeagueId",
		"lid",
	]);

	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [cloudLeagues, setCloudLeagues] = useState<CloudLeague[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState<string | null>(null);

	// Check Firebase configuration
	const firebaseConfigured = isFirebaseConfigured();

	// Load cloud leagues
	const loadCloudLeagues = useCallback(async () => {
		if (!isAuthenticated) return;

		try {
			const leagues = await toWorker("main", "getCloudLeagues", undefined);
			setCloudLeagues(leagues || []);
		} catch (err) {
			console.error("Failed to load cloud leagues:", err);
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
	};

	const handleUploadToCloud = async () => {
		if (!lid) {
			setError("No league is currently loaded. Please load a league first.");
			return;
		}

		setError(null);
		setUploadProgress("Preparing upload...");

		try {
			await toWorker("main", "uploadLeagueToCloud", {
				onProgress: (store: string, current: number, total: number) => {
					setUploadProgress(`Uploading ${store}... (${current}/${total})`);
				},
			});

			setUploadProgress(null);
			await loadCloudLeagues();

			// Refresh to show updated status
			await realtimeUpdate(["firstRun"]);
		} catch (err: any) {
			setError(err.message || "Failed to upload league to cloud");
			setUploadProgress(null);
		}
	};

	const handleJoinLeague = async (league: CloudLeague) => {
		setError(null);
		try {
			await toWorker("main", "joinCloudLeague", league.cloudId);
			await realtimeUpdate(["firstRun"], `/l/${lid}`);
		} catch (err: any) {
			setError(err.message || "Failed to join cloud league");
		}
	};

	const handleDeleteLeague = async (league: CloudLeague) => {
		if (!confirm(`Are you sure you want to delete "${league.name}" from the cloud? This cannot be undone.`)) {
			return;
		}

		setError(null);
		try {
			await toWorker("main", "deleteCloudLeague", league.cloudId);
			await loadCloudLeagues();
		} catch (err: any) {
			setError(err.message || "Failed to delete cloud league");
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
				<p className="mb-0">
					<a
						href="https://console.firebase.google.com/"
						target="_blank"
						rel="noopener noreferrer"
					>
						Go to Firebase Console
					</a>{" "}
					to create a project and get your credentials.
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

				{!isAuthenticated ? (
					<AuthSection onSignInSuccess={handleSignInSuccess} />
				) : (
					<>
						<UserInfoSection onSignOut={handleSignOut} />

						{/* Current League Status */}
						{lid && (
							<div className="card mb-4">
								<div className="card-body">
									<h5 className="card-title">
										Current League Status{" "}
										<SyncStatusBadge status={cloudSyncStatus} />
									</h5>

									{cloudLeagueId ? (
										<p className="text-success">
											This league is synced to the cloud. Changes will be
											automatically synced across all your devices.
										</p>
									) : (
										<>
											<p>
												This league is not yet synced to the cloud.
											</p>
											<button
												className="btn btn-primary"
												onClick={handleUploadToCloud}
												disabled={!!uploadProgress}
											>
												{uploadProgress || "Upload to Cloud"}
											</button>
										</>
									)}
								</div>
							</div>
						)}

						{/* Cloud Leagues */}
						<div className="card">
							<div className="card-body">
								<h5 className="card-title">Your Cloud Leagues</h5>
								<p className="text-muted">
									These leagues are stored in the cloud and can be accessed from
									any device.
								</p>

								<CloudLeaguesList
									leagues={cloudLeagues}
									onJoin={handleJoinLeague}
									onDelete={handleDeleteLeague}
									currentLeagueId={cloudLeagueId}
								/>

								<button
									className="btn btn-outline-primary mt-3"
									onClick={loadCloudLeagues}
								>
									Refresh List
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default CloudSync;
