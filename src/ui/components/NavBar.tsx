import { useState, useEffect, useCallback } from "react";
import { Nav, Navbar } from "react-bootstrap";
import { PHASE } from "../../common/index.ts";
import {
	helpers,
	localActions,
	menuItems,
	useLocalPartial,
} from "../util/index.ts";
import { useViewData } from "../util/viewManager.tsx";
import DropdownLinks from "./DropdownLinks.tsx";
import LogoAndText from "./LogoAndText.tsx";
import PlayMenu from "./PlayMenu.tsx";
import {
	onPendingUpdate,
	refreshFromCloud,
	type PendingUpdateInfo,
} from "../util/cloudSync.ts";

// Cloud sync status indicator with update notification
const CloudSyncIndicator = () => {
	const { cloudSyncStatus } = useLocalPartial(["cloudSyncStatus"]);
	const [pendingUpdate, setPendingUpdate] = useState<PendingUpdateInfo | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	// Subscribe to pending update notifications
	useEffect(() => {
		onPendingUpdate((info) => {
			setPendingUpdate(info);
		});
	}, []);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await refreshFromCloud();
		} catch (error) {
			console.error("Failed to refresh from cloud:", error);
			setRefreshing(false);
		}
		// Page will reload, so we don't need to reset refreshing
	}, []);

	// If there's a pending update, show a prominent notification
	if (pendingUpdate && !refreshing) {
		return (
			<button
				onClick={handleRefresh}
				className="btn btn-warning btn-sm me-2 d-flex align-items-center"
				style={{ animation: "pulse 2s infinite" }}
				title={`${pendingUpdate.updatedBy} made changes. Click to update.`}
			>
				<span className="glyphicon glyphicon-refresh me-1" />
				<span className="d-none d-md-inline">Update Available</span>
				<span className="d-md-none">Update</span>
			</button>
		);
	}

	if (refreshing) {
		return (
			<button className="btn btn-secondary btn-sm me-2" disabled>
				<span className="glyphicon glyphicon-refresh" style={{ animation: "spin 1s linear infinite" }} />
				<span className="d-none d-md-inline ms-1">Refreshing...</span>
			</button>
		);
	}

	if (!cloudSyncStatus || cloudSyncStatus === "disconnected") {
		return null;
	}

	const statusConfig: Record<string, { color: string; icon: string; title: string }> = {
		connecting: { color: "text-warning", icon: "glyphicon-refresh", title: "Connecting to cloud..." },
		syncing: { color: "text-info", icon: "glyphicon-refresh", title: "Syncing..." },
		synced: { color: "text-success", icon: "glyphicon-cloud", title: "Synced to cloud" },
		conflict: { color: "text-danger", icon: "glyphicon-exclamation-sign", title: "Sync conflict" },
		error: { color: "text-danger", icon: "glyphicon-remove", title: "Sync error" },
	};

	const config = statusConfig[cloudSyncStatus];
	if (!config) return null;

	return (
		<Nav.Link
			href="/cloud_sync"
			className={`${config.color} me-2`}
			title={config.title}
			aria-label={config.title}
		>
			<span className={`glyphicon ${config.icon}`} />
		</Nav.Link>
	);
};

const PhaseStatusBlock = () => {
	const { liveGameInProgress, phase, phaseText, statusText } = useLocalPartial([
		"liveGameInProgress",
		"phase",
		"phaseText",
		"statusText",
	]);

	// Hide phase and status, to prevent revealing that the playoffs has ended, thus spoiling a 3-0/3-1/3-2 finals
	// game. This is needed because game sim happens before the results are displayed in liveGame.
	const text = (
		<>
			{liveGameInProgress ? "Live game" : phaseText}
			<br />
			{liveGameInProgress ? "in progress" : statusText}
		</>
	);

	let urlParts;
	if (statusText === "Contract negotiation") {
		urlParts = ["negotiation"];
	} else {
		const urls = {
			[PHASE.EXPANSION_DRAFT]: ["draft"],
			[PHASE.FANTASY_DRAFT]: ["draft"],
			[PHASE.PRESEASON]: ["roster"],
			[PHASE.REGULAR_SEASON]: ["roster"],
			[PHASE.AFTER_TRADE_DEADLINE]: ["roster"],
			[PHASE.PLAYOFFS]: ["playoffs"],
			// Hack because we don't know repeatSeason and draftType, see updatePhase
			[PHASE.DRAFT_LOTTERY]: phaseText.includes("after playoffs")
				? ["draft_scouting"]
				: ["draft_lottery"],
			[PHASE.DRAFT]: ["draft"],
			[PHASE.AFTER_DRAFT]: ["draft_history"],
			[PHASE.RESIGN_PLAYERS]: ["negotiation"],
			[PHASE.FREE_AGENCY]: ["free_agents"],
		};
		urlParts = urls[phase];
	}

	return (
		<div className="dropdown-links navbar-nav flex-shrink-1 overflow-hidden text-nowrap">
			<div className="nav-item">
				<a
					href={helpers.leagueUrl(urlParts)}
					className="nav-link"
					style={{
						lineHeight: 1.35,
						padding: "9px 0 8px 16px",
					}}
				>
					{text}
				</a>
			</div>
		</div>
	);
};

const NavBar = ({ updating }: { updating: boolean }) => {
	const {
		lid,
		godMode,
		gold,
		sidebarOpen,
		spectator,
		playMenuOptions,
		popup,
		username,
	} = useLocalPartial([
		"lid",
		"godMode",
		"gold",
		"sidebarOpen",
		"spectator",
		"playMenuOptions",
		"popup",
		"username",
	]);
	const viewInfo = useViewData();

	// Checking lid too helps with some flicker
	const inLeague = viewInfo?.inLeague && lid !== undefined;

	if (popup) {
		return <div />;
	}

	const userBlock = username ? (
		<Nav.Link href="/account" aria-label="Account">
			<span className="glyphicon glyphicon-user" />{" "}
			<span className="d-none d-lg-inline">{username}</span>
		</Nav.Link>
	) : (
		<Nav.Link href="/account/login_or_register" aria-label="Login/Register">
			<span className="glyphicon glyphicon-user" />{" "}
			<span className="d-none d-lg-inline">Login/Register</span>
		</Nav.Link>
	);

	return (
		<Navbar
			bg="light"
			expand="sm"
			fixed="top"
			className="navbar-border flex-nowrap"
		>
			<div className="container-fluid">
				<button
					className="navbar-toggler me-2 d-block"
					onClick={() => {
						localActions.setSidebarOpen(!sidebarOpen);
					}}
					type="button"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon" />
				</button>
				<LogoAndText gold={gold} inLeague={inLeague} updating={updating} />
				{inLeague ? (
					<Nav navbar>
						<PlayMenu
							lid={lid}
							spectator={spectator}
							options={playMenuOptions}
						/>
					</Nav>
				) : null}
				{inLeague ? <PhaseStatusBlock /> : null}
				<div className="flex-grow-1" />
				<div className="d-none d-sm-flex">
					<DropdownLinks
						godMode={godMode}
						inLeague={inLeague}
						lid={lid}
						menuItems={menuItems.filter(
							(menuItem) => !menuItem.commandPaletteOnly,
						)}
					/>
				</div>
				<Nav id="top-user-block" navbar>
					<Nav.Item><CloudSyncIndicator /></Nav.Item>
					<Nav.Item>{userBlock}</Nav.Item>
				</Nav>
			</div>
		</Navbar>
	);
};

export default NavBar;
